import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
  try {
    const sqlPath = path.join(__dirname, '../sql/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('✅ Database initialized successfully!');
    } finally {
      client.release();
    }
    
    await pool.end();
    console.log('✅ Connection pool closed');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
};

initDb();
