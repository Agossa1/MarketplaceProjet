import express from 'express';
const router = express.Router();

// Import routes
import { authMiddleware, checkRole } from '../middleware/AuthMiddleware.js';
import {
    createProduct,
    deleteProductById,
    getAllProducts,
    getProductById,
    updateProductById
} from "../controllers/ProdcutControllers.js";
import {processMultipleImages, processSingleImage} from "../middleware/imagesMiddleware.js";

// Create a new product
router.post('/create-product', authMiddleware, checkRole('seller','admin'), processMultipleImages('images'), createProduct);
router.post('/create-product', authMiddleware, checkRole('seller','admin'), processSingleImage('image'), createProduct);
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById)
router.put('/products/:id', authMiddleware, checkRole('seller,admin'), updateProductById);
router.delete('/products/:id', authMiddleware, checkRole('admin'), deleteProductById);

export { router as ProductRouter };