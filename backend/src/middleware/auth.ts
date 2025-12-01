import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromRequest } from '../utils/jwt';
import { User } from '../types';
import pool from '../config/database';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, name, role, direktorat_id, subdirektorat_id, divisi_id, is_active, last_login, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          error: 'UNAUTHORIZED',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const user = result.rows[0];
      
      // Update last login
      await client.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Attach user to request
      req.user = {
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
      
      req.token = token;
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// Super admin only middleware
export const requireSuperAdmin = requireRole(['superadmin']);

// Admin or super admin middleware
export const requireAdmin = requireRole(['admin', 'superadmin']);

// User, admin, or super admin middleware
export const requireUser = requireRole(['user', 'admin', 'superadmin']);

// Check if user can access specific direktorat
export const checkDirektoratAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Super admin can access everything
    if (req.user.role === 'superadmin') {
      next();
      return;
    }

    const direktoratId = req.params.direktoratId || req.body.direktoratId;
    
    if (!direktoratId) {
      next();
      return;
    }

    // Check if user has access to this direktorat
    if (req.user.direktoratId === direktoratId) {
      next();
      return;
    }

    // Admin can access all direktorat
    if (req.user.role === 'admin') {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Access denied to this direktorat',
      error: 'FORBIDDEN',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direktorat access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Check if user can access specific document
export const checkDocumentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Super admin can access everything
    if (req.user.role === 'superadmin') {
      next();
      return;
    }

    const documentId = req.params.id || req.params.documentId;
    
    if (!documentId) {
      next();
      return;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT direktorat_id, subdirektorat_id, divisi_id, uploaded_by, assigned_to FROM documents WHERE id = $1',
        [documentId]
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

      const document = result.rows[0];

      // User can access if:
      // 1. They uploaded the document
      // 2. They are assigned to the document
      // 3. They are in the same direktorat/subdirektorat/divisi
      // 4. They are admin
      if (
        document.uploaded_by === req.user.id ||
        document.assigned_to === req.user.id ||
        document.direktorat_id === req.user.direktoratId ||
        document.subdirektorat_id === req.user.subdirektoratId ||
        document.divisi_id === req.user.divisiId ||
        req.user.role === 'admin'
      ) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Access denied to this document',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString()
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Document access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Optional authentication middleware (for public endpoints)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const client = await pool.connect();
        
        try {
          const result = await client.query(
            'SELECT id, email, name, role, direktorat_id, subdirektorat_id, divisi_id, is_active, last_login, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
          );

          if (result.rows.length > 0) {
            const user = result.rows[0];
            req.user = {
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
            req.token = token;
          }
        } finally {
          client.release();
        }
      } catch (error) {
        // Token is invalid, but we continue without authentication
        console.warn('Invalid token in optional auth:', error);
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
