import compression from 'compression';
// MEDIUM-005: Brotli/Gzip Compression
export function compressionMiddleware() {
    return compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
        level: 6, // Balanced compression level
        threshold: 1024, // Only compress responses > 1KB
    });
}
// MEDIUM-010: Request Batching Support
export function batchingMiddleware() {
    return async (req, res, next) => {
        if (req.path === '/api/batch' && req.method === 'POST') {
            const requests = req.body.requests;
            const results = await Promise.allSettled(requests.map(async (batchReq) => {
                try {
                    const response = await fetch(`${req.protocol}://${req.get('host')}${batchReq.url}`, {
                        method: batchReq.method,
                        headers: {
                            'Content-Type': 'application/json',
                            ...req.headers,
                        },
                        body: batchReq.body ? JSON.stringify(batchReq.body) : undefined,
                    });
                    return {
                        id: batchReq.id,
                        status: response.status,
                        data: await response.json(),
                    };
                }
                catch (error) {
                    return {
                        id: batchReq.id,
                        status: 500,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            }));
            return res.json({ results });
        }
        next();
    };
}
// MEDIUM-012: Connection Pool Metrics
export function poolMetricsMiddleware() {
    return (req, res, next) => {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            // Log slow queries
            if (duration > 1000) {
                console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
            }
            // Emit metrics (would integrate with metrics system)
            if (global.metricsCollector) {
                global.metricsCollector.recordRequestDuration(req.path, duration);
            }
        });
        next();
    };
}
// MEDIUM-011: Asset Preloading Headers
export function preloadMiddleware() {
    return (req, res, next) => {
        // Only preload assets in production (assets don't exist in dev mode - Vite handles them)
        if (req.path === '/' && process.env.NODE_ENV === 'production') {
            res.setHeader('Link', [
                '</assets/main.js>; rel=preload; as=script',
                '</assets/main.css>; rel=preload; as=style',
                '</assets/fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
            ].join(', '));
        }
        next();
    };
}
// MEDIUM-015: Memory Leak Detection
export function memoryMonitorMiddleware() {
    let requestCount = 0;
    return (req, res, next) => {
        requestCount++;
        // Check memory every 1000 requests
        if (requestCount % 1000 === 0) {
            const usage = process.memoryUsage();
            const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
            const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
            console.log(`Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`);
            // Alert if heap usage > 80%
            if (heapUsedMB / heapTotalMB > 0.8) {
                console.warn('⚠️  High memory usage detected!');
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    console.log('Forced garbage collection');
                }
            }
        }
        next();
    };
}
// HTTP/2 Server Push (when using HTTP/2)
export function http2PushMiddleware() {
    return (req, res, next) => {
        const resWithStream = res;
        // Only push assets in production (assets don't exist in dev mode - Vite handles them)
        if (req.path === '/' && process.env.NODE_ENV === 'production' && resWithStream.stream && typeof resWithStream.stream.pushStream === 'function') {
            // Push critical resources
            const resources = [
                { path: '/assets/main.js', type: 'script' },
                { path: '/assets/main.css', type: 'style' },
            ];
            resources.forEach(({ path, type }) => {
                resWithStream.stream.pushStream({ ':path': path }, (err, pushStream) => {
                    if (err)
                        return;
                    pushStream.respond({
                        'content-type': type === 'script' ? 'application/javascript' : 'text/css',
                        ':status': 200,
                    });
                    // Stream the resource
                    pushStream.end();
                });
            });
        }
        next();
    };
}
