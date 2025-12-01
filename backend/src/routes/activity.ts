import { Router } from 'express';
import {
  getActivityLogs,
  getActivityLogById,
  getUserActivityLogs,
  getActivityStats,
  getSystemHealth,
  exportActivityLogs
} from '../controllers/activity';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// =====================================================
// ACTIVITY LOGS & SYSTEM MONITORING ROUTES
// =====================================================

// Apply authentication middleware to all routes
router.use(authMiddleware);

// =====================================================
// ACTIVITY LOGS ROUTES
// =====================================================

// Get all activity logs (Admin only)
router.get('/logs', requireAdmin, getActivityLogs);

// Get activity log by ID (Admin only)
router.get('/logs/:id', requireAdmin, getActivityLogById);

// Get user activity logs (Admin only)
router.get('/users/:userId/logs', requireAdmin, getUserActivityLogs);

// =====================================================
// STATISTICS & MONITORING ROUTES
// =====================================================

// Get activity statistics (Admin only)
router.get('/stats', requireAdmin, getActivityStats);

// Get system health (Admin only)
router.get('/health', requireAdmin, getSystemHealth);

// =====================================================
// EXPORT ROUTES
// =====================================================

// Export activity logs (Admin only)
router.get('/export', requireAdmin, exportActivityLogs);

export default router;
