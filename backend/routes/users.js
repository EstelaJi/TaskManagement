import express from 'express'
import { query } from '../db.js'
import crypto from 'crypto'

const router = express.Router()

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const result = await query(
      'SELECT id, username, email, full_name, avatar, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [parseInt(limit), offset]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query(
      'SELECT id, username, email, full_name, avatar, created_at, updated_at FROM users WHERE id = $1',
      [parseInt(id)]
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
    const { username, email, password, full_name, avatar } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' })
    }

    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' })
    }

    const passwordHash = hashPassword(password)

    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, avatar)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, avatar, created_at, updated_at`,
      [username, email, passwordHash, full_name || null, avatar || null]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, password, full_name, avatar } = req.body

    const existing = await query('SELECT * FROM users WHERE id = $1', [parseInt(id)])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    let passwordHash = null
    if (password) {
      passwordHash = hashPassword(password)
    }

    const result = await query(
      `UPDATE users
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash),
           full_name = COALESCE($4, full_name),
           avatar = COALESCE($5, avatar)
       WHERE id = $6
       RETURNING id, username, email, full_name, avatar, created_at, updated_at`,
      [
        username || null,
        email || null,
        passwordHash,
        full_name !== undefined ? full_name : null,
        avatar !== undefined ? avatar : null,
        parseInt(id)
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [parseInt(id)])

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
