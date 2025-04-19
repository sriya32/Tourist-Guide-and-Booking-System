
# 🧭 Tourist Guide and Booking System

A web-based application designed to help users plan their travel by exploring destinations, connecting with verified tourist guides, and making bookings — all from a single platform.

This system includes secure user registration, session-based authentication, and integration with a MySQL database to manage user data, bookings, and guide listings.

---

## 📌 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Database Setup](#-database-setup)
- [API Endpoints](#-api-endpoints)
- [License](#-license)

---

## ✨ Features

- User and Guide registration & login with session management
- Browse and search tourist guides and locations
- Book appointments with guides
- Secure password hashing using bcrypt
- MySQL database integration for persistent storage


---

## 🛠️ Tech Stack

| Layer       | Technology           |
|-------------|----------------------|
| **Backend** | Node.js, Express.js  |
| **Database**| MySQL (via `mysql2`) |
| **Security**| bcrypt, express-session |


---

## 📁 Project Structure

```
Tourist Guide and Booking System/
├── node_modules/           # Node dependencies
├── public/                 # Static assets (if any)
├── src/
│   └── server.js           # Main server file
├── package.json            # Project config and dependencies
├── package-lock.json       # Locked versions of dependencies
└── README.md               # Project documentation (you're reading it!)
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- A terminal and code editor (like VS Code)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/tourist-guide-booking-system.git
cd tourist-guide-booking-system
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables (Optional but Recommended)

Create a `.env` file in the root directory and define:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=tourist_db
SESSION_SECRET=your_random_secret
PORT=3000
```

Then use `dotenv` in `server.js`:

```js
import dotenv from 'dotenv';
dotenv.config();
```

(Install with `npm install dotenv` if you choose to use this.)

---

### 4. Start the server

```bash
npm start
```

Server should run on [http://localhost:3000](http://localhost:3000)

---

## 🧾 Database Setup

Run the following SQL to create your tables (example structure):

```sql
CREATE DATABASE tourist_db;

USE tourist_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE guides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    contact_info VARCHAR(100)
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    guide_id INT,
    booking_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (guide_id) REFERENCES guides(id)
);
```

Update `server.js` to match your database settings.

---

## 📡 API Endpoints

Here are some common endpoints (based on convention):

| Method | Route             | Description                       |
|--------|------------------|-----------------------------------|
| POST   | `/register`       | Register a new user               |
| POST   | `/login`          | Login user and start session      |
| GET    | `/guides`         | List all guides                   |
| POST   | `/book`           | Book a guide                      |
| GET    | `/logout`         | Destroy session / logout user     |

*(Exact routes may vary based on implementation in `src/server.js`)*

---

## 🤝 Contribution

Feel free to fork the repository, submit issues, or open a pull request!

---

## 📄 License

This project is licensed under the **MIT License** — you’re free to use, modify, and distribute it.

---

> Built with ❤️ for travel enthusiasts!
