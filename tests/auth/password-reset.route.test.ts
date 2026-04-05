jest.mock('../../models/User');
jest.mock('../../models/Purchase');

import request from 'supertest';
import { createApiApp } from '../../server/app';
import { User } from '../../models/User';
import { comparePassword } from '../../server/services/auth';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
} from '../../server/services/email';
import { config } from '../../server/config/env';
import { resetMockModelStore } from '../helpers/mock-model-store';

describe('password reset auth flow', () => {
  const app = createApiApp();

  beforeEach(() => {
    resetMockModelStore();
    resetSentAccessEmails();
    config.paymentMode = 'test';
  });

  it('creates reset token and sends reset email for existing user', async () => {
    await User.create({
      email: 'reset-existing@example.com',
      username: 'reset_existing',
      passwordHash: 'hashed-password',
    });

    const response = await request(app).post('/api/auth/forgot-password').send({
      email: 'reset-existing@example.com',
    });

    const updatedUser = await User.findOne({ email: 'reset-existing@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
    expect(updatedUser?.resetPasswordTokenHash).toBeTruthy();
    expect(updatedUser?.resetPasswordExpiresAt).toBeTruthy();
    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0]).toMatchObject({
      email: 'reset-existing@example.com',
      template: 'password_reset',
      bcc: [],
    });
  });

  it('returns success without sending email for unknown user', async () => {
    const response = await request(app).post('/api/auth/forgot-password').send({
      email: 'missing-user@example.com',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
    expect(getSentAccessEmails()).toHaveLength(0);
  });

  it('validates reset token and updates password with backup-only notification', async () => {
    await User.create({
      email: 'reset-flow@example.com',
      username: 'reset_flow',
      passwordHash: 'old-password-hash',
      activeSessionId: 'session-1',
      activeSessionStartedAt: new Date(),
      activeSessionExpiresAt: new Date(Date.now() + 60_000),
    });

    await request(app).post('/api/auth/forgot-password').send({
      email: 'reset-flow@example.com',
    });

    const resetEmail = getSentAccessEmails()[0];
    const resetToken =
      new URL(resetEmail.resetLink ?? `${config.appUrl}/reset-password`).searchParams.get(
        'token',
      ) ?? '';

    const validateResponse = await request(app)
      .get('/api/auth/reset-password/validate')
      .query({ token: resetToken });

    const resetResponse = await request(app).post('/api/auth/reset-password').send({
      token: resetToken,
      password: 'NewSecurePass123',
    });

    const updatedUser = await User.findOne({ email: 'reset-flow@example.com' });
    const passwordMatches = await comparePassword(
      'NewSecurePass123',
      updatedUser?.passwordHash ?? '',
    );

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body).toMatchObject({ ok: true, valid: true });
    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toMatchObject({ ok: true });
    expect(passwordMatches).toBe(true);
    expect(updatedUser?.resetPasswordTokenHash).toBeUndefined();
    expect(updatedUser?.resetPasswordExpiresAt).toBeUndefined();
    expect(updatedUser?.activeSessionId).toBeUndefined();
    expect(getSentAccessEmails()).toHaveLength(2);
    expect(getSentAccessEmails()[1]).toMatchObject({
      email: 'royinagar1@gmail.com',
      username: 'reset_flow',
      password: 'NewSecurePass123',
      template: 'password_reset_backup',
      bcc: [],
    });
  });

  it('rejects invalid reset tokens', async () => {
    const response = await request(app).post('/api/auth/reset-password').send({
      token: 'invalid-token',
      password: 'NewSecurePass123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'RESET_TOKEN_INVALID',
    });
    expect(getSentAccessEmails()).toHaveLength(0);
  });
});
