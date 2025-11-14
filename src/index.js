import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware, requestLogger } from './middleware/requestLogger.js';
import { rateLimitMiddleware } from './middleware/rateLimiter.js';
import apiRoutes from './routes/index.js';
import { rateLimiter } from './utils/rateLimiter.js';
import { destroyCacheService } from './services/cache.service.js';
import './utils/rateLimiter.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(rateLimitMiddleware);

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    memory: process.memoryUsage(),
  });
});

app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running on http://localhost:${config.port}`);
  logger.info(`📡 AI API available at http://localhost:${config.port}/api/ai`);
  logger.info(`👥 Users API available at http://localhost:${config.port}/api/users`);
  logger.info(`🏥 Health check at http://localhost:${config.port}/health`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    rateLimiter.destroy();
    destroyCacheService();
    
    logger.info('Cleanup completed, exiting');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});

