import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, created_at, updated_at FROM users WHERE id = $1',
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

// 创建新用户
router.post('/', async (req, res) => {
  try {
    const { username, email, password_hash, full_name, avatar_url } = req.body
    
    if (!username || !email || !password_hash) {
      return res.status(400).json({ error: 'Username, email and password_hash are required' })
    }
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, avatar_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, full_name, avatar_url, created_at, updated_at`,
      [username, email, password_hash, full_name || null, avatar_url || null]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' })
    }
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// 更新用户
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, full_name, avatar_url } = req.body
    
    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           full_name = COALESCE($3, full_name),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, username, email, full_name, avatar_url, created_at, updated_at`,
      [username, email, full_name, avatar_url, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' })
    }
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )
    
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
