import pg from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config()

const { Client } = pg

const createDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  })

  try {
    await client.connect()
    const dbName = process.env.DB_NAME || 'task_management'
    
    const checkResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    )

    if (checkResult.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`)
      console.log(`✓ Database '${dbName}' created successfully`)
    } else {
      console.log(`✓ Database '${dbName}' already exists`)
    }
  } finally {
    await client.end()
  }
}

const createTables = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'task_management'
  })

  try {
    await client.connect()

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
          CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
        END IF;
      END$$;
    `)
    console.log('✓ Type task_status checked/created')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Table users created successfully')

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
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
      )
    `)
    console.log('✓ Table tasks created successfully')

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)
    `)
    console.log('✓ Indexes created successfully')

    const triggerFuncExists = await client.query(`
      SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    `)
    if (triggerFuncExists.rows.length === 0) {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `)
      console.log('✓ Function update_updated_at_column created')
    }

    const userTriggerExists = await client.query(`
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
    `)
    if (userTriggerExists.rows.length === 0) {
      await client.query(`
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `)
      console.log('✓ Trigger for users created')
    }

    const taskTriggerExists = await client.query(`
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
    `)
    if (taskTriggerExists.rows.length === 0) {
      await client.query(`
        CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `)
      console.log('✓ Trigger for tasks created')
    }

    const adminExists = await client.query('SELECT 1 FROM users WHERE username = $1', ['admin'])
    if (adminExists.rows.length === 0) {
      await client.query(`
        INSERT INTO users (username, email, password_hash, full_name) VALUES
        ('admin', 'admin@example.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Administrator'),
        ('demo', 'demo@example.com', '2a97516c354b68848cdbd8f54a226a0a55b21ed138e297da3cbe8724769d633c', 'Demo User')
      `)
      console.log('✓ Sample users created (admin/admin123, demo/demo123)')
    } else {
      console.log('✓ Sample users already exist')
    }

    const taskExists = await client.query('SELECT 1 FROM tasks LIMIT 1')
    if (taskExists.rows.length === 0) {
      await client.query(`
        INSERT INTO tasks (title, description, status, priority, category, user_id) VALUES
        ('Learn Vue 3 basics', 'Know the core concepts and Composition API of Vue 3', 'pending', 'high', 'learning', 1),
        ('Setup PostgreSQL database', 'Install and configure PostgreSQL for the project', 'in_progress', 'high', 'development', 1),
        ('Create API endpoints', 'Implement RESTful API for tasks and users', 'pending', 'medium', 'development', 2)
      `)
      console.log('✓ Sample tasks created')
    } else {
      console.log('✓ Sample tasks already exist')
    }

  } finally {
    await client.end()
  }
}

const main = async () => {
  try {
    console.log('\n🚀 Starting database initialization...\n')
    await createDatabase()
    await createTables()
    console.log('\n✅ Database initialization completed successfully!')
    console.log('\n📝 Default credentials:')
    console.log('   admin / admin123')
    console.log('   demo / demo123')
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
