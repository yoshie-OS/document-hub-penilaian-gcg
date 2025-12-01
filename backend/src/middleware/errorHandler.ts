import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
export const notFound = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  res.status(404).json(errorResponse);
};

// Global error handler
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    const statusCode = 400;
    error = new AppError(message, statusCode);
  }

  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    const statusCode = 400;
    error = new AppError(message, statusCode);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    const statusCode = 401;
    error = new AppError(message, statusCode);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    const statusCode = 401;
    error = new AppError(message, statusCode);
  }

  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    switch (err.message) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        statusCode = 413;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        statusCode = 413;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        statusCode = 400;
        break;
      default:
        message = err.message;
    }

    error = new AppError(message, statusCode);
  }

  // Handle database errors
  if (err.message && err.message.includes('duplicate key')) {
    const message = 'Duplicate field value';
    const statusCode = 400;
    error = new AppError(message, statusCode);
  }

  if (err.message && err.message.includes('violates foreign key constraint')) {
    const message = 'Referenced record not found';
    const statusCode = 400;
    error = new AppError(message, statusCode);
  }

  // Handle rate limit errors
  if (err.message && err.message.includes('Too many requests')) {
    const message = 'Too many requests, please try again later';
    const statusCode = 429;
    error = new AppError(message, statusCode);
  }

  // Default error
  const statusCode = (error as AppError).statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: ErrorResponse = {
    success: false,
    message: isDevelopment ? message : 'Internal Server Error',
    error: isDevelopment ? err.name : 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    (errorResponse as any).stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
export const handleValidationError = (errors: any[]): AppError => {
  const message = errors.map(err => `${err.field}: ${err.message}`).join(', ');
  return new AppError(message, 400);
};

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') { // Unique violation
    return new AppError('Duplicate field value', 400);
  }
  
  if (error.code === '23503') { // Foreign key violation
    return new AppError('Referenced record not found', 400);
  }
  
  if (error.code === '23502') { // Not null violation
    return new AppError('Required field missing', 400);
  }
  
  if (error.code === '22P02') { // Invalid text representation
    return new AppError('Invalid data format', 400);
  }
  
  return new AppError('Database operation failed', 500);
};

// File upload error handler
export const handleFileUploadError = (error: any): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size exceeds limit', 413);
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files uploaded', 413);
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }
  
  if (error.code === 'LIMIT_FIELD_KEY') {
    return new AppError('Field name too long', 400);
  }
  
  if (error.code === 'LIMIT_FIELD_VALUE') {
    return new AppError('Field value too long', 400);
  }
  
  if (error.code === 'LIMIT_FIELD_COUNT') {
    return new AppError('Too many fields', 400);
  }
  
  return new AppError('File upload failed', 500);
};
