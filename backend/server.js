import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import taskRoutes from './routes/tasks.js'
import userRoutes from './routes/users.js'
import { initDatabase } from './database/db.js'

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
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    const db = await import('./database/db.js')
    await db.query('SELECT 1')
    res.json({ 
      status: 'ok', 
      message: 'Server is running',
      database: 'connected'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message 
    })
  }
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

// 初始化数据库并启动服务器
const startServer = async () => {
  try {
    await initDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
      console.log('')
      console.log('Available API endpoints:')
      console.log('  Users:')
      console.log('    GET    /api/users          - 获取所有用户')
      console.log('    GET    /api/users/:id      - 获取单个用户')
      console.log('    POST   /api/users          - 创建用户')
      console.log('    PATCH  /api/users/:id      - 更新用户')
      console.log('    DELETE /api/users/:id      - 删除用户')
      console.log('    GET    /api/users/:id/tasks - 获取用户的所有任务')
      console.log('')
      console.log('  Tasks:')
      console.log('    GET    /api/tasks          - 获取所有任务（支持过滤）')
      console.log('    GET    /api/tasks/:id      - 获取单个任务')
      console.log('    POST   /api/tasks          - 创建任务')
      console.log('    PATCH  /api/tasks/:id      - 更新任务')
      console.log('    DELETE /api/tasks/:id      - 删除任务')
      console.log('    PATCH  /api/tasks/batch/status - 批量更新任务状态')
      console.log('    GET    /api/tasks/stats/overview - 获取任务统计')
      console.log('')
      console.log('  Health:')
      console.log('    GET    /api/health         - 健康检查')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
