import axios from "axios";
import fs from "fs";

const API_URL = "http://localhost:3000/api";

async function testFlow() {
  try {
    console.log("\n--- 1. INITIATING PURCHASE ---");
    const email = `test_${Date.now()}@example.com`;
    console.log(`👤 Buying for: ${email}`);

    const purchaseRes = await axios.post(`${API_URL}/purchase/create`, {
      fullName: "Test Buyer",
      phone: "0500000000",
      email,
    });

    const { checkoutUrl, paymentId } = purchaseRes.data;
    console.log(`✅ Purchase Initiated. Payment ID: ${paymentId}`);
    console.log(`🔗 Redirecting to: ${checkoutUrl}`);

    console.log("\n--- 2. SIMULATING PAYMENT SUCCESS (WEBHOOK) ---");
    // Simulate callback from GreenInvoice
    const webhookRes = await axios.post(`${API_URL}/purchase/webhook`, {
      paymentId: paymentId,
      status: "completed", // Or 'success' depending on provider
    });

    if (webhookRes.status === 200) {
      console.log("✅ Payment Confirmed via Webhook");
      console.log(
        "📧 Credentials should be sent to email (and logged to server console).",
      );
    } else {
      console.error("❌ Webhook failed:", webhookRes.status);
    }
  } catch (error: any) {
    console.error(
      "❌ Test failed:",
      error.response ? error.response.data : error.message,
    );
  }
}

testFlow();
