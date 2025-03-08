import { AppError } from '../utils/errorMessages.js';
import multer from 'multer';
import { cloudinaryUploadImg, cloudinaryUploadLogo, cloudinaryUploadCoverImage } from '../utils/cloudinary.js';

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

const processAndUploadImages = async (req, res, next) => {
    try {
        if (!req.files && !req.file) {
            console.log('Aucune image n\'a été téléchargée, continuation du processus');
            return next();
        }

        const uploadPromises = [];

        // Fonction helper pour uploader une image
        const uploadImage = async (file, uploadFunction, bodyField) => {
            if (file) {
                try {
                    const result = await uploadFunction(file.buffer);
                    req.body[bodyField] = { url: result.url, public_id: result.public_id };
                } catch (error) {
                    console.error(`Erreur lors de l'upload de ${bodyField}:`, error);
                }
            }
        };

        // Traitement du logo de la boutique
        await uploadImage(req.files?.shopLogo?.[0], cloudinaryUploadLogo, 'shopLogo');

        // Traitement de l'image de couverture
        await uploadImage(req.files?.coverImage?.[0], cloudinaryUploadCoverImage, 'coverImage');

        // Traitement des autres images
        const otherImages = req.files?.images || (req.file ? [req.file] : []);
        req.body.images = [];
        for (const file of otherImages) {
            await uploadImage(file, cloudinaryUploadImg, 'currentImage');
            if (req.body.currentImage) {
                req.body.images.push(req.body.currentImage);
                delete req.body.currentImage;
            }
        }

        console.log('Images traitées et ajoutées à req.body');
        next();
    } catch (error) {
        console.error('Erreur lors du traitement des images:', error);
        next(new AppError('Erreur lors du traitement des images', 500));
    }
};

export const processMultipleImages = (shopIdField = 'shopId') => [
    (req, res, next) => {
        console.log('Incoming request fields:', Object.keys(req.body));
        console.log('Incoming files:', req.files ? Object.keys(req.files) : 'No files');
        if (req.query[shopIdField]) {
            req.body[shopIdField] = req.query[shopIdField];
        }
        next();
    },
    upload.fields([
        { name: 'logo', maxCount: 1 },  // Changed from 'shopLogo' to 'logo'
        { name: 'coverImage', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]),
    (error, req, res, next) => {
        if (error instanceof multer.MulterError) {
            console.error('Multer error:', error);
            return res.status(400).json({ error: error.message });
        } else if (error) {
            console.error('Unknown error:', error);
            return res.status(500).json({ error: 'An unexpected error occurred during file upload.' });
        }
        next();
    },
    processAndUploadImages,
];

export const processSingleImage = (fieldName = 'image', shopIdField = 'shopId') => [
    (req, res, next) => {
        if (req.query[shopIdField]) {
            req.body[shopIdField] = req.query[shopIdField];
        }
        next();
    },
    upload.single(fieldName),
    processAndUploadImages,
];