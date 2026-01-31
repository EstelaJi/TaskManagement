import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT id, username, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query('SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = $1', [id])
    
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
    const { username, email, password_hash, first_name, last_name } = req.body
    
    if (!username || !email || !password_hash) {
      return res.status(400).json({ error: 'Username, email and password are required' })
    }
    
    const result = await query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, first_name, last_name, created_at',
      [username, email, password_hash, first_name, last_name]
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
    const id = parseInt(req.params.id)
    const { username, email, first_name, last_name } = req.body
    
    // 首先检查用户是否存在
    const userExists = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // 动态构建更新查询
    const updates = []
    const values = []
    let paramIndex = 1
    
    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`)
      values.push(username)
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email)
    }
    if (first_name !== undefined) {
      updates.push(`first_name = $${paramIndex++}`)
      values.push(first_name)
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramIndex++}`)
      values.push(last_name)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, first_name, last_name, created_at`,
      values
    )
    
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
    const id = parseInt(req.params.id)
    
    // 首先检查用户是否存在
    const userExists = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userExists.rows.length === 0) {
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