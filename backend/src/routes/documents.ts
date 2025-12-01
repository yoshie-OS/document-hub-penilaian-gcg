import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocument,
  searchDocuments,
  getDocumentStats
} from '../controllers/documents';
import { authMiddleware, checkDocumentAccess, requireAdmin } from '../middleware/auth';
import { uploadSingle, validateFileUpload } from '../middleware/upload';

const router = Router();

// =====================================================
// DOCUMENT MANAGEMENT ROUTES
// =====================================================

// Apply authentication middleware to all routes
router.use(authMiddleware);

// File upload route (with file validation)
router.post('/upload', uploadSingle, validateFileUpload, uploadDocument);

// Get all documents with filtering and pagination
router.get('/', getDocuments);

// Get document statistics
router.get('/stats', getDocumentStats);

// Search documents
router.post('/search', searchDocuments);

// Get document by ID
router.get('/:id', checkDocumentAccess, getDocumentById);

// Update document
router.put('/:id', checkDocumentAccess, updateDocument);

// Delete document (admin only)
router.delete('/:id', requireAdmin, checkDocumentAccess, deleteDocument);

// Download document
router.get('/:id/download', checkDocumentAccess, downloadDocument);

export default router;
