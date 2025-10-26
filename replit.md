# EchoVerse Platform

## Overview
EchoVerse is a comprehensive, production-ready full-stack platform providing AI-powered website building, e-commerce, content management, social communities, and marketing automation. It aims to deliver a modern, secure, and scalable solution for various business needs.

## Current Status (October 26, 2025)
✅ **Platform Operational - Evidence-Based Assessment**

**Verified Working:**
- ✅ Database: 98 tables confirmed via SQL query (SELECT COUNT(*) FROM information_schema.tables)
- ✅ API Endpoints: CSRF token endpoint responding correctly (/api/csrf-token returns valid JSON)
- ✅ Security Headers: Helmet configured (verified Strict-Transport-Security, X-Content-Type-Options, CORS headers present)
- ✅ Application Server: Running on port 5000, responding to requests
- ✅ Required Secrets: JWT_SECRET, TWO_FACTOR_BACKUP_ENCRYPTION_KEY, WEBHOOK_SIGNATURE_SECRET configured

**Configured (Not Fully Tested):**
- ⚠️ Stripe Integration: Backend routes present (payment intents, subscriptions, refunds with idempotency), secrets configured (VITE_STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- ⚠️ Frontend Optimization: Code splitting configured in vite.config.ts, 34 lazy-loaded routes in App.tsx
- ⚠️ Security Middleware: Implementation present (sanitization, rate limiting, CSRF) - requires integration testing

**Known Issues:**
- ⚠️ Database connection idle timeouts occur (~5min intervals) - connections auto-recover, no service impact
- ⚠️ drizzle-kit version 0.18.1 lacks `push` command - database already populated, migration path needs updating for future schema changes

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates. Ask before making major architectural changes or introducing new external dependencies. Do not make changes to the `docs/` folder. Do not make changes to files within the `k8s/` folder unless explicitly instructed.

## System Architecture
The platform is built with a Node.js 20+ (TypeScript) backend using Express.js and a React 18 frontend with Vite. Data persistence is handled by PostgreSQL 14+ with Drizzle ORM. AI capabilities are integrated via OpenAI GPT-4 and local Ollama, featuring a smart fallback system. Authentication uses JWT with session management and 2FA. Real-time communication is powered by WebSockets. The UI/UX leverages Tailwind CSS and Radix UI for a modern, responsive design.

Key architectural features include:
- **Comprehensive AI Integration**: Smart fallback between OpenAI and local Ollama, with 11+ AI features.
- **Robust Security**: SSL/TLS automation, JWT/session fingerprinting, 2FA, RBAC, AES-256 encryption, rate limiting, CSRF protection, and Zod input validation.
- **Automated Workflows**: SSL certificate management, non-interactive database migrations, order fulfillment, and daily encrypted database backups.
- **Observability**: Integrated Sentry for error monitoring, Prometheus for metrics, OpenTelemetry, and comprehensive health checks (`/api/health`, `/api/ready`, `/api/live`).
- **Internationalization (i18n)**: Multi-language support (10 languages) including RTL, with React hooks for easy integration and browser language detection.
- **Containerization**: Docker and Kubernetes manifests for deployment and orchestration, including Horizontal Pod Autoscaler (HPA).
- **SEO & PWA**: Complete meta tags, Open Graph, Twitter Cards, JSON-LD, and PWA support with service worker.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **AI**: OpenAI, Ollama
- **Payments**: Stripe
- **Email**: SendGrid / AWS SES
- **Error Tracking**: Sentry
- **Metrics**: Prometheus, OpenTelemetry
- **CDN**: CloudFront / Cloudflare
- **Certificate Management**: Let's Encrypt
- **Containerization**: Docker, Kubernetes
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS, Radix UI
- **Forms**: React Hook Form, Zod