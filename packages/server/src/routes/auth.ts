import { Router } from 'express';
import { RegisterSchema, LoginSchema } from '@omniplan/shared';
import { validate } from '../middleware/validate';
import { registerUser, findByUsername, generateApiKey } from '../services/auth-service';
import { registerApiKey } from '../middleware/auth';

const router = Router();

router.post('/register', validate(RegisterSchema), (req, res) => {
  try {
    const user = registerUser(req.body.username, req.body.display_name);
    const apiKey = generateApiKey();
    registerApiKey(user.id, apiKey);
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
  const apiKey = generateApiKey();
  registerApiKey(user.id, apiKey);
  res.json({ success: true, data: { user, api_key: apiKey } });
});

export default router;
