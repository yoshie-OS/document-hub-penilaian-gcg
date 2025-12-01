import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats
} from '../controllers/users';
import { authMiddleware, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// =====================================================
// USER MANAGEMENT ROUTES
// =====================================================

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all users (Admin+)
router.get('/', requireAdmin, getUsers);

// Get user by ID (Admin+)
router.get('/:id', requireAdmin, getUserById);

// Create new user (Admin+)
router.post('/', requireAdmin, createUser);

// Update user (Admin+)
router.put('/:id', requireAdmin, updateUser);

// Delete user (Superadmin only)
router.delete('/:id', requireSuperAdmin, deleteUser);

// Toggle user status (Admin+)
router.patch('/:id/status', requireAdmin, toggleUserStatus);

// Get user statistics (Admin+)
router.get('/stats/overview', requireAdmin, getUserStats);

export default router;
