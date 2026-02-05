-- 创建数据库（如果不存在）
-- CREATE DATABASE task_management;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务表
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
);

-- 创建更新时间的触发器函数
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

-- 插入一些示例数据
INSERT INTO users (username, email, password_hash, full_name) VALUES
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGsG', 'Administrator'),
('john_doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGsG', 'John Doe'),
('jane_smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGsG', 'Jane Smith')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES
('Learn Vue 3 basics', 'Study the core concepts and Composition API of Vue 3', 'completed', 'high', '2024-01-15', 1),
('Build a task management app', 'Create a full-stack task management application', 'in_progress', 'high', '2024-02-01', 1),
('Learn PostgreSQL', 'Understand database design and SQL queries', 'pending', 'medium', '2024-02-15', 2),
('Setup CI/CD pipeline', 'Configure automated testing and deployment', 'pending', 'low', '2024-03-01', 3),
('Write documentation', 'Document the API endpoints and usage', 'pending', 'medium', '2024-02-20', 1)
ON CONFLICT DO NOTHING;
