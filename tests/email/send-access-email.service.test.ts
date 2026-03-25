import { config } from '../../server/config/env';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
  sendAccessEmail,
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
});
