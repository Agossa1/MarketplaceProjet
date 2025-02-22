import Product from '../models/ProductModels.js';
import Shop from '../models/ShopModels.js';
import logger from '../utils/logger.js';
import *as  cloudinary from '../utils/cloudinary.js'; // Assurez-vous d'avoir configuré Cloudinary


const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, discountPercentage, stock,
            category, subCategory, brand, features, dimensions,
            weight, tags, sellerId
        } = req.body;

        // Validation de base
        if (!name || !description || !price || !stock || !category || !sellerId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Vérifier si le vendeur (shop) existe
        const shop = await Shop.findById(sellerId);
        if (!shop) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Créer une nouvelle instance de produit
        const newProduct = new Product({
            name,
            description,
            price,
            stock,
            category,
            seller: sellerId,
            subCategory,
            brand,
            features,
            dimensions,
            weight,
            tags
        });

        // Ajouter le pourcentage de réduction si fourni
        if (discountPercentage) {
            newProduct.discountPercentage = discountPercentage;
        }

        // Gérer les images avec Cloudinary
        if (req.body.images && req.body.images.length > 0) {
            newProduct.images = req.body.images.map(image => ({
                url: image.url,
                alt: image.alt || 'Product Image',
                public_id: image.publicId
            }));
        }

        // Sauvegarder le produit
        const savedProduct = await newProduct.save();

        // Ajouter le produit à la liste des produits du vendeur
        shop.products.push(savedProduct._id);
        await shop.save();

        logger.info(`New product created: ${savedProduct._id} for seller: ${sellerId}`);
        res.status(201).json({
            message: 'Product created successfully',
            product: savedProduct
        });
    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};



// Get all products
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();
        const products = await Product.find()
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        logger.info(`Retrieved ${products.length} products (page ${page})`);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        logger.error(`Error fetching products: ${error.message}`);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Get a single product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            logger.warn(`Product not found: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }

        logger.info(`Retrieved product: ${id}`);
        res.status(200).json(product);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            logger.warn(`Invalid product ID format: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        logger.error(`Error fetching product: ${error.message}`);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};
// Update a product by ID
const updateProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, subCategory, stock } = req.body;

        // Find the product
        const product = await Product.findById(id);

        if (!product) {
            logger.warn(`Product not found for update: ${id}`);
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update fields if they are provided
        if (name) product.name = name;
        if (description) product.description = description;
        if (price) product.price = price;
        if (category) product.category = category;
        if (subCategory) product.subCategory = subCategory;
        if (stock !== undefined) product.stock = stock;

        // Save the updated product
        const updatedProduct = await product.save();

        logger.info(`Product updated: ${id}`);
        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            logger.warn(`Invalid product ID format: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        logger.error(`Error updating product: ${error.message}`);
        res.status(500).json({ message: 'Error updating product', error: error.message });
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
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchQuery = { $text: { $search: query } };
        const totalProducts = await Product.countDocuments(searchQuery);
        const products = await Product.find(searchQuery)
            .skip(startIndex)
            .limit(limit)
            .sort({ score: { $meta: 'textScore' } });

        logger.info(`Search query "${query}" returned ${products.length} results (page ${page})`);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        logger.error(`Error searching products: ${error.message}`);
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