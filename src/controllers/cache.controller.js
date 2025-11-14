import { cacheService } from '../services/cache.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { z } from 'zod';

const statsResponseSchema = z.object({
  hits: z.number().int().nonnegative(),
  misses: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  defaultTTL: z.number().int().positive(),
});

export const cacheController = {
  getStats: asyncHandler(async (_req, res) => {
    const stats = cacheService.getStats();
    const validatedStats = statsResponseSchema.parse(stats);
    sendSuccess(res, validatedStats, 'Cache statistics retrieved successfully');
  }),
};