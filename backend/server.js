import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import taskRoutes from './routes/tasks.js'
import userRoutes from './routes/users.js'
import pool from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/tasks', taskRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', message: 'Server is running', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', database: 'disconnected' })
  }
})

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

const startServer = async () => {
  try {
    await pool.query('SELECT 1')
    console.log('✅ Database connected successfully')
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('\n💡 Please run "npm run init-db" first to initialize the database')
    console.log('💡 Make sure your PostgreSQL is running and .env is configured correctly')
    process.exit(1)
  }
}

startServer()
