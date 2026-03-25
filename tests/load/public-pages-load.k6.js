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
  duration: __ENV.DURATION || "30s",
  extraThresholds: {
    checks: ["rate>0.95"],
  },
});

const pages = ["/", "/modern-dance", "/login"];

console.log("Base URL:", baseUrl);

export default function () {
  group("real user flow", () => {
    let res = http.get(`${baseUrl}/`);
    check(res, { "home 200": (r) => r.status === 200 });

    sleep(1);

    res = http.get(`${baseUrl}/modern-dance`);
    check(res, { "modern-dance 200": (r) => r.status === 200 });

    sleep(1);

    res = http.get(`${baseUrl}/login`);
    check(res, { "login 200": (r) => r.status === 200 });
  });

  sleep(1);
}

export const handleSummary = buildSummary("public-pages-load");
