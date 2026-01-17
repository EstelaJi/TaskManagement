import pool from '../config/database.js'

class Task {
  static async create(data) {
    const { user_id, title, description, status, priority, due_date } = data
    
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, title, description, status || 'pending', priority || 'medium', due_date]
    )
    
    return result.rows[0]
  }

  static async findAll(filters = {}) {
    const { user_id, status, priority } = filters
    
    let query = 'SELECT * FROM tasks'
    let conditions = []
    let values = []
    let index = 1

    if (user_id) {
      conditions.push(`user_id = $${index++}`)
      values.push(user_id)
    }
    if (status) {
      conditions.push(`status = $${index++}`)
      values.push(status)
    }
    if (priority) {
      conditions.push(`priority = $${index++}`)
      values.push(priority)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, values)
    return result.rows
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  static async findByUserId(user_id, filters = {}) {
    const { status, priority } = filters
    
    let query = 'SELECT * FROM tasks WHERE user_id = $1'
    let values = [user_id]
    let index = 2

    if (status) {
      query += ` AND status = $${index++}`
      values.push(status)
    }
    if (priority) {
      query += ` AND priority = $${index++}`
      values.push(priority)
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, values)
    return result.rows
  }

  static async update(id, data) {
    const { title, description, status, priority, due_date, completed_at } = data
    
    let updateFields = []
    let values = []
    let index = 1

    if (title !== undefined) {
      updateFields.push(`title = $${index++}`)
      values.push(title)
    }
    if (description !== undefined) {
      updateFields.push(`description = $${index++}`)
      values.push(description)
    }
    if (status !== undefined) {
      updateFields.push(`status = $${index++}`)
      values.push(status)
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${index++}`)
      values.push(priority)
    }
    if (due_date !== undefined) {
      updateFields.push(`due_date = $${index++}`)
      values.push(due_date)
    }
    if (completed_at !== undefined) {
      updateFields.push(`completed_at = $${index++}`)
      values.push(completed_at)
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }

    values.push(id)
    
    const result = await pool.query(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    )
    return result.rows[0] ? true : false
  }

  static async getStatsByUserId(user_id) {
    const result = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM tasks 
       WHERE user_id = $1
       GROUP BY status`,
      [user_id]
    )
    return result.rows
  }
}

export default Task
