import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip } = req;
  const requestId = req.requestId || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    if (process.env.NODE_ENV === 'development' || duration > 1000 || statusCode >= 400) {
      logger.info(`${method} ${url} ${statusCode} - ${duration}ms`, { ip, requestId });
    }
  });

  next();
}

