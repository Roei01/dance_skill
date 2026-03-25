import http from "k6/http";
import { check, group, sleep } from "k6";
import {
  buildConstantVuOptions,
  getBaseUrl,
  parseNumberEnv,
} from "./shared/config.js";
import { buildSummary } from "./shared/summary.js";

const baseUrl = getBaseUrl();

export const options = buildConstantVuOptions({
  vus: parseNumberEnv("VUS", 50),
  duration: __ENV.DURATION || "45s",
  extraThresholds: {
    checks: ["rate>0.95"],
  },
});

export default function () {
  group("homepage", () => {
    const homeResponse = http.get(`${baseUrl}/`);
    check(homeResponse, {
      "home page loaded": (res) => res.status === 200,
      "home page contains title": (res) =>
        res.body.includes("ROTEM BARUCH dance tutorials"),
    });
  });

  sleep(0.5);

  group("primary CTA navigation", () => {
    const modernDanceResponse = http.get(`${baseUrl}/modern-dance`);
    check(modernDanceResponse, {
      "modern dance page loaded": (res) => res.status === 200,
    });
  });

  sleep(0.5);

  group("secondary navigation", () => {
    const responses = http.batch([
      ["GET", `${baseUrl}/login`],
      ["GET", `${baseUrl}/terms`],
      ["GET", `${baseUrl}/accessibility`],
    ]);

    check(responses[0], { "login page loaded": (res) => res.status === 200 });
    check(responses[1], { "terms page loaded": (res) => res.status === 200 });
    check(responses[2], {
      "accessibility page loaded": (res) => res.status === 200,
    });
  });

  sleep(1);
}

export const handleSummary = buildSummary("homepage-journey-load");
