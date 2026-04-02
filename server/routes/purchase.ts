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
import { DEFAULT_VIDEO_SLUG } from "../../lib/catalog";
import { getActiveVideoDocumentBySlug } from "../services/videos";

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
  videoSlug: z.string().trim().min(1).optional().default(DEFAULT_VIDEO_SLUG),
  paymentMethod: z
    .enum(["credit_card", "hosted"])
    .optional()
    .default("credit_card"),
});

const extractWebhookOrderId = (body: Record<string, any>) =>
  body?.custom ||
  body?.orderId ||
  body?.reference ||
  body?.data?.custom ||
  body?.data?.orderId ||
  body?.payload?.custom;

const extractWebhookEvent = (body: Record<string, any>) =>
  body?.event ||
  body?.type ||
  body?.action ||
  body?.data?.event ||
  body?.data?.type ||
  body?.payload?.event ||
  body?.payload?.type;

const extractWebhookEmail = (body: Record<string, any>) => {
  const rawEmail =
    body?.payer?.email ||
    body?.client?.email ||
    body?.email ||
    body?.customerEmail ||
    body?.data?.payer?.email ||
    body?.data?.client?.email ||
    body?.payload?.payer?.email ||
    body?.payload?.client?.email ||
    (Array.isArray(body?.client?.emails) ? body.client.emails[0] : undefined) ||
    (Array.isArray(body?.data?.client?.emails)
      ? body.data.client.emails[0]
      : undefined);

  return typeof rawEmail === "string"
    ? rawEmail.trim().toLowerCase()
    : undefined;
};

const normalizeWebhookStatus = (body: Record<string, any>) => {
  const rawStatus =
    body?.status ||
    body?.paymentStatus ||
    body?.data?.status ||
    body?.data?.paymentStatus ||
    body?.payload?.status ||
    body?.payload?.paymentStatus ||
    extractWebhookEvent(body);

  if (typeof rawStatus === "string" && rawStatus.trim()) {
    const normalized = rawStatus.trim().toLowerCase();

    if (
      [
        "success",
        "completed",
        "approved",
        "paid",
        "received",
        "payment/received",
        "payment_received",
        "payment-received",
      ].includes(normalized)
    ) {
      return "completed";
    }

    if (
      [
        "failed",
        "declined",
        "cancelled",
        "canceled",
        "error",
        "payment/failed",
        "payment_failed",
        "payment-failed",
      ].includes(normalized)
    ) {
      return "failed";
    }
  }

  if (reqBodyHasTransactions(body)) {
    return "completed";
  }

  return undefined;
};

const reqBodyHasTransactions = (body: Record<string, any>) =>
  Array.isArray(body?.transactions) && body.transactions.length > 0;

const findPurchaseForWebhook = async (
  paymentId?: string,
  orderId?: string,
  payerEmail?: string,
) => {
  if (paymentId) {
    const purchaseByPaymentId = await Purchase.findOne({ paymentId });
    if (purchaseByPaymentId) {
      return purchaseByPaymentId;
    }
  }

  if (orderId) {
    return Purchase.findOne({ orderId });
  }

  if (payerEmail) {
    return Purchase.findOne({
      customerEmail: payerEmail,
      status: "pending",
    }).sort({ createdAt: -1 });
  }

  return null;
};

router.post("/create", purchaseRateLimiter, async (req, res) => {
  try {
    const validation = purchaseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Please enter a valid email address.",
      });
    }

    const { email, fullName, phone, returnTo, paymentMethod, videoSlug } =
      validation.data;
    const appBaseUrl = deriveAppBaseUrlFromRequest(req);
    const video = await getActiveVideoDocumentBySlug(videoSlug);

    if (!video) {
      return res.status(404).json({
        code: "VIDEO_UNAVAILABLE",
        message: "Video not found.",
      });
    }

    console.log("VIDEO ID:", video._id, typeof video._id);

    const purchaseVideoId = video._id;
    const acceptedPurchaseVideoIds = [video._id];
    const orderId = `${String(video._id)}:${email}`;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const existingPurchase = await Purchase.findOne({
        userId: existingUser._id,
        videoId: { $in: acceptedPurchaseVideoIds },
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

    if (paymentMethod === "hosted") {
      const isTestMode = config.paymentMode === "test";
      const tempPaymentId = isTestMode
        ? `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
        : `link_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Set up the success URL to return to
      const successUrl = new URL("/success", `${appBaseUrl}/`);
      successUrl.searchParams.set("email", email);
      if (returnTo) {
        successUrl.searchParams.set("returnTo", returnTo);
      }

      const checkoutUrl = isTestMode
        ? `${config.appUrl}/success?mock=true`
        : `https://mrng.to/BKXBaFbl0K?email=${encodeURIComponent(email)}&successUrl=${encodeURIComponent(successUrl.toString())}&redirectUrl=${encodeURIComponent(successUrl.toString())}`;

      await Purchase.deleteMany({
        customerEmail: email,
        videoId: { $in: acceptedPurchaseVideoIds },
        status: "pending",
      });

      await Purchase.create({
        videoId: purchaseVideoId,
        paymentId: tempPaymentId,
        customerFullName: fullName,
        customerPhone: phone,
        customerEmail: email,
        orderId,
        status: "pending",
        appBaseUrl,
      });

      return res.json({
        url: checkoutUrl,
        checkoutUrl,
        paymentId: tempPaymentId,
      });
    }

    const payment = await createGreenInvoicePayment(
      email,
      video.price,
      video.title,
      {
        appBaseUrl,
        fullName,
        phone,
        orderId,
        returnTo,
      },
    );

    await Purchase.deleteMany({
      customerEmail: email,
      videoId: { $in: acceptedPurchaseVideoIds },
      status: "pending",
    });

    await Purchase.create({
      videoId: purchaseVideoId,
      paymentId: payment.paymentId,
      customerFullName: fullName,
      customerPhone: phone,
      customerEmail: email,
      orderId,
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
  console.log("🔥 WEBHOOK RECEIVED:");
  console.log(JSON.stringify(req.body, null, 2));
  const orderId = extractWebhookOrderId(req.body);
  const event = extractWebhookEvent(req.body);
  const payerEmail = extractWebhookEmail(req.body);
  const paymentId =
    req.body?.paymentId ||
    req.body?.id ||
    req.body?.productId ||
    req.body?.transactions?.[0]?.id ||
    req.body?.data?.id ||
    req.body?.data?.paymentId ||
    req.body?.payload?.id ||
    req.body?.payload?.paymentId;

  const status = normalizeWebhookStatus(req.body);

  logger.info("Purchase webhook triggered.", {
    paymentId,
    orderId,
    event,
    payerEmail,
    status,
    paymentMode: config.paymentMode,
  });

  if (
    config.paymentMode === "test" &&
    typeof paymentId === "string" &&
    paymentId.startsWith("mock_")
  ) {
    const mockPurchase = await findPurchaseForWebhook(
      paymentId,
      orderId,
      payerEmail,
    );

    if (status === "failed") {
      if (mockPurchase) {
        mockPurchase.status = "failed";
        await mockPurchase.save();
      }
      return res.status(200).json({ ok: true, mocked: true, status: "failed" });
    }

    const provisioned = mockPurchase
      ? await provisionPurchaseAccess(String(mockPurchase.paymentId))
      : null;
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

  const purchase = await findPurchaseForWebhook(paymentId, orderId, payerEmail);

  if (purchase && status === "completed") {
    try {
      const provisioned = await provisionPurchaseAccess(
        String(purchase.paymentId),
      );

      if (!provisioned) {
        logger.warn(
          "Webhook completed but no matching purchase could be provisioned",
          {
            paymentId,
            orderId,
            payerEmail,
            body: req.body,
          },
        );
      }
    } catch (error) {
      logger.error("Webhook provisioning error:", error);
    }
  } else if (purchase && status === "failed") {
    purchase.status = "failed";
    await purchase.save();
  }

  res.sendStatus(200);
});

export default router;
