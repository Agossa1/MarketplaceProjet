import express from 'express';
import {
    createProduct,
    deleteProductById,
    getAllProducts,
    getProductById, searchProducts,
    updateProductById
} from "../controllers/ProdcutControllers.js";
import {authMiddleware, checkRole} from "../middleware/AuthMiddleware.js";
import {processMultipleImages, processSingleImage} from "../middleware/imagesMiddleware.js";
const router = express.Router();



router.post('/create-product', authMiddleware, checkRole('Seller', 'admin'), processMultipleImages("images", "shopId"), createProduct);
router.post('/create-product', authMiddleware, checkRole('Seller', 'admin'), processSingleImage("images", "shopId"), createProduct);
router.get('/get-products', getAllProducts);
router.get('/get-product/:id', getProductById);
router.put('/update-product/:id', authMiddleware, checkRole('Seller', 'admin'), processMultipleImages("images", "shopId"), updateProductById);
router.delete('/delete-product/:id', authMiddleware, checkRole('Seller', 'admin'), deleteProductById);
router.get('/search', searchProducts);



export { router as ProductRouter };