/**
 * Centralized logging utility for KeyVault.
 * In production, it sanitizes error objects to prevent info leakage (stack traces, etc.)
 * and only logs to the console in development mode.
 */

const IS_DEV = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Strips sensitive fields from objects or errors.
 */
const sanitize = (val: unknown): unknown => {
    if (val instanceof Error) {
        return {
            name: val.name,
            message: val.message,
            ...(IS_DEV ? { stack: val.stack } : {}),
            code: (val as unknown as Record<string, unknown>).code || (val as unknown as Record<string, unknown>).status,
        };
    }

    if (typeof val === 'object' && val !== null) {
        const sanitized = { ...(val as Record<string, unknown>) };
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'seed', 'mnemonic', 'mph', 'mek'];
        sensitiveKeys.forEach(key => {
            if (key in sanitized) {
                sanitized[key] = '[REDACTED]';
            }
        });
        return sanitized;
    }

    return val;
};

const log = (level: LogLevel, ...args: unknown[]) => {
    if (!IS_DEV && (level === 'debug' || level === 'info')) return;

    const sanitizedArgs = args.map(sanitize);

    switch (level) {
        case 'debug':
            console.debug(...sanitizedArgs);
            break;
        case 'info':
            console.info(...sanitizedArgs);
            break;
        case 'warn':
            console.warn(...sanitizedArgs);
            break;
        case 'error':
            console.error(...sanitizedArgs);
            break;
    }
};

export const logger = {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
};
