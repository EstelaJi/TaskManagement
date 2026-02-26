import pool from '../config/database.js'

const initSQL = `
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为任务表创建触发器
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`

const seedSQL = `
-- 插入示例用户
INSERT INTO users (username, email, password_hash, full_name, avatar_url) VALUES
  ('john_doe', 'john@example.com', 'hashed_password_123', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'),
  ('jane_smith', 'jane@example.com', 'hashed_password_456', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'),
  ('bob_wilson', 'bob@example.com', 'hashed_password_789', 'Bob Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob')
ON CONFLICT (username) DO NOTHING;

-- 插入示例任务
INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES
  ('Learn Vue 3 basics', 'Study Vue 3 Composition API and core concepts', 'completed', 'high', NOW() + INTERVAL '7 days', 1),
  ('Setup PostgreSQL database', 'Install and configure PostgreSQL for the project', 'completed', 'high', NOW() + INTERVAL '5 days', 1),
  ('Design API endpoints', 'Design RESTful API for tasks and users', 'in_progress', 'medium', NOW() + INTERVAL '3 days', 2),
  ('Write unit tests', 'Create comprehensive test suite for backend', 'pending', 'medium', NOW() + INTERVAL '10 days', 2),
  ('Deploy to production', 'Setup CI/CD pipeline and deploy', 'pending', 'low', NOW() + INTERVAL '30 days', 3),
  ('Update documentation', 'Write API documentation and README', 'pending', 'low', NOW() + INTERVAL '14 days', 3)
ON CONFLICT DO NOTHING;
`

async function initDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Initializing database...')
    
    // 创建表结构
    await client.query(initSQL)
    console.log('✅ Tables created successfully')
    
    // 插入种子数据
    await client.query(seedSQL)
    console.log('✅ Seed data inserted successfully')
    
    // 验证数据
    const userCount = await client.query('SELECT COUNT(*) FROM users')
    const taskCount = await client.query('SELECT COUNT(*) FROM tasks')
    
    console.log(`📊 Database initialized with ${userCount.rows[0].count} users and ${taskCount.rows[0].count} tasks`)
    
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

initDatabase()
