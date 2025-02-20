import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'],
    index: true
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: [true, 'Order reference is required'],
    index: true
  },
  amount: { 
    type: Number, 
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: { 
    type: String, 
    required: [true, 'Currency is required'],
    enum: ['XOF', 'USD', 'EUR', 'GBP', 'NGN'],
    default: 'XOF'
  },
  method: { 
    type: String, 
    required: [true, 'Payment method is required'],
    enum: ['Mobile Money', 'Visa', 'Mastercard', 'PayPal', 'Stripe', 'Paystack', 'Flutterwave']
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'blocked', 'released', 'failed', 'refunded'],
    default: 'pending'
  },
  isBlocked: {
    type: Boolean,
    default: true
  },
  blockedAt: {
    type: Date
  },
  releasedAt: {
    type: Date
  },
  transactionDetails: {
    type: Map,
    of: String
  },
    transactionHash: {
        type: String,
        unique: true
    },
    paymentProvider: {
    type: String,
    required: [true, 'Payment provider is required'],
    enum: ['PayPal', 'Stripe', 'Flutterwave', 'Paystack', 'MTN', 'Orange', 'Moov']
  },
  paymentProviderReference: {
    type: String,
    unique: true,
    sparse: true
  },
  refundDetails: {
    amount: Number,
    reason: String,
    date: Date
  },
  metadata: {
    type: Map,
    of: String
  },
    refundStatus: {
        type: String,
        enum: ['not_requested', 'requested', 'approved', 'rejected', 'processed'],
        default: 'not_requested'
    },
    refundRequest: {
        reason: String,
        requestedAt: Date,
        processedAt: Date,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ isBlocked: 1 });

// Virtual for payment age
PaymentSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to block payment
PaymentSchema.methods.blockPayment = async function() {
  if (this.status !== 'processing') {
    throw new Error('Only processing payments can be blocked');
  }
  this.status = 'blocked';
  this.isBlocked = true;
  this.blockedAt = new Date();
  return this.save();
};

// Method to release payment
PaymentSchema.methods.releasePayment = async function() {
  if (this.status !== 'blocked') {
    throw new Error('Only blocked payments can be released');
  }
  this.status = 'released';
  this.isBlocked = false;
  this.releasedAt = new Date();
  return this.save();
};

// Method to process refund
PaymentSchema.methods.processRefund = async function(amount, reason) {
  if (this.status !== 'released') {
    throw new Error('Only released payments can be refunded');
  }
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed original payment amount');
  }
  this.status = 'refunded';
  this.refundDetails = { amount, reason, date: new Date() };
  return this.save();
};

// Pre-save hook to update order status
PaymentSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Order = mongoose.model('Order');
    switch (this.status) {
      case 'blocked':
        await Order.findByIdAndUpdate(this.order, { paymentStatus: 'paid', deliveryStatus: 'pending' });
        break;
      case 'released':
        await Order.findByIdAndUpdate(this.order, { paymentStatus: 'completed', deliveryStatus: 'delivered' });
        break;
      case 'refunded':
        await Order.findByIdAndUpdate(this.order, { paymentStatus: 'refunded' });
        break;
    }
  }
  next();
});

// Post-save hook to update user's total spend
PaymentSchema.post('save', async function() {
  if (this.status === 'released') {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, { $inc: { totalSpend: this.amount } });
  }
});
PaymentSchema.methods.generateTransactionHash = function() {
    const dataToHash = `${this.user}${this.order}${this.amount}${this.currency}${this.method}${this.status}${this.createdAt}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

// Hook pre-save pour générer automatiquement le hash avant la sauvegarde
PaymentSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('amount') || this.isModified('status')) {
        this.transactionHash = this.generateTransactionHash();
    }
    next();
});

// Méthode pour vérifier l'intégrité de la transaction
PaymentSchema.methods.verifyTransactionIntegrity = function() {
    return this.transactionHash === this.generateTransactionHash();
};
// Méthode pour demander un remboursement
PaymentSchema.methods.requestRefund = async function(reason) {
    if (this.status !== 'released') {
        throw new Error('Only released payments can be refunded');
    }
    if (this.refundStatus !== 'not_requested') {
        throw new Error('Refund has already been requested or processed');
    }
    this.refundStatus = 'requested';
    this.refundRequest = {
        reason: reason,
        requestedAt: new Date()
    };
    return this.save();
};

// Méthode pour approuver un remboursement
PaymentSchema.methods.approveRefund = async function(approvedBy) {
    if (this.refundStatus !== 'requested') {
        throw new Error('Refund must be requested before approval');
    }
    this.refundStatus = 'approved';
    this.refundRequest.approvedBy = approvedBy;
    this.refundRequest.processedAt = new Date();
    return this.save();
};

// Méthode pour rejeter un remboursement
PaymentSchema.methods.rejectRefund = async function() {
    if (this.refundStatus !== 'requested') {
        throw new Error('Refund must be requested before rejection');
    }
    this.refundStatus = 'rejected';
    this.refundRequest.processedAt = new Date();
    return this.save();
};

// Méthode pour traiter le remboursement
PaymentSchema.methods.processRefund = async function() {
    if (this.refundStatus !== 'approved') {
        throw new Error('Refund must be approved before processing');
    }
    this.status = 'refunded';
    this.refundStatus = 'processed';
    this.refundDetails = {
        amount: this.amount,
        reason: this.refundRequest.reason,
        date: new Date()
    };
    return this.save();
};

// Hook pre-save pour mettre à jour le statut de la commande
PaymentSchema.pre('save', async function(next) {
    if (this.isModified('refundStatus')) {
        const Order = mongoose.model('Order');
        switch (this.refundStatus) {
            case 'approved':
                await Order.findByIdAndUpdate(this.order, { refundStatus: 'approved' });
                break;
            case 'processed':
                await Order.findByIdAndUpdate(this.order, { refundStatus: 'processed', paymentStatus: 'refunded' });
                break;
        }
    }
    next();
});
const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;