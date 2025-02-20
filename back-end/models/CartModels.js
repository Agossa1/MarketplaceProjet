import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: [true, 'Product reference is required']
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'], 
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  selectedOptions: {
    color: String,
    size: String,
    // Add other product-specific options as needed
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const CartSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'], 
    unique: true 
  },
  items: [CartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
CartSchema.index({ user: 1 });

// Virtual for item count
CartSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Pre-save hook to update totals
CartSchema.pre('save', function(next) {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.lastUpdated = new Date();
  next();
});

// Method to add item to cart
CartSchema.methods.addItem = function(productId, quantity, price, options) {
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price;
    existingItem.selectedOptions = { ...existingItem.selectedOptions, ...options };
  } else {
    this.items.push({ product: productId, quantity, price, selectedOptions: options });
  }

  return this.save();
};

// Method to remove item from cart
CartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

// Method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Static method to get cart with populated items
CartSchema.statics.getPopulatedCart = function(userId) {
  return this.findOne({ user: userId }).populate('items.product');
};

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;