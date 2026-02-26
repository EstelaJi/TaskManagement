import pg from 'pg'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskmanagement',
  user: process.env.DB_USER || 'aether',
  password: process.env.DB_PASSWORD || '',
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export default pool
