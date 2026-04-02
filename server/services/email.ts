import nodemailer from "nodemailer";
import { config } from "../config/env";
import { logger } from "../lib/logger";

export type SentAccessEmailRecord = {
  email: string;
  bcc: string[];
  username: string;
  accessLink: string;
  password?: string;
  subject: string;
  template: "new_user" | "existing_user";
  videoTitle?: string;
  sentAt: Date;
  mocked: boolean;
};

const sentAccessEmails: SentAccessEmailRecord[] = [];

const createTransporter = () =>
  nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

const brandName = "ROTEM BARUCH dance tutorials";

const isMockEmailMode = () =>
  config.paymentMode === "test" && !config.isProduction;

export const getSentAccessEmails = () => [...sentAccessEmails];

export const resetSentAccessEmails = () => {
  sentAccessEmails.length = 0;
};

const getEmailContext = (email: string, accessLink: string) => {
  const backupRecipient = config.email.accessBackupRecipient?.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const bccRecipients =
    backupRecipient && backupRecipient !== normalizedEmail
      ? [backupRecipient]
      : [];
  const fromAddress = config.email.user
    ? `"${brandName}" <${config.email.user}>`
    : `"${brandName}" <no-reply@rotembaruch.dance>`;

  return {
    bccRecipients,
    fromAddress,
  };
};

type SendPurchaseEmailArgs = {
  email: string;
  username: string;
  accessLink: string;
  password?: string;
  subject: string;
  html: string;
  template: "new_user" | "existing_user";
  videoTitle?: string;
};

const sendPurchaseEmail = async ({
  email,
  username,
  accessLink,
  password,
  subject,
  html,
  template,
  videoTitle,
}: SendPurchaseEmailArgs) => {
  const { bccRecipients, fromAddress } = getEmailContext(email, accessLink);

  const mailOptions = {
    from: fromAddress,
    to: email,
    bcc: bccRecipients.length > 0 ? bccRecipients.join(", ") : undefined,
    subject,
    html,
  };

  const emailRecord: SentAccessEmailRecord = {
    email,
    bcc: bccRecipients,
    username,
    accessLink,
    password,
    subject,
    template,
    videoTitle,
    sentAt: new Date(),
    mocked: isMockEmailMode(),
  };

  try {
    if (isMockEmailMode()) {
      sentAccessEmails.push(emailRecord);
      logger.info(`Mock access email recorded for ${email}`, {
        bcc: bccRecipients,
      });
      return;
    }

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    sentAccessEmails.push(emailRecord);
    logger.info(`Access email sent to ${email}`, {
      bcc: bccRecipients,
    });

    if (config.isProduction === false) {
      logger.info(
        `🔑 DEV CREDENTIALS: Username: ${username}, Password: ${password || "(not changed)"}`,
      );
    }
  } catch (error) {
    logger.error("❌ Error sending email:", error);
    throw new Error("Email service failed");
  }
};

export const sendAccessEmail = async (
  email: string,
  username: string,
  accessLink: string,
  password?: string,
) => {
  await sendPurchaseEmail({
    email,
    username,
    accessLink,
    password,
    subject: "הגישה שלך לשיעור",
    template: "new_user",
    html: `
      <div dir="rtl" style="font-family: system-ui, sans-serif; line-height: 1.6;">
        <h1 style="margin-bottom: 0.5em;">${brandName}</h1>
        <p>תודה על הרכישה. להלן פרטי ההתחברות שלך:</p>
        <ul style="padding-right: 1.25em;">
          <li><strong>שם משתמש:</strong> ${username}</li>
          ${password ? `<li><strong>סיסמה:</strong> ${password}</li>` : ""}
        </ul>
        <p>קישור להתחברות לצפייה בשיעור:</p>
        <p><a href="${accessLink}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">מעבר לדף ההתחברות</a></p>
        <p style="font-size: 0.9em; color: #555;">אם הכפתור לא נפתח, אפשר להעתיק את הקישור הזה:</p>
        <p style="word-break: break-all; font-size: 0.9em; color: #2563eb;">${accessLink}</p>
        <p style="font-size: 0.9em; color: #555;">הקישור והסיסמה לשימושך האישי בלבד.</p>
      </div>
    `,
  });
};

type SendExistingUserPurchaseEmailArgs = {
  email: string;
  username: string;
  videoTitle: string;
  accessLink: string;
};

export const sendExistingUserPurchaseEmail = async ({
  email,
  username,
  videoTitle,
  accessLink,
}: SendExistingUserPurchaseEmailArgs) => {
  await sendPurchaseEmail({
    email,
    username,
    accessLink,
    subject: "רכישה בוצעה בהצלחה 🎉",
    template: "existing_user",
    videoTitle,
    html: `
      <div dir="rtl" style="font-family: system-ui, sans-serif; line-height: 1.6;">
        <h1 style="margin-bottom: 0.5em;">${brandName}</h1>
        <p>הרכישה בוצעה בהצלחה 🎉</p>
        <p>נוסף לך שיעור חדש לחשבון:</p>
        <p><strong>${videoTitle}</strong></p>
        <p>ניתן להתחבר עם הפרטים הקיימים:</p>
        <p><strong>שם משתמש:</strong> ${username}</p>
        <p>קישור להתחברות:</p>
        <p><a href="${accessLink}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">מעבר לדף ההתחברות</a></p>
        <p style="word-break: break-all; font-size: 0.9em; color: #2563eb;">${accessLink}</p>
      </div>
    `,
  });
};
