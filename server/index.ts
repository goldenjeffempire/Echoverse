// server/index.ts
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

dotenv.config();

const app = express();

// Middleware setup
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Logging
app.use(morgan('combined'));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Swagger API docs for the application'
    },
    servers: [
      {
        url: '/api/v1',
        description: 'v1 Server'
      }
    ]
  },
  apis: ['./routes/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Request logger for API routes
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 400,
        message: 'Validation Error',
        errors: err.errors,
        timestamp: new Date().toISOString()
      });
    }

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        status: 401,
        message: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errorId = Date.now().toString();

    res.status(status).json({ 
      message,
      errorId,
      status,
      timestamp: new Date().toISOString()
    });
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Rejection:', reason);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on http://0.0.0.0:${port}`);
  });
})();
