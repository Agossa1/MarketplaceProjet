import express from 'express';
import {addToCart, getCart} from "../controllers/CartsControllers.js";
import {authMiddleware} from "../middleware/AuthMiddleware.js";
const router = express.Router();




router.post('/add-to-cart', addToCart);
router.get('/get-cart', getCart)

export { router as CartRouter };