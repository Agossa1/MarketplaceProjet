import mongoose from "mongoose";
import bcrypt, {genSalt} from "bcryptjs";

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
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
        validate: {
            validator: function(value) {
                // At least one uppercase, one lowercase, one number, one special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
            },
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        }
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
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
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




// Pre-save hook to hash the password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
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



// Export the User model
const User = mongoose.model('User', UserSchema)

export default User;
