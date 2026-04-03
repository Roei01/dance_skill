import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Video } from "../models/Video";
import { DEFAULT_VIDEO_ID, DEFAULT_VIDEO_SLUG } from "../lib/catalog";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type RawPurchase = {
  _id: mongoose.Types.ObjectId;
  videoId?: unknown;
};

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

const getDatabaseName = (mongoUri: string) => {
  const withoutQuery = mongoUri.split("?")[0] || mongoUri;
  const segments = withoutQuery.split("/");
  return segments[segments.length - 1] || "";
};

const isObjectIdValue = (value: unknown): value is mongoose.Types.ObjectId => {
  return value instanceof mongoose.Types.ObjectId;
};

async function migrate() {
  if (!MONGO_URI) {
    throw new Error("Missing MONGODB_URI or DATABASE_URL environment variable.");
  }

  if (!MONGO_URI.includes("/dev")) {
    throw new Error("Refusing to run migration on non-dev database.");
  }

  const dbNameFromUri = getDatabaseName(MONGO_URI);
  console.log(`Target database from URI: ${dbNameFromUri}`);

  await mongoose.connect(MONGO_URI);

  const connectedDbName = mongoose.connection.name;
  console.log(`Connected database: ${connectedDbName}`);

  if (connectedDbName !== "dev") {
    throw new Error(`Refusing to run migration on database "${connectedDbName}".`);
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is missing a database handle.");
  }

  const purchaseCollection = db.collection<RawPurchase>("purchases");

  const videosMissingLegacyIds = await Video.find({
    $or: [{ videoId: { $exists: false } }, { videoId: "" }],
  }).select({ _id: 1, slug: 1, videoId: 1 });

  for (const video of videosMissingLegacyIds) {
    video.videoId =
      video.slug === DEFAULT_VIDEO_SLUG ? DEFAULT_VIDEO_ID : video.slug;
    await video.save();
    console.log(`Backfilled video.videoId for ${video.slug} -> ${video.videoId}`);
  }

  const purchases = await purchaseCollection
    .find({}, { projection: { videoId: 1 } })
    .toArray();

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const purchase of purchases) {
    if (isObjectIdValue(purchase.videoId)) {
      skipped += 1;
      continue;
    }

    if (typeof purchase.videoId !== "string" || purchase.videoId.trim().length === 0) {
      failed += 1;
      console.warn("Skipping purchase with invalid legacy videoId:", String(purchase._id));
      continue;
    }

    const legacyVideoId = purchase.videoId.trim();
    const video = await Video.findOne({
      $or: [{ videoId: legacyVideoId }, { slug: legacyVideoId }],
    })
      .select({ _id: 1, slug: 1, videoId: 1 })
      .lean();

    if (!video?._id) {
      failed += 1;
      console.warn(`No video found for legacy videoId "${legacyVideoId}" on purchase ${purchase._id}`);
      continue;
    }

    await purchaseCollection.updateOne(
      { _id: purchase._id },
      { $set: { videoId: video._id } },
    );

    updated += 1;
    console.log(`Updated purchase ${purchase._id} -> ${video._id.toString()} (${video.slug})`);
  }

  const remainingLegacyStrings = await purchaseCollection.countDocuments({
    videoId: { $type: "string" },
  });

  console.log("Migration summary:");
  console.log(`- total purchases: ${purchases.length}`);
  console.log(`- updated: ${updated}`);
  console.log(`- skipped: ${skipped}`);
  console.log(`- failed: ${failed}`);
  console.log(`- remaining string videoId values: ${remainingLegacyStrings}`);
}

migrate()
  .then(async () => {
    console.log("Migration completed.");
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
