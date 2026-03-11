import sequelize from '../config/database.js'
import User from './User.js'
import Task from './Task.js'

const initModels = () => {
  // 这里可以添加更多模型关联
}

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection has been established successfully.')
    
    // 同步模型到数据库
    await sequelize.sync({ 
      // alter: true, // 在开发环境中使用，生产环境不要用
      // force: false // 设为 true 会删除并重建表
    })
    console.log('✅ Models synchronized with database.')
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error)
    process.exit(1)
  }
}

export {
  sequelize,
  connectDB,
  initModels,
  User,
  Task
}
