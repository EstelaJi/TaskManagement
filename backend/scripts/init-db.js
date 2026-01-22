import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const createDatabaseIfNotExists = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  })

  try {
    const dbName = process.env.DB_NAME || 'task_management'
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    )
    
    if (result.rows.length === 0) {
      await pool.query(`CREATE DATABASE ${dbName}`)
      console.log(`✅ Database '${dbName}' created successfully`)
    } else {
      console.log(`✅ Database '${dbName}' already exists`)
    }
  } catch (error) {
    console.error('❌ Error creating database:', error)
    throw error
  } finally {
    await pool.end()
  }
}

const createTables = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        category VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users
    `)

    await pool.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks
    `)

    await pool.query(`
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `)

    console.log('✅ Database tables created successfully')
  } catch (error) {
    console.error('❌ Error creating tables:', error)
    throw error
  } finally {
    await pool.end()
  }
}

const dropTables = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  })

  try {
    await pool.query('DROP TABLE IF EXISTS tasks CASCADE')
    await pool.query('DROP TABLE IF EXISTS users CASCADE')
    console.log('✅ Tables dropped successfully')
  } catch (error) {
    console.error('❌ Error dropping tables:', error)
    throw error
  } finally {
    await pool.end()
  }
}

const seedData = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  })

  try {
    await pool.query(`
      INSERT INTO users (username, email, password, full_name) VALUES
      ('john_doe', 'john@example.com', 'hashed_password_1', 'John Doe'),
      ('jane_smith', 'jane@example.com', 'hashed_password_2', 'Jane Smith')
      ON CONFLICT (username) DO NOTHING
    `)

    await pool.query(`
      INSERT INTO tasks (title, description, status, category, priority, user_id) VALUES
      ('Learn Vue 3 basics', 'Know the core concepts and Composition API of Vue 3', 'pending', 'learning', 'high', 1),
      ('Build task management app', 'Create a full-stack task management application', 'in_progress', 'project', 'high', 1),
      ('Review code', 'Review pull requests from team members', 'completed', 'work', 'medium', 2),
      ('Write documentation', 'Document API endpoints and usage', 'pending', 'documentation', 'low', 2)
      ON CONFLICT DO NOTHING
    `)

    console.log('✅ Sample data seeded successfully')
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  } finally {
    await pool.end()
  }
}

const main = async () => {
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    await createDatabaseIfNotExists()
    
    if (command === 'drop') {
      await dropTables()
    } else if (command === 'seed') {
      await seedData()
    } else if (command === 'reset') {
      await dropTables()
      await createTables()
      await seedData()
    } else {
      await createTables()
      await seedData()
    }
  } catch (error) {
    process.exit(1)
  }
}

main()
