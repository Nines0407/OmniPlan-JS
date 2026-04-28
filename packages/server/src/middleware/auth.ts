import type { Request, Response, NextFunction } from 'express';

const API_KEYS = new Map<string, string>(); // apiKey -> userId

export function registerApiKey(userId: string, apiKey: string): void {
  API_KEYS.set(apiKey, userId);
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const apiKey = authHeader.slice(7);
  const userId = API_KEYS.get(apiKey);
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
    const userId = API_KEYS.get(apiKey);
    if (userId) {
      (req as AuthenticatedRequest).userId = userId;
    }
  }
  next();
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
