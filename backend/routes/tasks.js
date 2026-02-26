import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// 获取所有任务
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.username as user_username, u.email as user_email 
       FROM tasks t 
       LEFT JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// 获取单个任务
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT t.*, u.username as user_username, u.email as user_email 
       FROM tasks t 
       LEFT JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1`,
      [id]
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

// 创建新任务
router.post('/', async (req, res) => {
  try {
    const { title, description, status = 'pending', priority = 'medium', due_date, user_id } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, description || null, status, priority, due_date || null, user_id || null]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating task:', error)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'User not found' })
    }
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// 更新任务
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, priority, due_date, user_id } = req.body
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           user_id = COALESCE($6, user_id)
       WHERE id = $7
       RETURNING *`,
      [title, description, status, priority, due_date, user_id, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating task:', error)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'User not found' })
    }
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    )
    
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
