import 'dotenv/config'
import pg from 'pg'
import readline from 'readline'

const { Client } = pg

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres'
  })

  try {
    await client.connect()
    console.log('✅ Connected to PostgreSQL')

    const dbName = process.env.DB_NAME || 'taskmanagement'
    
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    )

    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`)
      console.log(`✅ Database "${dbName}" created successfully`)
    } else {
      console.log(`📊 Database "${dbName}" already exists`)
    }

    await client.end()
    return true
  } catch (error) {
    console.error('❌ Error creating database:', error.message)
    await client.end()
    return false
  }
}

async function createTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'taskmanagement'
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        avatar_url VARCHAR(500),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table "users" created')

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'todo',
        category VARCHAR(50) DEFAULT 'work',
        due_date DATE,
        tags TEXT[],
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table "tasks" created')

    await client.query(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table "subtasks" created')

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)

    await client.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON users`)
    await client.query(`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)

    await client.query(`DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks`)
    await client.query(`
      CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)
    console.log('✅ Triggers created')

    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`)
    console.log('✅ Indexes created')

    await client.end()
    return true
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    await client.end()
    return false
  }
}

async function seedData() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'taskmanagement'
  })

  try {
    await client.connect()

    const userCheck = await client.query('SELECT COUNT(*) FROM users')
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('📊 Database already has data, skipping seed')
      await client.end()
      return true
    }

    const userResult = await client.query(`
      INSERT INTO users (username, email, password, full_name, role)
      VALUES 
        ('admin', 'admin@example.com', 'hashed_password_here', 'Admin User', 'admin'),
        ('john', 'john@example.com', 'hashed_password_here', 'John Doe', 'user'),
        ('jane', 'jane@example.com', 'hashed_password_here', 'Jane Smith', 'user')
      RETURNING id
    `)
    console.log('✅ Sample users inserted')

    const userId = userResult.rows[0].id

    const taskResult = await client.query(`
      INSERT INTO tasks (title, description, priority, status, category, due_date, tags, user_id)
      VALUES 
        ('Complete project proposal', 'Finalize the Q1 project proposal document with budget estimates', 'high', 'in-progress', 'work', '2026-01-18', ARRAY['urgent', 'proposal'], $1),
        ('Review design mockups', 'Review and provide feedback on the new landing page designs', 'medium', 'todo', 'work', '2026-01-19', ARRAY['design', 'review'], $1),
        ('Schedule dentist appointment', 'Book annual dental checkup', 'low', 'todo', 'health', '2026-01-25', ARRAY['health'], $1),
        ('Prepare team presentation', 'Create slides for the quarterly team meeting', 'high', 'todo', 'work', '2026-01-17', ARRAY['presentation', 'meeting'], $1),
        ('Buy groceries', 'Weekly grocery shopping for essentials', 'medium', 'completed', 'personal', '2026-01-16', ARRAY['shopping'], $1),
        ('Update portfolio website', 'Add recent projects and update bio section', 'medium', 'in-progress', 'work', '2026-01-22', ARRAY['website', 'portfolio'], $1),
        ('Morning workout routine', '30-minute exercise session', 'medium', 'completed', 'health', '2026-01-16', ARRAY['fitness', 'daily'], $1),
        ('Read Vue 3 documentation', 'Study composition API and new features', 'low', 'in-progress', 'learning', '2026-01-30', ARRAY['learning', 'vue'], $1)
      RETURNING id
    `, [userId])
    console.log('✅ Sample tasks inserted')

    const taskId = taskResult.rows[0].id

    await client.query(`
      INSERT INTO subtasks (task_id, title, completed)
      VALUES 
        ($1, 'Research competitors', true),
        ($1, 'Draft budget', true),
        ($1, 'Review with team', false)
    `, [taskId])
    console.log('✅ Sample subtasks inserted')

    await client.end()
    return true
  } catch (error) {
    console.error('❌ Error seeding data:', error.message)
    await client.end()
    return false
  }
}

async function main() {
  console.log('🚀 Database Initialization Script\n')
  console.log('📋 Current configuration:')
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`)
  console.log(`   Port: ${process.env.DB_PORT || '5432'}`)
  console.log(`   Database: ${process.env.DB_NAME || 'taskmanagement'}`)
  console.log(`   User: ${process.env.DB_USER || 'postgres'}\n`)

  if (!process.env.DB_PASSWORD) {
    console.log('⚠️  Warning: DB_PASSWORD is not set in .env file')
    console.log('   Please make sure your PostgreSQL allows local connections without password\n')
  }

  const proceed = await question('Do you want to proceed? (y/n): ')
  if (proceed.toLowerCase() !== 'y') {
    console.log('❌ Aborted')
    rl.close()
    return
  }

  console.log('\n📦 Step 1: Creating database...')
  const dbCreated = await createDatabase()
  if (!dbCreated) {
    rl.close()
    return
  }

  console.log('\n📦 Step 2: Creating tables...')
  const tablesCreated = await createTables()
  if (!tablesCreated) {
    rl.close()
    return
  }

  console.log('\n📦 Step 3: Seeding data...')
  await seedData()

  console.log('\n✅ Database initialization completed!')
  console.log('\nYou can now start the server with: npm run dev')
  
  rl.close()
}

main()
