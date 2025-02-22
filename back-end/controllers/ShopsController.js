import { AppError } from '../utils/errorMessages.js';
import { cloudinaryUploadImg } from '../utils/cloudinary.js';
import Seller from '../models/ShopModels.js';
import User from '../models/UserModels.js';

export const createShop = async (req, res, next) => {
    try {
        const {
            shopName,
            description,
            contactEmail,
            contactPhone,
            address,
            categories,
            policies,
            socialMedia
        } = req.body;

        const userId = req.user._id; // Utilisez l'ID de l'utilisateur déjà présent dans req.user

        // Vérifier si l'utilisateur a déjà une boutique
        const existingShop = await Seller.findOne({ user: userId });
        if (existingShop) {
            return next(new AppError('User already has a shop', 400));
        }

        // Traiter le logo et l'image de couverture si fournis
        let shopLogo, coverImage;
        if (req.files && req.files.shopLogo) {
            const result = await cloudinaryUploadImg(req.files.shopLogo[0].buffer);
            shopLogo = result.url;
        }
        if (req.files && req.files.coverImage) {
            const result = await cloudinaryUploadImg(req.files.coverImage[0].buffer);
            coverImage = result.url;
        }

        // Créer la nouvelle boutique
        const newShop = new Seller({
            user: userId,
            shopName,
            description,
            shopLogo,
            coverImage,
            contactEmail,
            contactPhone,
            address,
            categories,
            policies,
            socialMedia
        });

        // Sauvegarder la nouvelle boutique
        const savedShop = await newShop.save();

        // Mettre à jour le rôle de l'utilisateur en 'seller' si ce n'est pas déjà le cas
        if (!req.user.role.includes('seller')) {
            await User.findByIdAndUpdate(userId, { $addToSet: { role: 'seller' } });
        }

        res.status(201).json({
            status: 'success',
            data: {
                shop: savedShop
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};