import pool from '../config/db.js'

const testDB = async () => {
  let client
  try {
    client = await pool.connect()
    console.log('Successfully connected to database')
    
    const result = await client.query('SELECT NOW()')
    console.log('Database time:', result.rows[0].now)
    
    // 检查表是否存在
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('Tables in database:', tables.rows.map(r => r.table_name))
    
  } catch (error) {
    console.error('Database connection error:', error.message)
    console.error('Error code:', error.code)
  } finally {
    if (client) {
      client.release()
    }
    process.exit()
  }
}

testDB()
