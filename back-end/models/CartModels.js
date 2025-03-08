 import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});



// Method to add an item to the cart
CartSchema.methods.addItem = async function(productId, quantity, price) {
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, price });
  }
  
  await this.calculateTotals();
};

// Method to remove an item from the cart
CartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  await this.calculateTotals();
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = async function(productId, newQuantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  if (item) {
    item.quantity = newQuantity;
    await this.calculateTotals();
  }
};

// Method to clear the cart
CartSchema.methods.clearCart = async function() {
  this.items = [];
  await this.calculateTotals();
};

// Method to calculate totals
CartSchema.methods.calculateTotals = async function() {
  this.totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Static method to get populated cart
CartSchema.statics.getPopulatedCart = async function(userId) {
  return this.findOne({ user: userId })
    .populate('items.product')
    .exec();
};

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;