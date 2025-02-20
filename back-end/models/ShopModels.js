import mongoose from 'mongoose';



const SellerSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User reference is required'],
    unique: true
  },
  shopName: { 
    type: String, 
    required: [true, 'Shop name is required'], 
    trim: true,
    maxlength: [50, 'Shop name cannot exceed 50 characters']
  },
  shopSlug: {
    type: String,
    unique: true,
    lowercase: true
  },
  shopLogo: { 
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
    coverImage: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  categories: [{ type: String }],
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  contactPhone: {
    type: String,
    validate: {
      validator: function(v) {
        return /\d{10}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  paymentInfo: {
    accountNumber: String,
    bankName: String
  },
  policies: {
    returns: String,
    shipping: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexing for better query performance
SellerSchema.index({ shopName: 'text', description: 'text' });
SellerSchema.index({ categories: 1 });
SellerSchema.index({ rating: -1 });

// Virtual for the number of products
SellerSchema.virtual('productCount').get(function() {
  return this.products.length;
});

// Pre-save hook to create shop slug
SellerSchema.pre('save', function(next) {
  this.shopSlug = this.shopName.toLowerCase().replace(/\s+/g, '-');
  next();
});

// Static method to get top rated sellers
SellerSchema.statics.getTopRated = function(limit = 10) {
  return this.find().sort({ rating: -1 }).limit(limit);
};

// Method to update total sales
SellerSchema.methods.updateTotalSales = function(amount) {
  this.totalSales += amount;
  return this.save();
};

const Seller = mongoose.model('Seller', SellerSchema);

export default Seller;