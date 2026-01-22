import express from 'express'
import pool from '../config/database.js'
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { user_id, status, category } = req.query
    
    let query = 'SELECT * FROM tasks'
    const conditions = []
    const values = []
    let paramCount = 1
    
    if (user_id) {
      conditions.push(`user_id = $${paramCount++}`)
      values.push(user_id)
    }
    
    if (status) {
      conditions.push(`status = $${paramCount++}`)
      values.push(status)
    }
    
    if (category) {
      conditions.push(`category = $${paramCount++}`)
      values.push(category)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY created_at DESC'
    
    const result = await pool.query(query, values)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id])
    
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
    const { title, description, status = 'pending', category, priority = 'medium', due_date, user_id } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, category, priority, due_date, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description, status, category, priority, due_date, user_id]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating task:', error)
    
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid user_id' })
    }
    
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, category, priority, due_date, user_id } = req.body
    
    const updates = []
    const values = []
    let paramCount = 1
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(title)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(description)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(status)
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`)
      values.push(category)
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`)
      values.push(priority)
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`)
      values.push(due_date)
    }
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramCount++}`)
      values.push(user_id)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
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
    
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id])
    
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

