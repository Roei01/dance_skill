jest.mock('../../models/Purchase');
jest.mock('../../models/User');
jest.mock('../../models/Video');
jest.mock('../../models/Offer');
jest.mock('../../models/DiscountCode');

import request from 'supertest';
import { createApiApp } from '../../server/app';
import { config } from '../../server/config/env';
import { Purchase } from '../../models/Purchase';
import { DiscountCode } from '../../models/DiscountCode';
import { Offer } from '../../models/Offer';
import { User } from '../../models/User';
import { Video } from '../../models/Video';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
} from '../../server/services/email';
import { DEFAULT_BUNDLE_OFFER_SLUG } from '../../lib/offers';
import { resetMockModelStore } from '../helpers/mock-model-store';

describe('full mock purchase flow integration', () => {
  const app = createApiApp();

  beforeEach(() => {
    resetMockModelStore();
    resetSentAccessEmails();
    config.paymentMode = 'test';
  });

  it('should create payment, redirect, process webhook, create user, and send email', async () => {
    const createResponse = await request(app).post('/api/purchase/create').send({
      fullName: 'Integration Buyer',
      phone: '0509999999',
      email: 'integration-buyer@example.com',
      returnTo: `${config.appUrl}/#purchase`,
    });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.checkoutUrl).toBe(`${config.appUrl}/success?mock=true`);
    expect(createResponse.body.paymentId).toMatch(/^mock_/);

    const pendingPurchase = await Purchase.findOne({
      paymentId: createResponse.body.paymentId,
    });

    expect(pendingPurchase?.status).toBe('pending');

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      paymentId: createResponse.body.paymentId,
      status: 'success',
    });

    expect(webhookResponse.status).toBe(200);

    const completedPurchase = await Purchase.findOne({
      paymentId: createResponse.body.paymentId,
    });
    const createdUser = await User.findOne({ email: 'integration-buyer@example.com' });

    expect(completedPurchase?.status).toBe('completed');
    expect(createdUser).not.toBeNull();
    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0].email).toBe('integration-buyer@example.com');
    expect(getSentAccessEmails()[0].bcc).toEqual(['royinagar1@gmail.com']);
  });

  it('should create a discounted bundle purchase for missing videos only and consume the coupon once completed', async () => {
    await Video.findOneAndUpdate(
      { slug: 'video-one' },
      {
        $setOnInsert: {
          slug: 'video-one',
          title: 'Video One',
          description: 'First video',
          price: 45,
          level: 'Open',
          videoUrl: 'https://example.com/video-one.mp4',
          previewUrl: 'https://example.com/video-one-preview.mp4',
          imageUrl: 'https://example.com/video-one.jpg',
          isActive: true,
        },
      },
      { upsert: true },
    );
    await Video.findOneAndUpdate(
      { slug: 'video-two' },
      {
        $setOnInsert: {
          slug: 'video-two',
          title: 'Video Two',
          description: 'Second video',
          price: 45,
          level: 'Open',
          videoUrl: 'https://example.com/video-two.mp4',
          previewUrl: 'https://example.com/video-two-preview.mp4',
          imageUrl: 'https://example.com/video-two.jpg',
          isActive: true,
        },
      },
      { upsert: true },
    );
    await Video.findOneAndUpdate(
      { slug: 'video-three' },
      {
        $setOnInsert: {
          slug: 'video-three',
          title: 'Video Three',
          description: 'Third video',
          price: 45,
          level: 'Open',
          videoUrl: 'https://example.com/video-three.mp4',
          previewUrl: 'https://example.com/video-three-preview.mp4',
          imageUrl: 'https://example.com/video-three.jpg',
          isActive: true,
        },
      },
      { upsert: true },
    );

    const existingUser = await User.create({
      email: 'bundle-owner@example.com',
      username: 'bundle_owner',
      passwordHash: 'hashed-password',
    });

    await Purchase.create({
      userId: existingUser._id,
      videoId: 'video-one',
      grantedVideoIds: [],
      paymentId: 'existing_bundle_purchase',
      customerFullName: 'Bundle Owner',
      customerPhone: '0501111111',
      customerEmail: 'bundle-owner@example.com',
      status: 'completed',
    });

    await Offer.create({
      slug: DEFAULT_BUNDLE_OFFER_SLUG,
      title: 'כל 3 הסרטונים ב-99 ש"ח',
      description: 'Bundle offer',
      price: 99,
      compareAtPrice: 135,
      includedVideoSlugs: ['video-one', 'video-two', 'video-three'],
      isActive: true,
    });

    await DiscountCode.create({
      code: 'BUNDLE45',
      offerSlug: DEFAULT_BUNDLE_OFFER_SLUG,
      email: 'bundle-owner@example.com',
      discountAmount: 45,
      isActive: true,
    });

    const createResponse = await request(app).post('/api/purchase/create').send({
      fullName: 'Bundle Owner',
      phone: '0509999999',
      email: 'bundle-owner@example.com',
      offerSlug: DEFAULT_BUNDLE_OFFER_SLUG,
      discountCode: 'BUNDLE45',
      paymentMethod: 'credit_card',
    });

    expect(createResponse.status).toBe(200);

    const pendingPurchase = await Purchase.findOne({
      paymentId: createResponse.body.paymentId,
    });

    expect(pendingPurchase?.purchaseType).toBe('offer');
    expect(pendingPurchase?.offerSlug).toBe(DEFAULT_BUNDLE_OFFER_SLUG);
    expect(pendingPurchase?.finalPrice).toBe(54);
    expect(pendingPurchase?.appliedDiscountCode).toBe('BUNDLE45');
    expect(pendingPurchase?.grantedVideoIds).toHaveLength(2);

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      paymentId: createResponse.body.paymentId,
      status: 'success',
    });

    expect(webhookResponse.status).toBe(200);

    const completedPurchase = await Purchase.findOne({
      paymentId: createResponse.body.paymentId,
    });
    const discountCode = await DiscountCode.findOne({ code: 'BUNDLE45' });
    const videoTwo = await Video.findOne({ slug: 'video-two' });
    const videoThree = await Video.findOne({ slug: 'video-three' });
    const grantedVideoIds = (completedPurchase?.grantedVideoIds ?? []).map((value: unknown) =>
      String(value),
    );
    const reusedQuoteResponse = await request(app)
      .post(`/api/offers/${DEFAULT_BUNDLE_OFFER_SLUG}/quote`)
      .send({
        email: 'bundle-owner@example.com',
        discountCode: 'BUNDLE45',
      });

    expect(completedPurchase?.status).toBe('completed');
    expect(discountCode?.isActive).toBe(false);
    expect(discountCode?.usedByEmail).toBe('bundle-owner@example.com');
    expect(grantedVideoIds).toHaveLength(2);
    expect(grantedVideoIds).toEqual(
      expect.arrayContaining([String(videoThree?._id), String(videoTwo?._id)]),
    );
    expect(reusedQuoteResponse.status).toBe(400);
    expect(reusedQuoteResponse.body.code).toBe('INVALID_DISCOUNT_CODE');
    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0]).toMatchObject({
      email: 'bundle-owner@example.com',
      template: 'existing_user',
    });
  });
});
