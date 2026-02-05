import express from 'express'
import { query } from '../database/db.js'

const router = express.Router()

// 获取所有任务（支持过滤和排序）
router.get('/', async (req, res) => {
  try {
    const { status, priority, user_id, sort_by = 'created_at', order = 'DESC' } = req.query
    
    let query_text = `
      SELECT t.*, u.username as assignee_username, u.full_name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `
    const values = []
    let paramIndex = 1
    
    // 添加过滤条件
    if (status) {
      query_text += ` AND t.status = $${paramIndex++}`
      values.push(status)
    }
    
    if (priority) {
      query_text += ` AND t.priority = $${paramIndex++}`
      values.push(priority)
    }
    
    if (user_id) {
      query_text += ` AND t.user_id = $${paramIndex++}`
      values.push(parseInt(user_id))
    }
    
    // 添加排序
    const allowedSortColumns = ['created_at', 'updated_at', 'due_date', 'priority', 'title']
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    query_text += ` ORDER BY t.${sortColumn} ${sortOrder}`
    
    const result = await query(query_text, values)
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
    const result = await query(
      `SELECT t.*, u.username as assignee_username, u.full_name as assignee_name
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
    
    // 验证必填字段
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    // 验证状态值
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      })
    }
    
    // 验证优先级值
    const validPriorities = ['low', 'medium', 'high']
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      })
    }
    
    // 如果提供了user_id，验证用户是否存在
    if (user_id) {
      const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id])
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assigned user not found' })
      }
    }
    
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, due_date, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, description || null, status, priority, due_date || null, user_id || null]
    )
    
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
    const { title, description, status, priority, due_date, user_id } = req.body
    
    // 检查任务是否存在
    const existingTask = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // 验证状态值
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        })
      }
    }
    
    // 验证优先级值
    if (priority) {
      const validPriorities = ['low', 'medium', 'high']
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ 
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
        })
      }
    }
    
    // 如果提供了user_id，验证用户是否存在
    if (user_id !== undefined && user_id !== null) {
      const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id])
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assigned user not found' })
      }
    }
    
    // 构建动态更新查询
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
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramIndex++}`)
      values.push(user_id)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    const query_text = `
      UPDATE tasks 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `
    
    const result = await query(query_text, values)
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
    
    // 检查任务是否存在
    const existingTask = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    await query('DELETE FROM tasks WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// 批量更新任务状态
router.patch('/batch/status', async (req, res) => {
  try {
    const { ids, status } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' })
    }
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      })
    }
    
    const placeholders = ids.map((_, index) => `$${index + 2}`).join(', ')
    const result = await query(
      `UPDATE tasks SET status = $1 WHERE id IN (${placeholders}) RETURNING *`,
      [status, ...ids]
    )
    
    res.json({
      message: `Updated ${result.rowCount} tasks`,
      tasks: result.rows
    })
  } catch (error) {
    console.error('Error batch updating tasks:', error)
    res.status(500).json({ error: 'Failed to update tasks' })
  }
})

// 获取任务统计
router.get('/stats/overview', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue
      FROM tasks
    `)
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching task stats:', error)
    res.status(500).json({ error: 'Failed to fetch task statistics' })
  }
})

export default router
