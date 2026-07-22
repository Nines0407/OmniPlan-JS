import type { Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../services/auth-service';

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const apiKey = authHeader.slice(7);
  const userId = verifyApiKey(apiKey);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Invalid API key' });
    return;
  }
  (req as AuthenticatedRequest).userId = userId;
  next();
}

export function authOptional(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7);
    const userId = verifyApiKey(apiKey);
    if (userId) {
      (req as AuthenticatedRequest).userId = userId;
    }
  }
  next();
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
