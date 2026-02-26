import express from 'express'
import { query } from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 20 } = req.query
    let sql = 'SELECT * FROM tasks WHERE 1=1'
    const params = []
    let paramIndex = 0

    if (status) {
      paramIndex++
      sql += ` AND status = $${paramIndex}`
      params.push(status)
    }

    if (user_id) {
      paramIndex++
      sql += ` AND user_id = $${paramIndex}`
      params.push(parseInt(user_id))
    }

    sql += ' ORDER BY created_at DESC'

    paramIndex++
    sql += ` LIMIT $${paramIndex}`
    params.push(parseInt(limit))

    paramIndex++
    sql += ` OFFSET $${paramIndex}`
    params.push((parseInt(page) - 1) * parseInt(limit))

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [parseInt(id)]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ error: 'Failed to fetch task' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, description, status = 'pending', priority = 'medium', category, due_date, user_id } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, category, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description || '', status, priority, category || null, due_date || null, user_id || null]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, priority, category, due_date, user_id } = req.body

    const existing = await query('SELECT * FROM tasks WHERE id = $1', [parseInt(id)])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const task = existing.rows[0]
    const result = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           category = COALESCE($5, category),
           due_date = COALESCE($6, due_date),
           user_id = COALESCE($7, user_id)
       WHERE id = $8
       RETURNING *`,
      [
        title || null,
        description !== undefined ? description : null,
        status || null,
        priority || null,
        category !== undefined ? category : null,
        due_date !== undefined ? due_date : null,
        user_id !== undefined ? user_id : null,
        parseInt(id)
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [parseInt(id)])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router
