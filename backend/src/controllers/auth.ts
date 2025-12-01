import { Request, Response } from 'express';
import { hashPassword, comparePassword, generateTokens } from '../utils/jwt';
import { asyncHandler } from '../middleware/errorHandler';
import { handleDatabaseError } from '../middleware/errorHandler';
import pool from '../config/database';
import { 
  CreateUserRequest, 
  LoginRequest, 
  RefreshTokenRequest,
  LoginResponse,
  User,
  ApiResponse 
} from '../types';

// =====================================================
// AUTHENTICATION CONTROLLERS
// =====================================================

// Register new user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, direktoratId, subdirektoratId, divisiId }: CreateUserRequest = req.body;

  // Validate required fields
  if (!email || !password || !name || !role) {
    res.status(400).json({
      success: false,
      message: 'Email, password, name, and role are required',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Invalid email format',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validate password strength
  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validate role
  const validRoles = ['superadmin', 'admin', 'user'];
  if (!validRoles.includes(role)) {
    res.status(400).json({
      success: false,
      message: 'Invalid role. Must be one of: superadmin, admin, user',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const client = await pool.connect();
  try {
    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Email already registered',
        error: 'DUPLICATE_EMAIL',
        timestamp: new Date().toISOString()
      });
      return;
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

    // Generate tokens
    const tokens = generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      direktoratId: newUser.direktorat_id,
      subdirektoratId: newUser.subdirektorat_id,
      divisiId: newUser.divisi_id
    });

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

    const response: LoginResponse = {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registration error:', error);
    const appError = handleDatabaseError(error);
    res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      error: 'REGISTRATION_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginRequest = req.body;

  // Validate required fields
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const client = await pool.connect();
  try {
    // Find user by email
    const result = await client.query(
      `SELECT id, email, password_hash, name, role, direktorat_id, subdirektorat_id, divisi_id, is_active, last_login, created_at, updated_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update last login
    await client.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      direktoratId: user.direktorat_id,
      subdirektoratId: user.subdirektorat_id,
      divisiId: user.divisi_id
    });

    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      direktoratId: user.direktorat_id,
      subdirektoratId: user.subdirektorat_id,
      divisiId: user.divisi_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    const response: LoginResponse = {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: 'LOGIN_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken }: RefreshTokenRequest = req.body;

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: 'Refresh token is required',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    const client = await pool.connect();
    try {
      // Get user from database
      const result = await client.query(
        `SELECT id, email, name, role, direktorat_id, subdirektorat_id, divisi_id, is_active, created_at, updated_at
         FROM users WHERE id = $1 AND is_active = true`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          error: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const user = result.rows[0];

      // Generate new tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        direktoratId: user.direktorat_id,
        subdirektoratId: user.subdirektorat_id,
        divisiId: user.divisi_id
      });

      const userResponse: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        direktoratId: user.direktorat_id,
        subdirektoratId: user.subdirektorat_id,
        divisiId: user.divisi_id,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      const response: LoginResponse = {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      };

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: response,
        timestamp: new Date().toISOString()
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: 'INVALID_REFRESH_TOKEN',
      timestamp: new Date().toISOString()
    });
  }
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success response
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: req.user,
    timestamp: new Date().toISOString()
  });
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long',
      error: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const client = await pool.connect();
  try {
    // Get current password hash
    const result = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        error: 'INVALID_PASSWORD',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: 'PASSWORD_CHANGE_FAILED',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});
