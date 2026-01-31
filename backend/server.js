import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import taskRoutes from './routes/tasks.js'
import userRoutes from './routes/users.js'
import { testConnection, initDatabase } from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/tasks', taskRoutes)
app.use('/api/users', userRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('Failed to connect to database. Please check your configuration.')
      console.error('You may need to run: node scripts/setupDatabase.js')
      process.exit(1)
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
      console.log('API endpoints available at:')
      console.log('  - Users: /api/users')
      console.log('  - Tasks: /api/tasks')
      console.log('  - Health: /api/health')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

