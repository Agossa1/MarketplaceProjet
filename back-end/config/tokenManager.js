import { V3 } from 'paseto';
import User from '../models/UserModels.js';
import dotenv from 'dotenv';

dotenv.config();

class TokenManager {
  static #secretKey;

  static initialize() {
    const keyString = process.env.PASETO_SECRET_KEY;
    if (!keyString) {
      throw new Error('PASETO_SECRET_KEY n\'est pas défini dans les variables d\'environnement');
    }
    this.#secretKey = Buffer.from(keyString, 'hex');
    
    if (this.#secretKey.length !== 32) {
      throw new Error('PASETO_SECRET_KEY doit faire 32 octets de long');
    }
  }

  static async generateAccessToken(userId) {
    const payload = {
      id: userId,
      type: 'access',
      exp: new Date(Date.now() + 3600000) // 1 heure à partir de maintenant
    };
    const token = await V3.encrypt(payload, this.#secretKey);
    return token.replace('v3.local.', ''); // Supprime le préfixe
  }

  static async generateRefreshToken(userId) {
    const payload = {
      id: userId,
      type: 'refresh',
      exp: new Date(Date.now() + 604800000) // 7 jours à partir de maintenant
    };
    const token = await V3.encrypt(payload, this.#secretKey);
    return token.replace('v3.local.', ''); // Supprime le préfixe
  }

static async verifyToken(token) {
  console.log('Début de la vérification du token PASETO');
  try {
    if (!token) {
      console.log('Token manquant');
      throw new Error('Token manquant');
    }

    // Ajouter le préfixe si nécessaire
    const fullToken = token.startsWith('v3.local.') ? token : 'v3.local.' + token;

    console.log('Tentative de déchiffrement du token');
    const decrypted = await V3.decrypt(fullToken, this.#secretKey);
    console.log('Token PASETO déchiffré avec succès');

    // Vérifier si le token a expiré
    const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    if (decrypted.exp && decrypted.exp < currentTime) {
      console.log('Token expiré');
      throw new Error('Token expiré');
    }

    // Vérifier le type de token (access ou refresh)
    if (!['access', 'refresh'].includes(decrypted.type)) {
      console.log('Type de token invalide:', decrypted.type);
      throw new Error('Type de token invalide');
    }

    console.log('Token valide et non expiré');
    return decrypted;
  } catch (error) {
    console.error('Erreur lors de la vérification du token PASETO:', error);
    if (error.code === 'ERR_PASETO_CLAIM_INVALID') {
      console.log('Erreur de validation PASETO:', error.message);
      throw new Error('Token expiré ou invalide');
    } else if (error.message === 'Token expiré' || error.message === 'Type de token invalide') {
      throw error;
    } else {
      throw new Error('Token invalide ou erreur de déchiffrement');
    }
  }
}

    static async saveToken(userId, token, type, expiresIn) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    await user.addToken(token, type, expiresIn);
  }

static async removeToken(userId, token, type) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    user.tokens = user.tokens.filter(t => !(t.token === token && t.type === type));
    await user.save();
}

  static async hasValidToken(userId, token, type) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    return user.hasValidToken(token, type);
  }

  static async removeExpiredTokens(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    await user.removeExpiredTokens();
  }
}



// Initialiser le TokenManager
TokenManager.initialize();

export default TokenManager;