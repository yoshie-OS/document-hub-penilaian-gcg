import { Router } from 'express';
import {
  // Direktorat
  getDirektorat,
  getDirektoratById,
  createDirektorat,
  updateDirektorat,
  deleteDirektorat,
  // Subdirektorat
  getSubdirektorat,
  getSubdirektoratById,
  createSubdirektorat,
  updateSubdirektorat,
  deleteSubdirektorat,
  // Divisi
  getDivisi,
  getDivisiById,
  createDivisi,
  updateDivisi,
  deleteDivisi
} from '../controllers/struktur';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// =====================================================
// ORGANIZATIONAL STRUCTURE ROUTES
// =====================================================

// Apply authentication middleware to all routes
router.use(authMiddleware);

// =====================================================
// DIREKTORAT ROUTES
// =====================================================

// Public routes (no admin required)
router.get('/direktorat', getDirektorat);
router.get('/direktorat/:id', getDirektoratById);

// Admin-only routes
router.post('/direktorat', requireAdmin, createDirektorat);
router.put('/direktorat/:id', requireAdmin, updateDirektorat);
router.delete('/direktorat/:id', requireAdmin, deleteDirektorat);

// =====================================================
// SUBDIREKTORAT ROUTES
// =====================================================

// Public routes (no admin required)
router.get('/subdirektorat', getSubdirektorat);
router.get('/subdirektorat/:id', getSubdirektoratById);

// Admin-only routes
router.post('/subdirektorat', requireAdmin, createSubdirektorat);
router.put('/subdirektorat/:id', requireAdmin, updateSubdirektorat);
router.delete('/subdirektorat/:id', requireAdmin, deleteSubdirektorat);

// =====================================================
// DIVISI ROUTES
// =====================================================

// Public routes (no admin required)
router.get('/divisi', getDivisi);
router.get('/divisi/:id', getDivisiById);

// Admin-only routes
router.post('/divisi', requireAdmin, createDivisi);
router.put('/divisi/:id', requireAdmin, updateDivisi);
router.delete('/divisi/:id', requireAdmin, deleteDivisi);

export default router;
