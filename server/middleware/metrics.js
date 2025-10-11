import { httpRequestDuration, httpRequestTotal } from '../monitoring/metrics';
export function metricsMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        httpRequestDuration.observe({
            method: req.method,
            route,
            status_code: res.statusCode
        }, duration);
        httpRequestTotal.inc({
            method: req.method,
            route,
            status_code: res.statusCode
        });
    });
    next();
}
