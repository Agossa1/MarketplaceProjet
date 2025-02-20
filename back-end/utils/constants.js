export const AUTH_ERRORS = {
    EMAIL_SEND_ERROR: "Erreur lors de l'envoi de l'email de réinitialisation du mot de passe",
    INVALID_RESET_TOKEN: "Token de réinitialisation invalide ou expiré",
    USER_NOT_FOUND: "Utilisateur non trouvé",
    PASSWORD_RESET_FAILED: "Échec de la réinitialisation du mot de passe",
    INVALID_CREDENTIALS: "Identifiants invalides",
    TOKEN_MISSING: "Token manquant",
    TOKEN_INVALID: "Token invalide ou expiré",
    TOKEN_REVOKED: "Token révoqué",
    UNAUTHORIZED: "Non autorisé",
    INTERNAL_ERROR: "Erreur interne du serveur"
};

export const AUTH_MESSAGES = {
    PASSWORD_RESET_SUCCESS: "Mot de passe réinitialisé avec succès",
    RESET_EMAIL_SENT: "Email de réinitialisation envoyé",
    LOGIN_SUCCESS: "Connexion réussie",
    LOGOUT_SUCCESS: "Déconnexion réussie"
};

export const EMAIL_SUBJECTS = {
    PASSWORD_RESET: "Réinitialisation de votre mot de passe"
};

export const TOKEN_TYPES = {
    ACCESS: "access",
    REFRESH: "refresh",
    RESET_PASSWORD: "reset_password"
};

export const TOKEN_EXPIRATION = {
    ACCESS: '15m',
    REFRESH: '7d',
    RESET_PASSWORD: '1h'
};