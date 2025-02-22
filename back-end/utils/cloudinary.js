import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

// Configuration de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction pour uploader une image sur Cloudinary
export const cloudinaryUploadImg = async (fileToUpload, options = {}) => {
    try {
        const defaultOptions = {
            resource_type: 'auto',
            folder: 'tokpamarket',
        };
        const uploadOptions = { ...defaultOptions, ...options };

        let result;
        if (Buffer.isBuffer(fileToUpload)) {
            // Si fileToUpload est un buffer, utilisez upload_stream
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                Readable.from(fileToUpload).pipe(uploadStream);
            });
        } else {
            // Si fileToUpload est un chemin de fichier ou une URL, utilisez upload
            result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);
        }

        return {
            url: result.secure_url,
            asset_id: result.asset_id,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
    }
};

// Fonction pour supprimer une image sur Cloudinary
export const cloudinaryDeleteImg = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error("Le paramètre 'publicId' est manquant ou indéfini.");
        }

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'not found') {
            console.warn(`L'image avec public_id "${publicId}" n'a pas été trouvée.`);
            return { success: false, message: 'Image non trouvée' };
        } else if (result.result === 'ok') {
            return { success: true, message: 'Image supprimée avec succès' };
        } else {
            console.warn('Réponse inattendue de Cloudinary:', result);
            return { success: false, message: 'Réponse inattendue lors de la suppression' };
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image sur Cloudinary:', error.message);
        throw new Error(`Erreur lors de la suppression de l'image: ${error.message}`);
    }
};

// Fonction pour mettre à jour une image sur Cloudinary
export const cloudinaryUpdateImg = async (oldPublicId, newFileToUpload, options = {}) => {
    try {
        await cloudinaryDeleteImg(oldPublicId);
        return await cloudinaryUploadImg(newFileToUpload, options);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'image:', error);
        throw new Error(`Erreur lors de la mise à jour de l'image: ${error.message}`);
    }
};