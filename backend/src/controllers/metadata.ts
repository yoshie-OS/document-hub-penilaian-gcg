import { Request, Response } from 'express';
import { asyncHandler, AppError, handleDatabaseError } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/auth';
import pool from '../config/database';
import {
  Aspect,
  CreateAspectRequest,
  UpdateAspectRequest,
  Klasifikasi,
  CreateKlasifikasiRequest,
  UpdateKlasifikasiRequest,
  Year,
  CreateYearRequest,
  UpdateYearRequest
} from '../types';

// =====================================================
// ASPECTS CONTROLLERS
// =====================================================

// Get all aspects
export const getAspects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM aspects ORDER BY nama ASC'
    );

    const aspects: Aspect[] = result.rows.map(row => ({
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Aspects retrieved successfully',
      data: aspects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get aspect by ID
export const getAspectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM aspects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Aspect not found', 404, true);
    }

    const row = result.rows[0];
    const aspect: Aspect = {
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Aspect retrieved successfully',
      data: aspect,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Create new aspect (Admin only)
export const createAspect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { nama, deskripsi }: CreateAspectRequest = req.body;

  if (!nama || nama.trim().length === 0) {
    throw new AppError('Aspect name is required', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if aspect name already exists
    const existingAspect = await client.query(
      'SELECT id FROM aspects WHERE LOWER(nama) = LOWER($1)',
      [nama.trim()]
    );

    if (existingAspect.rows.length > 0) {
      throw new AppError('Aspect with this name already exists', 409, true);
    }

    const result = await client.query(
      `INSERT INTO aspects (nama, deskripsi)
       VALUES ($1, $2)
       RETURNING *`,
      [nama.trim(), deskripsi?.trim() || null]
    );

    const newAspect = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'aspect',
        newAspect.id,
        JSON.stringify({ nama, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const aspect: Aspect = {
      id: newAspect.id,
      nama: newAspect.nama,
      deskripsi: newAspect.deskripsi,
      createdAt: newAspect.created_at,
      updatedAt: newAspect.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Aspect created successfully',
      data: aspect,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update aspect (Admin only)
export const updateAspect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nama, deskripsi }: UpdateAspectRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if aspect exists
    const existingAspect = await client.query(
      'SELECT * FROM aspects WHERE id = $1',
      [id]
    );

    if (existingAspect.rows.length === 0) {
      throw new AppError('Aspect not found', 404, true);
    }

    // Check if new name conflicts with existing aspects
    if (nama && nama.trim().length > 0) {
      const nameConflict = await client.query(
        'SELECT id FROM aspects WHERE LOWER(nama) = LOWER($1) AND id != $2',
        [nama.trim(), id]
      );

      if (nameConflict.rows.length > 0) {
        throw new AppError('Aspect with this name already exists', 409, true);
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
      UPDATE aspects
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedAspect = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'aspect',
        id,
        JSON.stringify({ nama, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Aspect updated successfully',
      data: updatedAspect,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete aspect (Admin only)
export const deleteAspect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if aspect exists
    const existingAspect = await client.query(
      'SELECT * FROM aspects WHERE id = $1',
      [id]
    );

    if (existingAspect.rows.length === 0) {
      throw new AppError('Aspect not found', 404, true);
    }

    // Check if aspect is used in documents
    const documentsResult = await client.query(
      'SELECT COUNT(*) FROM documents WHERE aspect_id = $1',
      [id]
    );

    if (parseInt(documentsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete aspect that is used in documents', 400, true);
    }

    // Delete aspect
    await client.query('DELETE FROM aspects WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'aspect',
        id,
        JSON.stringify({ deletedAspect: existingAspect.rows[0].nama }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Aspect deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// =====================================================
// KLASIFIKASI CONTROLLERS
// =====================================================

// Get all klasifikasi
export const getKlasifikasi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM klasifikasi ORDER BY nama ASC'
    );

    const klasifikasi: Klasifikasi[] = result.rows.map(row => ({
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Klasifikasi retrieved successfully',
      data: klasifikasi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get klasifikasi by ID
export const getKlasifikasiById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM klasifikasi WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Klasifikasi not found', 404, true);
    }

    const row = result.rows[0];
    const klasifikasi: Klasifikasi = {
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Klasifikasi retrieved successfully',
      data: klasifikasi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Create new klasifikasi (Admin only)
export const createKlasifikasi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { nama, deskripsi }: CreateKlasifikasiRequest = req.body;

  if (!nama || nama.trim().length === 0) {
    throw new AppError('Klasifikasi name is required', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if klasifikasi name already exists
    const existingKlasifikasi = await client.query(
      'SELECT id FROM klasifikasi WHERE LOWER(nama) = LOWER($1)',
      [nama.trim()]
    );

    if (existingKlasifikasi.rows.length > 0) {
      throw new AppError('Klasifikasi with this name already exists', 409, true);
    }

    const result = await client.query(
      `INSERT INTO klasifikasi (nama, deskripsi)
       VALUES ($1, $2)
       RETURNING *`,
      [nama.trim(), deskripsi?.trim() || null]
    );

    const newKlasifikasi = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'klasifikasi',
        newKlasifikasi.id,
        JSON.stringify({ nama, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const klasifikasi: Klasifikasi = {
      id: newKlasifikasi.id,
      nama: newKlasifikasi.nama,
      deskripsi: newKlasifikasi.deskripsi,
      createdAt: newKlasifikasi.created_at,
      updatedAt: newKlasifikasi.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Klasifikasi created successfully',
      data: klasifikasi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update klasifikasi (Admin only)
export const updateKlasifikasi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nama, deskripsi }: UpdateKlasifikasiRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if klasifikasi exists
    const existingKlasifikasi = await client.query(
      'SELECT * FROM klasifikasi WHERE id = $1',
      [id]
    );

    if (existingKlasifikasi.rows.length === 0) {
      throw new AppError('Klasifikasi not found', 404, true);
    }

    // Check if new name conflicts with existing klasifikasi
    if (nama && nama.trim().length > 0) {
      const nameConflict = await client.query(
        'SELECT id FROM klasifikasi WHERE LOWER(nama) = LOWER($1) AND id != $2',
        [nama.trim(), id]
      );

      if (nameConflict.rows.length > 0) {
        throw new AppError('Klasifikasi with this name already exists', 409, true);
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
      UPDATE klasifikasi
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedKlasifikasi = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'klasifikasi',
        id,
        JSON.stringify({ nama, deskripsi }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Klasifikasi updated successfully',
      data: updatedKlasifikasi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete klasifikasi (Admin only)
export const deleteKlasifikasi = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if klasifikasi exists
    const existingKlasifikasi = await client.query(
      'SELECT * FROM klasifikasi WHERE id = $1',
      [id]
    );

    if (existingKlasifikasi.rows.length === 0) {
      throw new AppError('Klasifikasi not found', 404, true);
    }

    // Delete klasifikasi
    await client.query('DELETE FROM klasifikasi WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'klasifikasi',
        id,
        JSON.stringify({ deletedKlasifikasi: existingKlasifikasi.rows[0].nama }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Klasifikasi deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// =====================================================
// YEARS CONTROLLERS
// =====================================================

// Get all years
export const getYears = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM years ORDER BY tahun DESC'
    );

    const years: Year[] = result.rows.map(row => ({
      id: row.id,
      tahun: row.tahun,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.status(200).json({
      success: true,
      message: 'Years retrieved successfully',
      data: years,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get year by ID
export const getYearById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM years WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Year not found', 404, true);
    }

    const row = result.rows[0];
    const year: Year = {
      id: row.id,
      tahun: row.tahun,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Year retrieved successfully',
      data: year,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Create new year (Admin only)
export const createYear = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { tahun, isActive = false }: CreateYearRequest = req.body;

  if (!tahun || isNaN(tahun) || tahun < 2000 || tahun > 2100) {
    throw new AppError('Valid year between 2000-2100 is required', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if year already exists
    const existingYear = await client.query(
      'SELECT id FROM years WHERE tahun = $1',
      [tahun]
    );

    if (existingYear.rows.length > 0) {
      throw new AppError('Year already exists', 409, true);
    }

    // If setting as active, deactivate other years
    if (isActive) {
      await client.query(
        'UPDATE years SET is_active = false, updated_at = CURRENT_TIMESTAMP'
      );
    }

    const result = await client.query(
      `INSERT INTO years (tahun, is_active)
       VALUES ($1, $2)
       RETURNING *`,
      [tahun, isActive]
    );

    const newYear = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'year',
        newYear.id,
        JSON.stringify({ tahun, isActive }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const year: Year = {
      id: newYear.id,
      tahun: newYear.tahun,
      isActive: newYear.is_active,
      createdAt: newYear.created_at,
      updatedAt: newYear.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Year created successfully',
      data: year,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update year (Admin only)
export const updateYear = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { tahun, isActive }: UpdateYearRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if year exists
    const existingYear = await client.query(
      'SELECT * FROM years WHERE id = $1',
      [id]
    );

    if (existingYear.rows.length === 0) {
      throw new AppError('Year not found', 404, true);
    }

    // Validate year if provided
    if (tahun !== undefined && (isNaN(tahun) || tahun < 2000 || tahun > 2100)) {
      throw new AppError('Valid year between 2000-2100 is required', 400, true);
    }

    // Check if new year conflicts with existing years
    if (tahun && tahun !== existingYear.rows[0].tahun) {
      const yearConflict = await client.query(
        'SELECT id FROM years WHERE tahun = $1 AND id != $2',
        [tahun, id]
      );

      if (yearConflict.rows.length > 0) {
        throw new AppError('Year already exists', 409, true);
      }
    }

    // If setting as active, deactivate other years
    if (isActive === true) {
      await client.query(
        'UPDATE years SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id != $1',
        [id]
      );
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (tahun !== undefined) {
      paramCount++;
      updateFields.push(`tahun = $${paramCount}`);
      params.push(tahun);
    }

    if (isActive !== undefined) {
      paramCount++;
      updateFields.push(`is_active = $${paramCount}`);
      params.push(isActive);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, true);
    }

    // Add updated_at and id to params
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE years
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedYear = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'year',
        id,
        JSON.stringify({ tahun, isActive }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Year updated successfully',
      data: updatedYear,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete year (Admin only)
export const deleteYear = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if year exists
    const existingYear = await client.query(
      'SELECT * FROM years WHERE id = $1',
      [id]
    );

    if (existingYear.rows.length === 0) {
      throw new AppError('Year not found', 404, true);
    }

    // Check if year is used in documents
    const documentsResult = await client.query(
      'SELECT COUNT(*) FROM documents WHERE year = $1',
      [existingYear.rows[0].tahun]
    );

    if (parseInt(documentsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete year that is used in documents', 400, true);
    }

    // Delete year
    await client.query('DELETE FROM years WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'year',
        id,
        JSON.stringify({ deletedYear: existingYear.rows[0].tahun }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Year deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});
