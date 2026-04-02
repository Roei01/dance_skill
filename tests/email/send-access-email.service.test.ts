import { config } from '../../server/config/env';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
  sendAccessEmail,
  sendExistingUserPurchaseEmail,
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
});
