import { Router } from 'express';
import { logger } from '../logger';
import { z } from 'zod';

const router = Router();

// Error reporting schema
const errorReportSchema = z.object({
  error: z.string(),
  errorInfo: z.string().optional(),
  url: z.string().url(),
  userAgent: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().optional()
});

// Frontend error reporting endpoint
router.post('/report', async (req, res) => {
  try {
    const errorData = errorReportSchema.parse(req.body);
    
    // Log error with context
    logger.error('Frontend error reported', new Error(errorData.error), {
      url: errorData.url,
      userAgent: errorData.userAgent,
      userId: errorData.userId || req.user?.id,
      errorInfo: errorData.errorInfo,
      timestamp: errorData.timestamp || new Date().toISOString()
    });
    
    // TODO: Send to error tracking service (Sentry, Datadog, etc.)
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(errorData.error), {
    //     contexts: { errorData }
    //   });
    // }
    
    res.status(200).json({ success: true, message: 'Error reported' });
  } catch (error) {
    logger.error('Failed to process error report', error as Error);
    res.status(400).json({ error: 'Invalid error report format' });
  }
});

export default router;
