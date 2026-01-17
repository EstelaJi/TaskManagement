import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

pool.on('connect', () => {
  console.log('✅ 成功连接到 PostgreSQL 数据库')
})

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err.message)
})

export default pool
