import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'],
    index: true
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: [true, 'Product reference is required'],
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required'],
    index: true
  },
  rating: { 
    type: Number, 
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: { 
    type: String, 
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  pros: [String],
  cons: [String],
  images: [{
    url: String,
    caption: String
  }],
  helpfulVotes: {
    type: Number,
    default: 0
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  sellerResponse: {
    text: String,
    createdAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ReviewSchema.index({ product: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });

// Virtual for calculating the age of the review
ReviewSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get average rating for a product
ReviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } }
  ]);
  return result[0]?.averageRating || 0;
};

// Method to mark a review as helpful
ReviewSchema.methods.markHelpful = function() {
  this.helpfulVotes += 1;
  return this.save();
};

// Pre-save middleware to verify purchase
ReviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      user: this.user,
      'items.product': this.product,
      status: 'completed'
    });
    this.verifiedPurchase = !!order;
  }
  next();
});

// Post-save middleware to update product's average rating
ReviewSchema.post('save', async function() {
  const averageRating = await this.constructor.getAverageRating(this.product);
  await mongoose.model('Product').findByIdAndUpdate(this.product, { averageRating });
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review;