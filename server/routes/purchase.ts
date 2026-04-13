import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Purchase } from "../../models/Purchase";
import { User } from "../../models/User";
import {
  createGreenInvoicePayment,
  GreenInvoiceError,
} from "../services/greenInvoice";
import {
  getGrantedPurchaseVideoReferences,
  provisionPurchaseAccess,
} from "../services/purchase";
import { isValidPurchaseConfirmationToken } from "../services/purchase-confirmation";
import { purchaseRateLimiter } from "../middleware/rateLimit";
import { logger } from "../lib/logger";
import { config } from "../config/env";
import { DEFAULT_VIDEO_SLUG } from "../../lib/catalog";
import {
  getActiveVideoDocumentBySlug,
  resolveOwnedVideoSlugs,
} from "../services/videos";
import {
  quoteOfferPurchase,
  resolveOfferVideoDocuments,
} from "../services/offers";

const router = express.Router();

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");
const normalizeString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const normalizeEmail = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : undefined;

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
  videoSlug: z.string().trim().min(1).optional(),
  offerSlug: z.string().trim().min(1).optional(),
  discountCode: z.string().trim().min(1).optional(),
  paymentMethod: z
    .enum(["credit_card", "hosted"])
    .optional()
    .default("credit_card"),
});

const hostedConfirmSchema = z.object({
  email: z.string().trim().email(),
});

const successConfirmSchema = z.object({
  email: z.string().trim().email(),
  orderId: z.string().trim().min(1),
  token: z.string().trim().min(1),
});

type PurchaseVideoId = mongoose.Types.ObjectId;

const extractWebhookExternalId = (body: Record<string, any>) =>
  normalizeString(
    body?.external_data ||
      body?.externalData ||
      body?.data?.external_data ||
      body?.data?.externalData ||
      body?.payload?.external_data ||
      body?.payload?.externalData ||
      body?.transactions?.[0]?.external_data ||
      body?.transactions?.[0]?.externalData,
  );

const extractWebhookOrderId = (body: Record<string, any>) =>
  normalizeString(
    body?.custom ||
      body?.orderId ||
      body?.reference ||
      body?.data?.custom ||
      body?.data?.orderId ||
      body?.data?.reference ||
      body?.payload?.custom ||
      body?.payload?.orderId ||
      body?.payload?.reference,
  );

const extractWebhookPaymentIds = (body: Record<string, any>) => {
  const rawCandidates = [
    body?.paymentId,
    body?.transaction_id,
    body?.productId,
    body?.transactions?.[0]?.id,
    body?.data?.paymentId,
    body?.data?.transaction_id,
    body?.payload?.paymentId,
    body?.payload?.transaction_id,
    body?.id,
    body?.data?.id,
    body?.payload?.id,
  ];

  const seen = new Set<string>();
  const paymentIds: string[] = [];

  for (const candidate of rawCandidates) {
    const normalized = normalizeString(candidate);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    paymentIds.push(normalized);
  }

  return paymentIds;
};

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
      : undefined) ||
    body?.data?.email ||
    body?.payload?.email;

  return normalizeEmail(rawEmail);
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

  if (
    normalizeString(body?.transaction_id) &&
    normalizeString(
      body?.external_data ||
        body?.data?.external_data ||
        body?.payload?.external_data,
    )
  ) {
    return "completed";
  }

  return undefined;
};

const reqBodyHasTransactions = (body: Record<string, any>) =>
  Array.isArray(body?.transactions) && body.transactions.length > 0;

const toLegacyWebhookOrderId = (externalId?: string) =>
  externalId && externalId.includes(":") ? externalId : undefined;

const findPurchaseForWebhook = async (
  externalId: string | undefined,
  paymentIds: string[],
  orderId?: string,
  payerEmail?: string,
) => {
  if (externalId && !externalId.includes(":")) {
    const purchaseByExternalId = await Purchase.findOne({ externalId });
    if (purchaseByExternalId) {
      return purchaseByExternalId;
    }
  }

  for (const paymentId of paymentIds) {
    const purchaseByPaymentId = await Purchase.findOne({ paymentId });
    if (purchaseByPaymentId) {
      return purchaseByPaymentId;
    }
  }

  const legacyOrderId = orderId || toLegacyWebhookOrderId(externalId);

  if (legacyOrderId) {
    const purchaseByOrderId = await Purchase.findOne({ orderId: legacyOrderId });
    if (purchaseByOrderId) {
      return purchaseByOrderId;
    }
  }

  if (payerEmail) {
    const purchaseByEmail = await Purchase.findOne({
      customerEmail: payerEmail,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (purchaseByEmail) {
      return purchaseByEmail;
    }
  }

  return null;
};

const HOSTED_CONFIRM_WINDOW_MS = 3 * 60 * 60 * 1000;

const findLatestHostedPurchaseByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const minCreatedAt = Date.now() - HOSTED_CONFIRM_WINDOW_MS;
  const purchases = await Purchase.find({
    customerEmail: normalizedEmail,
    status: { $in: ["pending", "completed"] },
  });

  return (
    purchases
      .filter((purchase) => {
        const isHostedPayment =
          purchase.paymentId.startsWith("link_") ||
          (config.paymentMode === "test" &&
            purchase.paymentId.startsWith("mock_"));

        return (
          isHostedPayment &&
          new Date(purchase.createdAt).getTime() >= minCreatedAt
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ?? null
  );
};

const resolveCustomerOwnedVideoSlugs = async ({
  existingUserId,
  email,
}: {
  existingUserId?: string;
  email: string;
}) => {
  const purchases = await Purchase.find({
    status: "completed",
    $or: existingUserId
      ? [{ userId: existingUserId }, { customerEmail: email }]
      : [{ customerEmail: email }],
  }).lean();

  return resolveOwnedVideoSlugs(
    purchases.flatMap((purchase) =>
      getGrantedPurchaseVideoReferences(purchase),
    ),
  );
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

    const {
      email,
      fullName,
      phone,
      returnTo,
      paymentMethod,
      videoSlug,
      offerSlug,
      discountCode,
    } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();
    const appBaseUrl = deriveAppBaseUrlFromRequest(req);
    const existingUser = await User.findOne({ email: normalizedEmail });
    const productVideoSlug = videoSlug || DEFAULT_VIDEO_SLUG;

    let purchaseVideoId!: PurchaseVideoId;
    let grantedVideoIds: PurchaseVideoId[] = [];
    let orderId = "";
    let description = "";
    let originalPrice = 0;
    let finalPrice = 0;
    let purchaseType: "video" | "offer" = "video";
    let appliedDiscountCode: string | undefined;
    let normalizedOfferSlug: string | undefined;
    let hostedPaymentUrl: string | undefined;

    if (offerSlug) {
      const resolvedOffer = await resolveOfferVideoDocuments(offerSlug);
      if (!resolvedOffer || resolvedOffer.videos.length === 0) {
        return res.status(404).json({
          code: "OFFER_UNAVAILABLE",
          message: "Offer not found.",
        });
      }

      if (paymentMethod === "hosted") {
        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Hosted payment is not available for this offer yet.",
        });
      }

      const ownedSlugs = await resolveCustomerOwnedVideoSlugs({
        existingUserId: existingUser ? String(existingUser._id) : undefined,
        email: normalizedEmail,
      });
      const missingVideos = resolvedOffer.videos.filter(
        (video) => !ownedSlugs.includes(video.slug),
      );

      if (missingVideos.length === 0) {
        return res.status(409).json({
          code: "ALREADY_OWNED",
          message: "You already own all videos in this offer.",
        });
      }

      const quote = await quoteOfferPurchase({
        offerSlug: resolvedOffer.offer.slug,
        email: normalizedEmail,
        discountCode,
      });

      if (!quote) {
        return res.status(404).json({
          code: "OFFER_UNAVAILABLE",
          message: "Offer not found.",
        });
      }

      if (discountCode?.trim() && !quote.appliedCode) {
        return res.status(400).json({
          code: "INVALID_DISCOUNT_CODE",
          message: quote.message || "קוד ההנחה לא תקין או שכבר נוצל.",
        });
      }

      purchaseType = "offer";
      normalizedOfferSlug = resolvedOffer.offer.slug;
      hostedPaymentUrl = resolvedOffer.offer.hostedPaymentUrl;
      grantedVideoIds = missingVideos.map((video) => video._id as PurchaseVideoId);
      purchaseVideoId = grantedVideoIds[0];
      orderId = `${resolvedOffer.offer.slug}:${normalizedEmail}`;
      description = resolvedOffer.offer.title;
      originalPrice = quote.originalPrice;
      finalPrice = quote.finalPrice;
      appliedDiscountCode = quote.appliedCode;
    } else {
      const video = await getActiveVideoDocumentBySlug(productVideoSlug);

      if (!video) {
        return res.status(404).json({
          code: "VIDEO_UNAVAILABLE",
          message: "Video not found.",
        });
      }

      console.log("VIDEO ID:", video._id, typeof video._id);

      purchaseVideoId = video._id as PurchaseVideoId;
      grantedVideoIds = [purchaseVideoId];
      orderId = `${String(video._id)}:${normalizedEmail}`;
      description = video.title;
      originalPrice = video.price;
      finalPrice = video.price;

      if (existingUser) {
        const existingPurchase = await Purchase.findOne({
          userId: existingUser._id,
          $or: [
            { videoId: video._id },
            { grantedVideoIds: { $in: [video._id] } },
          ],
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
    }

    const pendingPurchaseQuery = normalizedOfferSlug
      ? {
          customerEmail: normalizedEmail,
          offerSlug: normalizedOfferSlug,
          status: "pending" as const,
        }
      : {
          customerEmail: normalizedEmail,
          videoId: purchaseVideoId,
          status: "pending" as const,
        };

    await Purchase.deleteMany(pendingPurchaseQuery);

    if (paymentMethod === "hosted") {
      const isTestMode = config.paymentMode === "test";
      const tempPaymentId = isTestMode
        ? `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
        : `link_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const purchase = await Purchase.create({
        videoId: purchaseVideoId,
        grantedVideoIds,
        purchaseType,
        offerSlug: normalizedOfferSlug,
        paymentId: tempPaymentId,
        customerFullName: fullName,
        customerPhone: phone,
        customerEmail: normalizedEmail,
        orderId,
        status: "pending",
        appBaseUrl,
        originalPrice,
        finalPrice,
        appliedDiscountCode,
      });
      purchase.externalId = String(purchase._id);
      await purchase.save();

      // Set up the success URL to return to
      const successUrl = new URL("/success", `${appBaseUrl}/`);
      successUrl.searchParams.set("email", normalizedEmail);
      successUrl.searchParams.set("method", "hosted");
      successUrl.searchParams.set("videoSlug", productVideoSlug);
      if (returnTo) {
        successUrl.searchParams.set("returnTo", returnTo);
      }

      const checkoutUrl = isTestMode
        ? `${config.appUrl}/success?mock=true`
        : (() => {
            const baseHostedUrl =
              purchaseType === "offer" && hostedPaymentUrl
                ? hostedPaymentUrl
                : "https://mrng.to/BKXBaFbl0K";
            const hostedUrl = new URL(baseHostedUrl);
            hostedUrl.searchParams.set("email", normalizedEmail);
            hostedUrl.searchParams.set("successUrl", successUrl.toString());
            hostedUrl.searchParams.set("redirectUrl", successUrl.toString());
            hostedUrl.searchParams.set(
              "externalId",
              purchase.externalId || String(purchase._id),
            );
            return hostedUrl.toString();
          })();

      return res.json({
        url: checkoutUrl,
        checkoutUrl,
        paymentId: tempPaymentId,
      });
    }

    const purchase = await Purchase.create({
      videoId: purchaseVideoId,
      grantedVideoIds,
      purchaseType,
      offerSlug: normalizedOfferSlug,
      paymentId: `pending_${new mongoose.Types.ObjectId().toString()}`,
      customerFullName: fullName,
      customerPhone: phone,
      customerEmail: normalizedEmail,
      orderId,
      status: "pending",
      appBaseUrl,
      originalPrice,
      finalPrice,
      appliedDiscountCode,
    });
    purchase.externalId = String(purchase._id);
    await purchase.save();

    try {
      const payment = await createGreenInvoicePayment(
        email,
        finalPrice,
        description,
        {
          appBaseUrl,
          fullName,
          phone,
          orderId,
          externalId: purchase.externalId,
          returnTo,
        },
      );

      purchase.paymentId = payment.paymentId;
      await purchase.save();

      return res.json({
        checkoutUrl: payment.checkoutUrl,
        paymentId: payment.paymentId,
      });
    } catch (paymentError) {
      await Purchase.deleteMany({ _id: purchase._id });
      throw paymentError;
    }
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

router.post("/hosted/confirm", async (req, res) => {
  const validation = hostedConfirmSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "A valid email is required.",
    });
  }

  const email = validation.data.email.trim().toLowerCase();
  const purchase = await findLatestHostedPurchaseByEmail(email);

  if (!purchase) {
    logger.warn("Hosted purchase confirmation could not find purchase.", {
      email,
    });
    return res.status(404).json({
      code: "PURCHASE_NOT_FOUND",
      message: "No hosted purchase found for this email.",
    });
  }

  if (purchase.status === "completed" && purchase.credentialsSentAt) {
    logger.info("Hosted purchase already completed.", {
      email,
      paymentId: purchase.paymentId,
    });
    return res.status(200).json({
      ok: true,
      alreadyCompleted: true,
      paymentId: purchase.paymentId,
    });
  }

  try {
    purchase.status = "completed";
    await purchase.save();

    const provisioned = await provisionPurchaseAccess(
      String(purchase.paymentId),
    );
    logger.info("Hosted purchase confirmation completed.", {
      email,
      paymentId: purchase.paymentId,
      provisioned: Boolean(provisioned),
    });

    return res.status(200).json({
      ok: true,
      paymentId: purchase.paymentId,
      provisioned: Boolean(provisioned),
    });
  } catch (error) {
    logger.error("Hosted purchase confirmation error:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Unable to confirm hosted payment.",
    });
  }
});

router.post("/success/confirm", async (req, res) => {
  const validation = successConfirmSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "A valid email, order id and token are required.",
    });
  }

  const email = validation.data.email.trim().toLowerCase();
  const orderId = validation.data.orderId.trim();
  const token = validation.data.token.trim();

  if (!isValidPurchaseConfirmationToken({ email, orderId, token })) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Invalid purchase confirmation token.",
    });
  }

  const purchase = await Purchase.findOne({
    orderId,
    customerEmail: email,
  }).sort({ createdAt: -1 });

  if (!purchase) {
    logger.warn("Success confirmation could not find purchase.", {
      email,
      orderId,
    });
    return res.status(404).json({
      code: "PURCHASE_NOT_FOUND",
      message: "No matching purchase found for this confirmation.",
    });
  }

  if (purchase.status === "completed" && purchase.credentialsSentAt) {
    logger.info("Success confirmation found an already completed purchase.", {
      email,
      orderId,
      paymentId: purchase.paymentId,
    });
    return res.status(200).json({
      ok: true,
      alreadyCompleted: true,
      paymentId: purchase.paymentId,
    });
  }

  try {
    purchase.status = "completed";
    await purchase.save();

    const provisioned = await provisionPurchaseAccess(
      String(purchase.paymentId),
    );
    logger.info("Success confirmation completed.", {
      email,
      orderId,
      paymentId: purchase.paymentId,
      provisioned: Boolean(provisioned),
    });

    return res.status(200).json({
      ok: true,
      paymentId: purchase.paymentId,
      provisioned: Boolean(provisioned),
    });
  } catch (error) {
    logger.error("Success confirmation error:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Unable to confirm purchase success.",
    });
  }
});

router.post("/webhook", async (req, res) => {
  console.log("🔥 WEBHOOK RECEIVED:");
  console.log(JSON.stringify(req.body, null, 2));
  const externalId = extractWebhookExternalId(req.body);
  const orderId = extractWebhookOrderId(req.body);
  const legacyOrderId = orderId || toLegacyWebhookOrderId(externalId);
  const event = extractWebhookEvent(req.body);
  const payerEmail = extractWebhookEmail(req.body);
  const paymentIds = extractWebhookPaymentIds(req.body);
  const paymentId = paymentIds[0];

  const status = normalizeWebhookStatus(req.body);

  logger.info("Purchase webhook triggered.", {
    externalId,
    paymentId,
    orderId: legacyOrderId,
    event,
    payerEmail,
    status,
    paymentMode: config.paymentMode,
  });
  console.log("WEBHOOK_NORMALIZED", {
    externalId,
    paymentId,
    paymentIds,
    orderId: legacyOrderId,
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
      externalId,
      paymentIds,
      legacyOrderId,
      payerEmail,
    );

    if (status === "failed") {
      if (mockPurchase) {
        mockPurchase.status = "failed";
        await mockPurchase.save();
      }
      console.log("WEBHOOK_TEST_FAILED", {
        externalId,
        paymentId,
        orderId: legacyOrderId,
        payerEmail,
        foundPurchase: Boolean(mockPurchase),
      });
      return res.status(200).json({ ok: true, mocked: true, status: "failed" });
    }

    console.log("WEBHOOK_TEST_PROVISION_START", {
      externalId,
      paymentId,
      orderId: legacyOrderId,
      payerEmail,
      foundPurchase: Boolean(mockPurchase),
    });
    const provisioned = mockPurchase
      ? await provisionPurchaseAccess(String(mockPurchase.paymentId))
      : null;
    console.log("WEBHOOK_TEST_PROVISION_RESULT", {
      externalId,
      paymentId,
      orderId: legacyOrderId,
      payerEmail,
      provisioned: Boolean(provisioned),
    });
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

  let purchase = await findPurchaseForWebhook(
    externalId,
    paymentIds,
    legacyOrderId,
    payerEmail,
  );

  if (!purchase && req.body?.channel === "payment-link" && payerEmail) {
    purchase = await findLatestHostedPurchaseByEmail(payerEmail);
    if (purchase) {
      console.log("WEBHOOK_PAYMENT_LINK_EMAIL_FALLBACK_MATCH", {
        payerEmail,
        purchaseId: String(purchase._id),
        purchasePaymentId: String(purchase.paymentId),
      });
    }
  }
  console.log("WEBHOOK_PURCHASE_LOOKUP_RESULT", {
    externalId,
    paymentId,
    paymentIds,
    orderId: legacyOrderId,
    payerEmail,
    status,
    foundPurchase: Boolean(purchase),
    purchaseId: purchase ? String(purchase._id) : undefined,
    purchasePaymentId: purchase ? String(purchase.paymentId) : undefined,
    purchaseStatus: purchase?.status,
    purchaseEmail: purchase?.customerEmail,
  });

  if (!purchase) {
    console.warn("Webhook purchase not found", {
      externalId,
      paymentId,
      orderId: legacyOrderId,
      payerEmail,
      event,
      status,
    });
    return res.sendStatus(200);
  }

  if (status === "completed") {
    try {
      console.log("WEBHOOK_MARK_COMPLETED_START", {
        purchaseId: String(purchase._id),
        paymentId,
        currentStatus: purchase.status,
      });
      purchase.status = "completed";
      await purchase.save();
      console.log("WEBHOOK_MARK_COMPLETED_DONE", {
        purchaseId: String(purchase._id),
        paymentId,
        newStatus: purchase.status,
      });

      console.log("WEBHOOK_PROVISION_START", {
        purchaseId: String(purchase._id),
        purchasePaymentId: String(purchase.paymentId),
        customerEmail: purchase.customerEmail,
      });
      const provisioned = await provisionPurchaseAccess(
        String(purchase.paymentId),
      );
      console.log("WEBHOOK_PROVISION_RESULT", {
        purchaseId: String(purchase._id),
        purchasePaymentId: String(purchase.paymentId),
        provisioned: Boolean(provisioned),
        provisionedEmail: provisioned?.email,
        provisionedUsername: provisioned?.username,
      });

      if (!provisioned) {
        logger.warn(
          "Webhook completed but no matching purchase could be provisioned",
          {
            externalId,
            paymentId,
            orderId: legacyOrderId,
            payerEmail,
            body: req.body,
          },
        );
      }
    } catch (error) {
      console.error("Webhook provisioning error", {
        externalId,
        paymentId,
        orderId: legacyOrderId,
        payerEmail,
        purchaseId: String(purchase._id),
        purchasePaymentId: String(purchase.paymentId),
        error,
      });
      logger.error("Webhook provisioning error:", error);
    }
  } else if (status === "failed") {
    console.log("WEBHOOK_MARK_FAILED_START", {
      purchaseId: String(purchase._id),
      paymentId,
      currentStatus: purchase.status,
    });
    purchase.status = "failed";
    await purchase.save();
    console.log("WEBHOOK_MARK_FAILED_DONE", {
      purchaseId: String(purchase._id),
      paymentId,
      newStatus: purchase.status,
    });
  } else {
    console.log("WEBHOOK_IGNORED_STATUS", {
      externalId,
      paymentId,
      orderId: legacyOrderId,
      payerEmail,
      status,
      purchaseId: String(purchase._id),
    });
  }

  res.sendStatus(200);
});

export default router;
