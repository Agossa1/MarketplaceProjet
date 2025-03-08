import Product from '../models/ProductModels.js';
import Shop from '../models/ShopModels.js';
import logger from '../utils/logger.js';
import {AppError}from '../utils/errorMessages.js';
import * as cloudinary from '../utils/cloudinary.js';

const createProduct = async (req, res, next) => {
    const imageUrls = [];
    try {
        const {
            name, description, price, stock, category, subcategory,
            brand, features, dimensions, weight, quantity, tags, shopId,
            discountPercentage, isAvailable
        } = req.body;
        const userId = req.user.id;

        logger.info(`Creating product for User ID: ${userId}, Shop ID: ${shopId}`);

        if (!shopId) {
            return next(new AppError("L'ID de la boutique est requis", 400));
        }

        const shop = await Shop.findOne({ _id: shopId, owner: userId });
        if (!shop) {
            return next(new AppError("Vous n'êtes pas autorisé à créer un produit pour cette boutique", 403));
        }

        logger.info(`Shop found: ${shop._id}`);

        if (!name || !description || !price || !stock || !category) {
            return next(new AppError("Veuillez fournir tous les champs requis", 400));
        }

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                cloudinary.cloudinaryUploadImg(file.buffer, { folder: "products" })
            );

            const uploadResults = await Promise.allSettled(uploadPromises);

            uploadResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    imageUrls.push({
                        url: result.value.url,
                        publicId: result.value.public_id,
                        alt: `Product Image ${index + 1}`
                    });
                    logger.info(`Image ${index + 1} uploaded successfully: ${result.value.url}`);
                } else {
                    logger.error(`Failed to upload image ${index + 1}:`, result.reason);
                }
            });

            if (imageUrls.length === 0) {
                return next(new AppError("Aucune image n'a pu être téléchargée. Veuillez réessayer.", 500));
            }
        }

        const newProduct = new Product({
            name,
            description,
            price,
            stock,
            category,
            shop: shopId,
            subcategory,
            brand,
            features,
            dimensions,
            weight,
            quantity,
            tags: tags || [],
            images: imageUrls,
            discountPercentage,
            isAvailable: isAvailable !== undefined ? isAvailable : true
        });

        const savedProduct = await newProduct.save();

        shop.products.push(savedProduct._id);
        await shop.save();

        logger.info(`New product created: ${savedProduct._id} for seller: ${shopId}`);
        res.status(201).json({
            success: true,
            message: 'Produit créé avec succès et ajouté à la boutique',
            product: {
                _id: savedProduct._id,
                name: savedProduct.name,
                description: savedProduct.description,
                price: savedProduct.price,
                stock: savedProduct.stock,
                category: savedProduct.category,
                subcategory: savedProduct.subcategory,
                brand: savedProduct.brand,
                features: savedProduct.features,
                dimensions: savedProduct.dimensions,
                weight: savedProduct.weight,
                quantity: savedProduct.quantity,
                tags: savedProduct.tags,
                images: savedProduct.images,
                discountPercentage: savedProduct.discountPercentage,
                isAvailable: savedProduct.isAvailable,
                shop: savedProduct.shop,
                createdAt: savedProduct.createdAt,
                updatedAt: savedProduct.updatedAt
            }
        });
    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        logger.error(`Stack trace: ${error.stack}`);

        if (imageUrls.length > 0) {
            const deletePromises = imageUrls.map(image => 
                cloudinary.cloudinary.uploader.destroy(image.publicId)
            );

            Promise.allSettled(deletePromises).then(results => {
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        logger.error(`Failed to delete image ${index + 1}:`, result.reason);
                    }
                });
            });
        }

        next(new AppError(`Erreur lors de la création du produit: ${error.message}`, 500));
    }
};

// Get all products
const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        // Add filtering options
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.subcategory) filter.subcategory = req.query.subcategory;
        if (req.query.minPrice) filter.price = { $gte: parseFloat(req.query.minPrice) };
        if (req.query.maxPrice) filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };

        // Add sorting options
        const sort = {};
        if (req.query.sortBy) {
            const sortField = req.query.sortBy;
            const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
            sort[sortField] = sortOrder;
        } else {
            sort.createdAt = -1; // Default sort
        }

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .skip(startIndex)
            .limit(limit)
            .sort(sort)
            .select('-__v'); // Exclude the version key

        logger.info(`Retrieved ${products.length} products (page ${page})`);

        res.status(200).json({
            success: true,
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        logger.error(`Error fetching products: ${error.message}`);
        next(new AppError('Error fetching products', 500));
    }
};

// Get a single product by ID
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .populate('shop', 'name') // Populate shop information
            .lean(); // Use lean() for better performance if you don't need a full Mongoose document

        if (!product) {
            logger.warn(`Product not found: ${id}`);
            return next(new AppError('Product not found', 404));
        }

        // Add a field to show if the product is in stock
        product.inStock = product.stock > 0;

        // Calculate discount price if there's a discount percentage
        if (product.discountPercentage) {
            product.discountedPrice = product.price * (1 - product.discountPercentage / 100);
        }

        logger.info(`Retrieved product: ${id}`);
        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        if (error.name === 'CastError') {
            logger.warn(`Invalid product ID format: ${req.params.id}`);
            return next(new AppError('Invalid product ID format', 400));
        }
        logger.error(`Error fetching product: ${error.message}`);
        next(new AppError('Error fetching product', 500));
    }
};


// Update a product by ID
const updateProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Préparez les données de mise à jour
        const updateFields = {};
        const allowedFields = ['name', 'description', 'price', 'category', 'subcategory', 'stock', 'discountPercentage', 'isAvailable'];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateFields[field] = updateData[field];
            }
        });

        // Gérer la mise à jour des image
        if (updateData.image) {
            updateFields.$push = { images: updateData.image };
        } else if (updateData.images && updateData.images.length > 0) {
            updateFields.$push = { images: { $each: updateData.images } };
        }

        // Trouver et mettre à jour le produit
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            logger.warn(`Product not found for update: ${id}`);
            return next(new AppError('Product not found', 404));
        }

        logger.info(`Product updated successfully: ${id}`);
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        if (error.name === 'CastError') {
            logger.warn(`Invalid product ID format: ${req.params.id}`);
            return next(new AppError('Invalid product ID format', 400));
        }
        if (error.name === 'ValidationError') {
            logger.warn(`Validation error updating product: ${error.message}`);
            return next(new AppError(`Validation error: ${error.message}`, 400));
        }
        logger.error(`Error updating product: ${error.message}`);
        next(new AppError(`Error updating product: ${error.message}`, 500));
    }
};

// Delete a product by ID



const deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the product and delete it
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            logger.warn(`Product not found for deletion: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }

        logger.info(`Product deleted: ${id}`);
        res.status(200).json({
            message: 'Product deleted successfully',
            product: deletedProduct
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            logger.warn(`Invalid product ID format: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        logger.error(`Error deleting product: ${error.message}`);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

// Search for products by name or description
const searchProducts = async (req, res) => {
    try {
        const { 
            query, 
            category, 
            subcategory, 
            minPrice, 
            maxPrice, 
            sortBy, 
            sortOrder,
            page = 1,
            limit = 10
        } = req.query;

        const startIndex = (parseInt(page) - 1) * parseInt(limit);

        // Construire la requête de recherche
        let searchQuery = {};

        if (query) {
            searchQuery.$text = { $search: query };
        }

        if (category) {
            searchQuery.category = category;
        }

        if (subcategory) {
            searchQuery.subcategory = subcategory;
        }

        if (minPrice || maxPrice) {
            searchQuery.price = {};
            if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
            if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
        }

        // Construire les options de tri
        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            // Tri par défaut
            sortOptions = { score: { $meta: 'textScore' } };
        }

        const totalProducts = await Product.countDocuments(searchQuery);
        const products = await Product.find(searchQuery)
            .skip(startIndex)
            .limit(parseInt(limit))
            .sort(sortOptions);

        logger.info(`Advanced search returned ${products.length} results (page ${page})`);

        res.status(200).json({
            products,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            totalProducts
        });
    } catch (error) {
        logger.error(`Error in advanced product search: ${error.message}`);
        res.status(500).json({ message: 'Error searching products', error: error.message });
    }
};

// Get top rated products
const getTopRatedProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const topRatedProducts = await Product.getTopRated(limit);

        logger.info(`Retrieved ${topRatedProducts.length} top rated products`);

        res.status(200).json({
            message: 'Top rated products retrieved successfully',
            products: topRatedProducts
        });
    } catch (error) {
        logger.error(`Error fetching top rated products: ${error.message}`);
        res.status(500).json({ message: 'Error fetching top rated products', error: error.message });
    }
};


export { createProduct, getAllProducts, getProductById, updateProductById, deleteProductById, searchProducts, getTopRatedProducts };