import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI = process.env.DATABASE_URL;

async function backfillWatchMetadata() {
  if (!MONGO_URI) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  if (!MONGO_URI.includes("/dev")) {
    throw new Error("Refusing to run on non-dev database.");
  }

  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is missing a database handle.");
  }

  await db.collection("videos").updateMany(
    {
      $or: [{ watchDescription: { $exists: false } }, { watchDescription: "" }],
    },
    [{ $set: { watchDescription: "$description" } }],
  );

  await db.collection("videos").updateMany(
    { classBreakdown: { $exists: false } },
    { $set: { classBreakdown: [] } },
  );

  await db.collection("videos").updateOne(
    { slug: "modern-dance" },
    {
      $set: {
        watchDescription: "שיעור מודרני פיוז'ן לשיר אהבת השם של בן צור.",
        classBreakdown: [
          { time: "18:10", label: "קצב איטי" },
          { time: "19:10", label: "קצב רגיל" },
          { time: "19:55", label: "מלא עם מוזיקה" },
        ],
      },
    },
  );

  const videos = await db
    .collection("videos")
    .find(
      {},
      {
        projection: {
          slug: 1,
          title: 1,
          watchDescription: 1,
          classBreakdown: 1,
        },
      },
    )
    .toArray();

  console.log(JSON.stringify(videos, null, 2));
}

backfillWatchMetadata()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
