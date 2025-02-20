import User from "../models/UserModels.js";
import TokenManager from "../config/tokenManager.js";

// Create a new user
const registerUser = async (req, res) => {
    const { fullName, email, phone, password } = req.body;

    try {
        // Verification to user existing
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Verification to phone number existing
        const phoneUser = await User.findOne({ phone });
        if (phoneUser) {
            return res.status(400).json({ error: "Phone number already exists" });
        }

        // Verification to email isValid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        // Verification phone number isValid
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: "Invalid phone number" });
        }

        // Verification password length and format
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
        }

        // Create a new User
        const newUser = new User({ fullName, email, phone, password });
        await newUser.save();

        // Send verification email
        // TODO: Implement email verification logic

        // Return a success message
        res.json({ message: "User registered successfully" });

    } catch (error) {
        return res.status(500).json({ error: "Error registering user", details: error.message });
    }
};

// Function to login a user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier si le mot de passe correspond
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Mot de passe invalide' });
        }

        // Générer les tokens PASETO
        const accessToken = await TokenManager.generateAccessToken(user._id);
        const refreshToken = await TokenManager.generateRefreshToken(user._id);

        // Sauvegarder les tokens
        await TokenManager.saveToken(user._id, accessToken, 'access', 3600); // 1 heure
        await TokenManager.saveToken(user._id, refreshToken, 'refresh', 604800); // 7 jours

        // Supprimer les tokens expirés
        await TokenManager.removeExpiredTokens(user._id);

        // Set the refresh token as an HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            accessToken,
            user: { id: user._id, email: user.email, fullName: user.fullName }
        });
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la connexion de l'utilisateur", details: error.message });
    }
};

const refreshAccessToken = async (req, res) => {
    console.log('Refresh token request received');
    console.log('Request cookies:', req.cookies);
    console.log('Request body:', req.body);

    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        console.log('Refresh token extracted:', refreshToken);

        if (!refreshToken) {
            console.log('No refresh token found');
            return res.status(400).json({ error: 'Refresh token manquant' });
        }

        // Vérifier si le token commence par "v3.local." (PASETO token)
        if (!refreshToken.startsWith('v3.local.')) {
            console.error('Le token reçu n\'est pas un token PASETO valide');
            return res.status(401).json({ error: 'Format de refresh token invalide' });
        }

        // Vérifier le refresh token
        let decoded;
        try {
            decoded = await TokenManager.verifyToken(refreshToken);
            console.log('Token successfully decoded:', decoded);
        } catch (verifyError) {
            console.error('Erreur lors de la vérification du token:', verifyError);
            return res.status(401).json({ error: 'Refresh token invalide' });
        }

        if (!decoded || decoded.type !== 'refresh') {
            console.error('Token décodé invalide ou de mauvais type:', decoded);
            return res.status(401).json({ error: 'Refresh token invalide' });
        }

        // Vérifier si le token est toujours valide dans la base de données
        const isValid = await TokenManager.hasValidToken(decoded.id, refreshToken, 'refresh');
        console.log('Token validity in database:', isValid);

        if (!isValid) {
            return res.status(401).json({ error: 'Refresh token expiré ou révoqué' });
        }

        // Générer un nouveau access token
        const newAccessToken = await TokenManager.generateAccessToken(decoded.id);
        console.log('New access token generated');

        // Sauvegarder le nouveau access token
        await TokenManager.saveToken(decoded.id, newAccessToken, 'access', 3600); // 1 heure
        console.log('New access token saved');

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        return res.status(500).json({ error: "Erreur lors du rafraîchissement du token" });
    }
};

// Function to logout a user
const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token manquant' });
        }

        // Vérifier le refresh token
        const decoded = await TokenManager.verifyToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ error: 'Token invalide' });
        }

        // Supprimer le refresh token de la base de données
        await TokenManager.removeToken(decoded.id, refreshToken);

        // Effacer le cookie du refresh token
        res.clearCookie('refreshToken');

        res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la déconnexion", details: error.message });
    }
};



export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
};


