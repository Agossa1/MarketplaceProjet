import express from 'express';
import {
    createOrder,
    deleteOrderById,
    getAllOrdersForUser,
    getOrderById,
    updateOrderById
} from "../controllers/OrderControllers.js";
import {authMiddleware, checkRole} from "../middleware/AuthMiddleware.js";
const router = express.Router();

router.post('/create-order', authMiddleware, createOrder);
router.get('/get-my-orders', authMiddleware, getAllOrdersForUser);
router.get('/get-orders', authMiddleware, checkRole('seller', 'admin'), getAllOrdersForUser);
router.get('/get-order/:id', authMiddleware, checkRole('seller', 'admin'), getOrderById);
router.put('/update-order/:id', authMiddleware, checkRole('seller', 'admin'), updateOrderById);
router.delete('/delete-order/:id', authMiddleware, checkRole('seller', 'admin'), deleteOrderById);


export {router as OrderRouter };