import { Router } from 'express';
import { RegisterSchema, LoginSchema } from '@omniplan/shared';
import { validate } from '../middleware/validate';
import { registerUser, findByUsername, createApiKey, verifyApiKey, findUserById } from '../services/auth-service';

const router = Router();

router.post('/register', validate(RegisterSchema), (req, res) => {
  try {
    const user = registerUser(req.body.username, req.body.display_name);
    const apiKey = createApiKey(user.id);
    res.status(201).json({ success: true, data: { user, api_key: apiKey } });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/login', validate(LoginSchema), (req, res) => {
  const user = findByUsername(req.body.username);
  if (!user) {
    res.status(401).json({ success: false, error: 'User not found' });
    return;
  }
  const apiKey = createApiKey(user.id);
  res.json({ success: true, data: { user, api_key: apiKey } });
});

router.get('/verify', (req, res) => {
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
  const user = findUserById(userId);
  if (!user) {
    res.status(401).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: { user } });
});

export default router;
