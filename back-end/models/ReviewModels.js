import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'],
  },
  reviewedItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: [true, 'Reviewed item reference is required'],
    refPath: 'itemType',
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Product', 'Shop'],
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: function() { return this.itemType === 'Product'; },
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
ReviewSchema.index({ reviewedItem: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });

// Virtual for calculating the age of the review
ReviewSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get average rating for a product or shop
ReviewSchema.statics.getAverageRating = async function(itemId, itemType) {
  const result = await this.aggregate([
    { $match: { reviewedItem: itemId, itemType: itemType, status: 'approved' } },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } }
  ]);
  return result[0]?.averageRating || 0;
};

// Method to mark a review as helpful
ReviewSchema.methods.markHelpful = function() {
  this.helpfulVotes += 1;
  return this.save();
};

// Pre-save middleware to verify purchase for product reviews
ReviewSchema.pre('save', async function(next) {
  if (this.isNew && this.itemType === 'Product') {
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      user: this.user,
      'items.product': this.reviewedItem,
      status: 'completed'
    });
    this.verifiedPurchase = !!order;
  }
  next();
});

// Post-save middleware to update product's or shop's average rating
ReviewSchema.post('save', async function() {
  const averageRating = await this.constructor.getAverageRating(this.reviewedItem, this.itemType);
  if (this.itemType === 'Product') {
    await mongoose.model('Product').findByIdAndUpdate(this.reviewedItem, { averageRating });
  } else if (this.itemType === 'Shop') {
    await mongoose.model('Shop').findByIdAndUpdate(this.reviewedItem, { rating: averageRating });
  }
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review;