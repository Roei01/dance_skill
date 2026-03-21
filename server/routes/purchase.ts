import express from "express";
import { z } from "zod";
import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import {
  createGreenInvoicePayment,
  GreenInvoiceError,
} from "../services/greenInvoice";
import { generateTempPassword, hashPassword } from "../services/auth";
import { provisionPurchaseAccess } from "../services/purchase";
import { purchaseRateLimiter } from "../middleware/rateLimit";
import { logger } from "../lib/logger";
import { config } from "../config/env";
import {
  DEFAULT_VIDEO_ID,
  DEFAULT_VIDEO_PRICE_ILS,
  DEFAULT_VIDEO_TITLE,
} from "../../lib/catalog";

const router = express.Router();

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

/** Origin the client used (for payment redirects); falls back to config when host is missing or localhost. */
const deriveAppBaseUrlFromRequest = (req: express.Request): string => {
  const rawProto =
    (typeof req.headers["x-forwarded-proto"] === "string" &&
      req.headers["x-forwarded-proto"].split(",")[0]?.trim()) ||
    req.protocol ||
    "http";
  const proto =
    rawProto === "https" || rawProto === "http" ? rawProto : "https";

  const hostHeader =
    (typeof req.headers["x-forwarded-host"] === "string" &&
      req.headers["x-forwarded-host"].split(",")[0]?.trim()) ||
    (typeof req.headers.host === "string" ? req.headers.host : "");

  if (!hostHeader) {
    return normalizeBaseUrl(config.appUrl);
  }

  try {
    const origin = `${proto}://${hostHeader}`;
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "::1"].includes(hostname)) {
      return normalizeBaseUrl(config.appUrl);
    }
    return normalizeBaseUrl(origin);
  } catch {
    return normalizeBaseUrl(config.appUrl);
  }
};
const purchaseSchema = z.object({
  email: z.string().email(),
});

router.post("/create", purchaseRateLimiter, async (req, res) => {
  try {
    const validation = purchaseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Please enter a valid email address.",
      });
    }

    //
    const { email } = validation.data;
    const appBaseUrl = deriveAppBaseUrlFromRequest(req);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const existingPurchase = await Purchase.findOne({
        userId: existingUser._id,
        videoId: DEFAULT_VIDEO_ID,
        status: "completed",
      });

      if (existingPurchase) {
        return res.status(409).json({
          code: "ALREADY_OWNED",
          message:
            "You already own this tutorial. Check your email for access.",
        });
      }
    }

    const payment = await createGreenInvoicePayment(
      email,
      DEFAULT_VIDEO_PRICE_ILS,
      DEFAULT_VIDEO_TITLE,
      { appBaseUrl },
    );

    let user = existingUser;

    if (!user) {
      const tempPass = await hashPassword(generateTempPassword());
      const baseUsername =
        email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") || "user";
      const username = `${baseUsername}_${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      user = await User.create({
        email,
        username,
        passwordHash: tempPass,
      });
    }

    await Purchase.deleteMany({
      userId: user._id,
      videoId: DEFAULT_VIDEO_ID,
      status: "pending",
    });

    await Purchase.create({
      userId: user._id,
      videoId: DEFAULT_VIDEO_ID,
      paymentId: payment.paymentId,
      status: "pending",
      appBaseUrl,
    });

    res.json({
      checkoutUrl: payment.checkoutUrl,
    });
  } catch (error) {
    if (error instanceof GreenInvoiceError) {
      logger.error("Purchase error:", {
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
      });

      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }

    logger.error("Purchase error:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Unable to start payment. Please try again.",
    });
  }
});

router.post("/webhook", async (req, res) => {
  const paymentId =
    req.body?.paymentId ||
    req.body?.id ||
    req.body?.productId ||
    req.body?.transactions?.[0]?.id;

  const status =
    req.body?.status ||
    req.body?.paymentStatus ||
    (req.body?.transactions?.length ? "completed" : undefined);

  if (paymentId && (status === "success" || status === "completed")) {
    try {
      await provisionPurchaseAccess(paymentId);
    } catch (error) {
      logger.error("Webhook provisioning error:", error);
    }
  }

  res.sendStatus(200);
});

export default router;
