import mongoose from "mongoose";
import { Purchase } from "../models/Purchase";
import { config } from "../server/config/env";
import { provisionPurchaseAccess } from "../server/services/purchase";
import { getActiveVideoDocumentBySlug } from "../server/services/videos";

const args = process.argv.slice(2);

const getArgValue = (name: string) => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const email = getArgValue("email") ?? `testuser${Date.now()}@example.com`;
const fullName = getArgValue("name") ?? "Test New User";
const phone = getArgValue("phone") ?? "0500000000";
const videoSlug = getArgValue("videoSlug") ?? "modern-dance2";

async function run() {
  await mongoose.connect(config.dbUri);

  try {
    const existingUser = await mongoose.connection.collection("users").findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      throw new Error(
        `User ${email} already exists. Use a different email for the new-user test.`,
      );
    }

    const video = await getActiveVideoDocumentBySlug(videoSlug);

    if (!video) {
      throw new Error(`Active video not found for slug: ${videoSlug}`);
    }

    const paymentId = `manual_new_user_${Date.now()}`;
    const orderId = `${String(video._id)}:${email.toLowerCase()}`;

    await Purchase.create({
      videoId: video._id,
      paymentId,
      orderId,
      customerFullName: fullName,
      customerPhone: phone,
      customerEmail: email.toLowerCase(),
      status: "pending",
      appBaseUrl: config.appUrl,
    });

    const result = await provisionPurchaseAccess(paymentId);

    const purchase = await Purchase.findOne({ paymentId }).lean();

    console.log(
      JSON.stringify(
        {
          mode: "new-user",
          paymentId,
          email: email.toLowerCase(),
          videoSlug,
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
