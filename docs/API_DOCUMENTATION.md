# API Documentation

## Overview

EchoVerse REST API documentation. All endpoints require authentication unless specified.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.echoverse.com/api`

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePassword123!"
}

Response:
{
  "token": "jwt-token",
  "user": { ... }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {token}
```

## API Versioning

The API supports versioning via URL path:

- `/api/v1/*` - Version 1 (current)
- `/api/v2/*` - Version 2 (beta)

Deprecated endpoints return `Deprecation` header:
```
Deprecation: true
Sunset: Sat, 01 Jan 2025 00:00:00 GMT
```

## Rate Limiting

All endpoints are rate limited. Headers included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

Default limits:
- Anonymous: 20 requests/15min
- Authenticated: 100 requests/15min
- Premium: 1000 requests/15min

## AI Builder API

### Generate Website
```http
POST /ai/generate-website
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "Create a landing page for a tech startup",
  "style": "modern",
  "pages": ["home", "about", "contact"]
}

Response:
{
  "content": "...",
  "metadata": { ... }
}
```

### Generate Content
```http
POST /ai/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "Write a blog post about AI",
  "type": "blog",
  "tone": "professional"
}
```

## CMS API

### Create Post
```http
POST /cms/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My First Post",
  "content": "Post content...",
  "status": "draft",
  "tags": ["tech", "ai"]
}
```

### List Posts
```http
GET /cms/posts?page=1&limit=10&status=published
Authorization: Bearer {token}

Response:
{
  "posts": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### Update Post
```http
PATCH /cms/posts/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}
```

### Delete Post
```http
DELETE /cms/posts/{id}
Authorization: Bearer {token}
```

## E-commerce API

### List Products
```http
GET /products?category=electronics&page=1&limit=20
Authorization: Bearer {token}
```

### Create Product
```http
POST /products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Description",
  "price": 99.99,
  "category": "electronics",
  "inventory": 100
}
```

### Purchase Product
```http
POST /products/{id}/purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 1,
  "paymentMethod": "stripe"
}
```

## Communities API

### List Communities
```http
GET /communities?page=1&limit=10
Authorization: Bearer {token}
```

### Create Community
```http
POST /communities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tech Enthusiasts",
  "description": "A community for tech lovers",
  "visibility": "public"
}
```

### Join Community
```http
POST /communities/{id}/join
Authorization: Bearer {token}
```

### Leave Community
```http
POST /communities/{id}/leave
Authorization: Bearer {token}
```

## Marketing API

### Create Campaign
```http
POST /marketing/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Summer Sale",
  "type": "email",
  "audience": "all",
  "schedule": "2024-06-01T00:00:00Z"
}
```

### Track Event
```http
POST /marketing/track
Authorization: Bearer {token}
Content-Type: application/json

{
  "event": "page_view",
  "properties": {
    "page": "/products",
    "referrer": "google"
  }
}
```

## Marketplace API

### List Plugins
```http
GET /marketplace/plugins?category=integration
Authorization: Bearer {token}
```

### Install Plugin
```http
POST /marketplace/plugins/install
Authorization: Bearer {token}
Content-Type: application/json

{
  "pluginId": "stripe-integration"
}
```

## WebSocket API

### Connect
```javascript
const ws = new WebSocket('wss://api.echoverse.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'jwt-token'
  }));
};
```

### Events
- `message`: New message
- `notification`: System notification
- `presence`: User online/offline
- `typing`: User typing indicator

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": [...]
  }
}
```

## Swagger Documentation

Interactive API documentation available at:
- Development: `http://localhost:5000/api-docs`
- Production: `https://api.echoverse.com/api-docs`
