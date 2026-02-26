CREATE DATABASE task_management;

\c task_management;

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50),
    due_date TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

INSERT INTO users (username, email, password_hash, full_name) VALUES
('admin', 'admin@example.com', 'hashed_password_1', 'Administrator'),
('demo', 'demo@example.com', 'hashed_password_2', 'Demo User');

INSERT INTO tasks (title, description, status, priority, category, user_id) VALUES
('Learn Vue 3 basics', 'Know the core concepts and Composition API of Vue 3', 'pending', 'high', 'learning', 1),
('Setup PostgreSQL database', 'Install and configure PostgreSQL for the project', 'in_progress', 'high', 'development', 1),
('Create API endpoints', 'Implement RESTful API for tasks and users', 'pending', 'medium', 'development', 2);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
