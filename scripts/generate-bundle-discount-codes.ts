import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Purchase } from "../models/Purchase";
import { DiscountCode } from "../models/DiscountCode";
import { DEFAULT_BUNDLE_OFFER_SLUG } from "../lib/offers";
import { getGrantedPurchaseVideoReferences } from "../server/services/purchase";
import { getActiveOfferBySlug } from "../server/services/offers";
import { resolveOwnedVideoSlugs } from "../server/services/videos";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const DEFAULT_DISCOUNT_AMOUNT = 45;

const generateCode = () => {
  return `RB${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

async function main() {
  if (!MONGO_URI) {
    throw new Error("Missing MONGODB_URI or DATABASE_URL environment variable.");
  }

  await mongoose.connect(MONGO_URI);

  const offer = await getActiveOfferBySlug(DEFAULT_BUNDLE_OFFER_SLUG);

  if (!offer) {
    throw new Error(`Active offer "${DEFAULT_BUNDLE_OFFER_SLUG}" was not found.`);
  }

  const completedPurchases = await Purchase.find({
    status: "completed",
  }).lean();

  const purchasesByEmail = new Map<string, typeof completedPurchases>();

  for (const purchase of completedPurchases) {
    const email = purchase.customerEmail?.trim().toLowerCase();
    if (!email) {
      continue;
    }

    const existing = purchasesByEmail.get(email) ?? [];
    existing.push(purchase);
    purchasesByEmail.set(email, existing);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const [email, purchases] of purchasesByEmail.entries()) {
    const ownedSlugs = await resolveOwnedVideoSlugs(
      purchases.flatMap((purchase) => getGrantedPurchaseVideoReferences(purchase)),
    );
    const ownedBundleSlugs = offer.videos.map((video) => video.slug).filter((slug) =>
      ownedSlugs.includes(slug),
    );

    if (
      ownedBundleSlugs.length === 0 ||
      ownedBundleSlugs.length >= offer.videos.length
    ) {
      skippedCount += 1;
      continue;
    }

    const existingCode = await DiscountCode.findOne({
      offerSlug: offer.slug,
      email,
      isActive: true,
      usedAt: { $exists: false },
    }).lean();

    if (existingCode) {
      skippedCount += 1;
      continue;
    }

    await DiscountCode.create({
      code: generateCode(),
      offerSlug: offer.slug,
      email,
      discountAmount: DEFAULT_DISCOUNT_AMOUNT,
      isActive: true,
    });

    createdCount += 1;
    console.log(`Created bundle discount code for ${email}`);
  }

  console.log(`Done. Created ${createdCount} codes, skipped ${skippedCount} customers.`);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Failed to generate bundle discount codes:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
