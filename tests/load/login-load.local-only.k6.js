import http from "k6/http";
import { check, fail, sleep } from "k6";
import {
  buildSharedIterationOptions,
  defaultJsonHeaders,
  ensureTransactionalSafety,
  getBaseUrl,
  parseNumberEnv,
} from "./shared/config.js";
import { buildSummary } from "./shared/summary.js";

const baseUrl = getBaseUrl();
const vus = parseNumberEnv("VUS", 20);

export const options = buildSharedIterationOptions({
  vus,
  iterations: parseNumberEnv("ITERATIONS", vus),
  maxDuration: __ENV.MAX_DURATION || "2m",
  extraThresholds: {
    checks: ["rate>0.95"],
  },
});

const users = (() => {
  try {
    return JSON.parse(__ENV.LOGIN_USERS_JSON || "[]");
  } catch {
    return [];
  }
})();

if (!Array.isArray(users) || users.length === 0) {
  fail("LOGIN_USERS_JSON is required for login load tests.");
}

if (users.length < vus) {
  fail("LOGIN_USERS_JSON must include at least as many users as VUS.");
}

ensureTransactionalSafety(baseUrl, "login-load.local-only.k6.js");

const getCookieHeader = (setCookieHeader) => {
  if (Array.isArray(setCookieHeader)) {
    return setCookieHeader.join("; ");
  }

  if (typeof setCookieHeader === "string") {
    return setCookieHeader;
  }

  return "";
};

export default function () {
  const user = users[(__VU - 1) % users.length];

  const loginResponse = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({
      username: user.username,
      password: user.password,
    }),
    {
      headers: defaultJsonHeaders,
    },
  );

  check(loginResponse, {
    "login succeeded": (res) => res.status === 200,
    "login returned token": (res) => Boolean(res.json("token")),
  });

  const cookieHeader = getCookieHeader(loginResponse.headers["Set-Cookie"]);

  const meResponse = http.get(`${baseUrl}/api/auth/me`, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  check(meResponse, {
    "me endpoint succeeded": (res) => res.status === 200,
  });

  const logoutResponse = http.post(`${baseUrl}/api/auth/logout`, null, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  check(logoutResponse, {
    "logout succeeded": (res) => res.status === 204,
  });

  sleep(1);
}

export const handleSummary = buildSummary("login-load.local-only");
