import express from "express";
import { z } from "zod";
import {
  getActiveOfferBySlug,
  listActiveOffers,
  quoteOfferPurchase,
} from "../services/offers";

const router = express.Router();

const quoteSchema = z.object({
  email: z.string().trim().email().optional(),
  discountCode: z.string().trim().min(1),
});

router.get("/", async (_req, res) => {
  const offers = await listActiveOffers();
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(offers);
});

router.get("/:slug", async (req, res) => {
  const offer = await getActiveOfferBySlug(req.params.slug);
  if (!offer) {
    return res.status(404).json({
      code: "OFFER_UNAVAILABLE",
      message: "Offer not found.",
    });
  }

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(offer);
});

router.post("/:slug/quote", async (req, res) => {
  const validation = quoteSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "A valid discount code is required.",
    });
  }

  const quote = await quoteOfferPurchase({
    offerSlug: req.params.slug,
    email: validation.data.email,
    discountCode: validation.data.discountCode,
  });

  if (!quote) {
    return res.status(404).json({
      code: "OFFER_UNAVAILABLE",
      message: "Offer not found.",
    });
  }

  if (!quote.appliedCode) {
    return res.status(400).json({
      code: "INVALID_DISCOUNT_CODE",
      message: quote.message || "Invalid discount code.",
      quote,
    });
  }

  return res.json(quote);
});

export default router;
