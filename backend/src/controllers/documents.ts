import { Request, Response } from 'express';
import { asyncHandler, handleDatabaseError } from '../middleware/errorHandler';
import { checkDocumentAccess } from '../middleware/auth';
import { cleanupUploadedFile, getFileUrl, getFileSizeInMB, getFileType, getMimeType } from '../middleware/upload';
import pool from '../config/database';
import { 
  Document, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentFilter, 
  DocumentResponse,
  DocumentStats,
  SearchRequest,
  SearchResponse
} from '../types';

// =====================================================
// DOCUMENT CONTROLLERS
// =====================================================

// Upload document
export const uploadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
      error: 'NO_FILE',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!req.user) {
    // Cleanup uploaded file
    cleanupUploadedFile(req.file.path);
    
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { 
    aspectId, 
    direktoratId, 
    subdirektoratId, 
    divisiId, 
    year, 
    assignedTo, 
    dueDate 
  } = req.body;

  const client = await pool.connect();
  try {
    // Insert document record
    const result = await client.query(
      `INSERT INTO documents (
        file_name, original_name, file_path, file_size, file_type, mime_type,
        aspect_id, direktorat_id, subdirektorat_id, divisi_id, year,
        status, assigned_to, uploaded_by, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.size,
        getFileType(req.file.originalname),
        getMimeType(req.file.originalname),
        aspectId || null,
        direktoratId || req.user.direktoratId || null,
        subdirektoratId || req.user.subdirektoratId || null,
        divisiId || req.user.divisiId || null,
        year,
        'pending',
        assignedTo || null,
        req.user.id,
        dueDate || null
      ]
    );

    const document = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        'upload',
        'document',
        document.id,
        JSON.stringify({
          fileName: req.file.originalname,
          fileSize: req.file.size,
          year: year
        }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    // Transform document to match interface
    const documentResponse: Document = {
      id: document.id,
      fileName: document.file_name,
      originalName: document.original_name,
      filePath: document.file_path,
      fileSize: document.file_size,
      fileType: document.file_type,
      mimeType: document.mime_type,
      aspectId: document.aspect_id,
      direktoratId: document.direktorat_id,
      subdirektoratId: document.subdirektorat_id,
      divisiId: document.divisi_id,
      year: document.year,
      status: document.status,
      assignedTo: document.assigned_to,
      uploadedBy: document.uploaded_by,
      dueDate: document.due_date,
      uploadedAt: document.uploaded_at,
      completedAt: document.completed_at,
      updatedAt: document.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: documentResponse,
        fileSize: getFileSizeInMB(req.file.size),
        downloadUrl: getFileUrl(req.file.path)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Cleanup uploaded file on error
    cleanupUploadedFile(req.file.path);
    
    console.error('Document upload error:', error);
    const appError = handleDatabaseError(error);
    res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      error: 'UPLOAD_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Get all documents with filtering and pagination
export const getDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    search,
    year,
    aspectId,
    direktoratId,
    subdirektoratId,
    divisiId,
    status,
    assignedTo,
    uploadedBy
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const client = await pool.connect();
  try {
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (d.original_name ILIKE $${paramCount} OR d.file_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (year) {
      paramCount++;
      whereClause += ` AND d.year = $${paramCount}`;
      params.push(parseInt(year as string));
    }

    if (aspectId) {
      paramCount++;
      whereClause += ` AND d.aspect_id = $${paramCount}`;
      params.push(aspectId);
    }

    if (direktoratId) {
      paramCount++;
      whereClause += ` AND d.direktorat_id = $${paramCount}`;
      params.push(direktoratId);
    }

    if (subdirektoratId) {
      paramCount++;
      whereClause += ` AND d.subdirektorat_id = $${paramCount}`;
      params.push(subdirektoratId);
    }

    if (divisiId) {
      paramCount++;
      whereClause += ` AND d.divisi_id = $${paramCount}`;
      params.push(divisiId);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND d.status = $${paramCount}`;
      params.push(status);
    }

    if (assignedTo) {
      paramCount++;
      whereClause += ` AND d.assigned_to = $${paramCount}`;
      params.push(assignedTo);
    }

    if (uploadedBy) {
      paramCount++;
      whereClause += ` AND d.uploaded_by = $${paramCount}`;
      params.push(uploadedBy);
    }

    // Add user access restrictions (unless super admin)
    if (req.user && req.user.role !== 'superadmin') {
      if (req.user.role === 'admin') {
        // Admin can see all documents in their direktorat
        if (req.user.direktoratId) {
          paramCount++;
          whereClause += ` AND d.direktorat_id = $${paramCount}`;
          params.push(req.user.direktoratId);
        }
      } else {
        // Regular user can only see their own documents or assigned documents
        paramCount++;
        whereClause += ` AND (d.uploaded_by = $${paramCount} OR d.assigned_to = $${paramCount})`;
        params.push(req.user.id);
      }
    }

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM documents d ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get documents with pagination
    paramCount++;
    paramCount++;
    const documentsResult = await client.query(
      `SELECT 
        d.*,
        u.name as uploader_name,
        a.nama as aspect_nama,
        dir.nama as direktorat_nama,
        sub.nama as subdirektorat_nama,
        div.nama as divisi_nama
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN aspects a ON d.aspect_id = a.id
       LEFT JOIN direktorat dir ON d.direktorat_id = dir.id
       LEFT JOIN subdirektorat sub ON d.subdirektorat_id = sub.id
       LEFT JOIN divisi div ON d.divisi_id = div.id
       ${whereClause}
       ORDER BY d.uploaded_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    // Transform documents
    const documents: Document[] = documentsResult.rows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      originalName: row.original_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      fileType: row.file_type,
      mimeType: row.mime_type,
      aspectId: row.aspect_id,
      direktoratId: row.direktorat_id,
      subdirektoratId: row.subdirektorat_id,
      divisiId: row.divisi_id,
      year: row.year,
      status: row.status,
      assignedTo: row.assigned_to,
      uploadedBy: row.uploaded_by,
      dueDate: row.due_date,
      uploadedAt: row.uploaded_at,
      completedAt: row.completed_at,
      updatedAt: row.updated_at
    }));

    const totalPages = Math.ceil(total / parseInt(limit as string));

    const response: DocumentResponse = {
      documents,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages
    };

    res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: 'RETRIEVAL_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Get document by ID
export const getDocumentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        d.*,
        u.name as uploader_name,
        a.nama as aspect_nama,
        dir.nama as direktorat_nama,
        sub.nama as subdirektorat_nama,
        div.nama as divisi_nama
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN aspects a ON d.aspect_id = a.id
       LEFT JOIN direktorat dir ON d.direktorat_id = dir.id
       LEFT JOIN subdirektorat sub ON d.subdirektorat_id = sub.id
       LEFT JOIN divisi div ON d.divisi_id = div.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const row = result.rows[0];
    const document: Document = {
      id: row.id,
      fileName: row.file_name,
      originalName: row.original_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      fileType: row.file_type,
      mimeType: row.mime_type,
      aspectId: row.aspect_id,
      direktoratId: row.direktorat_id,
      subdirektoratId: row.subdirektorat_id,
      divisiId: row.divisi_id,
      year: row.year,
      status: row.status,
      assignedTo: row.assigned_to,
      uploadedBy: row.uploaded_by,
      dueDate: row.due_date,
      uploadedAt: row.uploaded_at,
      completedAt: row.completed_at,
      updatedAt: row.updated_at
    };

    // Log document access
    if (req.user) {
      await client.query(
        `INSERT INTO document_access_logs (document_id, user_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, req.user.id, 'view', req.ip, req.get('User-Agent')]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Document retrieved successfully',
      data: {
        document,
        metadata: {
          uploaderName: row.uploader_name,
          aspectNama: row.aspect_nama,
          direktoratNama: row.direktorat_nama,
          subdirektoratNama: row.subdirektorat_nama,
          divisiNama: row.divisi_nama,
          fileSizeMB: getFileSizeInMB(row.file_size),
          downloadUrl: getFileUrl(row.file_path)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: 'RETRIEVAL_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Update document
export const updateDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData: UpdateDocumentRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if document exists
    const existingDoc = await client.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (existingDoc.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (updateData.aspectId !== undefined) {
      paramCount++;
      updateFields.push(`aspect_id = $${paramCount}`);
      params.push(updateData.aspectId);
    }

    if (updateData.direktoratId !== undefined) {
      paramCount++;
      updateFields.push(`direktorat_id = $${paramCount}`);
      params.push(updateData.direktoratId);
    }

    if (updateData.subdirektoratId !== undefined) {
      paramCount++;
      updateFields.push(`subdirektorat_id = $${paramCount}`);
      params.push(updateData.subdirektoratId);
    }

    if (updateData.divisiId !== undefined) {
      paramCount++;
      updateFields.push(`divisi_id = $${paramCount}`);
      params.push(updateData.divisiId);
    }

    if (updateData.year !== undefined) {
      paramCount++;
      updateFields.push(`year = $${paramCount}`);
      params.push(updateData.year);
    }

    if (updateData.assignedTo !== undefined) {
      paramCount++;
      updateFields.push(`assigned_to = $${paramCount}`);
      params.push(updateData.assignedTo);
    }

    if (updateData.status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      params.push(updateData.status);
    }

    if (updateData.dueDate !== undefined) {
      paramCount++;
      updateFields.push(`due_date = $${paramCount}`);
      params.push(updateData.dueDate);
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update',
        error: 'NO_UPDATE_FIELDS',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add updated_at and id to params
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE documents 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedDocument = result.rows[0];

    // Log activity
    if (req.user) {
      await client.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.id,
          'update',
          'document',
          id,
          JSON.stringify(updateData),
          req.ip,
          req.get('User-Agent')
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update document error:', error);
    const appError = handleDatabaseError(error);
    res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      error: 'UPDATE_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Delete document
export const deleteDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if document exists
    const existingDoc = await client.query(
      'SELECT file_path FROM documents WHERE id = $1',
      [id]
    );

    if (existingDoc.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const filePath = existingDoc.rows[0].file_path;

    // Delete document record
    await client.query('DELETE FROM documents WHERE id = $1', [id]);

    // Delete physical file
    if (filePath) {
      cleanupUploadedFile(filePath);
    }

    // Log activity
    if (req.user) {
      await client.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.id,
          'delete',
          'document',
          id,
          JSON.stringify({ filePath }),
          req.ip,
          req.get('User-Agent')
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: 'DELETE_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Download document
export const downloadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT file_path, original_name, mime_type FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { file_path, original_name, mime_type } = result.rows[0];

    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(file_path)) {
      res.status(404).json({
        success: false,
        message: 'File not found on disk',
        error: 'FILE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Log download activity
    if (req.user) {
      await client.query(
        `INSERT INTO document_access_logs (document_id, user_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, req.user.id, 'download', req.ip, req.get('User-Agent')]
      );
    }

    // Set headers and send file
    res.setHeader('Content-Type', mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${original_name}"`);
    
    const fileStream = fs.createReadStream(file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: 'DOWNLOAD_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Search documents
export const searchDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { query, filters, page = 1, limit = 10, sortBy = 'uploaded_at', sortOrder = 'desc' }: SearchRequest = req.body;

  if (!query || query.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Search query is required',
      error: 'MISSING_QUERY',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
  
  const client = await pool.connect();
  try {
    // Build search query using full-text search
    let searchQuery = `
      SELECT 
        d.*,
        u.name as uploader_name,
        a.nama as aspect_nama,
        dir.nama as direktorat_nama,
        sub.nama as subdirektorat_nama,
        div.nama as divisi_nama,
        ts_rank(to_tsvector('indonesian', d.file_name || ' ' || COALESCE(d.original_name, '')), plainto_tsquery('indonesian', $1)) as rank
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN aspects a ON d.aspect_id = a.id
      LEFT JOIN direktorat dir ON d.direktorat_id = dir.id
      LEFT JOIN subdirektorat sub ON d.subdirektorat_id = sub.id
      LEFT JOIN divisi div ON d.divisi_id = div.id
      WHERE to_tsvector('indonesian', d.file_name || ' ' || COALESCE(d.original_name, '')) @@ plainto_tsquery('indonesian', $1)
    `;

    const params: any[] = [query];
    let paramCount = 1;

    // Add filters
    if (filters) {
      if (filters.year) {
        paramCount++;
        searchQuery += ` AND d.year = $${paramCount}`;
        params.push(filters.year);
      }

      if (filters.aspectId) {
        paramCount++;
        searchQuery += ` AND d.aspect_id = $${paramCount}`;
        params.push(filters.aspectId);
      }

      if (filters.status) {
        paramCount++;
        searchQuery += ` AND d.status = $${paramCount}`;
        params.push(filters.status);
      }
    }

    // Add user access restrictions
    if (req.user && req.user.role !== 'superadmin') {
      if (req.user.role === 'admin') {
        if (req.user.direktoratId) {
          paramCount++;
          searchQuery += ` AND d.direktorat_id = $${paramCount}`;
          params.push(req.user.direktoratId);
        }
      } else {
        paramCount++;
        searchQuery += ` AND (d.uploaded_by = $${paramCount} OR d.assigned_to = $${paramCount})`;
        params.push(req.user.id);
      }
    }

    // Get total count
    const countQuery = searchQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*/, '');
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    searchQuery += ` ORDER BY rank DESC, d.${sortBy} ${sortOrder.toUpperCase()}`;
    paramCount++;
    paramCount++;
    searchQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit.toString()), offset);

    const result = await client.query(searchQuery, params);

    // Transform results
    const results: Document[] = result.rows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      originalName: row.original_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      fileType: row.file_type,
      mimeType: row.mime_type,
      aspectId: row.aspect_id,
      direktoratId: row.direktorat_id,
      subdirektoratId: row.subdirektorat_id,
      divisiId: row.divisi_id,
      year: row.year,
      status: row.status,
      assignedTo: row.assigned_to,
      uploadedBy: row.uploaded_by,
      dueDate: row.due_date,
      uploadedAt: row.uploaded_at,
      completedAt: row.completed_at,
      updatedAt: row.updated_at
    }));

    const totalPages = Math.ceil(total / parseInt(limit.toString()));

    const searchResponse: SearchResponse<Document> = {
      results,
      total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages,
      query,
      filters: filters || {}
    };

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: searchResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: 'SEARCH_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Get document statistics
export const getDocumentStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { year } = req.query;
  
  const client = await pool.connect();
  try {
    let yearFilter = '';
    const params: any[] = [];
    
    if (year) {
      yearFilter = 'WHERE year = $1';
      params.push(parseInt(year as string));
    }

    // Get statistics by status
    const statusStats = await client.query(
      `SELECT status, COUNT(*) as count FROM documents ${yearFilter} GROUP BY status`,
      params
    );

    // Get statistics by aspect
    const aspectStats = await client.query(
      `SELECT a.nama, COUNT(*) as count 
       FROM documents d 
       LEFT JOIN aspects a ON d.aspect_id = a.id 
       ${yearFilter} 
       GROUP BY a.nama, a.id 
       ORDER BY count DESC`,
      params
    );

    // Get statistics by direktorat
    const direktoratStats = await client.query(
      `SELECT dir.nama, COUNT(*) as count 
       FROM documents d 
       LEFT JOIN direktorat dir ON d.direktorat_id = dir.id 
       ${yearFilter} 
       GROUP BY dir.nama, dir.id 
       ORDER BY count DESC`,
      params
    );

    // Get statistics by year
    const yearStats = await client.query(
      'SELECT year, COUNT(*) as count FROM documents GROUP BY year ORDER BY year DESC'
    );

    // Get upload trend (last 30 days)
    const trendStats = await client.query(
      `SELECT DATE(uploaded_at) as date, COUNT(*) as count 
       FROM documents 
       WHERE uploaded_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(uploaded_at) 
       ORDER BY date`
    );

    const stats: DocumentStats = {
      totalByStatus: Object.fromEntries(
        statusStats.rows.map(row => [row.status, parseInt(row.count)])
      ),
      totalByAspect: Object.fromEntries(
        aspectStats.rows.map(row => [row.nama, parseInt(row.count)])
      ),
      totalByDirektorat: Object.fromEntries(
        direktoratStats.rows.map(row => [row.nama, parseInt(row.count)])
      ),
      totalByYear: Object.fromEntries(
        yearStats.rows.map(row => [row.year, parseInt(row.count)])
      ),
      uploadTrend: trendStats.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: parseInt(row.count)
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Document statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document statistics',
      error: 'STATS_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});
