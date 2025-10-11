import compression from 'compression';
import { Request, Response } from 'express';

export function compressionMiddleware() {
  return compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024,
    level: 6,
  });
}
