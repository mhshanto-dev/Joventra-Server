import { Router } from 'express';
import { register, login, logout, refreshToken, getMe, registerSchema, loginSchema, googleAuth, googleCallback } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;
