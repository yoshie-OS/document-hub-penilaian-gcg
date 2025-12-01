import { Request, Response } from 'express';
import { asyncHandler, AppError, handleDatabaseError } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/auth';
import pool from '../config/database';
import {
  Direktorat,
  CreateDirektoratRequest,
  UpdateDirektoratRequest,
  Subdirektorat,
  CreateSubdirektoratRequest,
  UpdateSubdirektoratRequest,
  Divisi,
  CreateDivisiRequest,
  UpdateDivisiRequest
} from '../types';

// =====================================================
// DIREKTORAT CONTROLLERS
// =====================================================

// Get all direktorat
export const getDirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM direktorat ORDER BY nama ASC'
    );

    const direktorat: Direktorat[] = result.rows.map(row => ({
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Direktorat retrieved successfully',
      data: direktorat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get direktorat by ID
export const getDirektoratById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM direktorat WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Direktorat not found', 404, true);
    }

    const row = result.rows[0];
    const direktorat: Direktorat = {
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Direktorat retrieved successfully',
      data: direktorat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Create new direktorat (Admin only)
export const createDirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { nama, deskripsi }: CreateDirektoratRequest = req.body;

  if (!nama || nama.trim().length === 0) {
    throw new AppError('Direktorat name is required', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if direktorat name already exists
    const existingDirektorat = await client.query(
      'SELECT id FROM direktorat WHERE LOWER(nama) = LOWER($1)',
      [nama.trim()]
    );

    if (existingDirektorat.rows.length > 0) {
      throw new AppError('Direktorat with this name already exists', 409, true);
    }

    const result = await client.query(
      `INSERT INTO direktorat (nama, deskripsi)
       VALUES ($1, $2)
       RETURNING *`,
      [nama.trim(), deskripsi?.trim() || null]
    );

    const newDirektorat = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'direktorat',
        newDirektorat.id,
        JSON.stringify({ nama, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const direktorat: Direktorat = {
      id: newDirektorat.id,
      nama: newDirektorat.nama,
      deskripsi: newDirektorat.deskripsi,
      createdAt: newDirektorat.created_at,
      updatedAt: newDirektorat.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Direktorat created successfully',
      data: direktorat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update direktorat (Admin only)
export const updateDirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nama, deskripsi }: UpdateDirektoratRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if direktorat exists
    const existingDirektorat = await client.query(
      'SELECT * FROM direktorat WHERE id = $1',
      [id]
    );

    if (existingDirektorat.rows.length === 0) {
      throw new AppError('Direktorat not found', 404, true);
    }

    // Check if new name conflicts with existing direktorat
    if (nama && nama.trim().length > 0) {
      const nameConflict = await client.query(
        'SELECT id FROM direktorat WHERE LOWER(nama) = LOWER($1) AND id != $2',
        [nama.trim(), id]
      );

      if (nameConflict.rows.length > 0) {
        throw new AppError('Direktorat with this name already exists', 409, true);
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (nama !== undefined) {
      paramCount++;
      updateFields.push(`nama = $${paramCount}`);
      params.push(nama.trim());
    }

    if (deskripsi !== undefined) {
      paramCount++;
      updateFields.push(`deskripsi = $${paramCount}`);
      params.push(deskripsi?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, true);
    }

    // Add updated_at and id to params
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE direktorat
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedDirektorat = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'direktorat',
        id,
        JSON.stringify({ nama, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Direktorat updated successfully',
      data: updatedDirektorat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete direktorat (Admin only)
export const deleteDirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if direktorat exists
    const existingDirektorat = await client.query(
      'SELECT * FROM direktorat WHERE id = $1',
      [id]
    );

    if (existingDirektorat.rows.length === 0) {
      throw new AppError('Direktorat not found', 404, true);
    }

    // Check if direktorat is used in subdirektorat
    const subdirektoratResult = await client.query(
      'SELECT COUNT(*) FROM subdirektorat WHERE direktorat_id = $1',
      [id]
    );

    if (parseInt(subdirektoratResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete direktorat that has subdirektorat', 400, true);
    }

    // Check if direktorat is used in users
    const usersResult = await client.query(
      'SELECT COUNT(*) FROM users WHERE direktorat_id = $1',
      [id]
    );

    if (parseInt(usersResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete direktorat that has users assigned', 400, true);
    }

    // Check if direktorat is used in documents
    const documentsResult = await client.query(
      'SELECT COUNT(*) FROM documents WHERE direktorat_id = $1',
      [id]
    );

    if (parseInt(documentsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete direktorat that is used in documents', 400, true);
    }

    // Delete direktorat
    await client.query('DELETE FROM direktorat WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'direktorat',
        id,
        JSON.stringify({ deletedDirektorat: existingDirektorat.rows[0].nama }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Direktorat deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// =====================================================
// SUBDIREKTORAT CONTROLLERS
// =====================================================

// Get all subdirektorat
export const getSubdirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { direktoratId } = req.query;

  const client = await pool.connect();
  try {
    let query = `
      SELECT s.*, d.nama as direktorat_nama
      FROM subdirektorat s
      LEFT JOIN direktorat d ON s.direktorat_id = d.id
    `;
    const params: any[] = [];

    if (direktoratId) {
      query += ' WHERE s.direktorat_id = $1';
      params.push(direktoratId);
    }

    query += ' ORDER BY s.nama ASC';

    const result = await client.query(query, params);

    const subdirektorat: Subdirektorat[] = result.rows.map(row => ({
      id: row.id,
      nama: row.nama,
      direktoratId: row.direktorat_id,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Subdirektorat retrieved successfully',
      data: {
        subdirektorat,
        metadata: direktoratId ? undefined : {
          totalByDirektorat: result.rows.reduce((acc: any, row) => {
            const dirName = row.direktorat_nama || 'Unassigned';
            acc[dirName] = (acc[dirName] || 0) + 1;
            return acc;
          }, {})
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get subdirektorat by ID
export const getSubdirektoratById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT s.*, d.nama as direktorat_nama
       FROM subdirektorat s
       LEFT JOIN direktorat d ON s.direktorat_id = d.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Subdirektorat not found', 404, true);
    }

    const row = result.rows[0];
    const subdirektorat: Subdirektorat = {
      id: row.id,
      nama: row.nama,
      direktoratId: row.direktorat_id,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Subdirektorat retrieved successfully',
      data: {
        subdirektorat,
        metadata: {
          direktoratNama: row.direktorat_nama
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Create new subdirektorat (Admin only)
export const createSubdirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { nama, direktoratId, deskripsi }: CreateSubdirektoratRequest = req.body;

  if (!nama || nama.trim().length === 0) {
    throw new AppError('Subdirektorat name is required', 400, true);
  }

  if (!direktoratId) {
    throw new AppError('Direktorat ID is required', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if direktorat exists
    const direktoratResult = await client.query(
      'SELECT id FROM direktorat WHERE id = $1',
      [direktoratId]
    );

    if (direktoratResult.rows.length === 0) {
      throw new AppError('Referenced direktorat not found', 400, true);
    }

    // Check if subdirektorat name already exists in the same direktorat
    const existingSubdirektorat = await client.query(
      'SELECT id FROM subdirektorat WHERE LOWER(nama) = LOWER($1) AND direktorat_id = $2',
      [nama.trim(), direktoratId]
    );

    if (existingSubdirektorat.rows.length > 0) {
      throw new AppError('Subdirektorat with this name already exists in the selected direktorat', 409, true);
    }

    const result = await client.query(
      `INSERT INTO subdirektorat (nama, direktorat_id, deskripsi)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nama.trim(), direktoratId, deskripsi?.trim() || null]
    );

    const newSubdirektorat = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'subdirektorat',
        newSubdirektorat.id,
        JSON.stringify({ nama, direktoratId, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const subdirektorat: Subdirektorat = {
      id: newSubdirektorat.id,
      nama: newSubdirektorat.nama,
      direktoratId: newSubdirektorat.direktorat_id,
      deskripsi: newSubdirektorat.deskripsi,
      createdAt: newSubdirektorat.created_at,
      updatedAt: newSubdirektorat.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Subdirektorat created successfully',
      data: subdirektorat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update subdirektorat (Admin only)
export const updateSubdirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nama, direktoratId, deskripsi }: UpdateSubdirektoratRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if subdirektorat exists
    const existingSubdirektorat = await client.query(
      'SELECT * FROM subdirektorat WHERE id = $1',
      [id]
    );

    if (existingSubdirektorat.rows.length === 0) {
      throw new AppError('Subdirektorat not found', 404, true);
    }

    // Check if new direktorat exists if provided
    if (direktoratId) {
      const direktoratResult = await client.query(
        'SELECT id FROM direktorat WHERE id = $1',
        [direktoratId]
      );

      if (direktoratResult.rows.length === 0) {
        throw new AppError('Referenced direktorat not found', 400, true);
      }
    }

    // Check if new name conflicts with existing subdirektorat in the same direktorat
    if (nama && nama.trim().length > 0) {
      const targetDirektoratId = direktoratId || existingSubdirektorat.rows[0].direktorat_id;
      const nameConflict = await client.query(
        'SELECT id FROM subdirektorat WHERE LOWER(nama) = LOWER($1) AND direktorat_id = $2 AND id != $3',
        [nama.trim(), targetDirektoratId, id]
      );

      if (nameConflict.rows.length > 0) {
        throw new AppError('Subdirektorat with this name already exists in the selected direktorat', 409, true);
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (nama !== undefined) {
      paramCount++;
      updateFields.push(`nama = $${paramCount}`);
      params.push(nama.trim());
    }

    if (direktoratId !== undefined) {
      paramCount++;
      updateFields.push(`direktorat_id = $${paramCount}`);
      params.push(direktoratId);
    }

    if (deskripsi !== undefined) {
      paramCount++;
      updateFields.push(`deskripsi = $${paramCount}`);
      params.push(deskripsi?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, true);
    }

    // Add updated_at and id to params
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE subdirektorat
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedSubdirektorat = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'subdirektorat',
        id,
        JSON.stringify({ nama, direktoratId, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Subdirektorat updated successfully',
      data: updatedSubdirektorat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete subdirektorat (Admin only)
export const deleteSubdirektorat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if subdirektorat exists
    const existingSubdirektorat = await client.query(
      'SELECT * FROM subdirektorat WHERE id = $1',
      [id]
    );

    if (existingSubdirektorat.rows.length === 0) {
      throw new AppError('Subdirektorat not found', 404, true);
    }

    // Check if subdirektorat is used in divisi
    const divisiResult = await client.query(
      'SELECT COUNT(*) FROM divisi WHERE subdirektorat_id = $1',
      [id]
    );

    if (parseInt(divisiResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete subdirektorat that has divisi', 400, true);
    }

    // Check if subdirektorat is used in users
    const usersResult = await client.query(
      'SELECT COUNT(*) FROM users WHERE subdirektorat_id = $1',
      [id]
    );

    if (parseInt(usersResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete subdirektorat that has users assigned', 400, true);
    }

    // Check if subdirektorat is used in documents
    const documentsResult = await client.query(
      'SELECT COUNT(*) FROM documents WHERE subdirektorat_id = $1',
      [id]
    );

    if (parseInt(documentsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete subdirektorat that is used in documents', 400, true);
    }

    // Delete subdirektorat
    await client.query('DELETE FROM subdirektorat WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'subdirektorat',
        id,
        JSON.stringify({ deletedSubdirektorat: existingSubdirektorat.rows[0].nama }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Subdirektorat deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// =====================================================
// DIVISI CONTROLLERS
// =====================================================

// Get all divisi
export const getDivisi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subdirektoratId, direktoratId } = req.query;

  const client = await pool.connect();
  try {
    let query = `
      SELECT d.*, sd.nama as subdirektorat_nama, dir.nama as direktorat_nama
      FROM divisi d
      LEFT JOIN subdirektorat sd ON d.subdirektorat_id = sd.id
      LEFT JOIN direktorat dir ON sd.direktorat_id = dir.id
    `;
    const params: any[] = [];
    let whereConditions: string[] = [];

    if (subdirektoratId) {
      params.push(subdirektoratId);
      whereConditions.push(`d.subdirektorat_id = $${params.length}`);
    }

    if (direktoratId) {
      params.push(direktoratId);
      whereConditions.push(`sd.direktorat_id = $${params.length}`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ' ORDER BY d.nama ASC';

    const result = await client.query(query, params);

    const divisi: Divisi[] = result.rows.map(row => ({
      id: row.id,
      nama: row.nama,
      subdirektoratId: row.subdirektorat_id,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Divisi retrieved successfully',
      data: {
        divisi,
        metadata: {
          totalBySubdirektorat: result.rows.reduce((acc: any, row) => {
            const subDirName = row.subdirektorat_nama || 'Unassigned';
            acc[subDirName] = (acc[subDirName] || 0) + 1;
            return acc;
          }, {}),
          totalByDirektorat: result.rows.reduce((acc: any, row) => {
            const dirName = row.direktorat_nama || 'Unassigned';
            acc[dirName] = (acc[dirName] || 0) + 1;
            return acc;
          }, {})
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get divisi by ID
export const getDivisiById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT d.*, sd.nama as subdirektorat_nama, dir.nama as direktorat_nama
       FROM divisi d
       LEFT JOIN subdirektorat sd ON d.subdirektorat_id = sd.id
       LEFT JOIN direktorat dir ON sd.direktorat_id = dir.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Divisi not found', 404, true);
    }

    const row = result.rows[0];
    const divisi: Divisi = {
      id: row.id,
      nama: row.nama,
      subdirektoratId: row.subdirektorat_id,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Divisi retrieved successfully',
      data: {
        divisi,
        metadata: {
          subdirektoratNama: row.subdirektorat_nama,
          direktoratNama: row.direktorat_nama
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Create new divisi (Admin only)
export const createDivisi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { nama, subdirektoratId, deskripsi }: CreateDivisiRequest = req.body;

  if (!nama || nama.trim().length === 0) {
    throw new AppError('Divisi name is required', 400, true);
  }

  if (!subdirektoratId) {
    throw new AppError('Subdirektorat ID is required', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if subdirektorat exists
    const subdirektoratResult = await client.query(
      'SELECT id FROM subdirektorat WHERE id = $1',
      [subdirektoratId]
    );

    if (subdirektoratResult.rows.length === 0) {
      throw new AppError('Referenced subdirektorat not found', 400, true);
    }

    // Check if divisi name already exists in the same subdirektorat
    const existingDivisi = await client.query(
      'SELECT id FROM divisi WHERE LOWER(nama) = LOWER($1) AND subdirektorat_id = $2',
      [nama.trim(), subdirektoratId]
    );

    if (existingDivisi.rows.length > 0) {
      throw new AppError('Divisi with this name already exists in the selected subdirektorat', 409, true);
    }

    const result = await client.query(
      `INSERT INTO divisi (nama, subdirektorat_id, deskripsi)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nama.trim(), subdirektoratId, deskripsi?.trim() || null]
    );

    const newDivisi = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'divisi',
        newDivisi.id,
        JSON.stringify({ nama, subdirektoratId, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const divisi: Divisi = {
      id: newDivisi.id,
      nama: newDivisi.nama,
      subdirektoratId: newDivisi.subdirektorat_id,
      deskripsi: newDivisi.deskripsi,
      createdAt: newDivisi.created_at,
      updatedAt: newDivisi.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Divisi created successfully',
      data: divisi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update divisi (Admin only)
export const updateDivisi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nama, subdirektoratId, deskripsi }: UpdateDivisiRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if divisi exists
    const existingDivisi = await client.query(
      'SELECT * FROM divisi WHERE id = $1',
      [id]
    );

    if (existingDivisi.rows.length === 0) {
      throw new AppError('Divisi not found', 404, true);
    }

    // Check if new subdirektorat exists if provided
    if (subdirektoratId) {
      const subdirektoratResult = await client.query(
        'SELECT id FROM subdirektorat WHERE id = $1',
        [subdirektoratId]
      );

      if (subdirektoratResult.rows.length === 0) {
        throw new AppError('Referenced subdirektorat not found', 400, true);
      }
    }

    // Check if new name conflicts with existing divisi in the same subdirektorat
    if (nama && nama.trim().length > 0) {
      const targetSubdirektoratId = subdirektoratId || existingDivisi.rows[0].subdirektorat_id;
      const nameConflict = await client.query(
        'SELECT id FROM divisi WHERE LOWER(nama) = LOWER($1) AND subdirektorat_id = $2 AND id != $3',
        [nama.trim(), targetSubdirektoratId, id]
      );

      if (nameConflict.rows.length > 0) {
        throw new AppError('Divisi with this name already exists in the selected subdirektorat', 409, true);
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (nama !== undefined) {
      paramCount++;
      updateFields.push(`nama = $${paramCount}`);
      params.push(nama.trim());
    }

    if (subdirektoratId !== undefined) {
      paramCount++;
      updateFields.push(`subdirektorat_id = $${paramCount}`);
      params.push(subdirektoratId);
    }

    if (deskripsi !== undefined) {
      paramCount++;
      updateFields.push(`deskripsi = $${paramCount}`);
      params.push(deskripsi?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, true);
    }

    // Add updated_at and id to params
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE divisi
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedDivisi = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'divisi',
        id,
        JSON.stringify({ nama, subdirektoratId, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Divisi updated successfully',
      data: updatedDivisi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete divisi (Admin only)
export const deleteDivisi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if divisi exists
    const existingDivisi = await client.query(
      'SELECT * FROM divisi WHERE id = $1',
      [id]
    );

    if (existingDivisi.rows.length === 0) {
      throw new AppError('Divisi not found', 404, true);
    }

    // Check if divisi is used in users
    const usersResult = await client.query(
      'SELECT COUNT(*) FROM users WHERE divisi_id = $1',
      [id]
    );

    if (parseInt(usersResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete divisi that has users assigned', 400, true);
    }

    // Check if divisi is used in documents
    const documentsResult = await client.query(
      'SELECT COUNT(*) FROM documents WHERE divisi_id = $1',
      [id]
    );

    if (parseInt(documentsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete divisi that is used in documents', 400, true);
    }

    // Delete divisi
    await client.query('DELETE FROM divisi WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'divisi',
        id,
        JSON.stringify({ deletedDivisi: existingDivisi.rows[0].nama }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Divisi deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});
