import mongoose from "mongoose";
import { categories } from '../constants/categoriesProduct.js';
import slugify from 'slugify';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    minlength: [3, 'Le nom du produit doit contenir au moins 3 caractères'],
    maxlength: [255, 'Le nom du produit ne peut pas dépasser 255 caractères']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'La description du produit est requise'],
    trim: true,
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères']
  },
  price: {
    type: Number,
    required: [true, 'Le prix du produit est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité du produit est requise'],
    min: [0, 'La quantité ne peut pas être négative']
  },
  category: {
    type: String,
    required: [true, 'La catégorie du produit est requise'],
    enum: categories.map(cat => cat.name)
  },
  subcategory: {
    type: String,
    required: [true, 'La sous-catégorie du produit est requise'],
    validate: {
      validator: function(v) {
        const cat = categories.find(c => c.name === this.category);
        return cat && cat.subcategories.includes(v);
      },
      message: props => `${props.value} n'est pas une sous-catégorie valide pour la catégorie sélectionnée!`
    }
  },
      images: [{
        url: String,
        public_id: String
      }],
  shop: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Le magasin est requis']
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],

  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});



// Méthode pour calculer la note moyenne
ProductSchema.methods.calculateAverageRating = async function() {
  const reviews = await mongoose.model('Review').find({ product: this._id });
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  this.totalRatings = reviews.length;
  await this.save();
};

// Middleware pour mettre à jour la note moyenne après l'ajout d'un avis
ProductSchema.post('save', async function(doc) {
  if (this.isModified('reviews')) {
    await this.calculateAverageRating();
  }
});

ProductSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = slugify(this.name, { lower: true, strict: true, trim: true });
    let uniqueSlug = `${this.shop}-${baseSlug}`;
    let counter = 1;

    while (true) {
      const existingProduct = await this.constructor.findOne({ slug: uniqueSlug });
      if (!existingProduct) {
        break;
      }
      uniqueSlug = `${this.shop}-${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = uniqueSlug;
  }
  next();
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;