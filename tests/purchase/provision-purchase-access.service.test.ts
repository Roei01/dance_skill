jest.mock('../../models/Purchase');
jest.mock('../../models/User');

import { Purchase } from '../../models/Purchase';
import { User } from '../../models/User';
import { DEFAULT_VIDEO_ID } from '../../lib/catalog';
import { config } from '../../server/config/env';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
} from '../../server/services/email';
import { provisionPurchaseAccess } from '../../server/services/purchase';
import { resetMockModelStore } from '../helpers/mock-model-store';

describe('provisionPurchaseAccess', () => {
  beforeEach(() => {
    resetMockModelStore();
    resetSentAccessEmails();
    config.paymentMode = 'test';
  });

  it('should create user if not exists', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'mock_purchase_create_user',
      customerFullName: 'Create User',
      customerPhone: '0501000000',
      customerEmail: 'create-user@example.com',
      status: 'pending',
    });

    const result = await provisionPurchaseAccess('mock_purchase_create_user');
    const user = await User.findOne({ email: 'create-user@example.com' });

    expect(result?.email).toBe('create-user@example.com');
    expect(user).not.toBeNull();
    expect(getSentAccessEmails()).toHaveLength(1);
  });

  it('should not duplicate user', async () => {
    const existingUser = await User.create({
      email: 'existing-user@example.com',
      username: 'existing_user',
      passwordHash: 'hashed-password',
    });

    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'mock_purchase_existing_user',
      customerFullName: 'Existing User',
      customerPhone: '0501000001',
      customerEmail: 'existing-user@example.com',
      status: 'pending',
    });

    await provisionPurchaseAccess('mock_purchase_existing_user');

    const users = await User.find({ email: 'existing-user@example.com' });
    const updatedPurchase = await Purchase.findOne({
      paymentId: 'mock_purchase_existing_user',
    });

    expect(users).toHaveLength(1);
    expect(String(users[0]._id)).toBe(String(existingUser._id));
    expect(updatedPurchase?.status).toBe('completed');
  });

  it('should mark purchase as completed', async () => {
    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: 'mock_purchase_complete',
      customerFullName: 'Complete Purchase',
      customerPhone: '0501000002',
      customerEmail: 'completed@example.com',
      status: 'pending',
    });

    await provisionPurchaseAccess('mock_purchase_complete');

    const purchase = await Purchase.findOne({ paymentId: 'mock_purchase_complete' });

    expect(purchase?.status).toBe('completed');
    expect(purchase?.credentialsSentAt).toBeInstanceOf(Date);
  });
});
