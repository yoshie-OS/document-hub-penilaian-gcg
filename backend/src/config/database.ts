import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'gcg_document_hub',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    client.release();
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
};

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  try {
    await testConnection();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

// Get database pool
export const getPool = (): Pool => pool;

// Close database connections
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    throw error;
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1');
    client.release();
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

// Export pool for direct use
export default pool;
