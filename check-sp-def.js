require('dotenv').config();
const db = require('./config/db');

async function check() {
  try {
    const [rows1] = await db.query('SELECT * FROM technologies');
    console.log('technologies rows:', rows1);
    
    const [rows2] = await db.query('SELECT * FROM technologiesdetail');
    console.log('technologiesdetail rows:', rows2);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

check();
