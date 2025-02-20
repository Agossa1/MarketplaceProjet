import User from "../models/UserModels.js";
import TokenManager from "../config/tokenManager.js";
import { validateEmail, validatePhone, validatePassword } from "../utils/validators.js";
import logger from "../utils/logger.js";
import { AUTH_ERRORS } from '../utils/errorMessages.js';
import { sendEmailResetPasswordLink} from "../utils/sendEmailResePasseWord.js";

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
            return res.status(400).json({ error: 'User with this email or phone already exists' });
        }

        // Création du nouvel utilisateur
        const newUser = new User({ fullName, email, phone, password });
        await newUser.save();

        // Envoi d'un email de vérification (à implémenter)
        // await sendVerificationEmail(newUser);

        logger.info(`New user registered: ${email}`);
        res.status(201).json({ message: "User registered successfully" });

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

        if (user.isLocked()) {
            logger.warn(`Attempt to login to locked account: ${email}`);
            return res.status(401).json({ error: 'Account locked. Please try again later or reset your password.' });
        }

        let isMatch;
        try {
            isMatch = await user.comparePassword(password);
        } catch (error) {
            logger.error(`Error comparing passwords: ${error.message}`);
            return res.status(500).json({ error: "An error occurred during authentication" });
        }

        if (!isMatch) {
            await user.incrementLoginAttempts();
            if (user.isLocked()) {
                logger.warn(`Account locked due to multiple failed attempts: ${email}`);
                return res.status(401).json({ error: 'Account locked. Please try again later or reset your password.' });
            }
            logger.warn(`Failed login attempt for user: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await user.resetLoginAttempts();

        const accessToken = await TokenManager.generateAccessToken(user._id);
        const refreshToken = await TokenManager.generateRefreshToken(user._id);

        await user.addToken(accessToken, 'access', 3600);
        await user.addToken(refreshToken, 'refresh', 604800);

        await user.removeExpiredTokens();

        user.lastLogin = new Date();
        await user.save();

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
                role: user.role,
                verifiedEmail: user.verifiedEmail
            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ error: "An error occurred during login" });
    }
};

// Resfreshtoken a user
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_MISSING });
        }

        let decoded;
        try {
            decoded = await TokenManager.verifyToken(refreshToken);
        } catch (error) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_INVALID });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_INVALID_TYPE });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_INVALID });
        }

        const tokenExists = user.tokens.some(t => t.token === refreshToken && t.type === 'refresh');
        if (!tokenExists) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_REVOKED });
        }

        // Générer un nouveau access token
        const newAccessToken = await TokenManager.generateAccessToken(user._id);

        // Optionnel : générer un nouveau refresh token
        const newRefreshToken = await TokenManager.generateRefreshToken(user._id);

        // Mettre à jour les tokens dans la base de données
        await user.removeToken(refreshToken);
        await user.addToken(newAccessToken, 'access', 3600);
        await user.addToken(newRefreshToken, 'refresh', 604800);

        // Mettre à jour le cookie avec le nouveau refresh token
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        logger.info(`Tokens refreshed for user: ${user.email}`);
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        logger.error(`Error refreshing token: ${error.message}`);
        res.status(500).json({ error: "An error occurred while refreshing the token" });
    }
};

const verifyTokens = async (req, res) => {
    try {
        // Extraction automatique du token d'accès depuis le header Authorization
        const accessToken = req.headers.authorization?.split(' ')[1];
        
        // Extraction automatique du refresh token depuis les cookies
        const refreshToken = req.cookies.refreshToken;

        if (!accessToken && !refreshToken) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_MISSING });
        }

        let decodedAccess, decodedRefresh;

        if (accessToken) {
            try {
                decodedAccess = await TokenManager.verifyToken(accessToken);
            } catch (error) {
                logger.warn(`Invalid access token: ${error.message}`);
            }
        }

        if (refreshToken) {
            try {
                decodedRefresh = await TokenManager.verifyToken(refreshToken);
            } catch (error) {
                logger.warn(`Invalid refresh token: ${error.message}`);
            }
        }

        if (!decodedAccess && !decodedRefresh) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_INVALID });
        }

        const userId = decodedAccess?.id || decodedRefresh?.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_INVALID });
        }

        let accessTokenValid = false, refreshTokenValid = false;

        if (accessToken) {
            accessTokenValid = await TokenManager.hasValidToken(user._id, accessToken, 'access');
        }
        if (refreshToken) {
            refreshTokenValid = await TokenManager.hasValidToken(user._id, refreshToken, 'refresh');
        }

        if (!accessTokenValid && !refreshTokenValid) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_REVOKED });
        }

        res.status(200).json({ 
            message: "Tokens are valid", 
            userId: user._id,
            accessTokenValid,
            refreshTokenValid
        });
    } catch (error) {
        logger.error(`Error verifying tokens: ${error.message}`);
        res.status(500).json({ error: "An error occurred while verifying tokens" });
    }
};

// Verifie si l'utilisateur est connecté
const isAuthenticated = async (req, res, next) => {
    try {
        // Extraction du token depuis le header de la requête
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const token = authHeader.split(' ')[1];

        // Vérification du token PASETO
        let decodedToken;
        try {
            decodedToken = await TokenManager.verifyToken(token);
        } catch (error) {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }

        // Vérification si le token est valide dans la base de données
        const isValidToken = await TokenManager.hasValidToken(decodedToken.id, token, 'access');
        if (!isValidToken) {
            return res.status(401).json({ error: 'Token révoqué ou expiré' });
        }

        // Si tout est valide, on ajoute les informations de l'utilisateur à la requête
        req.user = {
            id: decodedToken.id,
            // Vous pouvez ajouter d'autres informations de l'utilisateur ici si nécessaire
        };

        // Passer au middleware suivant
        next();
    } catch (error) {
        logger.error('Erreur lors de la vérification de l\'authentification:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Function pour la deconnexion d'un utilisateur'
const logoutUser = async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        const { refreshToken } = req.cookies;
        const logoutAll = req.query.all === 'true';

        if (!accessToken && !refreshToken) {
            return res.status(400).json({ error: AUTH_ERRORS.TOKEN_MISSING });
        }

        let userId;
        if (accessToken) {
            try {
                const decodedToken = await TokenManager.verifyToken(accessToken);
                userId = decodedToken.id;
            } catch (error) {
                logger.warn(`Invalid access token during logout: ${error.message}`);
            }
        }

        if (!userId && refreshToken) {
            try {
                const decodedToken = await TokenManager.verifyToken(refreshToken);
                userId = decodedToken.id;
            } catch (error) {
                logger.warn(`Invalid refresh token during logout: ${error.message}`);
            }
        }

        if (!userId) {
            return res.status(401).json({ error: AUTH_ERRORS.TOKEN_INVALID });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: AUTH_ERRORS.USER_NOT_FOUND });
        }

        if (logoutAll) {
            await user.invalidateAllTokens();
            res.clearCookie('refreshToken');
        } else {
            if (accessToken) {
                await user.removeToken(accessToken);
            }
            if (refreshToken) {
                await user.removeToken(refreshToken);
                res.clearCookie('refreshToken');
            }
        }

        logger.info(`User logged out successfully: ${user.email}${logoutAll ? ' (from all devices)' : ''}`);
        res.status(200).json({ message: `Logged out successfully${logoutAll ? ' from all devices' : ''}` });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: AUTH_ERRORS.USER_NOT_FOUND });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        // Assurez-vous que expirationTime est un nombre entier
        const expirationTime = 1; // 1 heure, par exemple

        await sendEmailResetPasswordLink({
            email: user.email,
            resetToken: resetToken,
            expirationTime: expirationTime
        });

        logger.info(`Password reset token sent to: ${email}`);
        res.status(200).json({ message: 'Password reset token sent to email' });
    } catch (error) {
        logger.error(`Forget password error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};

// Function pour réinitialiser le mot de passe
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: AUTH_ERRORS.MISSING_FIELDS });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ error: AUTH_ERRORS.INVALID_PASSWORD });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: AUTH_ERRORS.INVALID_RESET_TOKEN });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Invalider tous les tokens existants
        await user.invalidateAllTokens();

        logger.info(`Password reset successful for user: ${user.email}`);
        res.status(200).json({ message: 'Password has been reset successfully. Please log in with your new password.' });
    } catch (error) {
        logger.error(`Reset password error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};

// Function pour mettre à jour le mot de passe
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: AUTH_ERRORS.MISSING_FIELDS });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ error: AUTH_ERRORS.INVALID_PASSWORD });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ error: AUTH_ERRORS.USER_NOT_FOUND });
        }

        if (!(await user.correctPassword(currentPassword, user.password))) {
            return res.status(401).json({ error: AUTH_ERRORS.INCORRECT_PASSWORD });
        }

        if (await user.correctPassword(newPassword, user.password)) {
            return res.status(400).json({ error: AUTH_ERRORS.SAME_PASSWORD });
        }

        user.password = newPassword;
        await user.save();

        // Invalider tous les tokens existants sauf le token actuel
        await user.invalidateAllTokens(req.token);

        logger.info(`Password updated for user: ${user.email}`);
        res.status(200).json({ message: 'Password updated successfully. Please log in again with your new password.' });
    } catch (error) {
        logger.error(`Update password error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};


export {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    refreshToken,
    verifyTokens,
    logoutUser,
    isAuthenticated,
    updatePassword,
};



