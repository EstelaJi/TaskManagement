import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, first_name, last_name, avatar, created_at, updated_at FROM users ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query(
      'SELECT id, username, email, first_name, last_name, avatar, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 创建新用户
router.post('/', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, avatar } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' })
    }

    const result = await query(
      `INSERT INTO users (username, email, password, first_name, last_name, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name, last_name, avatar, created_at`,
      [username, email, password, first_name || null, last_name || null, avatar || null]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 更新用户
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, password, first_name, last_name, avatar } = req.body

    const fields = []
    const values = []
    let paramIndex = 1

    if (username !== undefined) {
      fields.push(`username = $${paramIndex++}`)
      values.push(username)
    }
    if (email !== undefined) {
      fields.push(`email = $${paramIndex++}`)
      values.push(email)
    }
    if (password !== undefined) {
      fields.push(`password = $${paramIndex++}`)
      values.push(password)
    }
    if (first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`)
      values.push(first_name)
    }
    if (last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`)
      values.push(last_name)
    }
    if (avatar !== undefined) {
      fields.push(`avatar = $${paramIndex++}`)
      values.push(avatar)
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(id)
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, first_name, last_name, avatar, updated_at`,
      values
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
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
