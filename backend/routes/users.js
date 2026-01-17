import express from 'express'
import pool from '../config/database.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, full_name, created_at, updated_at FROM users ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, username, email, full_name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' })
    }
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, created_at, updated_at',
      [username, email, password, full_name]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error.code === '23505') {
      if (error.constraint.includes('username')) {
        return res.status(400).json({ error: 'Username already exists' })
      }
      if (error.constraint.includes('email')) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }
    
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, password, full_name } = req.body
    
    const updates = []
    const values = []
    let paramCount = 1
    
    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`)
      values.push(username)
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`)
      values.push(email)
    }
    if (password !== undefined) {
      updates.push(`password = $${paramCount++}`)
      values.push(password)
    }
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`)
      values.push(full_name)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, full_name, created_at, updated_at`,
      values
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error.code === '23505') {
      if (error.constraint.includes('username')) {
        return res.status(400).json({ error: 'Username already exists' })
      }
      if (error.constraint.includes('email')) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }
    
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
