import { config } from '../../server/config/env';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
  sendAccessEmail,
  sendExistingUserPurchaseEmail,
  sendPasswordResetBackupEmail,
  sendPasswordResetEmail,
} from '../../server/services/email';

describe('sendAccessEmail', () => {
  beforeEach(() => {
    resetSentAccessEmails();
    config.paymentMode = 'test';
  });

  it('should send email', async () => {
    await sendAccessEmail(
      'email-test@example.com',
      'email_test_user',
      `${config.appUrl}/login`,
      'Password123',
    );

    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0]).toMatchObject({
      email: 'email-test@example.com',
      bcc: ['royinagar1@gmail.com'],
      username: 'email_test_user',
      mocked: true,
    });
  });

  it('should not crash', async () => {
    await expect(
      sendAccessEmail(
        'email-no-crash@example.com',
        'email_no_crash',
        `${config.appUrl}/login`,
      ),
    ).resolves.toBeUndefined();
  });

  it('should record existing user purchase email', async () => {
    await sendExistingUserPurchaseEmail({
      email: 'existing@example.com',
      username: 'existing_user',
      videoTitle: 'כולם גנבים - 30 דק',
      accessLink: `${config.appUrl}/login`,
    });

    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0]).toMatchObject({
      email: 'existing@example.com',
      bcc: ['royinagar1@gmail.com'],
      username: 'existing_user',
      subject: 'רכישה בוצעה בהצלחה 🎉',
      template: 'existing_user',
      videoTitle: 'כולם גנבים - 30 דק',
      mocked: true,
    });
  });

  it('should record password reset request email only to the customer', async () => {
    await sendPasswordResetEmail({
      email: 'reset@example.com',
      username: 'reset_user',
      resetLink: `${config.appUrl}/reset-password?token=test-token`,
    });

    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0]).toMatchObject({
      email: 'reset@example.com',
      bcc: [],
      username: 'reset_user',
      subject: 'איפוס סיסמה',
      template: 'password_reset',
      resetLink: `${config.appUrl}/reset-password?token=test-token`,
      mocked: true,
    });
  });

  it('should record reset backup email only to the backup recipient', async () => {
    await sendPasswordResetBackupEmail({
      email: 'customer@example.com',
      username: 'customer_user',
      password: 'NewPassword123',
    });

    expect(getSentAccessEmails()).toHaveLength(1);
    expect(getSentAccessEmails()[0]).toMatchObject({
      email: 'royinagar1@gmail.com',
      bcc: [],
      username: 'customer_user',
      password: 'NewPassword123',
      subject: 'גיבוי שינוי סיסמה',
      template: 'password_reset_backup',
      mocked: true,
    });
  });
});
