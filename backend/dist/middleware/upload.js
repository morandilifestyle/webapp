"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.generateFileUrl = exports.validateUploadedFiles = exports.handleUploadError = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/reviews/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    }
});
exports.uploadSingle = upload.single('image');
exports.uploadMultiple = upload.array('images', 5);
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
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
exports.handleUploadError = handleUploadError;
const validateUploadedFiles = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = Array.isArray(req.files) ? req.files : [req.files];
    for (const file of files) {
        if (file && typeof file.mimetype === 'string' && !file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }
    }
    next();
};
exports.validateUploadedFiles = validateUploadedFiles;
const generateFileUrl = (filename) => {
    return `${process.env.API_URL || 'http://localhost:3001'}/uploads/reviews/${filename}`;
};
exports.generateFileUrl = generateFileUrl;
const deleteFile = (filename) => {
    const fs = require('fs').promises;
    const filepath = path_1.default.join('uploads/reviews/', filename);
    return fs.unlink(filepath).catch((err) => {
        console.error('Error deleting file:', err);
    });
};
exports.deleteFile = deleteFile;
exports.default = {
    uploadSingle: exports.uploadSingle,
    uploadMultiple: exports.uploadMultiple,
    handleUploadError: exports.handleUploadError,
    validateUploadedFiles: exports.validateUploadedFiles,
    generateFileUrl: exports.generateFileUrl,
    deleteFile: exports.deleteFile
};
//# sourceMappingURL=upload.js.map