import express from 'express';
import {
    loginUser, refreshToken, verifyTokens,
    registerUser, logoutUser, isAuthenticated, forgotPassword, resetPassword, updatePassword
} from "../controllers/AuthControllers.js";

import authMiddleware from "../middleware/AuthMiddleware.js";
const router = express.Router();

// register user
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/verify-token', verifyTokens);
router.post('/logout', logoutUser);
router.post('/authenticate', authMiddleware, isAuthenticated);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/update-password', authMiddleware, isAuthenticated, updatePassword);
export { router as UserRouter };