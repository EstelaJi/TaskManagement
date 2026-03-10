import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const initDB = async () => {
  let client
  try {
    client = await pool.connect()
    console.log('Connected to database')

    const sqlPath = path.join(__dirname, '../sql/init.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    await client.query(sql)
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  } finally {
    if (client) {
      client.release()
    }
    process.exit()
  }
}

initDB()
