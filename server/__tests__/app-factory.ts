import express from 'express';
import { registerRoutes } from '../routes';

export async function createTestApp() {
  const app = express();
  
  // Set test environment
  app.set('env', 'test');
  
  // Register all real routes
  await registerRoutes(app);
  
  return app;
}
