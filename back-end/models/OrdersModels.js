import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User is required']
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Seller is required']
  },
  products: [
    {
      product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true, 
        min: [1, 'Quantity must be at least 1']
      },
      price: { 
        type: Number, 
        required: true,
        min: [0, 'Price cannot be negative']
      },
      discountApplied: {
        type: Number,
        default: 0
      }
    }
  ],
  totalAmount: { 
    type: Number, 
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], 
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto']
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  trackingNumber: String,
  estimatedDeliveryDate: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, status: 1 });

// Virtual for order duration
OrderSchema.virtual('orderDuration').get(function() {
  if (this.status === 'delivered') {
    return (this.updatedAt - this.createdAt) / (1000 * 60 * 60 * 24); // Duration in days
  }
  return null;
});

// Pre-save hook to update total amount
OrderSchema.pre('save', function(next) {
  this.totalAmount = this.products.reduce((sum, item) => {
    return sum + (item.price * item.quantity) - item.discountApplied;
  }, 0);
  next();
});

// Static method to get orders by status
OrderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status: status }).populate('user seller products.product');
};

// Method to update order status
OrderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

const Order = mongoose.model('Order', OrderSchema);

export default Order;