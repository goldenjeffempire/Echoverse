# ADR-002: Authentication Strategy (JWT + Sessions)

**Status:** Accepted  
**Date:** 2025-10-07  
**Decision Makers:** Security Team, Development Team  
**Consulted:** DevOps Team, Compliance Team  

---

## Context

The EchoVerse Platform requires a secure, scalable authentication system that supports:
- Stateless API authentication for mobile and SPA clients
- Secure session management with automatic rotation
- Two-factor authentication (2FA) support
- OAuth integration (Google, GitHub, Facebook)
- Multi-device login management
- Password security and breach detection
- CSRF protection for web clients
- Session hijacking prevention

We needed to balance security, scalability, and user experience while meeting compliance requirements (GDPR, OWASP).

---

## Decision

We have decided to implement a **hybrid authentication strategy** using **JWT tokens with server-side session validation**.

### Key Components:

1. **JWT Tokens**
   - Access tokens (15-minute expiry)
   - Refresh tokens (7-day expiry)
   - Token rotation on refresh
   - HMAC-SHA256 signing

2. **Server-Side Sessions**
   - Session storage in PostgreSQL
   - Device fingerprinting (IP + User-Agent)
   - Session rotation every 4 hours
   - Max 5 concurrent sessions per user

3. **Security Features**
   - CSRF protection with cryptographic tokens
   - Password hashing with bcrypt (12 rounds)
   - Password history (last 5 passwords)
   - HaveIBeenPwned integration
   - Rate limiting per endpoint
   - Concurrent login protection

4. **Two-Factor Authentication**
   - TOTP-based (compatible with Google Authenticator)
   - Encrypted backup codes
   - Recovery email option

---

## Rationale

### Why Hybrid JWT + Sessions?

**Pure JWT (Stateless) Issues:**
- ❌ Cannot invalidate tokens immediately
- ❌ No way to logout from all devices
- ❌ Token size grows with claims
- ❌ Difficult to detect compromised tokens

**Pure Sessions (Stateful) Issues:**
- ❌ Scalability challenges across multiple servers
- ❌ Not ideal for mobile/SPA clients
- ❌ Requires sticky sessions or shared storage

**Hybrid Approach Benefits:**
- ✅ Immediate token invalidation via session check
- ✅ Logout all devices functionality
- ✅ Short-lived access tokens (15 min)
- ✅ Session-based security controls
- ✅ Mobile-friendly with refresh tokens
- ✅ WebSocket authentication support

---

## Implementation Details

### Token Structure

**Access Token (JWT):**
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "iat": 1633024800,
  "exp": 1633025700
}
```

**Refresh Token (JWT):**
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "type": "refresh",
  "nonce": "uuid",
  "iat": 1633024800,
  "exp": 1633629600
}
```

### Session Storage

```typescript
// PostgreSQL sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 64 }).notNull(),
  deviceFingerprint: varchar('device_fingerprint', { length: 64 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Authentication Flow

1. **Login**
   - Validate credentials (username + password)
   - Check 2FA if enabled
   - Create session with device fingerprint
   - Generate access + refresh tokens
   - Return tokens to client

2. **Token Refresh**
   - Verify refresh token signature
   - Acquire lock (prevent concurrent refresh)
   - Validate session exists and matches
   - Rotate refresh token (invalidate old)
   - Generate new access token
   - Return new tokens

3. **Authenticated Request**
   - Extract access token from header
   - Verify JWT signature
   - Load session from database
   - Validate session fingerprint
   - Check session expiry and activity
   - Attach user to request context

4. **Logout**
   - Invalidate session in database
   - Close WebSocket connections
   - Clear client-side tokens

### Security Mechanisms

#### 1. Session Fingerprinting
```typescript
interface SessionFingerprint {
  hash: string;           // SHA256 hash of combined data
  ipAddress: string;      // Client IP
  userAgent: string;      // Browser/device info
  acceptLanguage: string; // Browser language
  createdAt: Date;
}
```

#### 2. Session Validation
- IP address monitoring (warning only in dev)
- User-Agent changes detection
- Suspicious activity flagging
- Automatic rotation after 4 hours
- Inactivity timeout (15 minutes)

#### 3. CSRF Protection
```typescript
// HMAC-based CSRF token
const csrfToken = crypto
  .createHmac('sha256', csrfSecret)
  .update(sessionId)
  .digest('hex');
```

#### 4. Password Security
- Bcrypt hashing (12 rounds)
- Password history (last 5)
- Complexity requirements (8+ chars, mixed case, numbers, special)
- HaveIBeenPwned breach check
- Password reset lockout (3 attempts/hour)

#### 5. Rate Limiting
- Login: 5 requests/15min per IP
- Registration: 5 requests/hour per IP
- Password reset: 3 requests/hour per IP
- 2FA verify: 5 requests/15min per user
- Token refresh: 10 requests/minute per user

---

## Consequences

### Positive

1. **Security**: Multi-layered defense against attacks
2. **Scalability**: Short-lived JWTs reduce database load
3. **Flexibility**: Supports web, mobile, and WebSocket clients
4. **Control**: Immediate session invalidation capability
5. **UX**: Seamless token refresh, multi-device support
6. **Compliance**: Meets OWASP and GDPR requirements
7. **Monitoring**: Comprehensive session tracking

### Negative

1. **Complexity**: More complex than pure JWT or sessions
2. **Database Load**: Session validation on each request
3. **Token Size**: JWTs add to request size
4. **Storage**: Sessions stored in PostgreSQL
5. **Migration**: Existing auth systems need migration

### Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Token theft | Short expiry (15 min), session validation |
| Session hijacking | Device fingerprinting, IP monitoring |
| CSRF attacks | Cryptographic CSRF tokens |
| Brute force | Rate limiting, account lockout |
| Token replay | Nonce in refresh tokens, rotation |
| Database downtime | Redis fallback for sessions (optional) |

---

## Alternatives Considered

### 1. Pure JWT (Stateless)
- **Rejected**: Cannot invalidate tokens, security concerns
- **When to reconsider**: If extreme scalability is required

### 2. Pure Sessions (Stateful)
- **Rejected**: Not mobile-friendly, scalability issues
- **When to reconsider**: If only web clients are supported

### 3. OAuth Only (No password auth)
- **Rejected**: Vendor dependency, user preference for passwords
- **When to reconsider**: If enterprise SSO is primary use case

### 4. Passport.js Strategies
- **Rejected**: We built custom solution for more control
- **When to reconsider**: If rapid OAuth integration is needed

---

## Security Best Practices

### Token Management
- ✅ Store access token in memory (React state)
- ✅ Store refresh token in httpOnly cookie (web)
- ✅ Never expose tokens in URLs
- ✅ Clear tokens on logout
- ✅ Validate token expiry client-side

### Session Management
- ✅ Regenerate session ID on login
- ✅ Invalidate all sessions on password change
- ✅ Monitor for suspicious activity
- ✅ Limit concurrent sessions (max 5)
- ✅ Automatic cleanup of expired sessions

### CSRF Protection
- ✅ SameSite cookies (Strict/Lax)
- ✅ CSRF tokens for state-changing requests
- ✅ Origin/Referer header validation
- ✅ Double-submit cookie pattern

---

## Monitoring & Compliance

### Security Metrics
- Failed login attempts
- Session creation/invalidation rates
- Token refresh patterns
- Suspicious activity flags
- 2FA adoption rate

### Compliance
- **GDPR**: User can request session data, delete all sessions
- **OWASP**: Implements A2, A5, A7 protections
- **PCI DSS**: Secure authentication for payment processing

### Audit Logging
- All authentication events
- Session lifecycle (create, refresh, invalidate)
- Failed login attempts
- Password changes
- 2FA setup/disable

---

## Related Decisions

- [ADR-001: Database Choice](./ADR-001-database-choice.md) - Session storage in PostgreSQL
- [ADR-003: WebSocket Implementation](./ADR-003-websocket-implementation.md) - WebSocket authentication

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [bcrypt Password Hashing](https://github.com/kelektiv/node.bcrypt.js)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)

---

**Last Updated:** 2025-10-07  
**Next Review:** 2026-04-07
