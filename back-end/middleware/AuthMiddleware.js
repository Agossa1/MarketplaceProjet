import TokenManager from '../config/tokenManager.js';
import User from '../models/UserModels.js';
import logger from "../utils/logger.js";

const authMiddleware = async (req, res, next) => {
    try {
        // Extraction du token depuis le header de la requête
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant ou invalide' });
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

        // Récupération des informations complètes de l'utilisateur
        const user = await User.findById(decodedToken.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Ajout des informations de l'utilisateur à la requête
       // Ajout des informations de l'utilisateur à la requête
req.user = {
    _id: user._id,
    id: user._id,
    role: user.role,
    isAdmin: user.role.includes('admin'),
    // Ajoutez d'autres champs nécessaires ici
};

        logger.info(`User authenticated: ${user._id}, Role: ${user.role}`);

        next();
    } catch (error) {
        logger.error('Erreur dans le middleware d\'authentification:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Verifier le role d'un utilisateur
const checkRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            logger.info(`Checking role for user ${req.user.id}: Required roles are ${allowedRoles}`);

            const user = await User.findById(req.user.id);
            if (!user) {
                logger.warn(`User not found: ${req.user.id}`);
                return res.status(404).json({ error: 'User not found' });
            }

            logger.info(`User ${user.id} found. User role is ${user.role}`);

            const userRoles = Array.isArray(user.role) ? user.role : user.role.split(',').map(role => role.trim());

            if (!allowedRoles.some(role => userRoles.includes(role))) {
                logger.warn(`Access denied for user ${user.id}: Insufficient permissions`);
                return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
            }

            logger.info(`User ${user.id} has one of the required roles: ${allowedRoles}`);
            next();
        } catch (error) {
            logger.error('Error checking role:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};


export {authMiddleware, checkRole};