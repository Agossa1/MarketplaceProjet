import Order from "../models/OrdersModels.js";
import { AppError } from '../utils/errorMessages.js';
import logger from '../utils/logger.js';
import Shop from "../models/ShopModels.js";

// Create a new order
const createOrder = async (req, res, next) => {
    try {
        logger.info('Starting createOrder function');
        const { products, shippingAddress, paymentMethod, shopId } = req.body;
        const userId = req.user._id;

        logger.info(`Received order request for user: ${userId}`);
        logger.info('Order details:', { products, shippingAddress, paymentMethod, shopId });

        if (!products || products.length === 0) {
            logger.warn('Attempt to create order with no products');
            return next(new AppError('No products in the order', 400));
        }

        if (!shopId) {
            logger.warn('Attempt to create order without a shop ID');
            return next(new AppError('Shop ID is required', 400));
        }

        // Validate shop exists
        const shopExists = await Shop.exists({ _id: shopId });
        if (!shopExists) {
            logger.warn(`Attempt to create order with non-existent shop: ${shopId}`);
            return next(new AppError('Invalid shop ID', 400));
        }

        // Calculate total amount
        const totalAmount = products.reduce((sum, product) => {
            return sum + (product.price * product.quantity) - (product.discountApplied || 0);
        }, 0);

        if (totalAmount <= 0) {
            logger.warn('Attempt to create order with invalid total amount');
            return next(new AppError('Invalid total amount', 400));
        }

        logger.info('Creating new order');
        const newOrder = new Order({
            user: userId,
            shop: shopId,
            products: products.map(p => ({
                product: p.productId,
                quantity: p.quantity,
                price: p.price,
                discountApplied: p.discountApplied || 0
            })),
            shippingAddress,
            paymentMethod,
            totalAmount
        });

        logger.info('Saving order to database');
        const savedOrder = await newOrder.save();
        logger.info(`Order saved successfully with ID: ${savedOrder._id}`);

        res.status(201).json({
            status: 'success',
            data: {
                order: savedOrder
            }
        });
    } catch (error) {
        logger.error('Error in createOrder:', error.message);
        logger.error('Full error object:', error);
        logger.error('Stack trace:', error.stack);
        next(new AppError(`Error creating order: ${error.message}`, 500));
    }
};


// Get all orders for a user with pagination
const getAllOrdersForUser = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find({ user: userId })
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: 'success',
            results: orders.length,
            totalOrders,
            currentPage: page,
            totalPages,
            data: {
                orders
            }
        });
    } catch (error) {
        logger.error('Error in getAllOrdersForUser:', error);
        next(new AppError('Error fetching orders', 500));
    }
};

// Get an order by ID
const getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        logger.error('Error in getOrderById:', error);
        next(new AppError('Error fetching order', 500));
    }
};


// Update an order by ID
const updateOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user._id;
        const updates = req.body;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        // Only allow updating certain fields
        const allowedUpdates = ['shippingAddress', 'status'];
        const actualUpdates = Object.keys(updates)
            .filter(update => allowedUpdates.includes(update))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        Object.assign(order, actualUpdates);
        await order.save();

        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        logger.error('Error in updateOrderById:', error);
        next(new AppError('Error updating order', 500));
    }
};

// Delete an order by ID
const deleteOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user._id;

        const order = await Order.findOneAndDelete({ _id: orderId, user: userId });

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Order successfully deleted'
        });
    } catch (error) {
        logger.error('Error in deleteOrderById:', error);
        next(new AppError('Error deleting order', 500));
    }
};

export { createOrder, getAllOrdersForUser, getOrderById, updateOrderById, deleteOrderById };