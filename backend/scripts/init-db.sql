-- 快速初始化数据库脚本
-- 使用方法: psql -U postgres -f scripts/init-db.sql

-- 创建数据库
CREATE DATABASE task_management;

-- 连接到数据库
\c task_management;

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  avatar VARCHAR(255),
  role user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建 tasks 表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  category VARCHAR(50),
  due_date TIMESTAMP WITH TIME ZONE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags VARCHAR(255)[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_users_update_updated_at ON users;
CREATE TRIGGER trigger_users_update_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_tasks_update_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_update_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 插入测试用户 (密码: password123)
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES 
('admin', 'admin@example.com', '$2a$10$rQZ8Vb5nQr4eJ7Y9U3I1OeRrHhQqMmNnOoPpQqRrSsTtUuVvWwXxYyZz', 'Admin', 'User', 'admin'),
('john', 'john@example.com', '$2a$10$rQZ8Vb5nQr4eJ7Y9U3I1OeRrHhQqMmNnOoPpQqRrSsTtUuVvWwXxYyZz', 'John', 'Doe', 'user')
ON CONFLICT (username) DO NOTHING;

-- 插入测试任务
INSERT INTO tasks (title, description, status, priority, category, user_id, tags)
VALUES 
('Complete project setup', 'Set up the project structure and dependencies', 'completed', 'high', 'Development', 1, ARRAY['setup', 'project']),
('Learn Vue 3', 'Understand Vue 3 Composition API', 'in_progress', 'medium', 'Learning', 1, ARRAY['vue', 'frontend']),
('Write documentation', 'Create API documentation', 'pending', 'low', 'Documentation', 2, ARRAY['docs', 'api']),
('Review code', 'Review team members code', 'pending', 'urgent', 'Review', 1, ARRAY['code', 'review'])
ON CONFLICT DO NOTHING;

SELECT 'Database initialized successfully!' as message;
