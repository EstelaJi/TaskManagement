import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, username, email, full_name, avatar_url, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query(`
      SELECT id, username, email, full_name, avatar_url, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `, [id])
    
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
    const { username, email, password, full_name, avatar_url, role } = req.body
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' })
    }
    
    const result = await query(`
      INSERT INTO users (username, email, password, full_name, avatar_url, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, full_name, avatar_url, role, is_active, created_at, updated_at
    `, [username, email, password, full_name || null, avatar_url || null, role || 'user'])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === '23505') {
      const constraint = error.constraint
      if (constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already exists' })
      }
      if (constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already exists' })
      }
    }
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { username, email, password, full_name, avatar_url, role, is_active } = req.body
    
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const result = await query(`
      UPDATE users
      SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        password = COALESCE($3, password),
        full_name = COALESCE($4, full_name),
        avatar_url = COALESCE($5, avatar_url),
        role = COALESCE($6, role),
        is_active = COALESCE($7, is_active)
      WHERE id = $8
      RETURNING id, username, email, full_name, avatar_url, role, is_active, created_at, updated_at
    `, [username, email, password, full_name, avatar_url, role, is_active, id])
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    if (error.code === '23505') {
      const constraint = error.constraint
      if (constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already exists' })
      }
      if (constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already exists' })
      }
    }
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const updates = req.body
    
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const allowedFields = ['username', 'email', 'password', 'full_name', 'avatar_url', 'role', 'is_active']
    const setClauses = []
    const values = [id]
    let paramIndex = 2
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    const result = await query(`
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, username, email, full_name, avatar_url, role, is_active, created_at, updated_at
    `, values)
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    if (error.code === '23505') {
      const constraint = error.constraint
      if (constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already exists' })
      }
      if (constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already exists' })
      }
    }
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    await query('DELETE FROM users WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
