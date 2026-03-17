# Green Invoice API - Node.js SDK

Official Node.js SDK for the [Green Invoice API](https://www.greeninvoice.co.il). Create and manage invoices, receipts, clients, and more with ease.

## Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Automatic Authentication**: JWT token management with automatic refresh
- **Rate Limiting**: Built-in rate limiting to prevent 429 errors
- **Error Handling**: Comprehensive error classes with detailed context
- **Retry Logic**: Automatic retry with exponential backoff for transient errors
- **Dual Format**: Supports both CommonJS and ES Modules

## Installation

```bash
npm install @g-and-s/greeninvoice-api
```

## Quick Start

```javascript
const { GreenInvoiceAPI } = require('@g-and-s/greeninvoice-api');

const client = new GreenInvoiceAPI({
  apiKey: 'your-api-key',
  secret: 'your-secret',
  environment: 'production' // or 'sandbox'
});

// Create an invoice
const invoice = await client.documents.create({
  type: 'invoice',
  client: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  items: [
    {
      description: 'Consulting Services',
      quantity: 10,
      price: 150
    }
  ],
  currency: 'ILS',
  language: 'en'
});

console.log('Invoice created:', invoice.id);
```

## Authentication

### Getting API Credentials

1. Log in to your [Green Invoice account](https://www.greeninvoice.co.il)
2. Navigate to **My Account** → **Developer Tools**
3. Click **Add Key** under API Keys
4. Give your key a name and set permissions
5. Click **Save** to generate your credentials

### Configuration Options

```typescript
const client = new GreenInvoiceAPI({
  // Required
  apiKey: 'your-api-key-id',
  secret: 'your-api-key-secret',

  // Optional
  environment: 'production', // 'production' or 'sandbox'
  timeout: 30000,            // Request timeout in ms
  maxRetries: 3,             // Max retry attempts
  rateLimit: {
    requestsPerSecond: 3,    // Default: 3
    burstCapacity: 5         // Default: 5
  },
  debug: false               // Enable debug logging
});
```

## Usage Examples

### Working with Documents (Invoices, Receipts)

#### Create an Invoice

```javascript
const invoice = await client.documents.create({
  type: 'invoice',
  client: {
    name: 'Acme Corp',
    email: 'billing@acme.com',
    taxId: '123456789'
  },
  items: [
    {
      description: 'Website Development',
      quantity: 1,
      price: 5000,
      vatType: 'included',
      vatRate: 17
    }
  ],
  currency: 'ILS',
  language: 'en',
  dueDate: '2024-12-31',
  notes: 'Thank you for your business!'
});
```

#### Get a Document

```javascript
const document = await client.documents.get('document-id');
console.log(document);
```

#### List Documents

```javascript
const documents = await client.documents.list({
  page: 1,
  pageSize: 20,
  type: 'invoice',
  fromDate: '2024-01-01',
  sort: 'date',
  sortOrder: 'desc'
});

console.log(`Found ${documents.totalItems} documents`);
documents.data.forEach(doc => {
  console.log(`${doc.documentNumber}: ${doc.total} ${doc.currency}`);
});
```

#### Update a Document

```javascript
const updated = await client.documents.update('document-id', {
  notes: 'Updated notes',
  dueDate: '2024-12-31'
});
```

#### Delete a Document

```javascript
await client.documents.delete('document-id');
```

#### Send Document via Email

```javascript
await client.documents.send('document-id', {
  to: 'customer@example.com',
  cc: ['manager@example.com'],
  subject: 'Your Invoice',
  body: 'Please find your invoice attached.'
});
```

### Working with Clients

#### Create a Client

```javascript
const client = await client.clients.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+972-50-1234567',
  taxId: '123456789',
  address: {
    street: '123 Main St',
    city: 'Tel Aviv',
    zip: '12345',
    country: 'Israel'
  }
});
```

#### Get a Client

```javascript
const client = await client.clients.get('client-id');
```

#### List Clients

```javascript
const clients = await client.clients.list({
  page: 1,
  pageSize: 50,
  search: 'Acme',
  active: true
});
```

#### Update a Client

```javascript
const updated = await client.clients.update('client-id', {
  email: 'newemail@example.com',
  phone: '+972-50-9876543'
});
```

#### Delete a Client

```javascript
await client.clients.delete('client-id');
```

### Error Handling

The SDK provides specific error classes for different scenarios:

```javascript
const {
  GreenInvoiceAPI,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  APIError,
  NetworkError
} = require('@g-and-s/greeninvoice-api');

try {
  const invoice = await client.documents.create({...});
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid credentials:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid request:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof APIError) {
    console.error(`API error (${error.statusCode}):`, error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

### TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import {
  GreenInvoiceAPI,
  Document,
  CreateDocumentRequest,
  Client,
  CreateClientRequest,
  DocumentType,
  Currency
} from '@g-and-s/greeninvoice-api';

const client = new GreenInvoiceAPI({
  apiKey: process.env.API_KEY!,
  secret: process.env.API_SECRET!,
  environment: 'production'
});

// Full type inference
const invoice: Document = await client.documents.create({
  type: 'invoice' as DocumentType,
  client: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  items: [
    {
      description: 'Service',
      quantity: 1,
      price: 100
    }
  ],
  currency: 'ILS' as Currency,
  language: 'en'
});
```

## API Reference

### GreenInvoiceAPI

Main client class.

#### Constructor

```typescript
new GreenInvoiceAPI(config: GreenInvoiceConfig)
```

#### Methods

- `testConnection(): Promise<boolean>` - Test API connection
- `refreshToken(): Promise<void>` - Manually refresh auth token
- `clearToken(): void` - Clear cached token
- `resetRateLimiter(): void` - Reset rate limiter

### Resources

#### Documents (`client.documents`)

- `create(data: CreateDocumentRequest): Promise<Document>`
- `get(id: string): Promise<Document>`
- `update(id: string, updates: UpdateDocumentRequest): Promise<Document>`
- `delete(id: string): Promise<void>`
- `list(params?: ListDocumentsParams): Promise<PaginatedResponse<Document>>`
- `search(query: DocumentSearchQuery): Promise<Document[]>`
- `downloadPdf(id: string): Promise<Buffer>`
- `send(id: string, options: SendDocumentOptions): Promise<void>`

#### Clients (`client.clients`)

- `create(data: CreateClientRequest): Promise<Client>`
- `get(id: string): Promise<Client>`
- `update(id: string, updates: UpdateClientRequest): Promise<Client>`
- `delete(id: string): Promise<void>`
- `list(params?: ListClientsParams): Promise<PaginatedResponse<Client>>`
- `search(query: string): Promise<Client[]>`

## Document Types

- `invoice` - Tax invoice
- `receipt` - Receipt
- `invoiceReceipt` - Combined invoice and receipt
- `quote` - Price quote
- `deliveryNote` - Delivery note
- `creditInvoice` - Credit invoice
- `proforma` - Proforma invoice

## Currencies

- `ILS` - Israeli Shekel
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound

## Rate Limiting

The SDK automatically handles rate limiting:

- Default: 3 requests per second
- Burst capacity: 5 requests
- Automatic delay when limit exceeded
- Configurable via constructor options

The Green Invoice API enforces rate limits (~3 req/sec). Exceeding this returns HTTP 429. The SDK proactively prevents this with built-in rate limiting.

## Token Management

JWT tokens are managed automatically:

- Fetched on first request
- Cached for 1 hour
- Automatically refreshed before expiry
- Retry on 401 (token expiry)

No manual token management required!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

- [API Documentation](https://greeninvoice.docs.apiary.io/)
- [Green Invoice Website](https://www.greeninvoice.co.il)
- [Issue Tracker](https://github.com/your-repo/issues)

## Related Projects

- [Python SDK](https://github.com/yanivps/green-invoice)
- [PHP SDK](https://github.com/MordiSacks/greeninvoice)
