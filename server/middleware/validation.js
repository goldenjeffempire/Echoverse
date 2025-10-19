import { ZodError } from 'zod';
import { logger } from '../logger';
export function validateBody(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                logger.warn('Request validation failed', { errors, path: req.path });
                return res.status(400).json({
                    message: 'Validation failed',
                    errors
                });
            }
            next(error);
        }
    };
}
export function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                logger.warn('Query validation failed', { errors, path: req.path });
                return res.status(400).json({
                    message: 'Validation failed',
                    errors
                });
            }
            next(error);
        }
    };
}
export function validateParams(schema) {
    return async (req, res, next) => {
        try {
            req.params = await schema.parseAsync(req.params);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                logger.warn('Params validation failed', { errors, path: req.path });
                return res.status(400).json({
                    message: 'Validation failed',
                    errors
                });
            }
            next(error);
        }
    };
}
