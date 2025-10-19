# Complete Setup Guide

**Issue #141 FIX**: Comprehensive setup instructions for new developers

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Development](#development)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Tools
- **Redis** (for caching and session storage)
- **ClamAV** (for virus scanning)
- **Docker** (for containerized development)

## Quick Start

Get up and running in under 5 minutes:

```bash
# 1. Clone the repository
git clone <repository-url>
cd <project-directory>

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Create database and push schema
npm run db:push

# 5. Start development server
npm run dev
```

Visit `http://localhost:5000` in your browser!

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (backend)
- React (frontend)
- Drizzle ORM (database)
- TypeScript
- Vite (build tool)
- And 200+ other dependencies

### Step 3: Database Setup

#### Option A: Replit Database (Easiest)
If you're using Replit, the database is automatically provisioned. Just run:

```bash
npm run db:push
```

#### Option B: Local PostgreSQL

1. **Install PostgreSQL**
   - macOS: `brew install postgresql@14`
   - Ubuntu: `sudo apt-get install postgresql-14`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Create Database**
   ```bash
   createdb myapp_dev
   ```

3. **Set DATABASE_URL**
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/myapp_dev"
   ```

4. **Push Schema**
   ```bash
   npm run db:push
   ```

### Step 4: Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` and configure required variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# Session
SESSION_SECRET="generate-a-random-32-character-string"

# JWT (optional for API tokens)
JWT_SECRET="generate-another-random-string"

# Email (optional - for password reset)
SENDGRID_API_KEY="your-sendgrid-key"
# OR
AWS_SES_ACCESS_KEY="your-aws-access-key"
AWS_SES_SECRET_KEY="your-aws-secret-key"

# Stripe (optional - for payments)
STRIPE_SECRET_KEY="sk_test_your_test_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# OpenAI (optional - for AI features)
OPENAI_API_KEY="sk-your-openai-key"

# AWS S3 (optional - for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"
```

### Step 5: Optional Services

#### Redis (for caching)
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis

# Set in .env
REDIS_URL="redis://localhost:6379"
```

#### ClamAV (for virus scanning)
```bash
# macOS
brew install clamav
freshclam
clamd

# Ubuntu
sudo apt-get install clamav clamav-daemon
sudo freshclam
sudo systemctl start clamav-daemon

# Set in .env
ENABLE_VIRUS_SCAN="true"
```

## Configuration

### Frontend Configuration

Located in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 5173, // Development port
  },
  build: {
    chunkSizeWarningLimit: 500, // Bundle size limit
  },
})
```

### Backend Configuration

Located in `server/index.ts`:

```typescript
const PORT = parseInt(process.env.PORT || '5000', 10);
```

### Database Configuration

Schema defined in `shared/schema.ts`:

```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  // ...
});
```

To modify schema:
1. Edit `shared/schema.ts`
2. Run `npm run db:push` (or `npm run db:push --force` if prompted)

## Development

### Start Development Server

```bash
npm run dev
```

This starts:
- Backend API server on port 5000
- Frontend dev server with HMR
- WebSocket server
- Database connection pool

### Available Scripts

```bash
# Development
npm run dev           # Start development server
npm run dev:client    # Frontend only
npm run dev:server    # Backend only

# Build
npm run build         # Build for production
npm run build:analyze # Analyze bundle size

# Database
npm run db:push       # Push schema changes
npm run db:studio     # Open Drizzle Studio (GUI)
npm run db:backup     # Create database backup
npm run db:restore    # Restore from backup

# Testing
npm test              # Run unit tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run format        # Format with Prettier
npm run typecheck     # TypeScript type checking

# Utilities
npm run clean         # Clean build artifacts
npm run seed          # Seed development data
```

### Project Structure

```
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── contexts/      # React contexts
│   └── index.html         # HTML template
├── server/                # Backend application
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Server utilities
│   └── index.ts           # Server entry point
├── shared/                # Shared code
│   └── schema.ts          # Database schema
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Edit code in `client/` or `server/`
   - Hot reload happens automatically

3. **Test Changes**
   ```bash
   npm test
   npm run test:e2e
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/my-feature
   ```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -ti:5000
# Kill it
kill -9 <PID>

# Or use different port
PORT=3000 npm run dev
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isadmin

# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Type Errors

```bash
# Run type check to see all errors
npm run typecheck

# Generate types from database
npm run db:generate
```

### Database Schema Mismatch

```bash
# Force push schema (WARNING: may lose data)
npm run db:push --force

# Or reset database
dropdb myapp_dev
createdb myapp_dev
npm run db:push
```

### WebSocket Connection Failed

Check:
- Backend server is running
- CORS settings allow WebSocket
- Firewall not blocking connections

### Hot Reload Not Working

```bash
# Restart dev server
# Ctrl+C then
npm run dev

# Clear browser cache
# Hard refresh: Cmd/Ctrl + Shift + R
```

## Next Steps

- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
- Check [API_REFERENCE.md](API_REFERENCE.md) for API documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design

## Getting Help

- **Documentation**: Check `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/yourorg/yourrepo/issues)
- **Community**: [Discussions](https://github.com/yourorg/yourrepo/discussions)

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| `EADDRINUSE: port already in use` | Kill process on that port or use different port |
| `Cannot find module` | Run `npm install` |
| `Database connection timeout` | Check DATABASE_URL and PostgreSQL status |
| `Type errors` | Run `npm run typecheck` to see all errors |
| `Build size too large` | Check bundle analyzer: `npm run build:analyze` |
| `Tests failing` | Check test database is set up correctly |

---

**Last Updated**: October 19, 2025  
**Minimum Requirements**: Node.js 20+, PostgreSQL 14+  
**Recommended IDE**: VS Code with TypeScript, ESLint, Prettier extensions
