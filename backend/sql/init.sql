-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  avatar VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 插入测试用户数据
INSERT INTO users (username, email, password, first_name, last_name)
VALUES 
  ('admin', 'admin@example.com', 'hashed_password_here', 'Admin', 'User'),
  ('john_doe', 'john@example.com', 'hashed_password_here', 'John', 'Doe')
ON CONFLICT (username) DO NOTHING;

-- 插入测试任务数据
INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
VALUES 
  (1, '完成项目文档', '编写项目的技术文档和用户手册', 'in_progress', 'high', '工作', NOW() + INTERVAL '7 days'),
  (1, '学习Vue 3', '掌握Vue 3的Composition API', 'pending', 'medium', '学习', NOW() + INTERVAL '14 days'),
  (2, '购买生活用品', '购买日常所需的生活用品', 'pending', 'low', '生活', NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
