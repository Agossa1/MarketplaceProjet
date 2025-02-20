import express from 'express';
import {loginUser, logoutUser, refreshAccessToken, registerUser} from "../controllers/AuthControllers.js";
const router = express.Router();


// register user
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/refresh-token', refreshAccessToken)
router.post('/logout', logoutUser)



export {router as UserRouter };