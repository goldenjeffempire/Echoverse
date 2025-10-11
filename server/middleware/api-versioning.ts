import { Request, Response, NextFunction, Router } from 'express';
import { logger } from '../logger';

/**
 * API Versioning Middleware
 * 
 * Supports version-based routing: /api/v1/..., /api/v2/...
 * Allows gradual migration and backward compatibility
 */

export interface VersionedRouter {
  version: string;
  router: Router;
}

/**
 * Create versioned API router
 */
export function createVersionedAPI(versions: VersionedRouter[]): Router {
  const mainRouter = Router();
  
  // Register each version
  for (const { version, router } of versions) {
    mainRouter.use(`/${version}`, router);
    logger.info(`Registered API version: /${version}`);
  }
  
  // Default to latest version
  if (versions.length > 0) {
    const latestVersion = versions[versions.length - 1];
    mainRouter.use('/', latestVersion.router);
    logger.info(`Default API version set to: /${latestVersion.version}`);
  }
  
  return mainRouter;
}

/**
 * Extract API version from request
 */
export function getAPIVersion(req: Request): string {
  // Check URL path
  const pathMatch = req.path.match(/^\/api\/(v\d+)/);
  if (pathMatch) {
    return pathMatch[1];
  }
  
  // Check header
  const headerVersion = req.get('API-Version');
  if (headerVersion) {
    return headerVersion;
  }
  
  // Default version
  return 'v1';
}

/**
 * Deprecation warning middleware
 */
export function deprecationWarning(version: string, sunsetDate?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const warning = `API version ${version} is deprecated`;
    const fullWarning = sunsetDate 
      ? `${warning}. Sunset date: ${sunsetDate}` 
      : warning;
    
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', sunsetDate || 'TBD');
    res.setHeader('Warning', fullWarning);
    
    logger.warn(fullWarning, {
      requestId: req.id,
      path: req.path,
      version
    });
    
    next();
  };
}

/**
 * Version requirement middleware
 */
export function requireVersion(minVersion: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentVersion = getAPIVersion(req);
    
    const current = parseInt(currentVersion.replace('v', ''), 10);
    const required = parseInt(minVersion.replace('v', ''), 10);
    
    if (current < required) {
      res.status(400).json({
        success: false,
        message: `This endpoint requires API version ${minVersion} or higher`,
        currentVersion,
        requiredVersion: minVersion
      });
      return;
    }
    
    next();
  };
}
