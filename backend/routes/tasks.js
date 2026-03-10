import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

// 获取所有任务（支持按用户筛选）
router.get('/', async (req, res) => {
  try {
    const { user_id, status, priority, category } = req.query
    
    let sql = 'SELECT * FROM tasks WHERE 1=1'
    const values = []
    let paramIndex = 1

    if (user_id) {
      sql += ` AND user_id = $${paramIndex++}`
      values.push(user_id)
    }
    if (status) {
      sql += ` AND status = $${paramIndex++}`
      values.push(status)
    }
    if (priority) {
      sql += ` AND priority = $${paramIndex++}`
      values.push(priority)
    }
    if (category) {
      sql += ` AND category = $${paramIndex++}`
      values.push(category)
    }

    sql += ' ORDER BY created_at DESC'

    const result = await query(sql, values)
    res.json(result.rows)
  } catch (error) {
    console.error('Error getting tasks:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 获取单个任务
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('SELECT * FROM tasks WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error getting task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 创建新任务
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, category, due_date, user_id } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, category, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description || null,
        status || 'pending',
        priority || 'medium',
        category || null,
        due_date || null,
        user_id || null
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating task:', error)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid user_id' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 更新任务
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, priority, category, due_date, user_id } = req.body

    const fields = []
    const values = []
    let paramIndex = 1

    if (title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(title)
    }
    if (description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(description)
    }
    if (status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    if (priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`)
      values.push(priority)
    }
    if (category !== undefined) {
      fields.push(`category = $${paramIndex++}`)
      values.push(category)
    }
    if (due_date !== undefined) {
      fields.push(`due_date = $${paramIndex++}`)
      values.push(due_date)
    }
    if (user_id !== undefined) {
      fields.push(`user_id = $${paramIndex++}`)
      values.push(user_id)
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(id)
    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating task:', error)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid user_id' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
