# EchoVerse Platform - Developer Onboarding Video Script
## LOW-004: Developer Onboarding Video

**Duration: 10-15 minutes**

---

## Scene 1: Welcome & Platform Overview (2 min)

**[Opening Screen: EchoVerse Platform Logo]**

**Narrator:** "Welcome to EchoVerse Platform! In this video, we'll get you up and running as a developer in just 15 minutes."

**[Screen: Architecture Diagram]**

"EchoVerse is a full-stack platform built with:
- React + TypeScript frontend
- Node.js + Express backend  
- PostgreSQL database with Drizzle ORM
- Real-time features with WebSockets
- AI-powered website generation"

---

## Scene 2: Prerequisites & Setup (3 min)

**[Screen: Terminal]**

"First, ensure you have:
- Node.js 20+ installed
- PostgreSQL 16+ running  
- Git for version control"

**[Show commands]**
```bash
# Clone the repository
git clone https://github.com/echoverse/platform.git
cd platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

**[Show .env file]**

"Edit `.env` with your database credentials and API keys:
- DATABASE_URL for PostgreSQL
- SESSION_SECRET (generate with: openssl rand -base64 32)
- JWT_SECRET (generate with: openssl rand -base64 32)
- STRIPE_SECRET_KEY for payments"

---

## Scene 3: Database Setup (2 min)

**[Screen: Database setup]**

```bash
# Push database schema
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

**Narrator:** "Drizzle ORM automatically creates all tables from our schema."

---

## Scene 4: Running the Development Server (2 min)

**[Screen: Split terminal]**

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Open in browser
# Navigate to http://localhost:5000
```

**[Show browser with app running]**

"The app runs on port 5000 with hot reload enabled!"

---

## Scene 5: Project Structure Tour (3 min)

**[Screen: VS Code file explorer]**

```
/client - React frontend
  /src
    /components - Reusable UI components
    /pages - Route pages
    /lib - Utilities and hooks
    
/server - Node.js backend
  /routes - API endpoints
  /services - Business logic
  /middleware - Auth, security, rate limiting
  /utils - Helper functions
  
/shared - Shared types and schemas
  schema.ts - Database schema (Drizzle)
```

---

## Scene 6: Making Your First Change (2 min)

**[Screen: Code editing]**

"Let's add a new feature. Watch the hot reload in action!"

**[Edit a component, save, show browser auto-update]**

---

## Scene 7: Testing & Quality (1 min)

```bash
# Run tests
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

---

## Scene 8: Key Resources (1 min)

**[Screen: Documentation links]**

- **Architecture Decisions**: `/docs/adr`
- **API Documentation**: `/docs/api`
- **Troubleshooting**: `/TROUBLESHOOTING.md`
- **Contributing**: `/CONTRIBUTING.md`

---

## Scene 9: Getting Help (30 sec)

"Need help? 
- Join our Discord: discord.gg/echoverse
- Read the docs: docs.echoverse.dev
- File an issue: github.com/echoverse/platform/issues"

---

**[Closing Screen]**

"Happy coding! Welcome to the EchoVerse team! 🚀"

---

## Production Notes

- **Screen Recording Tool**: OBS Studio or Loom
- **Video Editing**: Final Cut Pro or DaVinci Resolve
- **Hosting**: YouTube (unlisted) + Vimeo
- **Embed**: Add video player to DEVELOPER_ONBOARDING.md
