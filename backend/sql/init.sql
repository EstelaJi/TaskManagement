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
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  due_date TIMESTAMP WITH TIME ZONE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 users 表创建触发器
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为 tasks 表创建触发器
DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 插入示例用户数据
INSERT INTO users (username, email, password, first_name, last_name)
VALUES 
  ('admin', 'admin@example.com', 'hashed_password_123', 'Admin', 'User'),
  ('johndoe', 'john@example.com', 'hashed_password_456', 'John', 'Doe')
ON CONFLICT (username) DO NOTHING;

-- 插入示例任务数据
INSERT INTO tasks (title, description, status, priority, category, user_id)
VALUES 
  ('完成项目报告', '编写第一季度项目完成报告', 'pending', 'high', '工作', 1),
  ('学习 Vue 3', '深入学习 Vue 3 Composition API', 'in_progress', 'medium', '学习', 1),
  ('健身计划', '每周至少三次健身房', 'pending', 'low', '生活', 2),
  ('代码审查', '审查团队成员的PR', 'completed', 'high', '工作', 1)
ON CONFLICT DO NOTHING;
