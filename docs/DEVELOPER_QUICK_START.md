# Developer Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database (provided by Replit)
- Git basic knowledge

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
npm run db:push -- --force
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs on http://localhost:5000 (or your Replit URL)

### 4. Verify Setup
- Open browser to server URL
- Check `/api/health` endpoint
- Create test account

## 📁 Project Structure
```
├── client/          # React frontend
│   └── src/
├── server/          # Express backend
│   ├── routes.ts   # API routes
│   └── index.ts    # Server entry
├── shared/         # Shared types/schemas
└── docs/           # Documentation
```

## 🧪 Testing
```bash
npm run test              # Unit tests
npm run test:e2e         # E2E tests  
npm run test:coverage    # Coverage report
```

## 🔑 Key Concepts
- **Authentication**: JWT-based with session management
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Ollama (local) + OpenAI (fallback)
- **Real-time**: WebSocket for live features

## 📚 Next Steps
1. Read [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
2. Review [Architecture Decision Records](./adr/)
3. Check [MONITORING_RUNBOOK.md](../MONITORING_RUNBOOK.md)
4. Explore [API Documentation](http://localhost:5000/api-docs)

## 🆘 Common Issues
See [MONITORING_RUNBOOK.md](../MONITORING_RUNBOOK.md) for troubleshooting.
