import { cloudinaryUploadLogo, cloudinaryUploadCoverImage } from '../utils/cloudinary.js';
import User from '../models/UserModels.js';
import Shop from '../models/ShopModels.js';
import { AppError } from '../utils/errorMessages.js';
import { validateShopData } from '../utils/validators.js';
import mongoose from 'mongoose';
import Product from '../models/ProductModels.js';
import logger from "../utils/logger.js";
import Review from "../models/ReviewModels.js";
import multer from "multer";
import slugify from 'slugify';

export const createShop = async (req, res) => {
    try {
        console.log('Données du corps de la requête:', req.body);

        let {
            name,
            categories,
            subcategories
        } = req.body;

        const userId = req.user.id;
        console.log('userId:', userId);

        // Récupérer l'utilisateur pour utiliser son email par défaut
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }
        
        // Vérifier le nombre de boutiques de l'utilisateur
        const userShopsCount = await Shop.countDocuments({ owner: userId });
        if (userShopsCount >= 10) {
            return res.status(400).json({
                success: false,
                message: "Vous avez atteint la limite de 10 boutiques par utilisateur"
            });
        }
        
        // Utiliser OBLIGATOIREMENT l'email de l'utilisateur connecté
        const contactEmail = user.email;
        console.log('Email de contact utilisé:', contactEmail);

        // Ensure categories and subcategories are arrays
        categories = Array.isArray(categories) ? categories : [categories].filter(Boolean);
        subcategories = Array.isArray(subcategories) ? subcategories : [subcategories].filter(Boolean);
        
        // Validation des données (sans description, contactPhone et openingHours)
        const validationErrors = validateShopData({
            name,
            categories,
            subcategories,
            contactEmail
        });

        if (validationErrors.length > 0) {
            console.error("Validation errors", validationErrors);
            return res.status(400).json({
                success: false,
                message: "Données de magasin invalides",
                errors: validationErrors
            });
        }

        // Vérifier si l'utilisateur a déjà une boutique avec ce nom
        const existingShop = await Shop.findOne({ 
            owner: userId,
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Recherche insensible à la casse
        });

        if (existingShop) {
            return res.status(400).json({
                success: false,
                message: "Vous avez déjà une boutique avec ce nom"
            });
        }

        // Generate slug from shop name
        const slug = slugify(name, { lower: true });

        const newShop = new Shop({
            name,
            categories,
            subcategories,
            slug,
            owner: userId,
            contactEmail: contactEmail, // Utiliser l'email de l'utilisateur connecté
            createdBy: user.fullName || user.username || 'Utilisateur', // Ajouter le nom de l'utilisateur qui a créé la boutique
            creationDate: new Date(),
            description: 'Description par défaut de la boutique. Vous pouvez la modifier ultérieurement.' // Ajouter une description par défaut
        });

        const savedShop = await newShop.save();

        // Mise à jour de l'utilisateur
        await User.findByIdAndUpdate(userId, { 
            $push: { shops: savedShop._id },  // Utiliser $push au lieu de $set pour permettre plusieurs boutiques
            $addToSet: { role: 'seller' }     // Ajouter le rôle de vendeur s'il ne l'a pas déjà
        });

        // Appeler la méthode pour mettre à jour l'utilisateur après la création de la boutique
        await savedShop.updateUserAfterShopCreation();

        // Enregistrer l'activité de création de boutique
        logger.info(`Boutique créée: ${name} par l'utilisateur ${user.email} (ID: ${userId})`);

        res.status(201).json({
            success: true,
            message: "Magasin créé avec succès",
            shop: savedShop
        });

    } catch (error) {
        console.error('Erreur lors de la création du magasin:', error);
        if (error.name === 'ValidationError') {
            // Handle mongoose validation errors
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        } else {
            // Handle other types of errors
            res.status(500).json({
                success: false,
                message: "Erreur lors de la création du magasin",
                error: error.message || error
            });
        }
    }
};


export const getAllShops = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            category,
            minRating,
            maxRating,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            isVerified
        } = req.query;

        const startIndex = (parseInt(page) - 1) * parseInt(limit);

        // Construire la requête
        let query = {};

        // Recherche textuelle
        if (search) {
            query.$or = [
                { shopName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filtrage par catégorie
        if (category) {
            query.categories = category;
        }

        // Filtrage par note
        if (minRating || maxRating) {
            query.rating = {};
            if (minRating) query.rating.$gte = parseFloat(minRating);
            if (maxRating) query.rating.$lte = parseFloat(maxRating);
        }

        // Filtrage par statut de vérification
        if (isVerified !== undefined) {
            query.isVerified = isVerified === 'true';
        }

        // Construire les options de tri
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Exécuter la requête
        const totalShops = await Shop.countDocuments(query);
        const shops = await Shop.find(query)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip(startIndex)
            .populate('owner', 'email fullName');

        res.status(200).json({
            status: 'success',
            results: shops.length,
            totalShops,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalShops / parseInt(limit)),
            data: {
                shops
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

export const getShopById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid shop ID', 400));
        }

        const shop = await Shop.findById(id)
            .populate('owner', 'email fullName')
            .populate('categories', 'name')
            .lean()
            .exec();

        if (!shop) {
            return next(new AppError('Shop not found', 404));
        }

        // Calculate average rating
        let averageRating = 'Not rated';
        if (shop.ratings && Array.isArray(shop.ratings) && shop.ratings.length > 0) {
            const sum = shop.ratings.reduce((acc, rating) => acc + (rating.value || 0), 0);
            averageRating = (sum / shop.ratings.length).toFixed(1);
        }

        // Get total products count
        const totalProducts = await Product.countDocuments({ shop: id });

        // Format the response
        const formattedShop = {
            ...shop,
            averageRating,
            totalProducts,
            isOpen: isShopOpen(shop.openingHours),
        };

        res.status(200).json({
            status: 'success',
            data: {
                shop: formattedShop
            }
        });
    } catch (error) {
        console.error('Error in getShopById:', error);
        next(new AppError(`Error fetching shop details: ${error.message}`, 500));
    }
};

// Helper function to check if the shop is currently open
const isShopOpen = (openingHours) => {
    if (!openingHours || !Array.isArray(openingHours)) return false;

    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 60 + now.getMinutes();

    const todayHours = openingHours[day];
    if (!todayHours || !Array.isArray(todayHours)) return false;

    return todayHours.some(({ open, close }) => {
        if (!open || !close || typeof open.hours !== 'number' || typeof open.minutes !== 'number' ||
            typeof close.hours !== 'number' || typeof close.minutes !== 'number') {
            return false;
        }
        const openTime = open.hours * 60 + open.minutes;
        const closeTime = close.hours * 60 + close.minutes;
        return time >= openTime && time < closeTime;
    });
};

// Update a shop by ID by the shop owner
export const updateShopById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Vérifier si l'utilisateur est le propriétaire de la boutique
        const shop = await Shop.findOne({ _id: id, owner: userId });
        if (!shop) {
            return next(new AppError('Shop not found or you are not authorized to update this shop', 403));
        }

        // Champs autorisés à être mis à jour
        const allowedUpdates = ['name', 'description', 'contactEmail', 'contactPhone', 'address', 'categories', 'policies', 'socialMedia'];
        const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));

        // Appliquer les mises à jour
        updates.forEach(update => shop[update] = req.body[update]);

        // Traitement du logo si un nouveau fichier est uploadé
        if (req.files && req.files.logo) {
            try {
                const result = await cloudinaryUploadLogo(req.files.logo[0].buffer);
                shop.logo = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            } catch (error) {
                console.error('Error uploading logo:', error);
                return next(new AppError('Error uploading logo', 500));
            }
        }

        // Traitement de l'image de couverture si un nouveau fichier est uploadé
        if (req.files && req.files.coverImage) {
            try {
                const result = await cloudinaryUploadCoverImage(req.files.coverImage[0].buffer);
                shop.coverImage = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            } catch (error) {
                console.error('Error uploading cover image:', error);
                return next(new AppError('Error uploading cover image', 500));
            }
        }

        await shop.save();

        res.status(200).json({
            status: 'success',
            data: {
                shop
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
        logger.error('Error in updateShopById:', error);
    }
};

// Delete a shop by ID by the shop owner
export const deleteShopById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Vérifier si l'utilisateur est le propriétaire de la boutique
        const shop = await Shop.findOne({ _id: id, owner: userId });
        if (!shop) {
            return next(new AppError('Shop not found or you are not authorized to delete this shop', 403));
        }

        await Shop.findByIdAndDelete(id);

        // Mettre à jour le rôle de l'utilisateur si nécessaire
        const user = await User.findById(userId);
        user.role = user.role.filter(role => role !== 'seller');
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Shop successfully deleted'
        });
    } catch (error) {
        next(new AppError(error.message, 500));
        logger.error('Error in deleteShopById:', error);
    }
};

// Function to follow a shop
export const followShop = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Validate shop ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid shop ID', 400));
        }

        // Check if the shop exists and the user is not already following it
        const shop = await Shop.findOneAndUpdate(
            { _id: id, followers: { $ne: userId } },
            { $addToSet: { followers: userId } },
            { new: true, runValidators: true }
        ).select('shopName followers');

        if (!shop) {
            return next(new AppError('Shop not found or already followed', 404));
        }

        // Update user's following list and get user details
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { followingShops: id } },
            { new: true, runValidators: true }
        ).select('fullName email');

        res.status(200).json({
            status: 'success',
            message: `You are now following ${shop.shopName}`,
            data: {
                shopId: shop._id,
                shopName: shop.shopName,
                followersCount: shop.followers.length,
                followingCount: updatedUser.followingShops ? updatedUser.followingShops.length : 0,
                following: updatedUser.followingShops || [],
                follower: {
                    id: updatedUser._id,
                    name: updatedUser.fullName,
                    email: updatedUser.email
                }
            }
        });
    } catch (error) {
        next(new AppError(`Error following shop: ${error.message}`, 500));
        logger.error('Error in followShop:', error);
    }
};

// Funtion to review a shop

export const reviewShop = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { rating, comment } = req.body;

        // Validate shop ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid shop ID', 400));
        }

        // Check if the shop exists
        const shop = await Shop.findById(id);
        if (!shop) {
            return next(new AppError('Shop not found', 404));
        }

        // Check if the user has already reviewed this shop
        const existingReview = await Review.findOne({ user: userId, reviewedItem: id, itemType: 'Shop' });
        if (existingReview) {
            return next(new AppError('You have already reviewed this shop', 400));
        }

        // Create a new review
        const newReview = new Review({
            user: userId,
            reviewedItem: id,
            itemType: 'Shop',
            rating,
            comment
        });

        // Save the review
        await newReview.save();

        // Update the shop's rating
        const allShopReviews = await Review.find({ reviewedItem: id, itemType: 'Shop' });
        const averageRating = allShopReviews.reduce((acc, review) => acc + review.rating, 0) / allShopReviews.length;

        shop.rating = averageRating;
        shop.numReviews = allShopReviews.length;
        await shop.save();

        res.status(201).json({
            status: 'success',
            message: 'Review added successfully',
            data: {
                review: newReview,
                shopNewRating: averageRating,
                shopTotalReviews: allShopReviews.length
            }
        });
    } catch (error) {
        logger.error('Error in reviewShop:', error);
        next(new AppError(`Error adding review: ${error.message}`, 500));
    }
};


export const unfollowShop = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Validate shop ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new AppError('Invalid shop ID', 400));
        }

        // Check if the shop exists and the user is following it
        const shop = await Shop.findOneAndUpdate(
            { _id: id, followers: userId },
            { $pull: { followers: userId } },
            { new: true, runValidators: true }
        ).select('shopName followers');

        if (!shop) {
            return next(new AppError('Shop not found or not followed', 404));
        }

        // Update user's following list
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { followingShops: id } },
            { new: true, runValidators: true }
        ).select('fullName email followingShops');

        // Ensure followingShops exists and is an array
        const followingShops = updatedUser.followingShops || [];

        res.status(200).json({
            status: 'success',
            message: `You have unfollowed ${shop.shopName}`,
            data: {
                shopId: shop._id,
                shopName: shop.shopName,
                followersCount: shop.followers.length,
                userFollowing: followingShops.includes(id),
                followingCount: followingShops.length,
                follower: {
                    id: updatedUser._id,
                    name: updatedUser.fullName,
                    email: updatedUser.email
                }
            }
        });
    } catch (error) {
        next(new AppError(`Error unfollowing shop: ${error.message}`, 500));
        logger.error('Error in unfollowShop:', error);
    }
};


// Get Shops bys User ID connected ID
// Get Shops bys User ID connected ID
export const getShopByUserId = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user.id;

        // Validate the user ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(new AppError('Invalid user ID format', 400));
        }

        // Find shop by owner ID
        const shop = await Shop.findOne({ owner: userId })
            .populate('owner', 'email fullName')
            .populate('categories', 'name')
            .lean()
            .exec();

        if (!shop) {
            return res.status(404).json({
                status: 'fail',
                message: 'No shop found for this user'
            });
        }

        // Calculate average rating
        let averageRating = 'Not rated';
        if (shop.ratings && Array.isArray(shop.ratings) && shop.ratings.length > 0) {
            const sum = shop.ratings.reduce((acc, rating) => acc + (rating.value || 0), 0);
            averageRating = (sum / shop.ratings.length).toFixed(1);
        }

        // Get total products count
        const totalProducts = await Product.countDocuments({ shop: shop._id });

        // Format the response
        const formattedShop = {
            ...shop,
            averageRating,
            totalProducts,
            isOpen: isShopOpen(shop.openingHours),
        };

        res.status(200).json({
            status: 'success',
            data: {
                shop: formattedShop
            }
        });
    } catch (error) {
        console.error('Error in getShopByUserId:', error);
        next(new AppError(`Error fetching shop by user ID: ${error.message}`, 500));
    }
};



