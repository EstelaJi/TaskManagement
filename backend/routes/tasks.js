import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// 获取所有任务
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, 
             u1.username as assigned_to_username,
             u2.username as created_by_username
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      ORDER BY t.created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// 获取单个任务
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await query(`
      SELECT t.*, 
             u1.username as assigned_to_username,
             u2.username as created_by_username
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [id])
    
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
    const { title, description, status = 'pending', priority = 'medium', due_date, assigned_to, created_by } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    const result = await query(`
      INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, status, priority, due_date, assigned_to, created_by])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// 更新任务
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { title, description, status, priority, due_date, assigned_to } = req.body
    
    // 首先检查任务是否存在
    const taskExists = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (taskExists.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // 动态构建更新查询
    const updates = []
    const values = []
    let paramIndex = 1
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(title)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`)
      values.push(priority)
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`)
      values.push(due_date)
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`)
      values.push(assigned_to)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    
    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    // 首先检查任务是否存在
    const taskExists = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (taskExists.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    await query('DELETE FROM tasks WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router

