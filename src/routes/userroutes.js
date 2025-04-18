// src/routes/userroutes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

async function getCurrentUserId(req) {
    console.log('Session data in getCurrentUserId:', req.session);
    if (req.session && req.session.user && req.session.user.type === 'user') {
        return req.session.user.id;
    }
    throw new Error('User not authenticated');
}

async function getUserBookings(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(`
            SELECT 
                u.username,
                p.package_name, 
                pl.name AS place_name, 
                b.booking_date,
                p.start_date
            FROM Bookings b
            JOIN Tour_Packages p ON b.package_id = p.package_id
            JOIN Places pl ON p.place_id = pl.place_id
            JOIN users u ON b.user_id = u.user_id
            WHERE b.user_id = ?
        `, [userId]);
        console.log('Bookings fetched for user:', userId, rows);
        return rows;
    } catch (err) {
        console.error('Error fetching user bookings for user:', userId, err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

// src/routes/userroutes.js
async function getPackages() {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(`
            SELECT 
                tp.package_id AS id, 
                p.name AS place_name, 
                tp.package_name, 
                tp.days, 
                tp.nights, 
                tp.price, 
                tp.hotel, 
                tp.flights, 
                tp.cabs, 
                tp.food,
                p.description,
                tp.start_date
            FROM Tour_Packages tp
            JOIN Places p ON tp.place_id = p.place_id
        `);
        console.log('Raw database rows:', rows); // Log raw data
        console.log('Packages fetched:', rows);
        return rows;
    } catch (err) {
        console.error('Error fetching packages:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function getPlaces() {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(`SELECT name, description FROM Places`);
        console.log('Places fetched:', rows);
        return rows;
    } catch (err) {
        console.error('Error fetching places:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

router.use((err, req, res, next) => {
    console.error('Error in userroutes:', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
});

router.get('/bookings/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const sessionUserId = await getCurrentUserId(req);
        console.log('Comparing userId:', parseInt(userId), 'with sessionUserId:', sessionUserId); // Debug log
        if (parseInt(userId) !== parseInt(sessionUserId)) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const bookings = await getUserBookings(parseInt(userId));
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error in /bookings/:userId endpoint:', err.message, err.stack);
        res.status(401).json({ error: err.message });
    }
});

router.get('/packages', async (req, res) => {
    try {
        await getCurrentUserId(req);
        const packages = await getPackages();
        res.status(200).json(packages);
    } catch (err) {
        console.error('Error in /packages endpoint:', err.message, err.stack);
        res.status(401).json({ error: err.message });
    }
});

router.get('/places', async (req, res) => {
    try {
        await getCurrentUserId(req);
        const places = await getPlaces();
        res.status(200).json(places);
    } catch (err) {
        console.error('Error in /places endpoint:', err.message, err.stack);
        res.status(401).json({ error: err.message });
    }
});

router.post('/bookings', async (req, res) => {
    const { user_id, package_id } = req.body;

    if (!user_id || !package_id) {
        return res.status(400).json({ error: 'User ID and Package ID are required' });
    }

    try {
        const sessionUserId = await getCurrentUserId(req);
        if (parseInt(user_id) !== parseInt(sessionUserId)) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        let connection;
        try {
            connection = await db.getConnection();
            await connection.query(
                `INSERT INTO Bookings (user_id, package_id, booking_date, status) VALUES (?, ?, NOW(), 'pending')`,
                [user_id, package_id]
            );
            res.status(201).json({ message: 'Booking created successfully' });
        } finally {
            if (connection) connection.release();
        }
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ error: 'Error creating booking: ' + err.message });
    }
});

export default router;