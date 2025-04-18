// src/db.js
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'sriya123@', // Replace with your MySQL password
    database: 'tourist_guide_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database connection successful');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Places (
                place_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Tour_Packages (
                package_id INT PRIMARY KEY AUTO_INCREMENT,
                place_id INT NOT NULL,
                admin_id INT NOT NULL,
                package_name VARCHAR(255) NOT NULL,
                days INT NOT NULL,
                nights INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                hotel ENUM('Yes', 'No') NOT NULL,
                flights ENUM('Yes', 'No') NOT NULL,
                cabs ENUM('Yes', 'No') NOT NULL,
                food ENUM('Yes', 'No') NOT NULL,
                start_date DATE NOT NULL DEFAULT '2025-01-01',
                FOREIGN KEY (place_id) REFERENCES Places(place_id),
                FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Bookings (
                booking_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                package_id INT NOT NULL,
                booking_date DATETIME NOT NULL,
                status ENUM('pending', 'confirmed', 'cancelled') NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                FOREIGN KEY (package_id) REFERENCES Tour_Packages(package_id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Notifications (
                notification_id INT PRIMARY KEY AUTO_INCREMENT,
                admin_id INT NOT NULL,
                package_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins(admin_id),
                FOREIGN KEY (package_id) REFERENCES Tour_Packages(package_id)
            )
        `);

        console.log('Database tables initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

export default pool;