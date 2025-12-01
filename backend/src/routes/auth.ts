import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword
} from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (authentication required)
router.use(authMiddleware); // Apply auth middleware to all routes below

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/change-password', changePassword);

export default router;
