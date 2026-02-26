import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

const formatTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  status: row.status,
  category: row.category,
  dueDate: row.due_date,
  tags: row.tags || [],
  userId: row.user_id,
  subtasks: row.subtasks || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

router.get('/', async (req, res) => {
  try {
    const { status, category, priority, user_id } = req.query
    
    let sql = `
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'title', s.title, 'completed', s.completed)
            ORDER BY s.created_at
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as subtasks
      FROM tasks t
      LEFT JOIN subtasks s ON t.id = s.task_id
    `
    
    const conditions = []
    const values = []
    let paramIndex = 1
    
    if (status) {
      conditions.push(`t.status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }
    if (category) {
      conditions.push(`t.category = $${paramIndex}`)
      values.push(category)
      paramIndex++
    }
    if (priority) {
      conditions.push(`t.priority = $${paramIndex}`)
      values.push(priority)
      paramIndex++
    }
    if (user_id) {
      conditions.push(`t.user_id = $${paramIndex}`)
      values.push(parseInt(user_id))
      paramIndex++
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    
    sql += ` GROUP BY t.id ORDER BY t.created_at DESC`
    
    const result = await query(sql, values)
    res.json(result.rows.map(formatTask))
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const result = await query(`
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'title', s.title, 'completed', s.completed)
            ORDER BY s.created_at
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as subtasks
      FROM tasks t
      LEFT JOIN subtasks s ON t.id = s.task_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    res.json(formatTask(result.rows[0]))
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ error: 'Failed to fetch task' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, description, priority, status, category, dueDate, tags, userId, subtasks } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    const result = await query(`
      INSERT INTO tasks (title, description, priority, status, category, due_date, tags, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      title,
      description || null,
      priority || 'medium',
      status || 'todo',
      category || 'work',
      dueDate || null,
      tags || [],
      userId || null
    ])
    
    const newTask = result.rows[0]
    
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await query(`
          INSERT INTO subtasks (task_id, title, completed)
          VALUES ($1, $2, $3)
        `, [newTask.id, subtask.title, subtask.completed || false])
      }
      
      const subtasksResult = await query(`
        SELECT id, title, completed FROM subtasks WHERE task_id = $1 ORDER BY created_at
      `, [newTask.id])
      
      newTask.subtasks = subtasksResult.rows
    } else {
      newTask.subtasks = []
    }
    
    res.status(201).json(formatTask(newTask))
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { title, description, priority, status, category, dueDate, tags, userId, subtasks } = req.body
    
    const checkResult = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const result = await query(`
      UPDATE tasks
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        status = COALESCE($4, status),
        category = COALESCE($5, category),
        due_date = COALESCE($6, due_date),
        tags = COALESCE($7, tags),
        user_id = COALESCE($8, user_id)
      WHERE id = $9
      RETURNING *
    `, [title, description, priority, status, category, dueDate, tags, userId, id])
    
    const updatedTask = result.rows[0]
    
    if (subtasks !== undefined) {
      await query('DELETE FROM subtasks WHERE task_id = $1', [id])
      
      if (subtasks && subtasks.length > 0) {
        for (const subtask of subtasks) {
          await query(`
            INSERT INTO subtasks (task_id, title, completed)
            VALUES ($1, $2, $3)
          `, [id, subtask.title, subtask.completed || false])
        }
      }
    }
    
    const subtasksResult = await query(`
      SELECT id, title, completed FROM subtasks WHERE task_id = $1 ORDER BY created_at
    `, [id])
    
    updatedTask.subtasks = subtasksResult.rows
    
    res.json(formatTask(updatedTask))
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const updates = req.body
    
    const checkResult = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const allowedFields = {
      title: 'title',
      description: 'description',
      priority: 'priority',
      status: 'status',
      category: 'category',
      dueDate: 'due_date',
      tags: 'tags',
      userId: 'user_id'
    }
    
    const setClauses = []
    const values = [id]
    let paramIndex = 2
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields[key] && key !== 'subtasks') {
        setClauses.push(`${allowedFields[key]} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }
    
    if (setClauses.length === 0 && updates.subtasks === undefined) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    let updatedTask
    if (setClauses.length > 0) {
      const result = await query(`
        UPDATE tasks
        SET ${setClauses.join(', ')}
        WHERE id = $1
        RETURNING *
      `, values)
      updatedTask = result.rows[0]
    } else {
      const result = await query('SELECT * FROM tasks WHERE id = $1', [id])
      updatedTask = result.rows[0]
    }
    
    if (updates.subtasks !== undefined) {
      await query('DELETE FROM subtasks WHERE task_id = $1', [id])
      
      if (updates.subtasks && updates.subtasks.length > 0) {
        for (const subtask of updates.subtasks) {
          await query(`
            INSERT INTO subtasks (task_id, title, completed)
            VALUES ($1, $2, $3)
          `, [id, subtask.title, subtask.completed || false])
        }
      }
    }
    
    const subtasksResult = await query(`
      SELECT id, title, completed FROM subtasks WHERE task_id = $1 ORDER BY created_at
    `, [id])
    
    updatedTask.subtasks = subtasksResult.rows
    
    res.json(formatTask(updatedTask))
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const checkResult = await query('SELECT id FROM tasks WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    await query('DELETE FROM tasks WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

router.post('/:id/subtasks', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const { title, completed } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    const checkResult = await query('SELECT id FROM tasks WHERE id = $1', [taskId])
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const result = await query(`
      INSERT INTO subtasks (task_id, title, completed)
      VALUES ($1, $2, $3)
      RETURNING id, title, completed
    `, [taskId, title, completed || false])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating subtask:', error)
    res.status(500).json({ error: 'Failed to create subtask' })
  }
})

router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const subtaskId = parseInt(req.params.subtaskId)
    const { title, completed } = req.body
    
    const result = await query(`
      UPDATE subtasks
      SET 
        title = COALESCE($1, title),
        completed = COALESCE($2, completed)
      WHERE id = $3 AND task_id = $4
      RETURNING id, title, completed
    `, [title, completed, subtaskId, taskId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating subtask:', error)
    res.status(500).json({ error: 'Failed to update subtask' })
  }
})

router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const subtaskId = parseInt(req.params.subtaskId)
    
    const result = await query(`
      DELETE FROM subtasks
      WHERE id = $1 AND task_id = $2
      RETURNING id
    `, [subtaskId, taskId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting subtask:', error)
    res.status(500).json({ error: 'Failed to delete subtask' })
  }
})

export default router
