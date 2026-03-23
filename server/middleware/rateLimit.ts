import rateLimit from "express-rate-limit";

const formatRetryAfterMessage = (seconds: number, label: string) => {
  if (seconds <= 60) {
    return `בוצעו יותר מדי ${label}. נסו שוב בעוד ${seconds} שניות.`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `בוצעו יותר מדי ${label}. נסו שוב בעוד כ-${minutes} דקות.`;
};

const buildRateLimitHandler = (label: string) => {
  return (req: any, res: any) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil((req.rateLimit?.windowMs ?? 0) / 1000);

    res.status(429).json({
      code: "RATE_LIMITED",
      message: formatRetryAfterMessage(retryAfterSeconds, label),
      retryAfterSeconds,
    });
  };
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildRateLimitHandler("ניסיונות התחברות"),
});

export const purchaseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildRateLimitHandler("ניסיונות רכישה"),
});

export const newsletterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildRateLimitHandler("ניסיונות הרשמה"),
});
