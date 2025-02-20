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
    return await V3.encrypt(payload, this.#secretKey);
  }

  static async generateRefreshToken(userId) {
    const payload = {
      id: userId,
      type: 'refresh',
      exp: new Date(Date.now() + 604800000) // 7 jours à partir de maintenant
    };
    return await V3.encrypt(payload, this.#secretKey);
  }

  static async verifyToken(token) {
  try {
    const decrypted = await V3.decrypt(token, this.#secretKey);
    console.log('Token PASETO déchiffré avec succès:', decrypted);

    // Vérifier si le token a expiré
    if (new Date(decrypted.exp) < new Date()) {
      throw new Error('Token expiré');
    }

    return decrypted;
  } catch (error) {
    console.error('Erreur lors de la vérification du token PASETO:', error);
    throw new Error('Token invalide ou expiré');
  }
}

  static async saveToken(userId, token, type, expiresIn) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    await user.addToken(token, type, expiresIn);
  }

  static async removeToken(userId, token) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    await user.removeToken(token);
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