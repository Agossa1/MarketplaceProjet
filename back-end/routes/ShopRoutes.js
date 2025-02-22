import express from "express";
import {createShop} from "../controllers/ShopsController.js";
import {authMiddleware, checkRole} from "../middleware/AuthMiddleware.js";
const router = express.Router();



router.post('/create-shop', authMiddleware, checkRole('seller', 'admin'), createShop)

export{router as ShopRouter};