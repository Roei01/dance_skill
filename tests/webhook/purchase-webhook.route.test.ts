jest.mock('../../models/Purchase');
jest.mock('../../models/User');

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
});
