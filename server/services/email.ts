import nodemailer from "nodemailer";
import { config } from "../config/env";
import { logger } from "../lib/logger";

export type SentAccessEmailRecord = {
  email: string;
  username: string;
  accessLink: string;
  password?: string;
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

export const sendAccessEmail = async (
  email: string,
  username: string,
  accessLink: string,
  password?: string,
) => {
  const accessHost = (() => {
    try {
      return new URL(accessLink).host;
    } catch {
      return accessLink;
    }
  })();
  const fromAddress = config.email.user
    ? `"${brandName}" <${config.email.user}>`
    : `"${brandName}" <no-reply@rotembaruch.dance>`;

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: "הגישה שלך לשיעור",
    html: `
      <div dir="rtl" style="font-family: system-ui, sans-serif; line-height: 1.6;">
        <h1 style="margin-bottom: 0.5em;">${brandName}</h1>
        <p>תודה על הרכישה. להלן פרטי ההתחברות שלך:</p>
        <ul style="padding-right: 1.25em;">
          <li><strong>שם משתמש:</strong> ${username}</li>
          ${password ? `<li><strong>סיסמה:</strong> ${password}</li>` : ""}
        </ul>
        <p>דף ההתחברות ייפתח דרך האתר שלך בכתובת: <strong>${accessHost}</strong></p>
        <p>קישור להתחברות לצפייה בשיעור:</p>
        <p><a href="${accessLink}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">מעבר לדף ההתחברות</a></p>
        <p style="font-size: 0.9em; color: #555;">אם הכפתור לא נפתח, אפשר להעתיק את הקישור הזה:</p>
        <p style="word-break: break-all; font-size: 0.9em; color: #2563eb;">${accessLink}</p>
        <p style="font-size: 0.9em; color: #555;">הקישור והסיסמה לשימושך האישי בלבד.</p>
      </div>
    `,
  };

  const emailRecord: SentAccessEmailRecord = {
    email,
    username,
    accessLink,
    password,
    sentAt: new Date(),
    mocked: isMockEmailMode(),
  };

  try {
    if (isMockEmailMode()) {
      sentAccessEmails.push(emailRecord);
      logger.info(`Mock access email recorded for ${email}`);
      return;
    }

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    sentAccessEmails.push(emailRecord);
    logger.info(`Access email sent to ${email}`);

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
