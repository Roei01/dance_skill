'use strict';

var axios2 = require('axios');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var axios2__default = /*#__PURE__*/_interopDefault(axios2);

// src/auth/TokenManager.ts

// src/core/errors.ts
var GreenInvoiceError = class _GreenInvoiceError extends Error {
  constructor(message, code, statusCode, requestId, originalError) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.originalError = originalError;
    this.name = "GreenInvoiceError";
    Object.setPrototypeOf(this, _GreenInvoiceError.prototype);
  }
};
var AuthenticationError = class _AuthenticationError extends GreenInvoiceError {
  constructor(message, code, requestId) {
    super(message, code, 401, requestId);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, _AuthenticationError.prototype);
  }
};
var ValidationError = class _ValidationError extends GreenInvoiceError {
  constructor(message, code, requestId) {
    super(message, code, 400, requestId);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
var RateLimitError = class _RateLimitError extends GreenInvoiceError {
  constructor(message, retryAfter, requestId) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, requestId);
    this.retryAfter = retryAfter;
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, _RateLimitError.prototype);
  }
};
var APIError = class _APIError extends GreenInvoiceError {
  constructor(message, statusCode, code, requestId) {
    super(message, code, statusCode, requestId);
    this.name = "APIError";
    Object.setPrototypeOf(this, _APIError.prototype);
  }
};
var NetworkError = class _NetworkError extends GreenInvoiceError {
  constructor(message, originalError) {
    super(message, "NETWORK_ERROR", void 0, void 0, originalError);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};

// src/config/constants.ts
var API_BASE_URLS = {
  production: "https://api.greeninvoice.co.il/api/v1",
  sandbox: "https://sandbox.d.greeninvoice.co.il/api/v1"
};
var DEFAULT_TIMEOUT = 3e4;
var DEFAULT_MAX_RETRIES = 3;
var DEFAULT_RATE_LIMIT_PER_SECOND = 3;
var DEFAULT_RATE_LIMIT_BURST = 5;
var TOKEN_EXPIRY_SECONDS = 3600;
var TOKEN_REFRESH_BUFFER_SECONDS = 120;

// src/auth/TokenManager.ts
var TokenManager = class {
  constructor(config) {
    this.currentToken = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.apiKeyId = config.apiKeyId;
    this.apiKeySecret = config.apiKeySecret;
    this.baseUrl = config.baseUrl;
    this.axiosInstance = axios2__default.default.create({
      timeout: config.timeout || 3e4
    });
  }
  async getToken() {
    if (this.currentToken && !this.isTokenExpired()) {
      return this.currentToken;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.fetchNewToken();
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }
  async refreshToken() {
    this.currentToken = null;
    this.tokenExpiry = null;
    return this.getToken();
  }
  isTokenExpired() {
    if (!this.tokenExpiry) {
      return true;
    }
    const now = /* @__PURE__ */ new Date();
    const expiryWithBuffer = new Date(
      this.tokenExpiry.getTime() - TOKEN_REFRESH_BUFFER_SECONDS * 1e3
    );
    return now >= expiryWithBuffer;
  }
  async fetchNewToken() {
    try {
      const response = await this.axiosInstance.post(
        `${this.baseUrl}/account/token`,
        {
          id: this.apiKeyId,
          secret: this.apiKeySecret
        }
      );
      if (!response.data || !response.data.token) {
        throw new AuthenticationError(
          "Token response missing token field",
          "INVALID_RESPONSE"
        );
      }
      this.currentToken = response.data.token;
      this.tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1e3);
      return this.currentToken;
    } catch (error) {
      if (axios2__default.default.isAxiosError(error)) {
        if (error.response) {
          const statusCode = error.response.status;
          const message = error.response.data?.message || error.response.data?.error || "Authentication failed";
          if (statusCode === 401 || statusCode === 403) {
            throw new AuthenticationError(
              message,
              "INVALID_CREDENTIALS",
              error.response.headers["x-request-id"]
            );
          }
          throw new AuthenticationError(
            `Failed to fetch token: ${message}`,
            "TOKEN_FETCH_FAILED",
            error.response.headers["x-request-id"]
          );
        }
        throw new NetworkError("Network error during authentication", error);
      }
      throw new AuthenticationError(
        "Unexpected error during authentication",
        "UNKNOWN_ERROR"
      );
    }
  }
  clearToken() {
    this.currentToken = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
  }
};
var HttpClient = class {
  constructor(config) {
    this.tokenManager = config.tokenManager;
    this.rateLimiter = config.rateLimiter;
    this.maxRetries = config.maxRetries || 3;
    this.debug = config.debug || false;
    this.axiosInstance = axios2__default.default.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 3e4,
      headers: {
        "Content-Type": "application/json"
      }
    });
    this.setupInterceptors();
  }
  async get(path, params) {
    return this.request("GET", path, void 0, params);
  }
  async post(path, data) {
    return this.request("POST", path, data);
  }
  async put(path, data) {
    return this.request("PUT", path, data);
  }
  async patch(path, data) {
    return this.request("PATCH", path, data);
  }
  async delete(path) {
    return this.request("DELETE", path);
  }
  async request(method, path, data, params) {
    const config = {
      method,
      url: path,
      data,
      params
    };
    return this.executeRequest(config);
  }
  async executeRequest(config, retryCount = 0) {
    try {
      const response = await this.axiosInstance.request(config);
      return response.data;
    } catch (error) {
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.calculateBackoff(retryCount);
        if (this.debug) {
          console.log(
            `Retrying request (attempt ${retryCount + 1}/${this.maxRetries}) after ${delay}ms`
          );
        }
        await this.sleep(delay);
        return this.executeRequest(config, retryCount + 1);
      }
      throw this.transformError(error);
    }
  }
  setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.rateLimiter.waitForToken();
        const token = await this.tokenManager.getToken();
        config.headers.Authorization = `Bearer ${token}`;
        if (this.debug) {
          console.log(`${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.tokenManager.refreshToken();
            return this.axiosInstance.request(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }
  shouldRetry(error, retryCount) {
    if (retryCount >= this.maxRetries) {
      return false;
    }
    if (!axios2__default.default.isAxiosError(error)) {
      return false;
    }
    if (!error.response) {
      return true;
    }
    const status = error.response.status;
    return status === 429 || status >= 500 && status < 600;
  }
  calculateBackoff(retryCount) {
    return Math.min(1e3 * Math.pow(2, retryCount), 1e4);
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  transformError(error) {
    if (!axios2__default.default.isAxiosError(error)) {
      return error;
    }
    if (!error.response) {
      return new NetworkError(
        error.message || "Network error occurred",
        error
      );
    }
    const response = error.response;
    const statusCode = response.status;
    const requestId = response.headers["x-request-id"];
    let errorMessage = "API error occurred";
    let errorDetails = "";
    if (response.data) {
      if (typeof response.data === "string") {
        errorMessage = response.data;
      } else if (response.data.message) {
        errorMessage = response.data.message;
      } else if (response.data.error) {
        errorMessage = response.data.error;
      } else if (response.data.errorMessage) {
        errorMessage = response.data.errorMessage;
      } else {
        errorMessage = response.statusText || "API error occurred";
      }
      if (response.data.errors) {
        errorDetails = ` - Details: ${JSON.stringify(response.data.errors)}`;
      } else if (response.data.details) {
        errorDetails = ` - Details: ${JSON.stringify(response.data.details)}`;
      }
    } else {
      errorMessage = response.statusText || "API error occurred";
    }
    const fullMessage = errorMessage + errorDetails;
    if (this.debug) {
      console.error("API Error Response:", {
        status: statusCode,
        data: response.data,
        headers: response.headers
      });
    }
    if (statusCode === 401 || statusCode === 403) {
      return new AuthenticationError(fullMessage, response.data?.code, requestId);
    }
    if (statusCode === 400) {
      return new ValidationError(fullMessage, response.data?.code, requestId);
    }
    if (statusCode === 429) {
      const retryAfter = response.headers["retry-after"] ? parseInt(response.headers["retry-after"], 10) : void 0;
      return new RateLimitError(fullMessage, retryAfter, requestId);
    }
    return new APIError(fullMessage, statusCode, response.data?.code, requestId);
  }
};

// src/core/RateLimiter.ts
var RateLimiter = class {
  constructor(tokensPerSecond = 3, bucketSize = 5) {
    this.tokensPerSecond = tokensPerSecond;
    this.bucketSize = bucketSize;
    this.tokens = bucketSize;
    this.lastRefill = Date.now();
  }
  async waitForToken() {
    this.refillTokens();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const delay = this.calculateDelay();
    await this.sleep(delay);
    this.refillTokens();
    this.tokens -= 1;
  }
  refillTokens() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1e3;
    const tokensToAdd = timePassed * this.tokensPerSecond;
    this.tokens = Math.min(this.bucketSize, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  calculateDelay() {
    const tokensNeeded = 1 - this.tokens;
    const delay = tokensNeeded / this.tokensPerSecond * 1e3;
    return Math.ceil(delay);
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  reset() {
    this.tokens = this.bucketSize;
    this.lastRefill = Date.now();
  }
};

// src/core/BaseResource.ts
var BaseResource = class {
  constructor(httpClient, basePath) {
    this.httpClient = httpClient;
    this.basePath = basePath;
  }
  buildPath(endpoint = "") {
    if (!endpoint) {
      return this.basePath;
    }
    return `${this.basePath}/${endpoint}`;
  }
  async request(method, endpoint = "", data, params) {
    const path = this.buildPath(endpoint);
    switch (method) {
      case "GET":
        return this.httpClient.get(path, params);
      case "POST":
        return this.httpClient.post(path, data);
      case "PUT":
        return this.httpClient.put(path, data);
      case "PATCH":
        return this.httpClient.patch(path, data);
      case "DELETE":
        return this.httpClient.delete(path);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
};

// src/resources/Documents.ts
var Documents = class extends BaseResource {
  constructor(httpClient) {
    super(httpClient, "/documents");
  }
  /**
   * Create a new document (invoice, receipt, quote, etc.)
   *
   * @param document - The document data to create
   * @returns Promise resolving to the created document
   *
   * @example
   * ```typescript
   * const invoice = await client.documents.create({
   *   type: 'invoice',
   *   client: { name: 'John Doe', email: 'john@example.com' },
   *   items: [{ description: 'Consulting', quantity: 1, price: 1000 }],
   *   currency: 'ILS',
   *   language: 'en'
   * });
   * ```
   */
  async create(document) {
    return this.request("POST", "", document);
  }
  /**
   * Get a document by ID
   *
   * @param documentId - The document ID
   * @returns Promise resolving to the document
   */
  async get(documentId) {
    return this.request("GET", documentId);
  }
  /**
   * Update an existing document
   *
   * @param documentId - The document ID
   * @param updates - The fields to update
   * @returns Promise resolving to the updated document
   */
  async update(documentId, updates) {
    return this.request("PUT", documentId, updates);
  }
  /**
   * Delete a document
   *
   * @param documentId - The document ID
   * @returns Promise resolving when deletion is complete
   */
  async delete(documentId) {
    return this.request("DELETE", documentId);
  }
  /**
   * List documents with optional filtering and pagination
   *
   * @param params - List parameters (pagination, filters, sorting)
   * @returns Promise resolving to paginated documents
   *
   * @example
   * ```typescript
   * const result = await client.documents.list({
   *   page: 1,
   *   pageSize: 20,
   *   type: 'invoice',
   *   fromDate: '2024-01-01'
   * });
   * ```
   */
  async list(params) {
    return this.request("GET", "", void 0, params);
  }
  /**
   * Search documents with complex criteria
   *
   * @param query - Search criteria
   * @returns Promise resolving to matching documents
   */
  async search(query) {
    return this.request("POST", "search", query);
  }
  /**
   * Download document PDF
   *
   * @param documentId - The document ID
   * @returns Promise resolving to PDF buffer
   */
  async downloadPdf(documentId) {
    return this.request("GET", `${documentId}/pdf`);
  }
  /**
   * Send document via email
   *
   * @param documentId - The document ID
   * @param options - Email options (recipients, subject, body)
   * @returns Promise resolving when email is sent
   *
   * @example
   * ```typescript
   * await client.documents.send('doc123', {
   *   to: 'customer@example.com',
   *   subject: 'Your Invoice',
   *   body: 'Please find your invoice attached.'
   * });
   * ```
   */
  async send(documentId, options) {
    return this.request("POST", `${documentId}/send`, options);
  }
};

// src/resources/Clients.ts
var Clients = class extends BaseResource {
  constructor(httpClient) {
    super(httpClient, "/clients");
  }
  /**
   * Create a new client
   *
   * @param client - The client data to create
   * @returns Promise resolving to the created client
   *
   * @example
   * ```typescript
   * const client = await api.clients.create({
   *   name: 'Acme Corp',
   *   email: 'contact@acme.com',
   *   phone: '+972-50-1234567',
   *   taxId: '123456789'
   * });
   * ```
   */
  async create(client) {
    return this.request("POST", "", client);
  }
  /**
   * Get a client by ID
   *
   * @param clientId - The client ID
   * @returns Promise resolving to the client
   */
  async get(clientId) {
    return this.request("GET", clientId);
  }
  /**
   * Update an existing client
   *
   * @param clientId - The client ID
   * @param updates - The fields to update
   * @returns Promise resolving to the updated client
   */
  async update(clientId, updates) {
    return this.request("PUT", clientId, updates);
  }
  /**
   * Delete a client
   *
   * @param clientId - The client ID
   * @returns Promise resolving when deletion is complete
   */
  async delete(clientId) {
    return this.request("DELETE", clientId);
  }
  /**
   * List clients with optional filtering and pagination
   *
   * @param params - List parameters (pagination, filters, sorting)
   * @returns Promise resolving to paginated clients
   *
   * @example
   * ```typescript
   * const result = await api.clients.list({
   *   page: 1,
   *   pageSize: 50,
   *   search: 'Acme',
   *   active: true
   * });
   * ```
   */
  async list(params) {
    return this.request("GET", "", void 0, params);
  }
  /**
   * Search clients by name or other criteria
   *
   * @param query - Search query string or search parameters
   * @returns Promise resolving to matching clients
   *
   * @example
   * ```typescript
   * // Search by name
   * const clients = await api.clients.search('Acme');
   *
   * // Search by tax ID
   * const client = await api.clients.findByTaxId('123456789');
   * ```
   */
  async search(query) {
    const searchParams = typeof query === "string" ? { name: query } : query;
    if (typeof searchParams === "object" && "taxId" in searchParams && searchParams.taxId != null) {
      const raw = String(searchParams.taxId);
      const stripped = raw.replace(/^0+/, "") || "0";
      const variants = [.../* @__PURE__ */ new Set([raw, stripped, stripped.padStart(9, "0")])];
      const seen = /* @__PURE__ */ new Set();
      const results = [];
      for (const variant of variants) {
        try {
          const response2 = await this.request("POST", "search", { ...searchParams, taxId: variant });
          const items = Array.isArray(response2) ? response2 : response2.items || [];
          for (const client of items) {
            if (!seen.has(client.id)) {
              seen.add(client.id);
              results.push(client);
            }
          }
        } catch {
        }
      }
      return results;
    }
    const response = await this.request("POST", "search", searchParams);
    return Array.isArray(response) ? response : response.items || [];
  }
  /**
   * Find a client by tax ID
   *
   * @param taxId - The client's tax ID
   * @returns Promise resolving to the client or null if not found
   *
   * @example
   * ```typescript
   * const client = await api.clients.findByTaxId('123456789');
   * if (client) {
   *   console.log('Found client:', client.name);
   * }
   * ```
   */
  async findByTaxId(taxId) {
    const str = String(taxId);
    const stripped = str.replace(/^0+/, "") || "0";
    const variants = [.../* @__PURE__ */ new Set([str, stripped, stripped.padStart(9, "0")])];
    for (const variant of variants) {
      try {
        const response = await this.request("POST", "search", { taxId: variant });
        const items = Array.isArray(response) ? response : response.items || [];
        const active = items.filter((c) => c.active !== false);
        if (active.length > 0) return active[0];
      } catch (error) {
        continue;
      }
    }
    return null;
  }
};

// src/client.ts
var GreenInvoiceAPI = class {
  /**
   * Create a new Green Invoice API client
   *
   * @param config - Configuration options
   *
   * @example
   * ```typescript
   * const client = new GreenInvoiceAPI({
   *   apiKey: 'your-api-key',
   *   secret: 'your-secret',
   *   environment: 'production'
   * });
   * ```
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }
    if (!config.secret) {
      throw new Error("secret is required");
    }
    this.config = {
      environment: "production",
      timeout: DEFAULT_TIMEOUT,
      maxRetries: DEFAULT_MAX_RETRIES,
      rateLimit: {
        requestsPerSecond: DEFAULT_RATE_LIMIT_PER_SECOND,
        burstCapacity: DEFAULT_RATE_LIMIT_BURST
      },
      debug: false,
      ...config
    };
    const baseUrl = API_BASE_URLS[this.config.environment || "production"];
    this.tokenManager = new TokenManager({
      apiKeyId: this.config.apiKey,
      apiKeySecret: this.config.secret,
      baseUrl,
      timeout: this.config.timeout
    });
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit?.requestsPerSecond || DEFAULT_RATE_LIMIT_PER_SECOND,
      this.config.rateLimit?.burstCapacity || DEFAULT_RATE_LIMIT_BURST
    );
    this.httpClient = new HttpClient({
      baseUrl,
      tokenManager: this.tokenManager,
      rateLimiter: this.rateLimiter,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      debug: this.config.debug
    });
    this.documents = new Documents(this.httpClient);
    this.clients = new Clients(this.httpClient);
  }
  /**
   * Test the connection to the Green Invoice API
   *
   * @returns Promise resolving to true if connection is successful
   *
   * @example
   * ```typescript
   * const isConnected = await client.testConnection();
   * console.log('Connected:', isConnected);
   * ```
   */
  async testConnection() {
    try {
      await this.tokenManager.getToken();
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Manually refresh the authentication token
   *
   * @returns Promise resolving when token is refreshed
   *
   * @example
   * ```typescript
   * await client.refreshToken();
   * ```
   */
  async refreshToken() {
    await this.tokenManager.refreshToken();
  }
  /**
   * Clear the cached authentication token
   *
   * @example
   * ```typescript
   * client.clearToken();
   * ```
   */
  clearToken() {
    this.tokenManager.clearToken();
  }
  /**
   * Reset the rate limiter
   *
   * @example
   * ```typescript
   * client.resetRateLimiter();
   * ```
   */
  resetRateLimiter() {
    this.rateLimiter.reset();
  }
};

// src/types/documents.ts
var DocumentType = /* @__PURE__ */ ((DocumentType2) => {
  DocumentType2[DocumentType2["PRICE_QUOTE"] = 10] = "PRICE_QUOTE";
  DocumentType2[DocumentType2["ORDER"] = 100] = "ORDER";
  DocumentType2[DocumentType2["DELIVERY_NOTE"] = 200] = "DELIVERY_NOTE";
  DocumentType2[DocumentType2["RETURN_DELIVERY_NOTE"] = 210] = "RETURN_DELIVERY_NOTE";
  DocumentType2[DocumentType2["TRANSACTION_ACCOUNT"] = 300] = "TRANSACTION_ACCOUNT";
  DocumentType2[DocumentType2["TAX_INVOICE"] = 305] = "TAX_INVOICE";
  DocumentType2[DocumentType2["TAX_INVOICE_RECEIPT"] = 320] = "TAX_INVOICE_RECEIPT";
  DocumentType2[DocumentType2["REFUND"] = 330] = "REFUND";
  DocumentType2[DocumentType2["RECEIPT"] = 400] = "RECEIPT";
  DocumentType2[DocumentType2["RECEIPT_FOR_DONATION"] = 405] = "RECEIPT_FOR_DONATION";
  DocumentType2[DocumentType2["PURCHASE_ORDER"] = 500] = "PURCHASE_ORDER";
  DocumentType2[DocumentType2["RECEIPT_OF_A_DEPOSIT"] = 600] = "RECEIPT_OF_A_DEPOSIT";
  DocumentType2[DocumentType2["WITHDRAWAL_OF_DEPOSIT"] = 610] = "WITHDRAWAL_OF_DEPOSIT";
  return DocumentType2;
})(DocumentType || {});

exports.APIError = APIError;
exports.AuthenticationError = AuthenticationError;
exports.DocumentType = DocumentType;
exports.GreenInvoiceAPI = GreenInvoiceAPI;
exports.GreenInvoiceError = GreenInvoiceError;
exports.NetworkError = NetworkError;
exports.RateLimitError = RateLimitError;
exports.ValidationError = ValidationError;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map