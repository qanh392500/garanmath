import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { connectDB } from './db/connectDB.js';
import authRoutes from './routes/auth.route.js';
import adminRoutes from './routes/admin.route.js';
import apikeyRoutes from './routes/apikey.route.js';
import generateRoutes from './routes/generate.route.js';
import passport from './config/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in environment variables.");
    process.exit(1);
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.json({ success: true, message: 'Server is running!' });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", apikeyRoutes);
app.use("/api", generateRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
	connectDB();
	console.log(`✅ Backend server running on http://localhost:${PORT}`);
	console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});