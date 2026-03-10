import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../lib/logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendAccessEmail = async (email: string, username: string, accessLink: string, password?: string) => {
  const mailOptions = {
    from: '"Dance Skill Team" <no-reply@danceskill.com>',
    to: email,
    subject: 'Your Dance Tutorial Access',
    html: `
      <h1>Welcome to Dance Skill!</h1>
      <p>Thank you for your purchase. Here are your login details:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        ${password ? `<li><strong>Temporary Password:</strong> ${password}</li>` : ''}
      </ul>
      <p>Access your video here:</p>
      <a href="${accessLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Watch Video</a>
      <p>Please note: This link is for your personal use only. Sharing your login details may result in account suspension.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`✅ Access email sent to ${email}`);
    // Log credentials in dev for convenience
    if (config.isProduction === false) {
      logger.info(`🔑 DEV CREDENTIALS: Username: ${username}, Password: ${password || '(not changed)'}`);
    }
  } catch (error) {
    logger.error('❌ Error sending email:', error);
    throw new Error('Email service failed');
  }
};
