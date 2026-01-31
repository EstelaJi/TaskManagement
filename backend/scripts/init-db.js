import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const createDatabaseSQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  due_date TIMESTAMP,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
`;

const seedDataSQL = `
INSERT INTO users (username, email, password) VALUES
('admin', 'admin@example.com', 'hashed_password_123'),
('demo', 'demo@example.com', 'hashed_password_456')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tasks (title, description, status, priority, category, user_id) VALUES
('完成项目文档', '编写项目的技术文档和API文档', 'pending', 'high', '工作', 1),
('学习Vue 3', '深入学习Vue 3的组合式API', 'in-progress', 'medium', '学习', 1),
('代码审查', '审查团队成员提交的代码', 'pending', 'medium', '工作', 2),
('修复Bug', '修复登录页面的验证问题', 'completed', 'high', '工作', 1)
ON CONFLICT DO NOTHING;
`;

async function initDB() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || 'task_management',
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');

    console.log('Creating tables...');
    await client.query(createDatabaseSQL);
    console.log('Tables created successfully');

    console.log('Seeding initial data...');
    await client.query(seedDataSQL);
    console.log('Initial data seeded successfully');

    console.log('\nDatabase initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDB();
