import crypto from "crypto";
import { config } from "../config/env";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const buildPurchaseConfirmationPayload = ({
  email,
  orderId,
}: {
  email: string;
  orderId: string;
}) => `purchase-confirm:${orderId.trim()}:${normalizeEmail(email)}`;

export const createPurchaseConfirmationToken = ({
  email,
  orderId,
}: {
  email: string;
  orderId: string;
}) =>
  crypto
    .createHmac("sha256", config.jwtSecret)
    .update(buildPurchaseConfirmationPayload({ email, orderId }))
    .digest("hex");

export const isValidPurchaseConfirmationToken = ({
  email,
  orderId,
  token,
}: {
  email: string;
  orderId: string;
  token: string;
}) => {
  const expectedToken = createPurchaseConfirmationToken({ email, orderId });
  const actualBuffer = Buffer.from(token.trim(), "hex");
  const expectedBuffer = Buffer.from(expectedToken, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};
