# EchoVerse API Reference

**Version:** 1.0.0  
**Base URL:** `/api`

## Table of Contents

1. [Authentication](#authentication)
2. [AI Services](#ai-services)
3. [E-Commerce](#e-commerce)
4. [CMS & Blog](#cms--blog)
5. [Community](#community)
6. [Admin](#admin)
7. [User Management](#user-management)
8. [File Management](#file-management)

---

## Authentication

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  },
  "token": "string"
}
```

### POST /api/auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "token": "string",
  "refreshToken": "string",
  "user": { ... }
}
```

### POST /api/auth/2fa/setup
Setup two-factor authentication.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "secret": "string",
  "qrCode": "string",
  "backupCodes": ["string"]
}
```

### POST /api/auth/magic-link
Request passwordless magic link.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Magic link sent to email"
}
```

---

## AI Services

### POST /api/ai/generate-website
Generate a complete website using AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "prompt": "string",
  "industry": "string",
  "style": "modern" | "minimal" | "bold"
}
```

**Response:** `200 OK`
```json
{
  "websiteId": "string",
  "html": "string",
  "css": "string",
  "preview": "string"
}
```

### POST /api/ai/generate-content
Generate blog content with AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "topic": "string",
  "keywords": ["string"],
  "tone": "professional" | "casual" | "technical",
  "length": "short" | "medium" | "long"
}
```

**Response:** `200 OK`
```json
{
  "title": "string",
  "content": "string",
  "seoMetadata": {
    "title": "string",
    "description": "string",
    "keywords": ["string"]
  }
}
```

### POST /api/ai/seo-optimize
Optimize content for SEO.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "string",
  "targetKeywords": ["string"]
}
```

**Response:** `200 OK`
```json
{
  "optimizedContent": "string",
  "suggestions": ["string"],
  "seoScore": 85
}
```

---

## E-Commerce

### GET /api/products
List all products with pagination.

**Query Parameters:**
- `limit` (number): Items per page (default: 20)
- `offset` (number): Page offset (default: 0)
- `category` (string): Filter by category
- `search` (string): Search products

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "price": 99.99,
      "description": "string",
      "imageUrl": "string",
      "stock": 100
    }
  ],
  "totalCount": 150,
  "hasMore": true
}
```

### POST /api/products
Create a new product.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "price": 99.99,
  "stock": 100,
  "category": "string",
  "images": ["string"]
}
```

**Response:** `201 Created`

### POST /api/orders
Create a new order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "string",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "string",
    "city": "string",
    "zipCode": "string"
  },
  "paymentMethodId": "string"
}
```

**Response:** `201 Created`
```json
{
  "orderId": "string",
  "total": 199.98,
  "status": "pending",
  "paymentIntentId": "string"
}
```

### POST /api/payments/create-intent
Create Stripe payment intent.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 9999,
  "currency": "usd",
  "orderId": "string"
}
```

**Response:** `200 OK`
```json
{
  "clientSecret": "string",
  "paymentIntentId": "string"
}
```

---

## CMS & Blog

### GET /api/posts
List blog posts.

**Query Parameters:**
- `limit` (number)
- `offset` (number)
- `status` (string): published | draft
- `search` (string)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "publishedAt": "2024-01-01T00:00:00Z",
      "author": { ... }
    }
  ],
  "totalCount": 50
}
```

### POST /api/posts
Create a new blog post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "excerpt": "string",
  "slug": "string",
  "status": "draft" | "published",
  "tags": ["string"]
}
```

**Response:** `201 Created`

### GET /api/posts/:slug
Get post by slug.

**Response:** `200 OK`
```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "publishedAt": "2024-01-01T00:00:00Z",
  "author": { ... },
  "comments": [ ... ]
}
```

---

## Community

### GET /api/communities
List all communities.

**Query Parameters:**
- `limit` (number)
- `offset` (number)
- `includePrivate` (boolean)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "memberCount": 1250,
      "isPrivate": false
    }
  ],
  "totalCount": 25
}
```

### POST /api/communities/:id/join
Join a community.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Successfully joined community",
  "membership": { ... }
}
```

### GET /api/communities/:id/messages
Get community messages.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (number)
- `before` (string): Message ID for pagination

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "string",
      "content": "string",
      "author": { ... },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Admin

### GET /api/admin/dashboard
Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response:** `200 OK`
```json
{
  "users": {
    "total": 15000,
    "active": 8500,
    "new": 250
  },
  "revenue": {
    "total": 125000,
    "monthly": 15000
  },
  "orders": {
    "total": 5000,
    "pending": 25
  }
}
```

### GET /api/admin/users
List all users (admin).

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `limit`, `offset`, `search`, `role`

**Response:** `200 OK`

### PATCH /api/admin/users/:id/role
Update user role.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "role": "admin" | "moderator" | "user"
}
```

**Response:** `200 OK`

---

## User Management

### GET /api/users/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### PATCH /api/users/me
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "string",
  "bio": "string",
  "avatar": "string"
}
```

**Response:** `200 OK`

### GET /api/users/gdpr/export
Export all user data (GDPR).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": { ... },
  "posts": [ ... ],
  "orders": [ ... ],
  "messages": [ ... ]
}
```

### DELETE /api/users/me
Delete user account (GDPR).

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## File Management

### POST /api/media/upload
Upload a file.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** FormData with `file` field

**Response:** `200 OK`
```json
{
  "id": "string",
  "url": "string",
  "filename": "string",
  "mimeType": "string",
  "size": 1024000
}
```

### POST /api/media/upload-multiple
Upload multiple files.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** FormData with multiple `files` field

**Response:** `200 OK`
```json
{
  "files": [
    {
      "id": "string",
      "url": "string",
      "filename": "string"
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [ ... ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

- **Unauthenticated**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Admin**: 5000 requests/hour

Rate limit headers:
- `X-RateLimit-Limit`: Total limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Webhooks

### Stripe Webhook
**Endpoint:** `POST /api/webhooks/stripe`

Handles Stripe payment events:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { EchoVerseClient } from '@echoverse/sdk';

const client = new EchoVerseClient({
  apiKey: process.env.ECHOVERSE_API_KEY
});

// Generate website
const website = await client.ai.generateWebsite({
  prompt: 'Create a modern portfolio website',
  industry: 'technology'
});

// Create product
const product = await client.products.create({
  name: 'Premium Package',
  price: 99.99
});
```

### Python
```python
from echoverse import EchoVerseClient

client = EchoVerseClient(api_key=os.getenv('ECHOVERSE_API_KEY'))

# Generate content
content = client.ai.generate_content(
    topic='AI in Web Development',
    tone='professional'
)
```

---

## Support

- Documentation: https://docs.echoverse.com
- API Status: https://status.echoverse.com
- Support: support@echoverse.com
