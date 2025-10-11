# Contributing to EchoVerse

Thank you for your interest in contributing to EchoVerse! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- Git

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/echoverse.git
   cd echoverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Seed development data** (optional)
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Message Format
Follow conventional commits:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(auth): add two-factor authentication

Implemented 2FA using TOTP with QR code generation.
Added backup codes for account recovery.

Closes #123
```

### Pull Request Process

1. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, maintainable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests locally**
   ```bash
   npm test
   npm run test:e2e
   npm run typecheck
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use the PR template
   - Provide clear description
   - Link related issues
   - Request review from maintainers

### Code Style Guidelines

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Use functional components and hooks in React
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Maximum line length: 100 characters

#### React Components
```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}
```

#### File Organization
```
client/src/
  ├── components/     # Reusable UI components
  ├── pages/          # Page components
  ├── hooks/          # Custom React hooks
  ├── lib/            # Utility functions
  ├── contexts/       # React contexts
  └── types/          # TypeScript types

server/
  ├── routes/         # API routes
  ├── middleware/     # Express middleware
  ├── services/       # Business logic
  ├── utils/          # Utility functions
  └── __tests__/      # Server tests
```

### Testing Guidelines

#### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from './validation';

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

#### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Documentation

- Update README.md for major changes
- Add JSDoc comments for public APIs
- Update API documentation for endpoint changes
- Include code examples where helpful

### Security

- Never commit sensitive information (API keys, passwords)
- Use environment variables for configuration
- Validate and sanitize all user inputs
- Follow OWASP security best practices
- Report security vulnerabilities privately to security@echoverse.com

### Performance

- Optimize database queries
- Use proper indexing
- Implement caching where appropriate
- Lazy load components and routes
- Minimize bundle size

## Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Code quality checks
   - Security scans
   - Build verification

2. **Code Review**
   - At least one maintainer approval required
   - Address review comments
   - Keep discussions constructive

3. **Merge**
   - Squash and merge for clean history
   - Delete branch after merge

## Getting Help

- 💬 [Discord Community](https://discord.gg/echoverse)
- 📧 Email: support@echoverse.com
- 📖 [Documentation](https://docs.echoverse.com)
- 🐛 [Issue Tracker](https://github.com/yourusername/echoverse/issues)

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website

Thank you for contributing to EchoVerse! 🚀
