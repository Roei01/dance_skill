jest.mock('../../models/Purchase');
jest.mock('../../models/User');
jest.mock('../../models/Video');

import request from 'supertest';
import { createApiApp } from '../../server/app';
import { config } from '../../server/config/env';
import { Purchase } from '../../models/Purchase';
import { User } from '../../models/User';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
} from '../../server/services/email';
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
});
