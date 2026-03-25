import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GREENINVOICE_API_KEY: z.string().optional(),
  GREENINVOICE_API_SECRET: z.string().optional(),
  GREENINVOICE_PLUGIN_ID: z.string().optional(),
  GREENINVOICE_GROUP: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  GREENINVOICE_API_URL: z
    .string()
    .url()
    .default("https://api.greeninvoice.co.il/api/v1"),
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.string().transform((val) => parseInt(val, 10)),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  JWT_SECRET: z.string().min(8),
  VIDEO_SECRET_TOKEN: z.string().min(8),
  APP_BASE_URL: z.string().url().optional(),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  PAYMENT_MODE: z.enum(["test", "production"]).optional().default("production"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .optional()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 2),
  );
  process.exit(1);
}

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const resolveAppUrl = () => {
  if (env.data.APP_BASE_URL) {
    return normalizeBaseUrl(env.data.APP_BASE_URL);
  }

  if (env.data.RENDER_EXTERNAL_URL) {
    return normalizeBaseUrl(env.data.RENDER_EXTERNAL_URL);
  }

  if (env.data.VERCEL_URL) {
    return normalizeBaseUrl(`https://${env.data.VERCEL_URL}`);
  }

  return "https://rbdt-online.onrender.com/";
};

export const config = {
  dbUri: env.data.DATABASE_URL,
  jwtSecret: env.data.JWT_SECRET,
  videoSecret: env.data.VIDEO_SECRET_TOKEN,
  greenInvoice: {
    key: env.data.GREENINVOICE_API_KEY,
    secret: env.data.GREENINVOICE_API_SECRET,
    pluginId: env.data.GREENINVOICE_PLUGIN_ID,
    group: env.data.GREENINVOICE_GROUP,
    url: env.data.GREENINVOICE_API_URL,
  },
  email: {
    host: env.data.EMAIL_HOST,
    port: env.data.EMAIL_PORT,
    user: env.data.EMAIL_USER,
    pass: env.data.EMAIL_PASS,
  },
  appUrl: resolveAppUrl(),
  isProduction: env.data.NODE_ENV === "production",
  isTest: env.data.NODE_ENV === "test",
  paymentMode:
    env.data.NODE_ENV === "production" ? "production" : env.data.PAYMENT_MODE,
  port: env.data.PORT,
};
