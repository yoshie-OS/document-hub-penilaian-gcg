import { Request, Response } from 'express';
import { asyncHandler, AppError, handleDatabaseError } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/auth';
import pool from '../config/database';
import { ActivityLog, ActivityAction, EntityType } from '../types';

// =====================================================
// ACTIVITY LOGS CONTROLLERS
// =====================================================

// Get all activity logs with filtering and pagination
export const getActivityLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    ipAddress
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const client = await pool.connect();
  try {
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      whereClause += ` AND al.user_id = $${paramCount}`;
      params.push(userId);
    }

    if (action) {
      paramCount++;
      whereClause += ` AND al.action = $${paramCount}`;
      params.push(action);
    }

    if (entityType) {
      paramCount++;
      whereClause += ` AND al.entity_type = $${paramCount}`;
      params.push(entityType);
    }

    if (entityId) {
      paramCount++;
      whereClause += ` AND al.entity_id = $${paramCount}`;
      params.push(entityId);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND al.timestamp >= $${paramCount}`;
      params.push(new Date(startDate as string));
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND al.timestamp <= $${paramCount}`;
      params.push(new Date(endDate as string));
    }

    if (ipAddress) {
      paramCount++;
      whereClause += ` AND al.ip_address ILIKE $${paramCount}`;
      params.push(`%${ipAddress}%`);
    }

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM activity_logs al ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get activity logs with pagination
    paramCount++;
    paramCount++;
    const logsResult = await client.query(
      `SELECT
         al.*,
         u.name as user_name,
         u.email as user_email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.timestamp DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    // Transform logs
    const logs: ActivityLog[] = logsResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp
    }));

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.status(200).json({
      success: true,
      message: 'Activity logs retrieved successfully',
      data: {
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages
        },
        metadata: {
          userNames: logsResult.rows.reduce((acc: any, row) => {
            if (row.user_name) {
              acc[row.user_id] = row.user_name;
            }
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

// Get activity log by ID
export const getActivityLogById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         al.*,
         u.name as user_name,
         u.email as user_email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Activity log not found', 404, true);
    }

    const row = result.rows[0];
    const log: ActivityLog = {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp
    };

    res.status(200).json({
      success: true,
      message: 'Activity log retrieved successfully',
      data: {
        log,
        metadata: {
          userName: row.user_name,
          userEmail: row.user_email
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

// Get user activity logs
export const getUserActivityLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 50,
    action,
    entityType,
    startDate,
    endDate
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const client = await pool.connect();
  try {
    // Check if user exists
    const userResult = await client.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, true);
    }

    // Build WHERE clause
    let whereClause = 'WHERE al.user_id = $1';
    const params: any[] = [userId];
    let paramCount = 1;

    if (action) {
      paramCount++;
      whereClause += ` AND al.action = $${paramCount}`;
      params.push(action);
    }

    if (entityType) {
      paramCount++;
      whereClause += ` AND al.entity_type = $${paramCount}`;
      params.push(entityType);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND al.timestamp >= $${paramCount}`;
      params.push(new Date(startDate as string));
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND al.timestamp <= $${paramCount}`;
      params.push(new Date(endDate as string));
    }

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM activity_logs al ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get activity logs with pagination
    paramCount++;
    paramCount++;
    const logsResult = await client.query(
      `SELECT al.*
       FROM activity_logs al
       ${whereClause}
       ORDER BY al.timestamp DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    // Transform logs
    const logs: ActivityLog[] = logsResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp
    }));

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.status(200).json({
      success: true,
      message: 'User activity logs retrieved successfully',
      data: {
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages
        },
        user: {
          id: userResult.rows[0].id,
          name: userResult.rows[0].name,
          email: userResult.rows[0].email
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

// Get activity statistics
export const getActivityStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = '30d' } = req.query;

  const client = await pool.connect();
  try {
    let dateFilter = '';
    let periodDays = 30;

    switch (period) {
      case '7d':
        periodDays = 7;
        break;
      case '30d':
        periodDays = 30;
        break;
      case '90d':
        periodDays = 90;
        break;
      case '1y':
        periodDays = 365;
        break;
      default:
        periodDays = 30;
    }

    dateFilter = `WHERE al.timestamp >= CURRENT_DATE - INTERVAL '${periodDays} days'`;

    // Get activity count by action
    const actionStats = await client.query(
      `SELECT action, COUNT(*) as count
       FROM activity_logs al
       ${dateFilter}
       GROUP BY action
       ORDER BY count DESC`
    );

    // Get activity count by entity type
    const entityStats = await client.query(
      `SELECT entity_type, COUNT(*) as count
       FROM activity_logs al
       ${dateFilter}
       GROUP BY entity_type
       ORDER BY count DESC`
    );

    // Get activity count by user
    const userStats = await client.query(
      `SELECT u.name, COUNT(*) as count
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${dateFilter}
       GROUP BY u.name, u.id
       ORDER BY count DESC
       LIMIT 10`
    );

    // Get daily activity trend
    const trendStats = await client.query(
      `SELECT DATE(al.timestamp) as date, COUNT(*) as count
       FROM activity_logs al
       ${dateFilter}
       GROUP BY DATE(al.timestamp)
       ORDER BY date`
    );

    // Get recent activity (last 10)
    const recentActivity = await client.query(
      `SELECT
         al.*,
         u.name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${dateFilter}
       ORDER BY al.timestamp DESC
       LIMIT 10`
    );

    const stats = {
      period: `${periodDays} days`,
      totalActivities: actionStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      byAction: Object.fromEntries(
        actionStats.rows.map(row => [row.action, parseInt(row.count)])
      ),
      byEntityType: Object.fromEntries(
        entityStats.rows.map(row => [row.entity_type, parseInt(row.count)])
      ),
      byUser: Object.fromEntries(
        userStats.rows.map(row => [row.name || 'Unknown', parseInt(row.count)])
      ),
      dailyTrend: trendStats.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: parseInt(row.count)
      })),
      recentActivity: recentActivity.rows.map(row => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        userName: row.user_name,
        timestamp: row.timestamp
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Activity statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Get system health and activity summary
export const getSystemHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    // Get total counts
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const documentCount = await client.query('SELECT COUNT(*) FROM documents');
    const activityCount = await client.query('SELECT COUNT(*) FROM activity_logs');

    // Get recent activity count (last 24 hours)
    const recentActivityCount = await client.query(
      `SELECT COUNT(*) FROM activity_logs 
       WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'`
    );

    // Get active users count (last 7 days)
    const activeUsersCount = await client.query(
      `SELECT COUNT(DISTINCT user_id) FROM activity_logs 
       WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'`
    );

    // Get document upload trend (last 7 days)
    const uploadTrend = await client.query(
      `SELECT DATE(uploaded_at) as date, COUNT(*) as count
       FROM documents
       WHERE uploaded_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(uploaded_at)
       ORDER BY date`
    );

    // Get error logs count (last 24 hours)
    const errorLogsCount = await client.query(
      `SELECT COUNT(*) FROM activity_logs 
       WHERE action IN ('error', 'failed') 
       AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'`
    );

    const health = {
      timestamp: new Date().toISOString(),
      system: {
        totalUsers: parseInt(userCount.rows[0].count),
        totalDocuments: parseInt(documentCount.rows[0].count),
        totalActivities: parseInt(activityCount.rows[0].count)
      },
      activity: {
        last24Hours: parseInt(recentActivityCount.rows[0].count),
        activeUsers7Days: parseInt(activeUsersCount.rows[0].count)
      },
      documents: {
        uploadTrend7Days: uploadTrend.rows.map(row => ({
          date: row.date.toISOString().split('T')[0],
          count: parseInt(row.count)
        }))
      },
      errors: {
        last24Hours: parseInt(errorLogsCount.rows[0].count)
      },
      status: 'healthy'
    };

    // Determine system status
    if (health.errors.last24Hours > 10) {
      health.status = 'warning';
    }
    if (health.errors.last24Hours > 50) {
      health.status = 'critical';
    }

    res.status(200).json({
      success: true,
      message: 'System health retrieved successfully',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});

// Export activity logs (Admin only)
export const exportActivityLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { format = 'json', startDate, endDate } = req.query;

  if (!['json', 'csv'].includes(format as string)) {
    throw new AppError('Invalid export format. Supported: json, csv', 400, true);
  }

  const client = await pool.connect();
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      params.push(new Date(startDate as string));
      whereClause += ` AND al.timestamp >= $${params.length}`;
    }

    if (endDate) {
      params.push(new Date(endDate as string));
      whereClause += ` AND al.timestamp <= $${params.length}`;
    }

    const logsResult = await client.query(
      `SELECT
         al.*,
         u.name as user_name,
         u.email as user_email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.timestamp DESC`,
      params
    );

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'ID',
        'User ID',
        'User Name',
        'User Email',
        'Action',
        'Entity Type',
        'Entity ID',
        'Details',
        'IP Address',
        'User Agent',
        'Timestamp'
      ];

      const csvRows = logsResult.rows.map(row => [
        row.id,
        row.user_id || '',
        row.user_name || '',
        row.user_email || '',
        row.action,
        row.entity_type || '',
        row.entity_id || '',
        row.details ? JSON.stringify(row.details) : '',
        row.ip_address || '',
        row.user_agent || '',
        row.timestamp
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      const logs = logsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        timestamp: row.timestamp
      }));

      res.status(200).json({
        success: true,
        message: 'Activity logs exported successfully',
        data: logs,
        exportInfo: {
          format: 'json',
          totalRecords: logs.length,
          startDate: startDate || 'all',
          endDate: endDate || 'all',
          exportedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    client.release();
  }
});
