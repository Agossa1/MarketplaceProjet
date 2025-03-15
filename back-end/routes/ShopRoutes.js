import express from "express";
import {
    createShop,
    deleteShopById, followShop,
    getAllShops,
    getShopById, getShopByUserId, reviewShop,
    unfollowShop,
    updateShopById
} from "../controllers/ShopsController.js";
import {authMiddleware, checkRole} from "../middleware/AuthMiddleware.js";
import {processMultipleImages} from "../middleware/imagesMiddleware.js";

const router = express.Router();


router.post('/create-shop', authMiddleware, processMultipleImages(), createShop);

router.get('/get-shops', getAllShops)
router.get('/get-shops/:id', getShopById)
router.put('/update-shop/:id', authMiddleware, checkRole('seller', 'admin'), updateShopById)
router.delete('/delete-shop/:id', authMiddleware, checkRole('seller', 'admin'), deleteShopById)

// Route pour s'abonner à un shop
router.post('/shops/:id/follow', authMiddleware, followShop);
router.post('/shops/:id/unfollow', authMiddleware, unfollowShop);
router.post('/review-shop/:id/review', authMiddleware, reviewShop);
// Route pour obtenir la boutique d'un utilisateur spécifique
router.get('/get-shop-by-user-id/:userId', authMiddleware, getShopByUserId);
export{router as ShopRouter};