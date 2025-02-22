import mongoose from 'mongoose';
import slugify from 'slugify';

const ProductSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'A product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
    index: true
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'], 
    min: [0, 'Price cannot be negative'],
    set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  stock: { 
    type: Number, 
    required: [true, 'Stock quantity is required'], 
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value for stock'
    }
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    index: true
  },
  subCategory: String,
  brand: String,
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shops',
    required: [true, 'Seller information is required']
  },
  images: [{ 
    url: { type: String, required: true },
    alt: String
  }],
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
      },
      comment: String,
      date: { type: Date, default: Date.now }
    }
  ],
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must not be more than 5'],
    set: function(val) {
      if (this.reviews.length === 0) return 0;
      const avg = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
      return Math.round(avg * 10) / 10; // Round to 1 decimal place
    }
  },
  numReviews: {
    type: Number,
    default: 0
  },
  features: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch', 'm'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'g', 'lb'],
      default: 'kg'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexing for better query performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, subCategory: 1 });
ProductSchema.index({ price: 1 });

// Virtual for discounted price
ProductSchema.virtual('discountedPrice').get(function() {
  if (!this.discountPercentage) return this.price;
  return Math.round((this.price * (100 - this.discountPercentage) / 100) * 100) / 100;
});

// Pre-save hook to create slug
ProductSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Static method to get top rated products
ProductSchema.statics.getTopRated = function(limit = 5) {
  return this.find({ averageRating: { $gte: 4 } })
    .sort('-averageRating')
    .limit(limit);
};

// Method to add a review
ProductSchema.methods.addReview = function(userId, rating, comment) {
  this.reviews.push({ user: userId, rating, comment });
  this.numReviews = this.reviews.length;
  this.averageRating = this.reviews.reduce((acc, item) => item.rating + acc, 0) / this.reviews.length;
  return this.save();
};

const Product = mongoose.model('Product', ProductSchema);

export default Product;