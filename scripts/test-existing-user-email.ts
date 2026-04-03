import mongoose from "mongoose";
import { Purchase } from "../models/Purchase";
import { User } from "../models/User";
import { Video } from "../models/Video";
import { config } from "../server/config/env";
import { provisionPurchaseAccess } from "../server/services/purchase";

const args = process.argv.slice(2);

const getArgValue = (name: string) => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const email = getArgValue("email");
const fullName = getArgValue("name") ?? "Existing User Purchase";
const phone = getArgValue("phone") ?? "0500000000";
const requestedVideoSlug = getArgValue("videoSlug");

async function run() {
  if (!email) {
    throw new Error(
      "Missing --email argument. Example: npx tsx scripts/test-existing-user-email.ts --email=rotem@rbdt-online.local",
    );
  }

  await mongoose.connect(config.dbUri);

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error(`Existing user not found for email: ${normalizedEmail}`);
    }

    const completedPurchases = await Purchase.find({
      customerEmail: normalizedEmail,
      status: "completed",
    }).lean();

    const ownedVideoIds = new Set(
      completedPurchases.map((purchase) => String(purchase.videoId)),
    );

    const video = requestedVideoSlug
      ? await Video.findOne({ slug: requestedVideoSlug, isActive: true })
      : await Video.findOne({
          isActive: true,
          _id: {
            $nin: Array.from(ownedVideoIds).map(
              (id) => new mongoose.Types.ObjectId(id),
            ),
          },
        }).sort({ createdAt: -1 });

    if (!video) {
      throw new Error(
        requestedVideoSlug
          ? `Active video not found for slug: ${requestedVideoSlug}`
          : `No unowned active video found for ${normalizedEmail}. Pass --videoSlug=<slug>.`,
      );
    }

    const paymentId = `manual_existing_user_${Date.now()}`;
    const orderId = `${String(video._id)}:${normalizedEmail}`;

    await Purchase.create({
      userId: user._id,
      videoId: video._id,
      paymentId,
      orderId,
      customerFullName: fullName,
      customerPhone: phone,
      customerEmail: normalizedEmail,
      status: "pending",
      appBaseUrl: config.appUrl,
    });

    const result = await provisionPurchaseAccess(paymentId);
    const purchase = await Purchase.findOne({ paymentId }).lean();

    console.log(
      JSON.stringify(
        {
          mode: "existing-user",
          paymentId,
          email: normalizedEmail,
          username: user.username,
          videoSlug: video.slug,
          videoTitle: video.title,
          result,
          purchaseStatus: purchase?.status,
          credentialsSentAt: purchase?.credentialsSentAt ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
