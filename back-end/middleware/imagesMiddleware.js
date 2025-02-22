import { AppError } from '../utils/errorMessages.js';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { cloudinaryUploadImg } from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer Storage
const multerStorage = multer.memoryStorage();

// File Filter for Images
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Unsupported file format', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// Image Resizing and Upload Middleware
const processAndUploadImages = async (req, res, next) => {
    try {
        if (!req.files && !req.file) return next();

        const files = req.files || [req.file];
        req.body.images = [];

        const tempDir = path.join(__dirname, 'temp');

        if (!fs.existsSync(tempDir)) {
            await fs.promises.mkdir(tempDir);
        }

        for (const file of files) {
            const filename = `product-${Date.now()}-${files.indexOf(file) + 1}.jpeg`;
            const tempFilePath = path.join(tempDir, filename);

            // Resize image
            await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(tempFilePath);

            // Upload to Cloudinary
            try {
                const result = await cloudinaryUploadImg(tempFilePath);
                req.body.images.push({
                    url: result.url,
                    publicId: result.public_id,
                });
            } catch (error) {
                console.error('Error uploading image to Cloudinary:', error.message);
                throw new AppError('Error uploading image to Cloudinary', 500);
            } finally {
                // Delete the temporary file
                await fs.promises.unlink(tempFilePath);
            }
        }

        next();
    } catch (error) {
        console.error('Error processing and uploading images:', error.message);
        next(new AppError('Error processing and uploading images', 500));
    }
};

export const processMultipleImages = (fieldName = 'images') => [
    upload.array(fieldName, 10),
    processAndUploadImages,
];

export const processSingleImage = (fieldName = 'image') => [
    upload.single(fieldName),
    processAndUploadImages,
];