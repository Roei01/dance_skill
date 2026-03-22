import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import { DEFAULT_VIDEO_ID } from "../../lib/catalog";
import { sendAccessEmail } from "./email";
import { generateTempPassword, hashPassword } from "./auth";
import { config } from "../config/env";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const buildLoginLink = (baseUrl: string) => {
  return new URL("/login", `${normalizeBaseUrl(baseUrl)}/`).toString();
};

export const provisionPurchaseAccess = async (paymentId: string) => {
  const purchase = await Purchase.findOne({ paymentId });

  if (!purchase) {
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
    const baseUsername =
      purchase.customerEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") ||
      "user";
    const username = `${baseUsername}_${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;

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

  const loginLink = `${config.appUrl}/login`;
  await sendAccessEmail(
    user.email,
    user.username,
    loginLink,
    generatedPassword
  );
  purchase.credentialsSentAt = new Date();
  await purchase.save();

  return {
    email: user.email,
    username: user.username,
    videoId: DEFAULT_VIDEO_ID,
  };
};
