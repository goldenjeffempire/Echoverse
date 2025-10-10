## API Changelog

All notable API changes will be documented here.

### [Version 2.0.0] - 2025-10-07

#### Added
- `/api/health` - System health check endpoint with database, Redis, and query metrics
- `/metrics` - Prometheus metrics endpoint (requires authentication)
- WebSocket authentication rate limiting (max 5 attempts/minute)
- Query result caching with configurable TTL
- Stripe circuit breaker integration for payment resilience

#### Changed
- `/api/csrf-token` - Now includes rate limiting (10 requests/minute)
- `/api/login` - Enhanced with password breach checking via HIBP
- Session timeout reduced to 15 minutes of inactivity
- All file uploads now support virus scanning in production

#### Security
- CSRF protection enforced on all state-changing endpoints
- WebSocket connections now validate origin headers
- Session fingerprinting to prevent session hijacking
- Password history enforcement (last 5 passwords)

#### Deprecated
- None

#### Removed  
- None

### [Version 1.0.0] - 2025-01-01

#### Initial Release
- User authentication and authorization
- Product catalog management
- Order processing
- WebSocket real-time communication
- AI website builder integration
