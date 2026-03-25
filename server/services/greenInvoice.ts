import axios, { AxiosError } from "axios";
import { config } from "../config/env";
import { logger } from "../lib/logger";

type GreenInvoiceTokenResponse = {
  token: string;
  expires?: number;
};

type GreenInvoicePaymentFormResponse = {
  id?: string;
  paymentId?: string;
  url?: string;
  paymentUrl?: string;
  checkoutUrl?: string;
  data?: {
    id?: string;
    paymentId?: string;
    url?: string;
    paymentUrl?: string;
    checkoutUrl?: string;
  };
};

type CreateGreenInvoicePaymentOptions = {
  appBaseUrl?: string;
  fullName?: string;
  phone?: string;
  orderId?: string;
};

type GreenInvoiceApiError = {
  errorCode?: number;
  errorMessage?: string;
  message?: string;
};

export class GreenInvoiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code:
      | "UNAUTHORIZED"
      | "VALIDATION_ERROR"
      | "PAYMENT_TERMINAL_INACTIVE"
      | "INTERNAL_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "GreenInvoiceError";
  }
}

const PRODUCTION_GREENINVOICE_URL = "https://api.greeninvoice.co.il/api/v1";
const SANDBOX_GREENINVOICE_URL = "https://sandbox.d.greeninvoice.co.il/api/v1";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const isPublicHostname = (hostname: string) => {
  const h = hostname.toLowerCase();
  return !["localhost", "127.0.0.1", "::1"].includes(h);
};

const isPublicAbsoluteUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return isPublicHostname(url.hostname);
  } catch {
    return false;
  }
};

const isPublicAppUrl = () => {
  try {
    const url = new URL(config.appUrl);
    return isPublicHostname(url.hostname);
  } catch {
    return false;
  }
};

const resolveCallbackBaseUrl = (appBaseUrl?: string) => {
  if (appBaseUrl && isPublicAbsoluteUrl(appBaseUrl)) {
    return normalizeBaseUrl(appBaseUrl);
  }
  if (isPublicAppUrl()) {
    return normalizeBaseUrl(config.appUrl);
  }
  return null;
};

const getConfiguredBaseUrls = () => {
  const configured = normalizeBaseUrl(config.greenInvoice.url);
  const fallbacks = [configured];

  if (
    configured.includes("sandbox.greeninvoice.co.il") &&
    !fallbacks.includes(SANDBOX_GREENINVOICE_URL)
  ) {
    fallbacks.push(SANDBOX_GREENINVOICE_URL);
  }

  if (
    (configured.includes("sandbox.d.greeninvoice.co.il") ||
      configured.includes("sandbox.greeninvoice.co.il")) &&
    !fallbacks.includes(PRODUCTION_GREENINVOICE_URL)
  ) {
    // The current credentials in this project authenticate against production.
    fallbacks.push(PRODUCTION_GREENINVOICE_URL);
  }

  return fallbacks;
};

const getErrorMessage = (error: AxiosError<GreenInvoiceApiError>) => {
  return (
    error.response?.data?.errorMessage ||
    error.response?.data?.message ||
    error.message ||
    "GreenInvoice request failed."
  );
};

const extractCheckout = (payload: GreenInvoicePaymentFormResponse) => {
  return {
    checkoutUrl:
      payload.url ||
      payload.paymentUrl ||
      payload.checkoutUrl ||
      payload.data?.url ||
      payload.data?.paymentUrl ||
      payload.data?.checkoutUrl,
    paymentId:
      payload.id ||
      payload.paymentId ||
      payload.data?.id ||
      payload.data?.paymentId,
  };
};

const authenticateWithBaseUrl = async (baseUrl: string) => {
  const response = await axios.post<GreenInvoiceTokenResponse>(
    `${baseUrl}/account/token`,
    {
      id: config.greenInvoice.key,
      secret: config.greenInvoice.secret,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  if (!response.data?.token) {
    throw new GreenInvoiceError(
      500,
      "INTERNAL_ERROR",
      "GreenInvoice token response did not include a token.",
    );
  }

  return {
    token: response.data.token,
    baseUrl,
  };
};

export const getGreenInvoiceAccessToken = async () => {
  if (!config.greenInvoice.key || !config.greenInvoice.secret) {
    throw new GreenInvoiceError(
      500,
      "INTERNAL_ERROR",
      "GreenInvoice credentials are missing on the server.",
    );
  }

  const baseUrls = getConfiguredBaseUrls();
  let lastError: unknown;

  for (const baseUrl of baseUrls) {
    try {
      if (baseUrl !== normalizeBaseUrl(config.greenInvoice.url)) {
        logger.warn(
          "⚠️ Falling back to GreenInvoice production endpoint for current credentials.",
        );
      }
      return await authenticateWithBaseUrl(baseUrl);
    } catch (error) {
      lastError = error;
    }
  }

  if (axios.isAxiosError(lastError)) {
    const statusCode = lastError.response?.status || 500;
    const message = getErrorMessage(lastError);

    if (statusCode === 401 || statusCode === 403) {
      throw new GreenInvoiceError(401, "UNAUTHORIZED", message);
    }

    if (statusCode === 400) {
      throw new GreenInvoiceError(400, "VALIDATION_ERROR", message);
    }

    throw new GreenInvoiceError(500, "INTERNAL_ERROR", message);
  }

  if (lastError instanceof GreenInvoiceError) {
    throw lastError;
  }

  throw new GreenInvoiceError(
    500,
    "INTERNAL_ERROR",
    "Failed to authenticate with GreenInvoice.",
  );
};

export const createGreenInvoicePayment = async (
  email: string,
  amount: number,
  description: string,
  options?: CreateGreenInvoicePaymentOptions,
) => {
  try {
    const { token, baseUrl } = await getGreenInvoiceAccessToken();

    const callbackBase = resolveCallbackBaseUrl(options?.appBaseUrl);
    const callbackUrls = callbackBase
      ? {
          successUrl: `${callbackBase}/success?email=${encodeURIComponent(email)}`,
          failureUrl: `${callbackBase}/cancel`,
          notifyUrl: `${callbackBase}/api/purchase/webhook`,
        }
      : {};

    const normalizedPhone = options?.phone?.trim();
    const payload = {
      description,
      type: 320,
      lang: "he",
      currency: "ILS",
      vatType: 0,
      amount,
      maxPayments: 1,
      ...(config.greenInvoice.pluginId
        ? { pluginId: config.greenInvoice.pluginId }
        : {}),
      ...(typeof config.greenInvoice.group === "number"
        ? { group: config.greenInvoice.group }
        : {}),
      client: {
        name: options?.fullName?.trim() || email.split("@")[0],
        emails: [email],
        ...(normalizedPhone
          ? {
              phone: normalizedPhone,
              mobile: normalizedPhone,
            }
          : {}),
        add: true,
      },
      income: [
        {
          description,
          quantity: 1,
          price: amount,
          currency: "ILS",
          vatType: 1,
        },
      ],
      remarks: description,
      custom: options?.orderId || email,
      ...callbackUrls,
    };

    const response = await axios.post<GreenInvoicePaymentFormResponse>(
      `${baseUrl}/payments/form`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const { checkoutUrl, paymentId } = extractCheckout(response.data);

    if (!checkoutUrl) {
      throw new GreenInvoiceError(
        500,
        "INTERNAL_ERROR",
        "GreenInvoice did not return a checkout URL.",
      );
    }

    return {
      checkoutUrl,
      paymentId: paymentId || `gi_${Date.now()}`,
    };
  } catch (error) {
    if (error instanceof GreenInvoiceError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);

      if (statusCode === 401 || statusCode === 403) {
        throw new GreenInvoiceError(401, "UNAUTHORIZED", message);
      }

      if (statusCode === 400) {
        const apiErrorCode = error.response?.data?.errorCode;

        if (apiErrorCode === 2600) {
          throw new GreenInvoiceError(
            400,
            "PAYMENT_TERMINAL_INACTIVE",
            "לא נמצא מסוף סליקה פעיל בחשבון GreenInvoice. יש לוודא שהופעל מסוף דיגיטלי פעיל עבור סליקת אשראי.",
          );
        }

        throw new GreenInvoiceError(400, "VALIDATION_ERROR", message);
      }

      throw new GreenInvoiceError(500, "INTERNAL_ERROR", message);
    }

    logger.error("GreenInvoice payment error:", error);
    throw new GreenInvoiceError(
      500,
      "INTERNAL_ERROR",
      "Unable to create GreenInvoice payment.",
    );
  }
};
