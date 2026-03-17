interface AuthConfig {
    apiKeyId: string;
    apiKeySecret: string;
    baseUrl: string;
    timeout?: number;
}
declare class TokenManager {
    private apiKeyId;
    private apiKeySecret;
    private baseUrl;
    private currentToken;
    private tokenExpiry;
    private refreshPromise;
    private axiosInstance;
    constructor(config: AuthConfig);
    getToken(): Promise<string>;
    refreshToken(): Promise<string>;
    isTokenExpired(): boolean;
    private fetchNewToken;
    clearToken(): void;
}

declare class RateLimiter {
    private tokensPerSecond;
    private bucketSize;
    private tokens;
    private lastRefill;
    constructor(tokensPerSecond?: number, bucketSize?: number);
    waitForToken(): Promise<void>;
    private refillTokens;
    private calculateDelay;
    private sleep;
    reset(): void;
}

interface HttpClientConfig {
    baseUrl: string;
    tokenManager: TokenManager;
    rateLimiter: RateLimiter;
    timeout?: number;
    maxRetries?: number;
    debug?: boolean;
}
declare class HttpClient {
    private axiosInstance;
    private tokenManager;
    private rateLimiter;
    private maxRetries;
    private debug;
    constructor(config: HttpClientConfig);
    get<T>(path: string, params?: any): Promise<T>;
    post<T>(path: string, data?: any): Promise<T>;
    put<T>(path: string, data?: any): Promise<T>;
    patch<T>(path: string, data?: any): Promise<T>;
    delete<T>(path: string): Promise<T>;
    private request;
    private executeRequest;
    private setupInterceptors;
    private shouldRetry;
    private calculateBackoff;
    private sleep;
    private transformError;
}

declare abstract class BaseResource {
    protected httpClient: HttpClient;
    protected basePath: string;
    constructor(httpClient: HttpClient, basePath: string);
    protected buildPath(endpoint?: string): string;
    protected request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', endpoint?: string, data?: any, params?: any): Promise<T>;
}

interface PaginatedResponse<T> {
    data: T[];
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}
interface ListParams {
    page?: number;
    pageSize?: number;
    sort?: string;
    sortOrder?: 'asc' | 'desc';
}
type Currency = 'ILS' | 'USD' | 'EUR' | 'GBP';
type Language = 'he' | 'en';
interface Address {
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
}

/**
 * Document type numeric codes as expected by the Green Invoice API
 *
 * @see https://github.com/yanivps/green-invoice/blob/master/green_invoice/models.py
 */
declare enum DocumentType {
    /** Price quote (הצעת מחיר) */
    PRICE_QUOTE = 10,
    /** Order (הזמנה) */
    ORDER = 100,
    /** Delivery note (תעודת משלוח) */
    DELIVERY_NOTE = 200,
    /** Return delivery note (תעודת משלוח החזרה) */
    RETURN_DELIVERY_NOTE = 210,
    /** Transaction account (חשבון עסקה) */
    TRANSACTION_ACCOUNT = 300,
    /** Tax invoice (חשבונית מס) */
    TAX_INVOICE = 305,
    /** Tax invoice receipt (חשבונית מס קבלה) */
    TAX_INVOICE_RECEIPT = 320,
    /** Refund (זיכוי) */
    REFUND = 330,
    /** Receipt (קבלה) */
    RECEIPT = 400,
    /** Receipt for donation (קבלה על תרומה) */
    RECEIPT_FOR_DONATION = 405,
    /** Purchase order (הזמנת רכש) */
    PURCHASE_ORDER = 500,
    /** Receipt of a deposit (קבלת פיקדון) */
    RECEIPT_OF_A_DEPOSIT = 600,
    /** Withdrawal of deposit (משיכת פיקדון) */
    WITHDRAWAL_OF_DEPOSIT = 610
}
type PaymentType = 'cash' | 'creditCard' | 'check' | 'bankTransfer' | 'other';
type VatType = 'included' | 'excluded' | 'exempt';
interface IncomeItem {
    description: string;
    quantity: number;
    price: number;
    currency?: Currency;
    vatType?: number;
}
interface DocumentClient {
    id?: string;
    name: string;
    emails?: string[];
    phone?: string;
    taxId?: string;
    add?: boolean;
}
interface Payment {
    type: number;
    price: number;
    currency?: Currency;
    date?: string;
    currencyRate?: number;
    cardType?: number;
    cardNum?: string;
    dealType?: number;
    transactionId?: string;
    chequeNum?: string;
    bankName?: string;
    bankBranch?: string;
    bankAccount?: string;
    accountId?: string;
}
interface Document {
    id: string;
    documentNumber: string;
    type: DocumentType;
    date: string;
    dueDate?: string;
    client: DocumentClient;
    income: IncomeItem[];
    currency: Currency;
    lang: Language;
    subtotal: number;
    vat: number;
    total: number;
    payment?: Payment[];
    remarks?: string;
    footer?: string;
    signed?: boolean;
    url?: string;
    pdfUrl?: string;
    createdAt: string;
    updatedAt: string;
}
interface CreateDocumentRequest {
    type: DocumentType;
    client: DocumentClient;
    income: IncomeItem[];
    currency?: Currency;
    lang?: Language;
    date?: string;
    dueDate?: string;
    payment?: Payment[];
    remarks?: string;
    footer?: string;
    signed?: boolean;
    rounding?: boolean;
}
interface UpdateDocumentRequest {
    client?: Partial<DocumentClient>;
    income?: IncomeItem[];
    date?: string;
    dueDate?: string;
    payment?: Payment[];
    remarks?: string;
    footer?: string;
    signed?: boolean;
}
interface DocumentSearchQuery {
    clientId?: string;
    clientName?: string;
    type?: DocumentType;
    fromDate?: string;
    toDate?: string;
    minAmount?: number;
    maxAmount?: number;
    signed?: boolean;
}
interface ListDocumentsParams {
    page?: number;
    pageSize?: number;
    type?: DocumentType;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
    sort?: 'date' | 'amount' | 'documentNumber';
    sortOrder?: 'asc' | 'desc';
}
interface SendDocumentOptions {
    to: string | string[];
    cc?: string | string[];
    subject?: string;
    body?: string;
}

declare class Documents extends BaseResource {
    constructor(httpClient: HttpClient);
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
    create(document: CreateDocumentRequest): Promise<Document>;
    /**
     * Get a document by ID
     *
     * @param documentId - The document ID
     * @returns Promise resolving to the document
     */
    get(documentId: string): Promise<Document>;
    /**
     * Update an existing document
     *
     * @param documentId - The document ID
     * @param updates - The fields to update
     * @returns Promise resolving to the updated document
     */
    update(documentId: string, updates: UpdateDocumentRequest): Promise<Document>;
    /**
     * Delete a document
     *
     * @param documentId - The document ID
     * @returns Promise resolving when deletion is complete
     */
    delete(documentId: string): Promise<void>;
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
    list(params?: ListDocumentsParams): Promise<PaginatedResponse<Document>>;
    /**
     * Search documents with complex criteria
     *
     * @param query - Search criteria
     * @returns Promise resolving to matching documents
     */
    search(query: DocumentSearchQuery): Promise<Document[]>;
    /**
     * Download document PDF
     *
     * @param documentId - The document ID
     * @returns Promise resolving to PDF buffer
     */
    downloadPdf(documentId: string): Promise<Buffer>;
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
    send(documentId: string, options: SendDocumentOptions): Promise<void>;
}

type ClientType = 'business' | 'individual';
interface Client {
    id: string;
    name: string;
    type?: ClientType;
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
    taxId?: string;
    address?: Address;
    active: boolean;
    balance?: number;
    currency?: string;
    paymentTerms?: number;
    createdAt: string;
    updatedAt: string;
}
interface CreateClientRequest {
    name: string;
    type?: ClientType;
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
    taxId?: string;
    address?: Address;
    paymentTerms?: number;
    currency?: string;
    active?: boolean;
}
interface UpdateClientRequest {
    name?: string;
    type?: ClientType;
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
    taxId?: string;
    address?: Address;
    paymentTerms?: number;
    currency?: string;
    active?: boolean;
}
interface ListClientsParams {
    page?: number;
    pageSize?: number;
    search?: string;
    active?: boolean;
    sort?: 'name' | 'createdAt' | 'balance';
    sortOrder?: 'asc' | 'desc';
}

declare class Clients extends BaseResource {
    constructor(httpClient: HttpClient);
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
    create(client: CreateClientRequest): Promise<Client>;
    /**
     * Get a client by ID
     *
     * @param clientId - The client ID
     * @returns Promise resolving to the client
     */
    get(clientId: string): Promise<Client>;
    /**
     * Update an existing client
     *
     * @param clientId - The client ID
     * @param updates - The fields to update
     * @returns Promise resolving to the updated client
     */
    update(clientId: string, updates: UpdateClientRequest): Promise<Client>;
    /**
     * Delete a client
     *
     * @param clientId - The client ID
     * @returns Promise resolving when deletion is complete
     */
    delete(clientId: string): Promise<void>;
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
    list(params?: ListClientsParams): Promise<PaginatedResponse<Client>>;
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
    search(query: string | object): Promise<Client[]>;
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
    findByTaxId(taxId: string): Promise<Client | null>;
}

interface GreenInvoiceConfig {
    apiKey: string;
    secret: string;
    environment?: 'production' | 'sandbox';
    timeout?: number;
    maxRetries?: number;
    rateLimit?: {
        requestsPerSecond?: number;
        burstCapacity?: number;
    };
    debug?: boolean;
}
interface Logger {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
}

declare class GreenInvoiceAPI {
    private tokenManager;
    private httpClient;
    private rateLimiter;
    private config;
    readonly documents: Documents;
    readonly clients: Clients;
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
    constructor(config: GreenInvoiceConfig);
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
    testConnection(): Promise<boolean>;
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
    refreshToken(): Promise<void>;
    /**
     * Clear the cached authentication token
     *
     * @example
     * ```typescript
     * client.clearToken();
     * ```
     */
    clearToken(): void;
    /**
     * Reset the rate limiter
     *
     * @example
     * ```typescript
     * client.resetRateLimiter();
     * ```
     */
    resetRateLimiter(): void;
}

interface APIResponse<T> {
    data?: T;
    message?: string;
    error?: string;
    code?: string;
}
interface APIErrorResponse {
    message: string;
    error?: string;
    code?: string;
    statusCode: number;
}

declare class GreenInvoiceError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    requestId?: string | undefined;
    originalError?: Error | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined, requestId?: string | undefined, originalError?: Error | undefined);
}
declare class AuthenticationError extends GreenInvoiceError {
    constructor(message: string, code?: string, requestId?: string);
}
declare class ValidationError extends GreenInvoiceError {
    constructor(message: string, code?: string, requestId?: string);
}
declare class RateLimitError extends GreenInvoiceError {
    retryAfter?: number | undefined;
    constructor(message: string, retryAfter?: number | undefined, requestId?: string);
}
declare class APIError extends GreenInvoiceError {
    constructor(message: string, statusCode: number, code?: string, requestId?: string);
}
declare class NetworkError extends GreenInvoiceError {
    constructor(message: string, originalError?: Error);
}

export { APIError, type APIErrorResponse, type APIResponse, type Address, AuthenticationError, type Client, type ClientType, type CreateClientRequest, type CreateDocumentRequest, type Currency, type Document, type DocumentClient, type DocumentSearchQuery, DocumentType, GreenInvoiceAPI, type GreenInvoiceConfig, GreenInvoiceError, type IncomeItem, type Language, type ListClientsParams, type ListDocumentsParams, type ListParams, type Logger, NetworkError, type PaginatedResponse, type Payment, type PaymentType, RateLimitError, type SendDocumentOptions, type UpdateClientRequest, type UpdateDocumentRequest, ValidationError, type VatType };
