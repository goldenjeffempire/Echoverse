import { createHash } from "crypto";
import { createWriteStream, existsSync, mkdirSync, statSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["CRITICAL"] = "CRITICAL";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor() {
        this.logStream = null;
        this.currentLogFile = null;
        this.logDir = "./logs";
        this.rotationConfig = {
            maxSize: 10 * 1024 * 1024,
            maxFiles: 7,
            compress: true
        };
        this.environment = process.env.NODE_ENV || 'development';
        this.secretPatterns = [
            /sk_live_[a-zA-Z0-9]+/gi,
            /sk_test_[a-zA-Z0-9]+/gi,
            /pk_live_[a-zA-Z0-9]+/gi,
            /pk_test_[a-zA-Z0-9]+/gi,
            /whsec_[a-zA-Z0-9]+/gi,
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
            /\d{13,19}/g,
            /\d{3}-\d{2}-\d{4}/g,
            // CRITICAL FIX #15: Redact database connection strings (postgres://...)
            /postgres(?:ql)?:\/\/[^\s]+/gi,
            /mysql:\/\/[^\s]+/gi,
            /mongodb(?:\+srv)?:\/\/[^\s]+/gi,
        ];
        this.secretKeys = new Set([
            'password',
            'secret',
            'token',
            'apikey',
            'api_key',
            'accesstoken',
            'access_token',
            'refreshtoken',
            'refresh_token',
            'auth',
            'authorization',
            'bearer',
            'jwt',
            'sessionid',
            'session_id',
            'csrf',
            'xsrf',
            'privatekey',
            'private_key',
            'encryption_key',
            'twoFactorSecret',
            'two_factor_secret',
            'backupCodes',
            'backup_codes',
            'stripekey',
            'stripe_key',
            'openaikey',
            'openai_key',
            'webhooksecret',
            'webhook_secret',
            // CRITICAL FIX #15: Prevent database connection string logging
            'database_url',
            'connectionstring',
            'connection_string',
            'db_url',
            'postgres',
            'postgresql',
        ]);
        this.initializeLogRotation();
    }
    initializeLogRotation() {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
        this.rotateLogFile();
        setInterval(() => this.checkAndRotate(), 60000);
    }
    rotateLogFile() {
        if (this.logStream) {
            this.logStream.end();
        }
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        this.currentLogFile = join(this.logDir, `app-${timestamp}.log`);
        this.logStream = createWriteStream(this.currentLogFile, { flags: 'a' });
        this.cleanupOldLogs();
    }
    checkAndRotate() {
        if (!this.currentLogFile || !existsSync(this.currentLogFile)) {
            this.rotateLogFile();
            return;
        }
        const stats = statSync(this.currentLogFile);
        if (stats.size >= this.rotationConfig.maxSize) {
            this.rotateLogFile();
        }
    }
    cleanupOldLogs() {
        try {
            const files = readdirSync(this.logDir)
                .filter(file => file.startsWith('app-') && file.endsWith('.log'))
                .map(file => ({
                name: file,
                path: join(this.logDir, file),
                time: statSync(join(this.logDir, file)).mtime.getTime()
            }))
                .sort((a, b) => b.time - a.time);
            if (files.length > this.rotationConfig.maxFiles) {
                files.slice(this.rotationConfig.maxFiles).forEach(file => {
                    unlinkSync(file.path);
                });
            }
        }
        catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }
    redactSecrets(value) {
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value === 'string') {
            let redacted = value;
            this.secretPatterns.forEach(pattern => {
                redacted = redacted.replace(pattern, (match) => {
                    const visibleChars = Math.min(4, Math.floor(match.length * 0.2));
                    return match.substring(0, visibleChars) + '*'.repeat(match.length - visibleChars);
                });
            });
            return redacted;
        }
        if (Array.isArray(value)) {
            return value.map(item => this.redactSecrets(item));
        }
        if (typeof value === 'object') {
            const redacted = {};
            for (const key in value) {
                const lowerKey = key.toLowerCase().replace(/[-_\s]/g, '');
                if (this.secretKeys.has(lowerKey)) {
                    redacted[key] = '[REDACTED]';
                }
                else {
                    redacted[key] = this.redactSecrets(value[key]);
                }
            }
            return redacted;
        }
        return value;
    }
    formatLog(entry) {
        const safeEntry = {
            ...entry,
            message: this.redactSecrets(entry.message),
            context: entry.context ? this.redactSecrets(entry.context) : undefined,
            error: entry.error ? {
                ...entry.error,
                message: this.redactSecrets(entry.error.message),
                stack: entry.error.stack ? this.redactSecrets(entry.error.stack) : undefined,
            } : undefined,
        };
        if (this.environment === 'development') {
            return JSON.stringify(safeEntry, null, 2);
        }
        return JSON.stringify(safeEntry);
    }
    log(level, message, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context }),
        };
        const formatted = this.formatLog(entry);
        if (this.logStream && this.environment === 'production') {
            this.logStream.write(formatted + '\n');
        }
        switch (level) {
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
                console.error(formatted);
                break;
            case LogLevel.WARN:
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
        }
    }
    debug(message, context) {
        if (this.environment === 'development') {
            this.log(LogLevel.DEBUG, message, context);
        }
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, error, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.ERROR,
            message,
            ...(context && { context }),
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            }),
        };
        const formatted = this.formatLog(entry);
        if (this.logStream && this.environment === 'production') {
            this.logStream.write(formatted + '\n');
        }
        console.error(formatted);
    }
    critical(message, error, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.CRITICAL,
            message,
            ...(context && { context }),
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            }),
        };
        const formatted = this.formatLog(entry);
        if (this.logStream && this.environment === 'production') {
            this.logStream.write(formatted + '\n');
        }
        console.error(formatted);
    }
    async logAudit(userId, action, resource, resourceId, details) {
        this.info('Audit log', {
            userId,
            action,
            resource,
            resourceId,
            details,
            type: 'audit'
        });
    }
    requestLogger(req, res, next) {
        const requestId = createHash('sha256')
            .update(`${Date.now()}-${Math.random()}`)
            .digest('hex')
            .substring(0, 16);
        req.requestId = requestId;
        const start = Date.now();
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            const duration = Date.now() - start;
            logger.info(`${req.method} ${req.path} ${res.statusCode}`, {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                requestId,
                userId: req.user?.id,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
            return res.send(data);
        };
        next();
    }
    shutdown() {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}
export const logger = new Logger();
