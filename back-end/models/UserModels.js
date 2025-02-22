import mongoose from "mongoose";
import bcrypt, {genSalt} from "bcryptjs";
import { validatePassword } from "../utils/validators.js";
import crypto from 'crypto';
import {USER_STATUS_ARRAY, USER_STATUSES} from "../constants/enums.js";


const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
        minlength: [2, "Full name must be at least 2 characters long"],
        maxlength: [50, "Full name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: value => /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(value),
            message: "Please enter a valid email address"
        }
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        validate: {
            validator: value => /^[0-9]{10}$/.test(value),
            message: "Please enter a valid 10-digit phone number"
        }
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    wishList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    status: {
        type: String,
        enum: USER_STATUS_ARRAY,
        default: USER_STATUSES.ACTIVE
    },
    avatar: String,
    isActive: {
        type: Boolean,
        default: true
    },
    verifiedEmail: {
        type: Boolean,
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin:{
        type: Date,
        default: null
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['access', 'refresh'],
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        }
    }],
    oauthProvider: {
        type: String,
        enum: ['google', 'facebook', null],
        default: null
    },
    oauthId: {
        type: String,
        sparse: true,
        unique: true
    },
    // Champs pour la validation d'email
    emailVerificationToken: String,
    emailVerificationExpires: Date,

 
    // Champs pour PASETO (au lieu de JWT)
    pasetoTokens: [{
        token: {
            type: String,
            required: true
        },
        purpose: {
            type: String,
            enum: ['access', 'refresh'],
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        }
    }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



// Formatage du champ 'lastLogin'
UserSchema.virtual('formattedLastLogin').get(function (){
    if (this.lastLogin) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - this.lastLogin) / 1000);

        if (diffInSeconds < 60) {
            return "connecté à l'instant";
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `connecté il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `connecté il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else {
            return this.lastLogin.toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZone: 'UTC'
            });
        }
    } else {
        return "jamais connecté";
    }
})

// Formatage du champ lockUntil
UserSchema.virtual('formattedLockUntil').get(function() {
    if (this.lockUntil) {
        const now = new Date();
        const timeLeft = this.lockUntil - now;

        if (timeLeft <= 0) {
            return "Compte débloqué";
        }

        const seconds = Math.floor(timeLeft / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `Compte bloqué pour encore ${hours} heure${hours > 1 ? 's' : ''} et ${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `Compte bloqué pour encore ${minutes} minute${minutes > 1 ? 's' : ''} et ${seconds % 60} seconde${seconds % 60 > 1 ? 's' : ''}`;
        } else {
            return `Compte bloqué pour encore ${seconds} seconde${seconds > 1 ? 's' : ''}`;
        }
    } else {
        return "Compte non bloqué";
    }
});
// Middleware de pré-validation
UserSchema.pre('validate', function(next) {
    if (this.isModified('password') && !this.password.startsWith('$2b$')) {
        if (!validatePassword(this.password)) {
            this.invalidate('password', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }
    }
    next();
});

 
UserSchema.methods.invalidateAllTokens = function() {
    this.tokens = [];
    return this.save();
};
UserSchema.methods.hasValidToken = function(token, type) {
    const now = new Date();
    return this.tokens.some(t => t.token === token && t.type === type && t.expiresAt > now);
};
// Pre-save hook pour hacher le mot de passe
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    console.log('Password before hashing:', this.password);

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully');
        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});
// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    console.log('Comparing passwords');
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', result);
    return result;
};

// Method to generate a verification token
UserSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};
// Method to increment login attempts and lock account if necessary
UserSchema.methods.incrementLoginAttempts = function() {
    this.loginAttempts += 1;
    if (this.loginAttempts > 7) {
        // Lock account for 1 hour
        this.lockUntil = Date.now() + 3600000;
    }
    return this.save();
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

// Method to check if account is locked
UserSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Method to add a token
UserSchema.methods.addToken = function(token, type, expiresIn) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    this.tokens.push({ token, type, expiresAt });
    return this.save();
};

// Method to remove a specific token
UserSchema.methods.removeToken = function(token) {
    this.tokens = this.tokens.filter(t => t.token !== token);
    return this.save();
};

// Method to remove all expired tokens
UserSchema.methods.removeExpiredTokens = function() {
    const now = new Date();
    this.tokens = this.tokens.filter(t => t.expiresAt > now);
    return this.save();
};

// Method to check if a token is valid
UserSchema.methods.hasValidToken = function(token, type) {
    const now = new Date();
    return this.tokens.some(t => t.token === token && t.type === type && t.expiresAt > now);
};

// Method to generate a secure token
UserSchema.methods.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

// Méthode pour générer un token de vérification d'email
UserSchema.methods.generateEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
    return verificationToken;
};

// Méthode pour générer un token de réinitialisation de mot de passe
UserSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 heure
    return resetToken;
};

// Méthode pour ajouter un token PASETO
UserSchema.methods.addPasetoToken = function(token, purpose, expiresIn) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    this.pasetoTokens.push({ token, purpose, expiresAt });
    return this.save();
};

// Méthode pour vérifier un token PASETO
UserSchema.methods.hasValidPasetoToken = function(token, purpose) {
    const now = new Date();
    return this.pasetoTokens.some(t => t.token === token && t.purpose === purpose && t.expiresAt > now);
};


UserSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 heure
    return resetToken;
};

// Methode de mise a jour du champ lastLogin
UserSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
}
// Export the User model
const User = mongoose.model('User', UserSchema)

export default User;
