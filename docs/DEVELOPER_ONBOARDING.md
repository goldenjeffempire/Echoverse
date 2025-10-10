## Developer Onboarding Guide

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Git

### Quick Start

#### 1. Clone & Install
```bash
git clone <repository-url>
cd AIAgentExecute
npm install
```

#### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Database Setup
```bash
npm run db:push
```

#### 4. Start Development
```bash
npm run dev
```

Application runs at: http://localhost:5000

### Project Structure

```
AIAgentExecute/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities & helpers
│   │   └── hooks/         # Custom React hooks
├── server/                # Node.js backend
│   ├── routes.ts          # API route definitions
│   ├── websocket.ts       # WebSocket handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   └── utils/             # Helper functions
├── shared/                # Shared code
│   └── schema.ts          # Database schema (Drizzle ORM)
└── docs/                  # Documentation
```

### Development Workflow

#### Running Tests
```bash
npm run test                 # All tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:e2e            # End-to-end tests
```

#### Database Migrations
```bash
npm run db:push             # Push schema changes
npm run db:studio           # Open Drizzle Studio
```

#### Code Quality
```bash
npm run lint                # Lint code
npm run typecheck           # TypeScript check
npm run format              # Format with Prettier
```

### Key Concepts

#### Authentication
- JWT-based with refresh tokens
- Session fingerprinting for security
- 2FA support with TOTP

#### Real-time Communication
- WebSocket for chat & notifications
- Automatic reconnection with exponential backoff
- Message queueing during offline

#### State Management
- React Query for server state
- Context API for global UI state
- Optimistic updates with rollback

#### Error Handling
- Error boundaries for React components
- Centralized error logging
- Automatic retry logic for transient failures

### Common Tasks

#### Add New API Endpoint
1. Define route in `server/routes.ts`
2. Add validation using Zod
3. Implement business logic in `server/services/`
4. Add tests in `server/__tests__/`
5. Update API documentation

#### Add New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Implement UI with shadcn/ui components
4. Add to navigation if needed

#### Add Database Table
1. Define schema in `shared/schema.ts`
2. Run `npm run db:push`
3. Update storage layer in `server/storage.ts`
4. Add TypeScript types

### Best Practices

#### Security
- Never commit secrets to git
- Always validate user input
- Use prepared statements for SQL
- Implement rate limiting for public endpoints

#### Performance
- Use React.memo() for expensive components
- Implement pagination for large lists
- Cache API responses when appropriate
- Lazy load routes and components

#### Code Style
- Follow ESLint configuration
- Use TypeScript strict mode
- Write meaningful commit messages
- Keep functions small and focused

### Debugging

#### Server Logs
```bash
# Tail development logs
tail -f server.log

# Search for errors
grep ERROR server.log
```

#### Database Queries
```bash
# Enable query logging
ENABLE_QUERY_LOGGING=true npm run dev
```

#### WebSocket Debugging
Open browser DevTools → Network → WS tab

### Resources

- [API Documentation](./API_CHANGELOG.md)
- [Architecture Decisions](./adr/)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Monitoring Runbook](./MONITORING_RUNBOOK.md)

### Getting Help

- **Slack**: #engineering-support
- **Documentation**: Check `/docs` folder
- **Code Reviews**: Tag @platform-team
- **Bugs**: Create GitHub issue with template

### Checklist for First PR

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log() in production code
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Accessibility considered
- [ ] Performance impact assessed
