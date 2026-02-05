import express from 'express'
import { query } from '../database/db.js'

const router = express.Router()

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, full_name, avatar_url, created_at, updated_at FROM users ORDER BY id'
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
    const id = parseInt(req.params.id)
    const result = await query(
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
    const { username, email, password, full_name, avatar_url } = req.body
    
    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      })
    }
    
    // 检查用户名是否已存在
    const existingUser = await query('SELECT id FROM users WHERE username = $1', [username])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    
    // 创建用户（注意：实际项目中应该对密码进行哈希处理）
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, avatar_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, full_name, avatar_url, created_at, updated_at`,
      [username, email, password, full_name || null, avatar_url || null]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// 更新用户
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { username, email, full_name, avatar_url } = req.body
    
    // 检查用户是否存在
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // 检查用户名是否被其他用户使用
    if (username) {
      const usernameCheck = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2', 
        [username, id]
      )
      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Username already exists' })
      }
    }
    
    // 检查邮箱是否被其他用户使用
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2', 
        [email, id]
      )
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already exists' })
      }
    }
    
    // 构建动态更新查询
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
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`)
      values.push(full_name)
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`)
      values.push(avatar_url)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    const query_text = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, username, email, full_name, avatar_url, created_at, updated_at
    `
    
    const result = await query(query_text, values)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    // 检查用户是否存在
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    await query('DELETE FROM users WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// 获取用户的所有任务
router.get('/:id/tasks', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    // 检查用户是否存在
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    )
    
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching user tasks:', error)
    res.status(500).json({ error: 'Failed to fetch user tasks' })
  }
})

export default router
