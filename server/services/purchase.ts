import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import { DEFAULT_VIDEO_ID } from "../../lib/catalog";
import { sendAccessEmail } from "./email";
import { generateTempPassword, hashPassword } from "./auth";
import { config } from "../config/env";
import { logger } from "../lib/logger";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const buildLoginLink = (baseUrl: string) => {
  return new URL("/login", `${normalizeBaseUrl(baseUrl)}/`).toString();
};

const buildBaseUsername = (email: string) => {
  return email.split("@")[0]?.trim().replace(/[^a-zA-Z0-9]/g, "") || "user";
};

const generateUniqueUsername = async (email: string) => {
  const baseUsername = buildBaseUsername(email);
  let candidate = baseUsername;
  let suffix = 2;

  while (await User.findOne({ username: candidate })) {
    candidate = `${baseUsername}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const resolveSiteBaseUrl = (purchaseBaseUrl?: string) => {
  if (purchaseBaseUrl) {
    try {
      const parsedUrl = new URL(purchaseBaseUrl);
      if (!["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)) {
        return normalizeBaseUrl(purchaseBaseUrl);
      }
    } catch {
      // Fall back to the configured app URL below.
    }
  }

  return normalizeBaseUrl(config.appUrl);
};

export const provisionPurchaseAccess = async (paymentId: string) => {
  const purchase = await Purchase.findOne({ paymentId });

  if (!purchase) {
    logger.warn("דילגנו על פתיחת הגישה כי לא נמצאה רכישה עבור התשלום.", {
      paymentId,
    });
    return null;
  }

  let user = purchase.userId ? await User.findById(purchase.userId) : null;
  let generatedPassword: string | undefined;

  if (!user) {
    user = await User.findOne({ email: purchase.customerEmail });
  }

  if (!user) {
    generatedPassword = generateTempPassword();
    const passwordHash = await hashPassword(generatedPassword);
    const username = await generateUniqueUsername(purchase.customerEmail);

    user = await User.create({
      email: purchase.customerEmail,
      username,
      passwordHash,
    });
  }

  purchase.userId = user._id;
  purchase.status = "completed";

  if (purchase.credentialsSentAt) {
    await purchase.save();
    logger.info("הגישה לרכישה כבר נפתחה בעבר, מחזירים את פרטי הגישה הקיימים.", {
      paymentId,
      email: user.email,
    });

    return {
      email: user.email,
      username: user.username,
      videoId: DEFAULT_VIDEO_ID,
    };
  }

  if (!generatedPassword) {
    generatedPassword = generateTempPassword();
    user.passwordHash = await hashPassword(generatedPassword);
    await user.save();
  }

  const loginLink = buildLoginLink(resolveSiteBaseUrl(purchase.appBaseUrl));
  await sendAccessEmail(
    user.email,
    user.username,
    loginLink,
    generatedPassword
  );
  purchase.credentialsSentAt = new Date();
  await purchase.save();
  logger.info("הגישה לרכישה נפתחה בהצלחה.", {
    paymentId,
    email: user.email,
    username: user.username,
  });

  return {
    email: user.email,
    username: user.username,
    videoId: DEFAULT_VIDEO_ID,
  };
};
