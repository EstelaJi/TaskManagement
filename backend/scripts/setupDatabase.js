import { testConnection, initDatabase } from '../config/database.js'
import seedDatabase from './seedDatabase.js'

const setupDatabase = async () => {
  try {
    console.log('Setting up database...')
    
    // 测试数据库连接
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('Failed to connect to database. Please check your configuration.')
      process.exit(1)
    }
    
    // 初始化数据库表
    const isInitialized = await initDatabase()
    if (!isInitialized) {
      console.error('Failed to initialize database.')
      process.exit(1)
    }
    
    // 询问是否要填充示例数据
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    rl.question('Do you want to populate the database with sample data? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await seedDatabase()
      }
      rl.close()
      console.log('Database setup completed!')
      process.exit(0)
    })
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()