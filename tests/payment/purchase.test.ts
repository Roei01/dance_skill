jest.mock('../../server/services/greenInvoice', () => {
  const actual = jest.requireActual('../../server/services/greenInvoice');

  return {
    ...actual,
    createGreenInvoicePayment: jest.fn(),
  };
});

jest.mock('../../server/services/email', () => {
  const actual = jest.requireActual('../../server/services/email');

  return {
    ...actual,
    sendAccessEmail: jest.fn(),
  };
});

import request from 'supertest';
import { createApiApp } from '../../server/app';
import { Purchase } from '../../models/Purchase';
import { User } from '../../models/User';
import { DEFAULT_VIDEO_ID } from '../../lib/catalog';
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from '../helpers/mongodb-test-utils';
import { createGreenInvoicePayment } from '../../server/services/greenInvoice';
import { sendAccessEmail } from '../../server/services/email';

const mockedCreateGreenInvoicePayment =
  createGreenInvoicePayment as jest.MockedFunction<typeof createGreenInvoicePayment>;
const mockedSendAccessEmail =
  sendAccessEmail as jest.MockedFunction<typeof sendAccessEmail>;

describe('purchase integration flow', () => {
  const app = createApiApp();

  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(() => {
    mockedCreateGreenInvoicePayment.mockResolvedValue({
      checkoutUrl: 'http://mock-checkout',
      paymentId: 'test_payment_123',
    });
    mockedSendAccessEmail.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await clearTestDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('creates a pending purchase and returns checkout url', async () => {
    const response = await request(app).post('/api/purchase/create').send({
      fullName: 'Integration Buyer',
      phone: '0501234567',
      email: 'buyer@example.com',
      returnTo: 'https://www.example.com/#purchase',
    });

    const purchase = await Purchase.findOne({ paymentId: 'test_payment_123' }).lean();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      checkoutUrl: 'http://mock-checkout',
      paymentId: 'test_payment_123',
    });
    expect(purchase).toMatchObject({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'test_payment_123',
      orderId: `${DEFAULT_VIDEO_ID}:buyer@example.com`,
      customerEmail: 'buyer@example.com',
      status: 'pending',
    });
  });

  it('completes purchase, creates user, generates password, and sends email after success webhook', async () => {
    await request(app).post('/api/purchase/create').send({
      fullName: 'Webhook Buyer',
      phone: '0507654321',
      email: 'webhook-success@example.com',
      returnTo: 'https://www.example.com/#purchase',
    });

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      paymentId: 'test_payment_123',
      status: 'success',
    });

    const purchase = await Purchase.findOne({ paymentId: 'test_payment_123' }).lean();
    const user = await User.findOne({ email: 'webhook-success@example.com' }).lean();

    expect(webhookResponse.status).toBe(200);
    expect(purchase?.status).toBe('completed');
    expect(purchase?.credentialsSentAt).toBeTruthy();
    expect(user).not.toBeNull();
    expect(user?.passwordHash).toBeTruthy();
    expect(mockedSendAccessEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendAccessEmail).toHaveBeenCalledWith(
      'webhook-success@example.com',
      user?.username,
      expect.stringContaining('/login'),
      expect.any(String),
    );
  });

  it('reuses existing user without creating duplicate, updates password, and sends email', async () => {
    const existingUser = await User.create({
      email: 'existing-user@example.com',
      username: 'existing_user',
      passwordHash: 'old-password-hash',
    });

    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'existing_user_payment_123',
      customerFullName: 'Existing User',
      customerPhone: '0501111111',
      customerEmail: 'existing-user@example.com',
      status: 'pending',
    });

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      paymentId: 'existing_user_payment_123',
      status: 'success',
    });

    const users = await User.find({ email: 'existing-user@example.com' }).lean();
    const updatedUser = await User.findById(existingUser._id).lean();
    const purchase = await Purchase.findOne({
      paymentId: 'existing_user_payment_123',
    }).lean();

    expect(webhookResponse.status).toBe(200);
    expect(users).toHaveLength(1);
    expect(updatedUser?.passwordHash).toBeTruthy();
    expect(updatedUser?.passwordHash).not.toBe('old-password-hash');
    expect(purchase?.status).toBe('completed');
    expect(mockedSendAccessEmail).toHaveBeenCalledTimes(1);
  });

  it('marks purchase as failed and does not create user when payment fails', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'failed_payment_123',
      customerFullName: 'Failed Buyer',
      customerPhone: '0502222222',
      customerEmail: 'failed@example.com',
      status: 'pending',
    });

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      paymentId: 'failed_payment_123',
      status: 'failed',
    });

    const purchase = await Purchase.findOne({ paymentId: 'failed_payment_123' }).lean();
    const user = await User.findOne({ email: 'failed@example.com' }).lean();

    expect(webhookResponse.status).toBe(200);
    expect(purchase?.status).toBe('failed');
    expect(user).toBeNull();
    expect(mockedSendAccessEmail).not.toHaveBeenCalled();
  });

  it('returns 200 and leaves database unchanged for invalid webhook payload', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'invalid_payload_payment_123',
      customerFullName: 'Invalid Payload',
      customerPhone: '0503333333',
      customerEmail: 'invalid@example.com',
      status: 'pending',
    });

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({});

    const purchase = await Purchase.findOne({
      paymentId: 'invalid_payload_payment_123',
    }).lean();
    const userCount = await User.countDocuments();

    expect(webhookResponse.status).toBe(200);
    expect(purchase?.status).toBe('pending');
    expect(userCount).toBe(0);
    expect(mockedSendAccessEmail).not.toHaveBeenCalled();
  });

  it('matches webhook by custom orderId when provider sends a different payment identifier', async () => {
    await request(app).post('/api/purchase/create').send({
      fullName: 'Custom Match Buyer',
      phone: '0504444444',
      email: 'custom-match@example.com',
      returnTo: 'https://www.example.com/#purchase',
    });

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      productId: 'provider_product_456',
      status: 'success',
      custom: `${DEFAULT_VIDEO_ID}:custom-match@example.com`,
    });

    const purchase = await Purchase.findOne({
      orderId: `${DEFAULT_VIDEO_ID}:custom-match@example.com`,
    }).lean();
    const user = await User.findOne({ email: 'custom-match@example.com' }).lean();

    expect(webhookResponse.status).toBe(200);
    expect(purchase?.status).toBe('completed');
    expect(user).not.toBeNull();
    expect(mockedSendAccessEmail).toHaveBeenCalledTimes(1);
  });

  it('matches webhook by payer email when provider does not return matching ids', async () => {
    await request(app).post('/api/purchase/create').send({
      fullName: 'Email Match Buyer',
      phone: '0505555555',
      email: 'email-match@example.com',
      returnTo: 'https://www.example.com/#purchase',
    });

    const webhookResponse = await request(app).post('/api/purchase/webhook').send({
      id: 'provider_event_789',
      transactions: [
        {
          id: 'provider_transaction_789',
        },
      ],
      payer: {
        email: 'email-match@example.com',
      },
    });

    const purchase = await Purchase.findOne({
      orderId: `${DEFAULT_VIDEO_ID}:email-match@example.com`,
    }).lean();
    const user = await User.findOne({ email: 'email-match@example.com' }).lean();

    expect(webhookResponse.status).toBe(200);
    expect(purchase?.status).toBe('completed');
    expect(user).not.toBeNull();
    expect(mockedSendAccessEmail).toHaveBeenCalledTimes(1);
  });
});
