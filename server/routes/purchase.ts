import express from "express";
import { z } from "zod";
import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import {
  createGreenInvoicePayment,
  GreenInvoiceError,
} from "../services/greenInvoice";
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
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(9),
  email: z.string().email(),
  returnTo: z.string().trim().url().optional(),
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

    const { email, fullName, phone, returnTo } = validation.data;
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
      {
        appBaseUrl,
        fullName,
        phone,
        orderId: `${DEFAULT_VIDEO_ID}:${email}`,
        returnTo,
      },
    );

    await Purchase.deleteMany({
      customerEmail: email,
      videoId: DEFAULT_VIDEO_ID,
      status: "pending",
    });

    await Purchase.create({
      videoId: DEFAULT_VIDEO_ID,
      paymentId: payment.paymentId,
      customerFullName: fullName,
      customerPhone: phone,
      customerEmail: email,
      status: "pending",
      appBaseUrl,
    });

    res.json({
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.paymentId,
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

  logger.info("Purchase webhook triggered.", {
    paymentId,
    status,
    paymentMode: config.paymentMode,
  });

  if (
    config.paymentMode === "test" &&
    typeof paymentId === "string" &&
    paymentId.startsWith("mock_")
  ) {
    if (status === "failed") {
      await Purchase.findOneAndUpdate({ paymentId }, { status: "failed" });
      return res.status(200).json({ ok: true, mocked: true, status: "failed" });
    }

    const provisioned = await provisionPurchaseAccess(paymentId);
    return res.status(200).json({
      ok: true,
      mocked: true,
      status: "completed",
      provisioned: Boolean(provisioned),
    });
  }

  if (typeof paymentId === "string" && paymentId.startsWith("mock_")) {
    return res.status(400).json({
      code: "MOCK_PAYMENT_DISABLED",
      message: "Mock payments are disabled in production mode.",
    });
  }

  if (paymentId && (status === "success" || status === "completed")) {
    try {
      const provisioned = await provisionPurchaseAccess(paymentId);

      if (!provisioned) {
        logger.warn(
          "Webhook completed but no pending purchase found for paymentId",
          {
            paymentId,
            body: req.body,
          },
        );
      }
    } catch (error) {
      logger.error("Webhook provisioning error:", error);
    }
  } else if (paymentId && status === "failed") {
    await Purchase.findOneAndUpdate({ paymentId }, { status: "failed" });
  }

  res.sendStatus(200);
});

export default router;
