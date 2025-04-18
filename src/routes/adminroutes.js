// src/routes/adminroutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';

const router = express.Router();
const saltRounds = 10;

async function getCurrentAdminId(req) {
    console.log('Session data in getCurrentAdminId:', req.session); // Debug session
    if (req.session && req.session.user && req.session.user.type === 'admin') {
        return req.session.user.id;
    }
    throw new Error('Admin not authenticated');
}

async function notifyAdmin(adminId, packageId, packageName) {
    const message = `Package "${packageName}" has passed its start date. Please edit or delete it.`;
    console.log(`Notification to admin ${adminId}: ${message}`);
    
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.query(
            `INSERT INTO Notifications (admin_id, package_id, message) VALUES (?, ?, ?)`,
            [adminId, packageId, message]
        );
        return {
            notification_id: result.insertId,
            package_id: packageId,
            package_name: packageName,
            message,
            date: new Date().toISOString()
        };
    } catch (err) {
        console.error('Error saving notification:', err);
        return { package_id: packageId, package_name: packageName, message, date: new Date().toISOString() };
    } finally {
        if (connection) connection.release();
    }
}

async function checkExpiredPackages(adminId) {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(`
            SELECT package_id, admin_id, package_name, start_date 
            FROM Tour_Packages 
            WHERE start_date <= CURDATE() AND admin_id = ?
        `, [adminId]);
        
        const notifications = [];
        for (const pkg of rows) {
            const [existing] = await connection.query(`
                SELECT notification_id 
                FROM Notifications 
                WHERE package_id = ? AND admin_id = ? AND message LIKE ?
            `, [pkg.package_id, adminId, `%${pkg.package_name}%`]);
            
            if (existing.length === 0) {
                const notif = await notifyAdmin(pkg.admin_id, pkg.package_id, pkg.package_name);
                notifications.push(notif);
            }
        }
        
        const [allNotifs] = await connection.query(`
            SELECT n.notification_id, n.package_id, p.package_name, n.message, n.created_at AS date
            FROM Notifications n
            JOIN Tour_Packages p ON n.package_id = p.package_id
            WHERE n.admin_id = ?
            ORDER BY n.created_at DESC
        `, [adminId]);
        
        return allNotifs;
    } catch (err) {
        console.error('Error checking expired packages:', err);
        return [];
    } finally {
        if (connection) connection.release();
    }
}

async function getBookings(adminId) {
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
            JOIN users u ON b.user_id = u.user_id
            JOIN Tour_Packages p ON b.package_id = p.package_id
            JOIN Places pl ON p.place_id = pl.place_id
            WHERE p.admin_id = ?
        `, [adminId]);
        console.log('Bookings fetched for admin:', adminId, rows); // Debug
        return rows;
    } catch (err) {
        console.error('Error fetching bookings for admin:', adminId, err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function getPackages(adminId) {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(`
            SELECT 
                tp.package_id AS id, 
                tp.place_id, 
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
            WHERE tp.admin_id = ?
        `, [adminId]);
        console.log('Packages fetched for admin:', adminId, rows); // Debug
        return rows;
    } catch (err) {
        console.error('Error fetching packages for admin:', adminId, err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function addPackage(adminId, place_name, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date) {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let [placeResult] = await connection.query(
            `SELECT place_id FROM Places WHERE name = ?`,
            [place_name]
        );

        let place_id;
        if (placeResult.length === 0) {
            const [insertResult] = await connection.query(
                `INSERT INTO Places (name, description) VALUES (?, ?)`,
                [place_name, description || null]
            );
            place_id = insertResult.insertId;
        } else {
            place_id = placeResult[0].place_id;
            if (description) {
                await connection.query(
                    `UPDATE Places SET description = ? WHERE place_id = ?`,
                    [description, place_id]
                );
            }
        }

        const [result] = await connection.query(
            `INSERT INTO Tour_Packages (place_id, admin_id, package_name, days, nights, price, hotel, flights, cabs, food, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [place_id, adminId, package_name, days, nights, price, hotel, flights, cabs, food, start_date]
        );

        await connection.commit();
        return { success: true, id: result.insertId };
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error adding package:', err);
        return { success: false, error: err.message };
    } finally {
        if (connection) connection.release();
    }
}

async function updatePackage(id, adminId, place_name, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date) {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let [placeResult] = await connection.query(
            `SELECT place_id FROM Places WHERE name = ?`,
            [place_name]
        );

        let place_id;
        if (placeResult.length === 0) {
            const [insertResult] = await connection.query(
                `INSERT INTO Places (name, description) VALUES (?, ?)`,
                [place_name, description || null]
            );
            place_id = insertResult.insertId;
        } else {
            place_id = placeResult[0].place_id;
            if (description) {
                await connection.query(
                    `UPDATE Places SET description = ? WHERE place_id = ?`,
                    [description, place_id]
                );
            }
        }

        await connection.query(
            `UPDATE Tour_Packages SET place_id = ?, admin_id = ?, package_name = ?, days = ?, nights = ?, price = ?, hotel = ?, flights = ?, cabs = ?, food = ?, start_date = ? WHERE package_id = ? AND admin_id = ?`,
            [place_id, adminId, package_name, days, nights, price, hotel, flights, cabs, food, start_date, id, adminId]
        );

        await connection.commit();
        return { success: true };
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error updating package:', err);
        return { success: false, error: err.message };
    } finally {
        if (connection) connection.release();
    }
}

async function deletePackage(id, adminId) {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.query(`DELETE FROM Notifications WHERE package_id = ? AND admin_id = ?`, [id, adminId]);
        await connection.query(`DELETE FROM Tour_Packages WHERE package_id = ? AND admin_id = ?`, [id, adminId]);

        await connection.commit();
        return { success: true };
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error deleting package:', err);
        return { success: false, error: err.message };
    } finally {
        if (connection) connection.release();
    }
}

async function getPlaces() {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(`SELECT place_id, name FROM Places`);
        console.log('Places fetched:', rows); // Debug
        return rows;
    } catch (err) {
        console.error('Error fetching places:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

// Routes
router.get('/bookings', async (req, res) => {
    try {
        const adminId = await getCurrentAdminId(req);
        const bookings = await getBookings(adminId);
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error in /bookings endpoint:', err.message, err.stack);
        res.status(500).json({ error: 'Error fetching bookings: ' + err.message });
    }
});

router.get('/packages', async (req, res) => {
    try {
        const adminId = await getCurrentAdminId(req);
        const packages = await getPackages(adminId);
        await checkExpiredPackages(adminId);
        res.status(200).json(packages);
    } catch (err) {
        console.error('Error in /packages endpoint:', err.message, err.stack);
        res.status(500).json({ error: 'Error fetching packages: ' + err.message });
    }
});

router.post('/packages', async (req, res) => {
    const { place_id, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date } = req.body;

    if (!place_id || !package_name || !days || !nights || !price || !hotel || !flights || !cabs || !food || !start_date) {
        return res.status(400).json({ error: 'All fields except description are required' });
    }

    try {
        const adminId = await getCurrentAdminId(req);
        const place_name = place_id;
        const result = await addPackage(adminId, place_name, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date);
        if (result.success) {
            res.status(201).json({ message: 'Package added successfully', id: result.id });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        console.error('Error in POST /packages:', err);
        res.status(500).json({ error: 'Error adding package' });
    }
});

router.put('/packages/:id', async (req, res) => {
    const { id } = req.params;
    const { place_id, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date } = req.body;

    if (!place_id || !package_name || !days || !nights || !price || !hotel || !flights || !cabs || !food || !start_date) {
        return res.status(400).json({ error: 'All fields except description are required' });
    }

    try {
        const adminId = await getCurrentAdminId(req);
        const place_name = place_id;
        const result = await updatePackage(id, adminId, place_name, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date);
        if (result.success) {
            res.status(200).json({ message: 'Package updated successfully' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        console.error('Error in PUT /packages/:id:', err);
        res.status(500).json({ error: 'Error updating package' });
    }
});

router.delete('/packages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const adminId = await getCurrentAdminId(req);
        const result = await deletePackage(id, adminId);
        if (result.success) {
            res.status(200).json({ message: 'Package deleted successfully' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (err) {
        console.error('Error in DELETE /packages/:id:', err);
        res.status(500).json({ error: 'Error deleting package' });
    }
});

router.get('/places', async (req, res) => {
    try {
        const places = await getPlaces();
        res.status(200).json(places);
    } catch (err) {
        console.error('Error in /places:', err);
        res.status(500).json({ error: 'Error fetching places' });
    }
});

router.get('/notifications', async (req, res) => {
    try {
        const adminId = await getCurrentAdminId(req);
        const notifications = await checkExpiredPackages(adminId);
        res.status(200).json(notifications);
    } catch (err) {
        console.error('Error in /notifications:', err);
        res.status(500).json({ error: 'Error fetching notifications' });
    }
});

export default router;