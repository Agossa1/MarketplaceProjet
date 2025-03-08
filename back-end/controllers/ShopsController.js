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
        console.log('Fichiers reçus:', req.files);
        console.log('Données du corps de la requête:', req.body);

        let {
            name,
            description,
            categories,
            subcategories,
            address,
            contactEmail,
            contactPhone,
            openingHours,
            socialMedia,
            tags
        } = req.body;

        const userId = req.user.id;
        console.log('userId:', userId)

        // Test for name and category
        console.log('Name:', name);
        console.log('Categories:', categories);

        // Ensure categories and subcategories are arrays
        categories = Array.isArray(categories) ? categories : [categories].filter(Boolean);
        subcategories = Array.isArray(subcategories) ? subcategories : [subcategories].filter(Boolean);

        // Test data
        console.log('categories:', categories);
        console.log('subcategories:', subcategories);
        console.log('description:', description);
        console.log('contactEmail:', contactEmail);
        console.log('contactPhone:', contactPhone);
        console.log('socialMedia:', socialMedia);

        // Validation des données
        const validationErrors = validateShopData({
            name,
            description,
            categories,
            subcategories,
            contactEmail,
            contactPhone
        });

        if (validationErrors.length > 0) {
            console.error("Validation errors", validationErrors);
            return res.status(400).json({
                success: false,
                message: "Données de magasin invalides",
                errors: validationErrors
            });
        }

        // Generate slug from shop name
        const slug = slugify(name, { lower: true });

        // Handle logo and cover image upload
        let logo, coverImage;
        if (req.files) {
            console.log('Uploading images');
            if (req.files.logo && req.files.logo[0]) {
                console.log('Uploading logo...');
                const logoResult = await cloudinaryUploadLogo(req.files.logo[0].buffer);
                console.log('Logo uploaded:', logoResult);
                logo = {
                    url: logoResult.secure_url,
                    public_id: logoResult.public_id
                };
            }
            if (req.files.coverImage && req.files.coverImage[0]) {
                console.log('Uploading cover image...');
                const coverImageResult = await cloudinaryUploadCoverImage(req.files.coverImage[0].buffer);
                console.log('Cover image uploaded:', coverImageResult);
                coverImage = {
                    url: coverImageResult.secure_url,
                    public_id: coverImageResult.public_id
                };
            }
        }

        const newShop = new Shop({
            name,
            description,
            categories,
            subcategories,
            slug,
            owner: userId,
            address,
            contactEmail,
            contactPhone,
            openingHours,
            socialMedia,
            tags,
            logo,
            coverImage
        });

        const savedShop = await newShop.save();

        // Mise à jour de l'utilisateur
        await User.findByIdAndUpdate(userId, { $set: { shop: savedShop._id } });

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




