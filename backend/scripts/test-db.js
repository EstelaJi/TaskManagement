import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

const testConnection = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  })

  try {
    console.log('Testing database connection...')
    console.log('Configuration:')
    console.log('  Host:', process.env.DB_HOST || 'localhost')
    console.log('  Port:', process.env.DB_PORT || 5432)
    console.log('  User:', process.env.DB_USER || 'postgres')
    console.log('  Database: postgres')
    console.log('  Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET')
    console.log('')
    
    const result = await pool.query('SELECT version()')
    console.log('✅ Database connection successful!')
    console.log('PostgreSQL version:', result.rows[0].version)
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
    
    if (error.code === '28P01') {
      console.log('')
      console.log('💡 Password authentication failed.')
      console.log('Please check your PostgreSQL password in .env file.')
      console.log('')
      console.log('To find or reset your PostgreSQL password:')
      console.log('1. If using Postgres.app: Check the app settings')
      console.log('2. If using Homebrew: Try empty password or reset it')
      console.log('3. If using Docker: Check your docker-compose configuration')
    }
    
    await pool.end()
    process.exit(1)
  }
}

testConnection()
