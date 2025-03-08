import mongoose from 'mongoose';
import { categories } from '../constants/categoriesShop.js';

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du magasin est requis'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'La description du magasin est requise'],
    trim: true,
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères']
  },
categories: {
  type: [String],
  required: [true, 'Les catégories du magasin sont requises'],
  validate: {
    validator: function(v) {
      return v.length > 0 && v.every(cat => categories.some(c => c.name === cat));
    },
    message: props => `${props.value} doit contenir au moins une catégorie valide!`
  }
},
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  subcategories: {
    type: [String],
    validate: {
      validator: function(v) {
        const shopCategories = this.categories;
        return v.every(subcat =>
            categories
                .filter(cat => shopCategories.includes(cat.name))
                .some(cat => cat.subcategories.includes(subcat))
        );
      },
      message: props => `${props.value} contient une ou plusieurs sous-catégories invalides pour les catégories sélectionnées!`
    }
  },
 logo: {
  url: {
    type: String,
    default: 'default-shop-logo.png'
  },
  public_id: {
    type: String,
    default: ''
  }
},
coverImage: {
  url: {
    type: String,
    default: 'default-shop-banner.png'
  },
  public_id: {
    type: String,
    default: ''
  }
},
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    category: String,
    subcategory: String,
    price: Number
  }],
  ordersHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire du magasin est requis'],
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  contactEmail: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide']
  },
  contactPhone: {
    type: String,
    match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Veuillez fournir un numéro de téléphone valide']
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  tags: [String],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index géospatial pour les recherches basées sur la localisation
ShopSchema.index({ location: '2dsphere' });

// Méthode pour calculer la note moyenne
ShopSchema.methods.calculateAverageRating = async function() {
  const reviews = await mongoose.model('ReviewsShop').find({ shop: this._id });
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(2)) : 0;
  this.totalRatings = reviews.length;
  await this.save();
};

// Middleware pour mettre à jour la note moyenne après l'ajout d'un avis
ShopSchema.post('save', async function(doc, next) {
  if (this.isModified('reviews')) {
    await doc.calculateAverageRating();
  }
  next();
});

// Méthode virtuelle pour obtenir l'URL complète du logo
ShopSchema.virtual('logoUrl').get(function() {
  return this.logo ? `${process.env.BASE_URL}/uploads/shops/${this.logo}` : null;
});

// Methode pour obtenir les avis du magasin
ShopSchema.methods.getReviews = async function() {
  return await mongoose.model('ReviewsShop').find({ shop: this._id }).populate('user', 'name avatar');
};

// Middleware pour récupérer les notes moyennes des avis des clients
ShopSchema.post('find', async function(docs) {
  if (!Array.isArray(docs)) return;

  const shopIds = docs.map(doc => doc._id);
  const reviews = await mongoose.model('ReviewsShop').aggregate([
    { $match: { shop: { $in: shopIds } } },
    { $group: {
        _id: '$shop',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }}
  ]);

  const reviewMap = new Map(reviews.map(r => [r._id.toString(), r]));

  docs.forEach(shop => {
    const shopReviews = reviewMap.get(shop._id.toString());
    shop.averageRating = shopReviews ? shopReviews.averageRating : 0;
    shop.totalRatings = shopReviews ? shopReviews.reviewCount : 0;
  });
});

// Validation des catégories et sous-catégories
ShopSchema.pre('validate', function(next) {
  const validCategories = categories.map(cat => cat.name);
  const invalidCategories = this.categories.filter(cat => !validCategories.includes(cat));
  if (invalidCategories.length > 0) {
    return next(new Error(`Catégorie(s) invalide(s): ${invalidCategories.join(', ')}`));
  }

  const validSubcategories = this.categories.flatMap(catName => {
    const category = categories.find(c => c.name === catName);
    return category ? category.subcategories : [];
  });
  const invalidSubcategories = this.subcategories.filter(subcat => !validSubcategories.includes(subcat));
  if (invalidSubcategories.length > 0) {
    return next(new Error(`Sous-catégorie(s) invalide(s): ${invalidSubcategories.join(', ')}`));
  }

  next();
});

// Méthode pour ajouter un produit au magasin
ShopSchema.methods.addProduct = async function(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("ID de produit invalide");
  }

  const existingProduct = this.products.find(product => 
    product.productId && product.productId.toString() === productId.toString()
  );

  if (existingProduct) {
    throw new Error("Le produit est déjà dans le magasin");
  }

  const product = await mongoose.model('Product').findById(productId);

  if (!product) {
    throw new Error("Produit non trouvé");
  }

  this.products.push({
    productId: product._id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory,
    price: product.price
  });

  await this.save();

  return {
    success: true,
    message: "Produit ajouté avec succès au magasin",
    product: {
      id: product._id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price
    }
  };
};

// Méthode pour obtenir tous les produits du magasin
ShopSchema.methods.getProducts = async function() {
  return this.products;
};

// Méthode pour obtenir les commandes appartenant au magasin
ShopSchema.methods.getOrders = async function() {
  return await mongoose.model('Order').find({ shop: this._id }).populate('user', 'name email');
};

// Méthode statique pour mettre à jour la note moyenne de la boutique
ShopSchema.statics.updateShopRating = async function(shopId) {
  const result = await mongoose.model('ReviewsShop').aggregate([
    { $match: { shop: new mongoose.Types.ObjectId(shopId) } },
    { $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }}
  ]);

  const update = result.length > 0
    ? { averageRating: result[0].averageRating, totalRatings: result[0].totalReviews }
    : { averageRating: 0, totalRatings: 0 };

  await this.findByIdAndUpdate(shopId, update);
};

// Ajoutez cette méthode à la fin du fichier, juste avant l'export
ShopSchema.methods.updateUserAfterShopCreation = async function() {
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(
      this.owner,
      {
        $push: { shops: this._id },
        $addToSet: { role: 'seller' }
      },
      { new: true, runValidators: true }
  );
};

const Shop = mongoose.model('Shop', ShopSchema);

export default Shop;