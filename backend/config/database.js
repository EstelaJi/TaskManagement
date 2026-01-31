import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

// PostgreSQL连接池配置
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'task_management',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 测试数据库连接
export const testConnection = async () => {
  try {
    const client = await pool.connect()
    console.log('Connected to PostgreSQL database successfully')
    client.release()
    return true
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error)
    return false
  }
}

// 执行查询的辅助函数
export const query = async (text, params) => {
  try {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Error executing query', error)
    throw error
  }
}

// 初始化数据库表
export const initDatabase = async () => {
  try {
    // 检查表是否已存在
    const tablesResult = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND (table_name = 'users' OR table_name = 'tasks')
    `)
    
    const existingTables = tablesResult.rows.map(row => row.table_name)
    
    // 如果表已存在，跳过初始化
    if (existingTables.includes('users') && existingTables.includes('tasks')) {
      console.log('Database tables already exist, skipping initialization')
      return true
    }
    
    // 创建用户表
    if (!existingTables.includes('users')) {
      await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(50),
          last_name VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Created users table')
    }
    
    // 创建任务表
    if (!existingTables.includes('tasks')) {
      await query(`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          priority VARCHAR(20) DEFAULT 'medium',
          due_date TIMESTAMP,
          assigned_to INTEGER REFERENCES users(id),
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Created tasks table')
    }
    
    // 创建更新时间触发器（如果不存在）
    const triggerResult = await query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'update_updated_at_column'
    `)
    
    if (triggerResult.rows.length === 0) {
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)
      
      await query(`
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `)
      
      await query(`
        CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log('Created update triggers')
    }
    
    console.log('Database initialization completed successfully')
    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}

export default pool