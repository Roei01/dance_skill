jest.mock('../../models/Purchase');
jest.mock('../../models/User');
jest.mock('../../models/Video');

import request from 'supertest';
import { createApiApp } from '../../server/app';
import { config } from '../../server/config/env';
import { Purchase } from '../../models/Purchase';
import { User } from '../../models/User';
import { DEFAULT_VIDEO_ID } from '../../lib/catalog';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
} from '../../server/services/email';
import { createPurchaseConfirmationToken } from '../../server/services/purchase-confirmation';
import { resetMockModelStore } from '../helpers/mock-model-store';

describe('purchase webhook route', () => {
  const app = createApiApp();

  beforeEach(() => {
    resetMockModelStore();
    resetSentAccessEmails();
    config.paymentMode = 'test';
  });

  it('should handle mock payment', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'mock_1001',
      customerFullName: 'Webhook User',
      customerPhone: '0500000000',
      customerEmail: 'webhook-success@example.com',
      status: 'pending',
    });

    const response = await request(app).post('/api/purchase/webhook').send({
      paymentId: 'mock_1001',
      status: 'success',
    });

    const purchase = await Purchase.findOne({ paymentId: 'mock_1001' });
    const user = await User.findOne({ email: 'webhook-success@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      mocked: true,
      status: 'completed',
      provisioned: true,
    });
    expect(purchase?.status).toBe('completed');
    expect(user).not.toBeNull();
    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0].bcc).toEqual(['royinagar1@gmail.com']);
  });

  it('should update purchase status when webhook fails', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'mock_1002',
      customerFullName: 'Webhook Failed',
      customerPhone: '0500000001',
      customerEmail: 'webhook-failed@example.com',
      status: 'pending',
    });

    const response = await request(app).post('/api/purchase/webhook').send({
      paymentId: 'mock_1002',
      status: 'failed',
    });

    const purchase = await Purchase.findOne({ paymentId: 'mock_1002' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      mocked: true,
      status: 'failed',
    });
    expect(purchase?.status).toBe('failed');
  });

  it('should handle form-encoded webhook payloads', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'mock_1003',
      customerFullName: 'Webhook Form',
      customerPhone: '0500000002',
      customerEmail: 'webhook-form@example.com',
      status: 'pending',
    });

    const response = await request(app)
      .post('/api/purchase/webhook')
      .type('form')
      .send({
        paymentId: 'mock_1003',
        status: 'success',
      });

    const purchase = await Purchase.findOne({ paymentId: 'mock_1003' });

    expect(response.status).toBe(200);
    expect(purchase?.status).toBe('completed');
  });

  it('should match webhook by custom orderId when paymentId differs', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'provider_generated_placeholder',
      orderId: `${DEFAULT_VIDEO_ID}:webhook-order@example.com`,
      customerFullName: 'Webhook Order',
      customerPhone: '0500000003',
      customerEmail: 'webhook-order@example.com',
      status: 'pending',
    });

    const response = await request(app).post('/api/purchase/webhook').send({
      productId: 'different_provider_id',
      status: 'success',
      custom: `${DEFAULT_VIDEO_ID}:webhook-order@example.com`,
    });

    const purchase = await Purchase.findOne({
      orderId: `${DEFAULT_VIDEO_ID}:webhook-order@example.com`,
    });

    expect(response.status).toBe(200);
    expect(purchase?.status).toBe('completed');
  });

  it('should match webhook by payer email when ids do not match', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'provider_placeholder_email_match',
      customerFullName: 'Webhook Email Match',
      customerPhone: '0500000004',
      customerEmail: 'webhook-email-match@example.com',
      status: 'pending',
    });

    const response = await request(app).post('/api/purchase/webhook').send({
      id: 'provider_event_999',
      transactions: [{ id: 'provider_transaction_999' }],
      payer: {
        email: 'webhook-email-match@example.com',
      },
    });

    const purchase = await Purchase.findOne({
      customerEmail: 'webhook-email-match@example.com',
      status: 'completed',
    });

    expect(response.status).toBe(200);
    expect(purchase?.status).toBe('completed');
  });

  it('should treat payment received events as completed', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'provider_placeholder_payment_received',
      customerFullName: 'Webhook Payment Received',
      customerPhone: '0500000005',
      customerEmail: 'webhook-payment-received@example.com',
      status: 'pending',
    });

    const response = await request(app).post('/api/purchase/webhook').send({
      event: 'payment/received',
      payer: {
        email: 'webhook-payment-received@example.com',
      },
    });

    const purchase = await Purchase.findOne({
      customerEmail: 'webhook-payment-received@example.com',
      status: 'completed',
    });

    expect(response.status).toBe(200);
    expect(purchase?.status).toBe('completed');
  });

  it('should ignore description as orderId and still match payment-link by email', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'link_hosted_email_fallback',
      customerFullName: 'Hosted Email Fallback',
      customerPhone: '0500000007',
      customerEmail: 'payment-link@example.com',
      status: 'pending',
      createdAt: new Date(),
    });

    const response = await request(app).post('/api/purchase/webhook').send({
      id: 'event_payment_link_1',
      channel: 'payment-link',
      productId: 'provider_product_link_1',
      description: 'תשלום על שיעור ריקוד',
      payer: {
        email: 'payment-link@example.com',
      },
      transactions: [
        {
          id: 'provider_transaction_link_1',
          paymentMethod: {
            type: 'bit',
          },
        },
      ],
    });

    const purchase = await Purchase.findOne({
      customerEmail: 'payment-link@example.com',
    });
    const user = await User.findOne({ email: 'payment-link@example.com' });

    expect(response.status).toBe(200);
    expect(purchase?.status).toBe('completed');
    expect(user).not.toBeNull();
    expect(getSentAccessEmails()).toHaveLength(1);
  });

  it('should confirm hosted purchases from the success page fallback', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'link_hosted_1001',
      customerFullName: 'Hosted Payment User',
      customerPhone: '0500000006',
      customerEmail: 'hosted-confirm@example.com',
      status: 'pending',
      createdAt: new Date(),
    });

    const response = await request(app)
      .post('/api/purchase/hosted/confirm')
      .send({
        email: 'hosted-confirm@example.com',
      });

    const purchase = await Purchase.findOne({ paymentId: 'link_hosted_1001' });
    const user = await User.findOne({ email: 'hosted-confirm@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      paymentId: 'link_hosted_1001',
      provisioned: true,
    });
    expect(purchase?.status).toBe('completed');
    expect(user).not.toBeNull();
    expect(getSentAccessEmails()).toHaveLength(1);
  });

  it('should confirm credit card purchases from the success page fallback', async () => {
    const orderId = `${DEFAULT_VIDEO_ID}:success-confirm@example.com`;

    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'credit_card_1001',
      orderId,
      customerFullName: 'Success Confirm User',
      customerPhone: '0500000008',
      customerEmail: 'success-confirm@example.com',
      status: 'pending',
      createdAt: new Date(),
    });

    const response = await request(app)
      .post('/api/purchase/success/confirm')
      .send({
        email: 'success-confirm@example.com',
        orderId,
        token: createPurchaseConfirmationToken({
          email: 'success-confirm@example.com',
          orderId,
        }),
      });

    const purchase = await Purchase.findOne({ paymentId: 'credit_card_1001' });
    const user = await User.findOne({ email: 'success-confirm@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      paymentId: 'credit_card_1001',
      provisioned: true,
    });
    expect(purchase?.status).toBe('completed');
    expect(user).not.toBeNull();
    expect(getSentAccessEmails()).toHaveLength(1);
  });

  it('should reject success page confirmation with an invalid token', async () => {
    const orderId = `${DEFAULT_VIDEO_ID}:invalid-confirm@example.com`;

    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'credit_card_1002',
      orderId,
      customerFullName: 'Invalid Confirm User',
      customerPhone: '0500000009',
      customerEmail: 'invalid-confirm@example.com',
      status: 'pending',
      createdAt: new Date(),
    });

    const response = await request(app)
      .post('/api/purchase/success/confirm')
      .send({
        email: 'invalid-confirm@example.com',
        orderId,
        token: 'deadbeef',
      });

    const purchase = await Purchase.findOne({ paymentId: 'credit_card_1002' });
    const user = await User.findOne({ email: 'invalid-confirm@example.com' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
    expect(purchase?.status).toBe('pending');
    expect(user).toBeNull();
  });
});
