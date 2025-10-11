/**
 * Code Splitting Utilities
 * FIX: PERF-003 - Implement route-based code splitting
 */
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
function LoadingFallback({ message = 'Loading...' }) {
    return (<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"/>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>);
}
/**
 * Lazy load a component with automatic code splitting
 */
export function lazyLoad(importFunc, fallback) {
    const LazyComponent = lazy(importFunc);
    return (props) => (<Suspense fallback={fallback || <LoadingFallback />}>
      <LazyComponent {...props}/>
    </Suspense>);
}
/**
 * Preload a lazy component
 */
export function preloadComponent(importFunc) {
    // Trigger the import to start loading
    importFunc();
}
/**
 * Lazy load with retry logic for failed chunks
 */
export function lazyLoadWithRetry(importFunc, retries = 3, interval = 1000) {
    return lazy(() => {
        return new Promise((resolve, reject) => {
            const attemptLoad = (attemptsLeft) => {
                importFunc()
                    .then(resolve)
                    .catch((error) => {
                    if (attemptsLeft === 1) {
                        reject(error);
                        return;
                    }
                    setTimeout(() => {
                        console.log(`Retrying chunk load... (${retries - attemptsLeft + 1}/${retries})`);
                        attemptLoad(attemptsLeft - 1);
                    }, interval);
                });
            };
            attemptLoad(retries);
        });
    });
}
// Export lazy-loaded route components
// Note: Uncomment and update imports as pages are created
/*
export const LazyDashboard = lazyLoadWithRetry(
  () => import('../pages/Dashboard')
);

export const LazyWebsiteBuilder = lazyLoadWithRetry(
  () => import('../pages/website-builder/WebsiteBuilder')
);

export const LazyEcommerce = lazyLoadWithRetry(
  () => import('../pages/ecommerce/EcommerceDashboard')
);

export const LazyCMS = lazyLoadWithRetry(
  () => import('../pages/cms/CMSDashboard')
);

export const LazyCommunity = lazyLoadWithRetry(
  () => import('../pages/community/CommunityHub')
);

export const LazyMarketing = lazyLoadWithRetry(
  () => import('../pages/marketing/MarketingDashboard')
);

export const LazySettings = lazyLoadWithRetry(
  () => import('../pages/Settings')
);

export const LazyAdmin = lazyLoadWithRetry(
  () => import('../pages/AdminDashboard')
);
*/
