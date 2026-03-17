import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import { DEFAULT_VIDEO_ID } from "../../lib/catalog";
import { sendAccessEmail } from "./email";
import { generateTempPassword, hashPassword } from "./auth";
import { config } from "../config/env";

export const provisionPurchaseAccess = async (paymentId: string) => {
  const purchase = await Purchase.findOne({ paymentId });

  if (!purchase) {
    return null;
  }

  if (purchase.status !== "completed") {
    purchase.status = "completed";
    await purchase.save();
  }

  const user = await User.findById(purchase.userId);

  if (!user) {
    return null;
  }

  const tempPassword = generateTempPassword();
  user.passwordHash = await hashPassword(tempPassword);
  await user.save();

  const loginLink = `${config.appUrl}/login`;
  await sendAccessEmail(user.email, user.username, loginLink, tempPassword);

  return {
    email: user.email,
    username: user.username,
    videoId: DEFAULT_VIDEO_ID,
  };
};
