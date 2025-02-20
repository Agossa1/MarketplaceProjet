import TokenManager from '../config/tokenManager.js';

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
        
        // Ajout des informations de l'utilisateur à la requête
        req.user = { id: decodedToken.id };
        
        next();
    } catch (error) {
        console.error('Erreur dans le middleware d\'authentification:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

export default authMiddleware;