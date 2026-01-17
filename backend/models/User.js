import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

class User {
  static async create(data) {
    const { username, email, password, full_name } = data
    
    const password_hash = await bcrypt.hash(password, 10)
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, password_hash, full_name]
    )
    
    const user = result.rows[0]
    delete user.password_hash
    return user
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT id, username, email, full_name, created_at, updated_at FROM users ORDER BY created_at DESC'
    )
    return result.rows
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, full_name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  }

  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )
    return result.rows[0] || null
  }

  static async update(id, data) {
    const { username, email, full_name, password } = data
    
    let updateFields = []
    let values = []
    let index = 1

    if (username) {
      updateFields.push(`username = $${index++}`)
      values.push(username)
    }
    if (email) {
      updateFields.push(`email = $${index++}`)
      values.push(email)
    }
    if (full_name) {
      updateFields.push(`full_name = $${index++}`)
      values.push(full_name)
    }
    if (password) {
      const password_hash = await bcrypt.hash(password, 10)
      updateFields.push(`password_hash = $${index++}`)
      values.push(password_hash)
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }

    values.push(id)
    
    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${index} RETURNING id, username, email, full_name, created_at, updated_at`,
      values
    )

    return result.rows[0] || null
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )
    return result.rows[0] ? true : false
  }

  static async verifyPassword(password, password_hash) {
    return bcrypt.compare(password, password_hash)
  }
}

export default User
