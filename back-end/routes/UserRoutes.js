import express from 'express';
import {
    loginUser, refreshToken, verifyTokens,
    registerUser, logoutUser, isAuthenticated, forgotPassword, resetPassword, updatePassword, blockUser
} from "../controllers/AuthControllers.js";

import { authMiddleware, checkRole} from '../middleware/AuthMiddleware.js';

const router = express.Router();

// register user
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/verify-token', verifyTokens);
router.post('/logout', logoutUser);
router.get('/authenticate', authMiddleware, isAuthenticated);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/update-password', authMiddleware, isAuthenticated, updatePassword);
router.post('/block-user/:userId', isAuthenticated, checkRole('admin'), blockUser);
export { router as UserRouter };