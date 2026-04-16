jest.mock('../../models/User');
jest.mock('../../models/Purchase');

import request from 'supertest';
import { createApiApp } from '../../server/app';
import { User } from '../../models/User';
import { hashPassword } from '../../server/services/auth';
import { resetMockModelStore } from '../helpers/mock-model-store';

describe('auth login route', () => {
  const app = createApiApp();

  beforeEach(() => {
    resetMockModelStore();
  });

  it('reclaims an old active session and allows login again', async () => {
    const user = await User.create({
      email: 'reclaim@example.com',
      username: 'reclaim_user',
      passwordHash: await hashPassword('Password123'),
      activeSessionId: 'old-session-id',
      activeSessionStartedAt: new Date(Date.now() - 30 * 60 * 1000),
      activeSessionExpiresAt: new Date(Date.now() + 90 * 60 * 1000),
    });

    const response = await request(app).post('/api/auth/login').send({
      username: 'reclaim_user',
      password: 'Password123',
    });

    const updatedUser = await User.findById(user._id);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      username: 'reclaim_user',
      email: 'reclaim@example.com',
    });
    expect(updatedUser?.activeSessionId).toBeTruthy();
    expect(updatedUser?.activeSessionId).not.toBe('old-session-id');
  });

  it('allows login when username casing differs', async () => {
    await User.create({
      email: 'case@example.com',
      username: 'CaseSensitiveUser',
      passwordHash: await hashPassword('Password123'),
    });

    const response = await request(app).post('/api/auth/login').send({
      username: 'casesensitiveuser',
      password: 'Password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      username: 'CaseSensitiveUser',
      email: 'case@example.com',
    });
  });
});
