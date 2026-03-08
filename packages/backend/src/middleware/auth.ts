import type { Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@prisma/client';

const DEFAULT_USER_EMAIL = 'admin@uppr.local';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

/**
 * Simplified auth middleware for Phase 1.
 * Creates/retrieves a default test user and attaches userId to all requests.
 */
export function authMiddleware(prisma: PrismaClient) {
  let defaultUserId: string | null = null;

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!defaultUserId) {
        const user = await prisma.user.upsert({
          where: { email: DEFAULT_USER_EMAIL },
          update: {},
          create: { email: DEFAULT_USER_EMAIL, name: 'Admin' },
        });
        defaultUserId = user.id;
      }
      req.userId = defaultUserId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
