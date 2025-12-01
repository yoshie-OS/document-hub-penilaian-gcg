import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// =====================================================
// FILE UPLOAD CONFIGURATION
// =====================================================

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create year-based subdirectories
const createYearDirectories = () => {
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    const yearDir = path.join(uploadDir, year.toString());
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }
  }
};

createYearDirectories();

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Get year from request body or use current year
    const year = req.body.year || new Date().getFullYear();
    const yearDir = path.join(uploadDir, year.toString());
    
    // Create year directory if it doesn't exist
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }
    
    cb(null, yearDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${randomString}${fileExtension}`;
    
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 1 // Allow only 1 file per request
  }
});

// Single file upload middleware
export const uploadSingle = upload.single('file');

// Multiple files upload middleware (optional)
export const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    files: 10 // Allow up to 10 files
  }
}).array('files', 10);

// =====================================================
// FILE VALIDATION MIDDLEWARE
// =====================================================

export const validateFileUpload = (req: Request, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      error: 'NO_FILE',
      timestamp: new Date().toISOString()
    });
  }

  // Validate file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
  if (req.file.size > maxSize) {
    // Remove uploaded file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(413).json({
      success: false,
      message: `File size exceeds limit. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      error: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString()
    });
  }

  // Validate required fields
  const { year, aspectId } = req.body;
  if (!year) {
    // Remove uploaded file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(400).json({
      success: false,
      message: 'Year is required',
      error: 'MISSING_YEAR',
      timestamp: new Date().toISOString()
    });
  }

  // Validate year format
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    // Remove uploaded file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid year format. Year must be between 2000-2100',
      error: 'INVALID_YEAR',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// =====================================================
// FILE CLEANUP UTILITIES
// =====================================================

export const cleanupUploadedFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
};

export const cleanupUploadedFiles = (files: Express.Multer.File[]) => {
  files.forEach(file => {
    if (file.path) {
      cleanupUploadedFile(file.path);
    }
  });
};

// =====================================================
// FILE PATH UTILITIES
// =====================================================

export const getFileUrl = (filePath: string) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const relativePath = filePath.replace(/\\/g, '/').replace('./uploads/', '');
  return `${baseUrl}/uploads/${relativePath}`;
};

export const getFileSizeInMB = (bytes: number) => {
  return (bytes / 1024 / 1024).toFixed(2);
};

export const getFileType = (filename: string) => {
  return path.extname(filename).toLowerCase().substring(1);
};

export const getMimeType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

// =====================================================
// EXPORT CONFIGURATION
// =====================================================

export default upload;
export { uploadDir };
