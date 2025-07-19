import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Extend Request interface to include files
declare global {
  namespace Express {
    interface Request {
      files?: any[];
    }
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, 'uploads/reviews/');
  },
  filename: (req: any, file: any, cb: any) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req: Request, file: any, cb: any) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Single file upload middleware
export const uploadSingle = upload.single('image');

// Multiple files upload middleware
export const uploadMultiple = upload.array('images', 5);

// Error handling middleware for multer
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed.' });
  }
  
  next(err);
};

// Validate uploaded files
export const validateUploadedFiles = (req: Request, res: any, next: any) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  // Check if all files are images
  const files = Array.isArray(req.files) ? req.files : [req.files];
  for (const file of files) {
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
  }
  
  next();
};

// Generate file URL
export const generateFileUrl = (filename: string): string => {
  return `${process.env.API_URL || 'http://localhost:3001'}/uploads/reviews/${filename}`;
};

// Delete file from filesystem
export const deleteFile = (filename: string): Promise<void> => {
  const fs = require('fs').promises;
  const filepath = path.join('uploads/reviews/', filename);
  
  return fs.unlink(filepath).catch((err: any) => {
    console.error('Error deleting file:', err);
  });
};

export default {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  validateUploadedFiles,
  generateFileUrl,
  deleteFile
}; 