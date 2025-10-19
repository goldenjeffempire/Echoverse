# EchoVerse Platform

## Overview
EchoVerse is a comprehensive, production-ready full-stack platform providing AI-powered website building, e-commerce, content management, social communities, and marketing automation. It aims to deliver a modern, secure, and scalable solution for various business needs.

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