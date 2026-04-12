import mongoose from "mongoose";
import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import { DiscountCode } from "../../models/DiscountCode";
import { sendAccessEmail, sendExistingUserPurchaseEmail } from "./email";
import { generateTempPassword, hashPassword } from "./auth";
import { config } from "../config/env";
import { logger } from "../lib/logger";
import { getActiveVideoDocumentBySlug, resolveOwnedVideoSlug } from "./videos";
import { getActiveOfferBySlug } from "./offers";

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

export const getGrantedPurchaseVideoReferences = (purchase: {
  videoId: mongoose.Types.ObjectId | string | null | undefined;
  grantedVideoIds?: Array<mongoose.Types.ObjectId | string | null | undefined>;
}) => {
  if (Array.isArray(purchase.grantedVideoIds) && purchase.grantedVideoIds.length > 0) {
    return purchase.grantedVideoIds.filter(
      (
        value,
      ): value is mongoose.Types.ObjectId | string =>
        value instanceof mongoose.Types.ObjectId || typeof value === "string",
    );
  }

  if (purchase.videoId instanceof mongoose.Types.ObjectId || typeof purchase.videoId === "string") {
    return [purchase.videoId];
  }

  return [];
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
  let isExistingUser = Boolean(user);

  if (!user) {
    user = await User.findOne({ email: purchase.customerEmail });
    isExistingUser = Boolean(user);
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
    logger.info("New user created", {
      paymentId,
      email: user.email,
      username: user.username,
    });
  } else {
    logger.info("Existing user detected", {
      paymentId,
      email: user.email,
      username: user.username,
    });
  }

  purchase.userId = user._id;
  purchase.status = "completed";

  // Persist access before sending email so the DB state
  // stays correct even if the final notification step fails.
  await purchase.save();

  const ownedVideoSlug = await resolveOwnedVideoSlug(
    getGrantedPurchaseVideoReferences(purchase)[0],
  );

  if (purchase.credentialsSentAt) {
    logger.info("הגישה לרכישה כבר נפתחה בעבר, מחזירים את פרטי הגישה הקיימים.", {
      paymentId,
      email: user.email,
    });

    return {
      email: user.email,
      username: user.username,
      videoId: ownedVideoSlug ?? "",
    };
  }

  if (purchase.appliedDiscountCode) {
    const discountCode = await DiscountCode.findOne({
      code: purchase.appliedDiscountCode,
      offerSlug: purchase.offerSlug,
      isActive: true,
    });

    if (discountCode && !discountCode.usedAt && !discountCode.usedByPurchaseId) {
      discountCode.usedAt = new Date();
      discountCode.usedByPurchaseId = purchase._id;
      discountCode.usedByEmail = user.email;
      discountCode.isActive = false;
      await discountCode.save();
    }
  }

  const loginLink = buildLoginLink(resolveSiteBaseUrl(purchase.appBaseUrl));
  if (isExistingUser) {
    const offer = purchase.offerSlug
      ? await getActiveOfferBySlug(purchase.offerSlug)
      : null;
    const ownedVideo = !offer && ownedVideoSlug
      ? await getActiveVideoDocumentBySlug(ownedVideoSlug)
      : null;
    const videoTitle = offer?.title ?? ownedVideo?.title ?? "השיעור החדש שלך";

    await sendExistingUserPurchaseEmail({
      email: user.email,
      username: user.username,
      videoTitle,
      accessLink: loginLink,
    });
  } else {
    await sendAccessEmail(
      user.email,
      user.username,
      loginLink,
      generatedPassword,
    );
  }
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
    videoId: ownedVideoSlug ?? "",
  };
};
