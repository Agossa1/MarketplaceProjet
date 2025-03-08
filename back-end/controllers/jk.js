import User from "../models/UserModels.js";
import TokenManager from "../config/tokenManager.js";
import { validateEmail, validatePhone, validatePassword } from "../utils/validators.js";
import logger from "../utils/logger.js";
import { AUTH_ERRORS } from '../utils/errorMessages.js';
import { sendEmailResetPasswordLink} from "../utils/sendEmailResePasseWord.js";
import crypto from 'crypto';
import { USER_STATUSES } from '../constants/enums.js';
import { scheduleJob } from 'node-schedule';

// Create a new user
const registerUser = async (req, res) => {
    const { fullName, email, phone, password } = req.body;

    try {
        // Validation des entrées
        if (!validateEmail(email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }
        if (!validatePhone(phone)) {
            return res.status(400).json({ error: "Invalid phone number" });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ error: "Password does not meet security requirements" });
        }

        // Vérification de l'existence de l'utilisateur
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'email already in use' });
            }else{
                return res.status(400).json({ error: 'phone already in use' });
            }
        }

        // Création du nouvel utilisateur
        const newUser = new User({ fullName, email, phone, password });
        await newUser.save();

        // Génération des tokens
        const accessToken = await TokenManager.generateAccessToken(newUser._id);
        const refreshToken = await TokenManager.generateRefreshToken(newUser._id);

        // Ajout des tokens à l'utilisateur
        await newUser.addToken(accessToken, 'access', 3600);
        await newUser.addToken(refreshToken, 'refresh', 604800);

        // Envoi d'un email de vérification (à implémenter)
        // await sendVerificationEmail(newUser);

        logger.info(`New user registered: ${email}`);

        // Réponse avec les données de l'utilisateur et les tokens
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName,
                phone: newUser.phone,
                avatar: newUser.avatar || 'default.png',
                bio: newUser.bio,
                role: Array.isArray(newUser.role) ? newUser.role : [newUser.role],
                verifiedEmail: newUser.verifiedEmail
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        res.status(500).json({ error: "An error occurred while registering the user" });
    }
};

// Login a user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            logger.warn(`Login attempt with non-existent email: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.isLocked && user.isLocked()) {
            logger.warn(`Attempt to login to locked account: ${email}`);
            return res.status(401).json({ error: 'Account locked. Please try again later or reset your password.' });
        }

        let isMatch = false;
        try {
            isMatch = await user.comparePassword(password);
        } catch (error) {
            logger.error(`Error comparing passwords: ${error.message}`);
            return res.status(500).json({ error: "An error occurred during password comparison" });
        }

        if (!isMatch) {
            if (user.incrementLoginAttempts) {
                await user.incrementLoginAttempts();
                if (user.isLocked && user.isLocked()) {
                    logger.warn(`Account locked due to multiple failed attempts: ${email}`);
                    return res.status(401).json({
                        error: 'Account locked.',
                        message: user.formattedLockUntil
                    });
                }
            }
            logger.warn(`Failed login attempt for user: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.resetLoginAttempts) {
            await user.resetLoginAttempts();
        }

        if (user.updateLastLogin) {
            try {
                await user.updateLastLogin();
            } catch (error) {
                logger.error(`Error updating last login: ${error.message}`);
                // Continue with login process even if updating last login fails
            }
        }

        const accessToken = await TokenManager.generateAccessToken(user._id);
        const refreshToken = await TokenManager.generateRefreshToken(user._id);

        if (user.addToken) {
            await user.addToken(accessToken, 'access', 3600);
            await user.addToken(refreshToken, 'refresh', 604800);
        }

        if (user.removeExpiredTokens) {
            await user.removeExpiredTokens();
        }

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                avatar: user.avatar || 'default.png',
                bio: user.bio,
                lastLogin: user.formattedLastLogin,
                role: Array.isArray(user.role) ? user.role : [user.role],
                verifiedEmail: user.verifiedEmail,

            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ error: `An error occurred during login: ${error.message}` });
    }
};

