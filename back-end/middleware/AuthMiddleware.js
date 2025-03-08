import User from '../models/UserModels.js';
import TokenManager from '../config/tokenManager.js';
import logger from "../utils/logger.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            logger.warn('Tentative d\'accès sans en-tête d\'autorisation');
            return res.status(401).json({ error: 'En-tête d\'autorisation manquant' });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (typeof token !== 'string' || !token.startsWith('v3.local.')) {
            logger.warn('Format de token invalide');
            return res.status(401).json({ error: 'Format de token invalide' });
        }

        logger.info(`Token reçu: ${token.substring(0, 20)}...`);

        let decodedToken;
        try {
            decodedToken = await TokenManager.verifyToken(token);
            logger.info('Token déchiffré avec succès');
        } catch (error) {
            logger.error('Erreur lors de la vérification du token:', error);
            if (error.code === 'ERR_PASETO_DECRYPTION_FAILED') {
                return res.status(401).json({ error: 'Token invalide ou corrompu' });
            } else if (error.code === 'ERR_PASETO_CLAIM_INVALID') {
                return res.status(401).json({ error: 'Token expiré ou invalide' });
            }
            return res.status(401).json({ error: 'Erreur lors de la vérification du token' });
        }

        const user = await User.findById(decodedToken.id);
        if (!user) {
            logger.warn(`Utilisateur non trouvé pour l'ID: ${decodedToken.id}`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        req.user = {
            _id: user._id,
            id: user._id.toString(),
            role: user.role,
            isAdmin: user.role.includes('admin'),
        };

        logger.info(`Utilisateur authentifié: ${user._id}, Rôle: ${user.role}`);

        next();
    } catch (error) {
        logger.error('Erreur dans le middleware d\'authentification:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};
// Vérifier le rôle d'un utilisateur
const checkRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            logger.info(`Vérification du rôle pour l'utilisateur ${req.user.id}: Rôles requis sont ${allowedRoles}`);

            const user = await User.findById(req.user.id);
            if (!user) {
                logger.warn(`Utilisateur non trouvé: ${req.user.id}`);
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            logger.info(`Utilisateur ${user.id} trouvé. Rôle de l'utilisateur: ${user.role}`);

            const userRoles = Array.isArray(user.role) ? user.role : user.role.split(',').map(role => role.trim());

            if (!allowedRoles.some(role => userRoles.includes(role))) {
                logger.warn(`Accès refusé pour l'utilisateur ${user.id}: Permissions insuffisantes`);
                return res.status(403).json({ error: 'Accès refusé. Permissions insuffisantes.' });
            }

            logger.info(`L'utilisateur ${user.id} a l'un des rôles requis: ${allowedRoles}`);
            next();
        } catch (error) {
            logger.error('Erreur lors de la vérification du rôle:', error);
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    };
};

export { authMiddleware, checkRole };