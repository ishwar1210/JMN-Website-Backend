require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function initializeUsers() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('users table created or already exists.');

    // Check if admin user already exists
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      // Hash a default password: admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      console.log('Default admin user created successfully! Username: admin, Password: admin123');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Error creating users table:', err.message);
  } finally {
    process.exit();
  }
}

initializeUsers();
