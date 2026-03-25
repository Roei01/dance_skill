import { fail } from "k6";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export const getBaseUrl = () => {
  const rawBaseUrl = (__ENV.BASE_URL || "").trim();

  if (!rawBaseUrl) {
    fail("BASE_URL is required. Set it directly or via APP_BASE_URL in .env.");
  }

  return rawBaseUrl.replace(/\/$/, "");
};

export const parseNumberEnv = (name, fallbackValue) => {
  const rawValue = (__ENV[name] || "").trim();
  if (!rawValue) return fallbackValue;

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

export const isLocalBaseUrl = (baseUrl) => {
  try {
    const url = new URL(baseUrl);
    return LOCAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

export const ensureTransactionalSafety = (baseUrl, scriptName) => {
  if (isLocalBaseUrl(baseUrl)) {
    return;
  }

  if (__ENV.ALLOW_REMOTE_TRANSACTIONAL_LOAD === "1") {
    return;
  }

  fail(
    `${scriptName} is blocked for non-local targets. Use localhost/test or set ALLOW_REMOTE_TRANSACTIONAL_LOAD=1 explicitly.`,
  );
};

export const defaultJsonHeaders = {
  "Content-Type": "application/json",
};

export const buildConstantVuOptions = ({
  vus,
  duration,
  extraThresholds = {},
}) => ({
  vus,
  duration,
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2500"],
    iteration_duration: ["p(95)<4000"],
    ...extraThresholds,
  },
});

export const buildSharedIterationOptions = ({
  vus,
  iterations,
  maxDuration,
  extraThresholds = {},
}) => ({
  scenarios: {
    main: {
      executor: "shared-iterations",
      vus,
      iterations,
      maxDuration,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2500"],
    iteration_duration: ["p(95)<5000"],
    ...extraThresholds,
  },
});
