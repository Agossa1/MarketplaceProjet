import Cart from '../models/CartModels.js';
import Product from '../models/ProductModels.js';
import logger from '../utils/logger.js';

export const getCart = async (req, res) => {
    try {
        let cart;
        let userId;

        if (req.user) {
            // Utilisateur authentifié
            userId = req.user._id;
            logger.info(`Récupération du panier pour l'utilisateur authentifié: ${userId}`);
            cart = await Cart.getPopulatedCart(userId);

            if (!cart) {
                logger.info(`Panier non trouvé pour l'utilisateur: ${userId}, création d'un nouveau panier`);
                cart = new Cart({ user: userId, items: [] });
                await cart.save();
            }
        } else {
            // Utilisateur non authentifié
            logger.info(`Récupération du panier pour un utilisateur non authentifié`);
            
            // Vérifier si req.session existe
            if (!req.session) {
                logger.warn('Session non initialisée');
                req.session = {};
            }

            // Initialiser le panier de session s'il n'existe pas
            if (!req.session.cart) {
                req.session.cart = { items: [], totalQuantity: 0, totalAmount: 0 };
            }
            cart = req.session.cart;
        }

        logger.info(`Panier récupéré avec succès${userId ? ` pour l'utilisateur: ${userId}` : ''}`);
        res.status(200).json({
            message: "Panier récupéré avec succès",
            cart
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération du panier: ${error.message}`);
        res.status(500).json({ 
            message: "Erreur serveur lors de la récupération du panier", 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Validate input
        if (!productId || !quantity || quantity <= 0) {
            logger.warn(`Invalid input - ProductId: ${productId}, Quantity: ${quantity}`);
            return res.status(400).json({ message: "Invalid product ID or quantity" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            logger.warn(`Produit non trouvé: ${productId}`);
            return res.status(404).json({ message: "Produit non trouvé" });
        }

        // Check if product is available and in stock
        if (!product.isAvailable || product.stock < quantity) {
            logger.warn(`Produit non disponible ou stock insuffisant: ${productId}`);
            return res.status(400).json({ message: "Produit non disponible ou stock insuffisant" });
        }

        let cart;
        if (req.user) {
            // Utilisateur connecté
            const userId = req.user._id;
            logger.info(`Ajout au panier - Utilisateur connecté: ${userId}, Produit: ${productId}, Quantité: ${quantity}`);

            cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
                logger.info(`Nouveau panier créé pour l'utilisateur: ${userId}`);
            }
        } else {
            // Utilisateur non connecté
            logger.info(`Ajout au panier - Utilisateur non connecté, Produit: ${productId}, Quantité: ${quantity}`);

            // Initialiser la session si elle n'existe pas
            if (!req.session) {
                req.session = {};
            }

            // Utiliser un panier temporaire stocké dans la session
            if (!req.session.cart) {
                req.session.cart = { items: [], totalQuantity: 0, totalAmount: 0 };
            }
            cart = req.session.cart;
        }

        // Fonction pour ajouter un item au panier (similaire à la méthode addItem du modèle Cart)
        const addItemToCart = (cart, productId, quantity, price) => {
            const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity, price });
            }
        };

        addItemToCart(cart, productId, quantity, product.price);

        // Recalculate cart totals
        if (req.user) {
            await cart.calculateTotals();
            await cart.save();
            cart = await Cart.getPopulatedCart(req.user._id);
        } else {
            // Calculer les totaux pour le panier de session
            cart.totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
            cart.totalAmount = cart.items.reduce((total, item) => total + (item.quantity * item.price), 0);
        }

        logger.info(`Produit ajouté au panier avec succès`);
        res.status(200).json({
            message: "Produit ajouté au panier avec succès",
            cart: cart
        });
    } catch (error) {
        logger.error(`Erreur lors de l'ajout au panier: ${error.message}`);
        res.status(500).json({
            message: "Erreur lors de l'ajout au panier",
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};
// Supprimer un produit du panier
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        if (!productId) {
            logger.warn(`Tentative de suppression sans ID de produit valide`);
            return res.status(400).json({ message: "ID de produit non fourni" });
        }

        logger.info(`Suppression du produit ${productId} du panier de l'utilisateur ${userId}`);

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            logger.warn(`Panier non trouvé pour l'utilisateur: ${userId}`);
            return res.status(404).json({ message: "Panier non trouvé" });
        }

        const initialItemCount = cart.items.length;
        await cart.removeItem(productId);
        
        // Check if the item was actually removed
        if (cart.items.length === initialItemCount) {
            logger.warn(`Produit ${productId} non trouvé dans le panier de l'utilisateur ${userId}`);
            return res.status(404).json({ message: "Produit non trouvé dans le panier" });
        }

        // Recalculate cart totals
        cart.calculateTotals();
        await cart.save();

        logger.info(`Produit ${productId} supprimé du panier avec succès pour l'utilisateur ${userId}`);
        
        // Get the updated cart with populated items
        const updatedCart = await Cart.getPopulatedCart(userId);

        res.status(200).json({
            message: "Produit supprimé du panier avec succès",
            cart: updatedCart
        });
    } catch (error) {
        logger.error(`Erreur lors de la suppression du produit du panier: ${error.message}`);
        res.status(500).json({ 
            message: "Erreur lors de la suppression du produit du panier", 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};

// Mettre à jour la quantité d'un produit dans le panier
export const updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!productId || !quantity || isNaN(quantity) || quantity < 0) {
            logger.warn(`Invalid input - ProductId: ${productId}, Quantity: ${quantity}`);
            return res.status(400).json({ message: "ID de produit invalide ou quantité invalide" });
        }

        logger.info(`Mise à jour de la quantité - Utilisateur: ${userId}, Produit: ${productId}, Nouvelle quantité: ${quantity}`);

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            logger.warn(`Panier non trouvé pour l'utilisateur: ${userId}`);
            return res.status(404).json({ message: "Panier non trouvé" });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex > -1) {
            // Check product availability and stock
            const product = await Product.findById(productId);
            if (!product) {
                logger.warn(`Produit non trouvé: ${productId}`);
                return res.status(404).json({ message: "Produit non trouvé" });
            }

            if (!product.isAvailable || product.stock < quantity) {
                logger.warn(`Produit non disponible ou stock insuffisant: ${productId}`);
                return res.status(400).json({ message: "Produit non disponible ou stock insuffisant" });
            }

            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            
            // Recalculate cart totals
            cart.calculateTotals();
            await cart.save();

            logger.info(`Quantité mise à jour avec succès`);
            
            // Get the updated cart with populated items
            const updatedCart = await Cart.getPopulatedCart(userId);

            res.status(200).json({
                message: "Quantité mise à jour avec succès",
                cart: updatedCart
            });
        } else {
            logger.warn(`Produit non trouvé dans le panier: ${productId}`);
            res.status(404).json({ message: "Produit non trouvé dans le panier" });
        }
    } catch (error) {
        logger.error(`Erreur lors de la mise à jour de la quantité: ${error.message}`);
        res.status(500).json({ 
            message: "Erreur lors de la mise à jour de la quantité", 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};

// Vider le panier
export const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;
        logger.info(`Tentative de vidage du panier pour l'utilisateur: ${userId}`);

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            logger.warn(`Panier non trouvé pour l'utilisateur: ${userId}`);
            return res.status(404).json({ 
                success: false,
                message: "Panier non trouvé" 
            });
        }

        if (cart.items.length === 0) {
            logger.info(`Le panier de l'utilisateur ${userId} est déjà vide`);
            return res.status(200).json({ 
                success: true,
                message: "Le panier est déjà vide" 
            });
        }

        const itemCount = cart.items.length;
        await cart.clearCart();
        
        logger.info(`Panier vidé avec succès pour l'utilisateur: ${userId}. ${itemCount} article(s) supprimé(s).`);
        res.status(200).json({ 
            success: true,
            message: "Panier vidé avec succès",
            itemsRemoved: itemCount
        });
    } catch (error) {
        logger.error(`Erreur lors du vidage du panier pour l'utilisateur ${req.user._id}: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors du vidage du panier", 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};


// Obtenir le total du panier
export const getCartTotal = async (req, res) => {
    try {
        const userId = req.user._id;
        logger.info(`Calcul du total du panier pour l'utilisateur: ${userId}`);

        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            logger.warn(`Panier non trouvé pour l'utilisateur: ${userId}`);
            return res.status(404).json({ 
                success: false,
                message: "Panier non trouvé" 
            });
        }

        let subtotal = 0;
        let totalItems = 0;
        const itemDetails = [];

        for (const item of cart.items) {
            if (item.product) {
                const itemTotal = item.product.price * item.quantity;
                subtotal += itemTotal;
                totalItems += item.quantity;
                itemDetails.push({
                    productId: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    total: itemTotal
                });
            }
        }

        // You might want to add tax calculation here if applicable
        const tax = 0; // Replace with actual tax calculation if needed
        const total = subtotal + tax;

        logger.info(`Total du panier calculé avec succès pour l'utilisateur: ${userId}`);
        res.status(200).json({
            success: true,
            data: {
                subtotal,
                tax,
                total,
                totalItems,
                itemDetails
            }
        });
    } catch (error) {
        logger.error(`Erreur lors du calcul du total du panier pour l'utilisateur ${req.user._id}: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors du calcul du total du panier", 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};