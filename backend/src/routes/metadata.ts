import { Router } from 'express';
import {
  // Aspects
  getAspects,
  getAspectById,
  createAspect,
  updateAspect,
  deleteAspect,
  // Klasifikasi
  getKlasifikasi,
  getKlasifikasiById,
  createKlasifikasi,
  updateKlasifikasi,
  deleteKlasifikasi,
  // Years
  getYears,
  getYearById,
  createYear,
  updateYear,
  deleteYear
} from '../controllers/metadata';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// =====================================================
// METADATA ROUTES
// =====================================================

// Apply authentication middleware to all routes
router.use(authMiddleware);

// =====================================================
// ASPECTS ROUTES
// =====================================================

// Public routes (no admin required)
router.get('/aspects', getAspects);
router.get('/aspects/:id', getAspectById);

// Admin-only routes
router.post('/aspects', requireAdmin, createAspect);
router.put('/aspects/:id', requireAdmin, updateAspect);
router.delete('/aspects/:id', requireAdmin, deleteAspect);

// =====================================================
// KLASIFIKASI ROUTES
// =====================================================

// Public routes (no admin required)
router.get('/klasifikasi', getKlasifikasi);
router.get('/klasifikasi/:id', getKlasifikasiById);

// Admin-only routes
router.post('/klasifikasi', requireAdmin, createKlasifikasi);
router.put('/klasifikasi/:id', requireAdmin, updateKlasifikasi);
router.delete('/klasifikasi/:id', requireAdmin, deleteKlasifikasi);

// =====================================================
// YEARS ROUTES
// =====================================================

// Public routes (no admin required)
router.get('/years', getYears);
router.get('/years/:id', getYearById);

// Admin-only routes
router.post('/years', requireAdmin, createYear);
router.put('/years/:id', requireAdmin, updateYear);
router.delete('/years/:id', requireAdmin, deleteYear);

export default router;
