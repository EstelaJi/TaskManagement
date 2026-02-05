import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'task_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

// 测试连接
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err)
})

// 查询辅助函数
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// 获取客户端（用于事务）
export const getClient = async () => {
  return await pool.connect()
}

// 初始化数据库表
export const initDatabase = async () => {
  try {
    // 检查表是否存在
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'tasks')
    `)
    
    const existingTables = tablesResult.rows.map(row => row.table_name)
    
    if (!existingTables.includes('users') || !existingTables.includes('tasks')) {
      console.log('📊 Initializing database tables...')
      
      // 创建用户表
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(100),
          avatar_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // 创建任务表
      await query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
          priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          due_date TIMESTAMP,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // 创建触发器函数
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `)
      
      // 为用户表创建触发器
      await query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `)
      
      // 为任务表创建触发器
      await query(`
        DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
        CREATE TRIGGER update_tasks_updated_at
          BEFORE UPDATE ON tasks
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `)
      
      // 插入示例用户数据
      await query(`
        INSERT INTO users (username, email, password_hash, full_name) VALUES
        ('admin', 'admin@example.com', 'hashed_password_1', 'Administrator'),
        ('john_doe', 'john@example.com', 'hashed_password_2', 'John Doe'),
        ('jane_smith', 'jane@example.com', 'hashed_password_3', 'Jane Smith')
        ON CONFLICT (username) DO NOTHING
      `)
      
      // 插入示例任务数据
      await query(`
        INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES
        ('Learn Vue 3 basics', 'Study the core concepts and Composition API of Vue 3', 'completed', 'high', '2024-01-15', 1),
        ('Build a task management app', 'Create a full-stack task management application', 'in_progress', 'high', '2024-02-01', 1),
        ('Learn PostgreSQL', 'Understand database design and SQL queries', 'pending', 'medium', '2024-02-15', 2),
        ('Setup CI/CD pipeline', 'Configure automated testing and deployment', 'pending', 'low', '2024-03-01', 3),
        ('Write documentation', 'Document the API endpoints and usage', 'pending', 'medium', '2024-02-20', 1)
        ON CONFLICT DO NOTHING
      `)
      
      console.log('✅ Database initialized successfully')
    } else {
      console.log('✅ Database tables already exist')
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

export default pool
