import { Request, Response } from 'express';
import { asyncHandler, AppError, handleDatabaseError } from '../middleware/errorHandler';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { hashPassword } from '../utils/jwt';
import pool from '../config/database';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse
} from '../types';

// =====================================================
// USERS CONTROLLERS
// =====================================================

// Get all users with pagination and filtering
export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    direktoratId,
    subdirektoratId,
    divisiId,
    isActive
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
      whereClause += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      whereClause += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (direktoratId) {
      paramCount++;
      whereClause += ` AND u.direktorat_id = $${paramCount}`;
      params.push(direktoratId);
    }

    if (subdirektoratId) {
      paramCount++;
      whereClause += ` AND u.subdirektorat_id = $${paramCount}`;
      params.push(subdirektoratId);
    }

    if (divisiId) {
      paramCount++;
      whereClause += ` AND u.divisi_id = $${paramCount}`;
      params.push(divisiId);
    }

    if (isActive !== undefined) {
      paramCount++;
      whereClause += ` AND u.is_active = $${paramCount}`;
      params.push(isActive === 'true');
    }

    // Add user access restrictions (unless super admin)
    if (req.user && req.user.role !== 'superadmin') {
      if (req.user.role === 'admin') {
        // Admin can only see users in their direktorat
        if (req.user.direktoratId) {
          paramCount++;
          whereClause += ` AND u.direktorat_id = $${paramCount}`;
          params.push(req.user.direktoratId);
        }
      } else {
        // Regular users can only see themselves
        paramCount++;
        whereClause += ` AND u.id = $${paramCount}`;
        params.push(req.user.id);
      }
    }

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users with pagination
    paramCount++;
    paramCount++;
    const usersResult = await client.query(
      `SELECT
         u.id, u.email, u.name, u.role, u.is_active, u.last_login, u.created_at, u.updated_at,
         u.direktorat_id, u.subdirektorat_id, u.divisi_id,
         d.nama as direktorat_nama,
         sd.nama as subdirektorat_nama,
         div.nama as divisi_nama
       FROM users u
       LEFT JOIN direktorat d ON u.direktorat_id = d.id
       LEFT JOIN subdirektorat sd ON u.subdirektorat_id = sd.id
       LEFT JOIN divisi div ON u.divisi_id = div.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    // Transform users
    const users: User[] = usersResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      direktoratId: row.direktorat_id,
      subdirektoratId: row.subdirektorat_id,
      divisiId: row.divisi_id,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const totalPages = Math.ceil(total / parseInt(limit as string));

    const response: PaginatedResponse<User> = {
      data: users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages
      }
    };

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         u.id, u.email, u.name, u.role, u.is_active, u.last_login, u.created_at, u.updated_at,
         u.direktorat_id, u.subdirektorat_id, u.divisi_id,
         d.nama as direktorat_nama,
         sd.nama as subdirektorat_nama,
         div.nama as divisi_nama
       FROM users u
       LEFT JOIN direktorat d ON u.direktorat_id = d.id
       LEFT JOIN subdirektorat sd ON u.subdirektorat_id = sd.id
       LEFT JOIN divisi div ON u.divisi_id = div.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, true);
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      direktoratId: row.direktorat_id,
      subdirektoratId: row.subdirektorat_id,
      divisiId: row.divisi_id,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user,
        metadata: {
          direktoratNama: row.direktorat_nama,
          subdirektoratNama: row.subdirektorat_nama,
          divisiNama: row.divisi_nama
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

// Create new user (Admin only)
export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, direktoratId, subdirektoratId, divisiId }: CreateUserRequest = req.body;

  // Validate required fields
  if (!email || !password || !name || !role) {
    throw new AppError('Email, password, name, and role are required', 400, true);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400, true);
  }

  // Validate password strength
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400, true);
  }

  // Validate role
  const validRoles = ['admin', 'user'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role. Must be one of: admin, user', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 409, true);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, role, direktorat_id, subdirektorat_id, divisi_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role, direktorat_id, subdirektorat_id, divisi_id, is_active, created_at, updated_at`,
      [email, hashedPassword, name, role, direktoratId, subdirektoratId, divisiId]
    );

    const newUser = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'create',
        'user',
        newUser.id,
        JSON.stringify({ email, name, role }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    const user: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      direktoratId: newUser.direktorat_id,
      subdirektoratId: newUser.subdirektorat_id,
      divisiId: newUser.divisi_id,
      isActive: newUser.is_active,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData: UpdateUserRequest = req.body;

  const client = await pool.connect();
  try {
    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      throw new AppError('User not found', 404, true);
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (updateData.name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      params.push(updateData.name);
    }

    if (updateData.role !== undefined) {
      // Only superadmin can change roles
      if (req.user!.role !== 'superadmin') {
        throw new AppError('Insufficient permissions to change user role', 403, true);
      }
      paramCount++;
      updateFields.push(`role = $${paramCount}`);
      params.push(updateData.role);
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

    if (updateData.isActive !== undefined) {
      // Only superadmin can deactivate users
      if (updateData.isActive === false && req.user!.role !== 'superadmin') {
        throw new AppError('Insufficient permissions to deactivate users', 403, true);
      }
      paramCount++;
      updateFields.push(`is_active = $${paramCount}`);
      params.push(updateData.isActive);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, true);
    }

    // Add updated_at and id to params
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, params);
    const updatedUser = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'update',
        'user',
        id,
        JSON.stringify(updateData),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Delete user (Superadmin only)
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      throw new AppError('User not found', 404, true);
    }

    const userToDelete = existingUser.rows[0];

    // Prevent self-deletion
    if (userToDelete.id === req.user!.id) {
      throw new AppError('Cannot delete your own account', 400, true);
    }

    // Prevent deletion of superadmin accounts
    if (userToDelete.role === 'superadmin') {
      throw new AppError('Cannot delete superadmin accounts', 403, true);
    }

    // Check if user has uploaded documents
    const documentsResult = await client.query(
      'SELECT COUNT(*) FROM documents WHERE uploaded_by = $1',
      [id]
    );

    if (parseInt(documentsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete user with uploaded documents. Consider deactivating instead.', 400, true);
    }

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        'delete',
        'user',
        id,
        JSON.stringify({ deletedUser: userToDelete.email }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Deactivate/Reactivate user
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean value', 400, true);
  }

  const client = await pool.connect();
  try {
    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      throw new AppError('User not found', 404, true);
    }

    const userToToggle = existingUser.rows[0];

    // Prevent self-deactivation
    if (userToToggle.id === req.user!.id) {
      throw new AppError('Cannot deactivate your own account', 400, true);
    }

    // Prevent deactivation of superadmin accounts
    if (userToToggle.role === 'superadmin' && !isActive) {
      throw new AppError('Cannot deactivate superadmin accounts', 403, true);
    }

    // Update user status
    const result = await client.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isActive, id]
    );

    const updatedUser = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user!.id,
        isActive ? 'reactivate' : 'deactivate',
        'user',
        id,
        JSON.stringify({ previousStatus: userToToggle.is_active, newStatus: isActive }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'reactivated' : 'deactivated'} successfully`,
      data: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get user statistics
export const getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    // Get total users by role
    const roleStats = await client.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // Get total users by status
    const statusStats = await client.query(
      'SELECT is_active, COUNT(*) as count FROM users GROUP BY is_active'
    );

    // Get users by direktorat
    const direktoratStats = await client.query(
      `SELECT d.nama, COUNT(*) as count
       FROM users u
       LEFT JOIN direktorat d ON u.direktorat_id = d.id
       GROUP BY d.nama, d.id
       ORDER BY count DESC`
    );

    // Get recent registrations (last 30 days)
    const recentStats = await client.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    const stats = {
      totalByRole: Object.fromEntries(
        roleStats.rows.map(row => [row.role, parseInt(row.count)])
      ),
      totalByStatus: Object.fromEntries(
        statusStats.rows.map(row => [row.is_active ? 'active' : 'inactive', parseInt(row.count)])
      ),
      totalByDirektorat: Object.fromEntries(
        direktoratStats.rows.map(row => [row.nama, parseInt(row.count)])
      ),
      recentRegistrations: recentStats.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: parseInt(row.count)
      }))
    };

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});
