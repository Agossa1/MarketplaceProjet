import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from "./config/database.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';

import Shop from './models/ShopModels.js';

// Import routes
import {UserRouter} from "./routes/UserRoutes.js";
import {ProductRouter} from "./routes/ProductRouters.js";
import {ShopRouter} from "./routes/ShopRoutes.js";
import {OrderRouter} from "./routes/OrderProducts.js";
import {CartRouter} from "./routes/CartsRoutes.js";

// Connect to MongoDB
connectDB();

// Initialize the express app
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration CORS plus sécurisée
const corsOptions = {
    origin:'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(morgan('tiny'));
app.use(cookieParser());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

try {
    await Shop.removeUniqueOwnerIndex();
    console.log('Index unique sur le champ owner vérifié/supprimé');
} catch (error) {
    console.error('Erreur lors de la suppression de l\'index:', error);
}


// Routes
app.use('/api/users', UserRouter);
app.use('/api/products', ProductRouter);
app.use('/api/shops', ShopRouter);
app.use('/api/orders', OrderRouter);
app.use('/api/cart', CartRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`This server is running on port http://localhost:${PORT}`);
});