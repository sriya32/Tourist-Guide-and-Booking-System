// src/routes/authroutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';

const router = express.Router();

async function signup(type, username, password) {
    const table = type === 'admin' ? 'admins' : 'users';
    const idField = type === 'admin' ? 'admin_id' : 'user_id';
    let connection;
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(`Attempting to insert into ${table}: username=${username}`);

        connection = await db.getConnection();
        const [result] = await connection.query(
            `INSERT INTO ${table} (username, password) VALUES (?, ?)`,
            [username, hashedPassword]
        );
        const insertedId = result.insertId;
        console.log(`Insert successful into ${table}, ID:`, insertedId);
        return { success: true, id: insertedId };
    } catch (err) {
        console.error(`Insert error in ${table}:`, err);
        if (err.code === 'ER_DUP_ENTRY') {
            return { success: false, error: 'Username already exists' };
        }
        return { success: false, error: 'Database error: ' + err.message };
    } finally {
        if (connection) connection.release();
    }
}

async function login(type, username, password) {
    const table = type === 'admin' ? 'admins' : 'users';
    const idField = type === 'admin' ? 'admin_id' : 'user_id';
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query(
            `SELECT ${idField}, username, password FROM ${table} WHERE username = ?`,
            [username]
        );
        console.log(`Query result for ${table}:`, rows);
        if (rows.length === 0) {
            return { success: false, error: 'Invalid credentials' };
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        console.log(`Password match for ${username}:`, match);
        if (match) {
            return { success: true, user: { id: user[idField], username: user.username, type } };
        }
        return { success: false, error: 'Invalid credentials' };
    } catch (err) {
        console.error(`Login error in ${table}:`, err);
        return { success: false, error: 'Database error: ' + err.message };
    } finally {
        if (connection) connection.release();
    }
}

router.post('/login', async (req, res) => {
    console.log('Login request received:', req.body);
    const { type, username, password } = req.body;
    if (!type || !username || !password) {
        console.log('Missing required fields:', { type, username, password });
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (type !== 'user' && type !== 'admin') {
        console.log('Invalid type:', type);
        return res.status(400).json({ error: 'Invalid type. Must be "user" or "admin"' });
    }

    const result = await login(type, username, password);
    console.log('Login result:', result);
    if (result.success) {
        req.session.user = result.user;
        console.log('Session set after login:', req.session); // Debug log
        res.status(200).json({ message: 'Login successful', user: result.user });
    } else {
        res.status(401).json({ error: result.error });
    }
});

router.post('/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    const { type, username, password } = req.body;
    if (!type || !username || !password) {
        console.log('Missing required fields:', { type, username, password });
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (type !== 'user' && type !== 'admin') {
        console.log('Invalid type:', type);
        return res.status(400).json({ error: 'Invalid type. Must be "user" or "admin"' });
    }

    const result = await signup(type, username, password);
    console.log('Signup result:', result);
    if (result.success) {
        req.session.user = { id: result.id, username, type };
        console.log('Session set after signup:', req.session); // Debug log
        res.status(201).json({ message: 'Signup successful', id: result.id });
    } else {
        res.status(400).json({ error: 'Signup failed: ' + result.error });
    }
});

router.get('/current', (req, res) => {
    if (req.session.user) {
        console.log('Returning current user:', req.session.user); // Debug log
        res.status(200).json({ id: req.session.user.id, username: req.session.user.username, type: req.session.user.type });
    } else {
        console.log('No session found in /api/auth/current'); // Debug log
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.post('/logout', (req, res) => {
    console.log('Logout request received');
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        console.log('Session destroyed successfully');
        res.status(200).json({ message: 'Logout successful' });
    });
});

export default router;