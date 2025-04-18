// src/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Keep this, but we won’t need SequelizeStore
import authRoutes from './routes/authroutes.js';
import adminRoutes from './routes/adminroutes.js';
import userRoutes from './routes/userroutes.js';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Session middleware with in-memory store (default)
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware setup
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});