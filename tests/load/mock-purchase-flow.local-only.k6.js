import http from "k6/http";
import { check, group, sleep } from "k6";
import {
  buildSharedIterationOptions,
  defaultJsonHeaders,
  ensureTransactionalSafety,
  getBaseUrl,
  parseNumberEnv,
} from "./shared/config.js";
import { buildSummary } from "./shared/summary.js";

const baseUrl = getBaseUrl();
const vus = parseNumberEnv("VUS", 10);

export const options = buildSharedIterationOptions({
  vus,
  iterations: parseNumberEnv("ITERATIONS", 10),
  maxDuration: __ENV.MAX_DURATION || "2m",
  extraThresholds: {
    checks: ["rate>0.95"],
  },
});

ensureTransactionalSafety(baseUrl, "mock-purchase-flow.local-only.k6.js");

const buildEmail = () =>
  `k6_purchase_vu${__VU}_iter${__ITER}_${Date.now()}@example.com`;

export default function () {
  const email = buildEmail();
  let paymentId = "";

  group("create mock purchase", () => {
    const createResponse = http.post(
      `${baseUrl}/api/purchase/create`,
      JSON.stringify({
        fullName: `K6 User ${__VU}`,
        phone: `0500000${String(__VU).padStart(3, "0")}`,
        email,
        returnTo: `${baseUrl}/#purchase`,
      }),
      {
        headers: defaultJsonHeaders,
      },
    );

    check(createResponse, {
      "purchase create succeeded": (res) => res.status === 200,
      "purchase create returned payment id": (res) =>
        Boolean(res.json("paymentId")),
      "purchase create returned checkout url": (res) =>
        Boolean(res.json("checkoutUrl")),
    });

    paymentId = createResponse.json("paymentId") || "";
  });

  sleep(0.5);

  group("complete mock webhook", () => {
    const webhookResponse = http.post(
      `${baseUrl}/api/purchase/webhook`,
      JSON.stringify({
        paymentId,
        status: "success",
      }),
      {
        headers: defaultJsonHeaders,
      },
    );

    check(webhookResponse, {
      "mock webhook succeeded": (res) => res.status === 200,
    });
  });

  sleep(1);
}

export const handleSummary = buildSummary("mock-purchase-flow.local-only");
