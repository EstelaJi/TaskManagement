import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function initializeDatabase() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_management',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('Connecting to database...');
    
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        due_date TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `INSERT INTO users (name, email, password) VALUES
       ('John Doe', 'john@example.com', 'password123'),
       ('Jane Smith', 'jane@example.com', 'password456')
       ON CONFLICT DO NOTHING`,
      
      `INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES
       ('Complete project proposal', 'Finish the project proposal document', 'pending', 'high', '2024-01-15 18:00:00', 1),
       ('Buy groceries', 'Milk, eggs, bread, vegetables', 'completed', 'medium', '2024-01-10 18:00:00', 1),
       ('Schedule meeting', 'Schedule team meeting for next week', 'pending', 'medium', '2024-01-12 10:00:00', 2)
       ON CONFLICT DO NOTHING`,
      
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
           NEW.updated_at = CURRENT_TIMESTAMP;
           RETURN NEW;
       END;
       $$ language 'plpgsql'`,
      
      `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      
      `DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks`,
      `CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    ];

    console.log(`Found ${queries.length} queries to execute:`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`[${i+1}/${queries.length}] Executing...`);
      await pool.query(query);
    }

    console.log('✅ Database initialized successfully!');
    console.log('✅ Sample data inserted!');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  } finally {
    await pool.end();
  }
}

initializeDatabase();