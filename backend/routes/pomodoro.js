import express from 'express'
import pool from '../config/database.js'
const router = express.Router()

// 获取所有时间追踪记录
router.get('/', async (req, res) => {
  try {
    const { user_id, task_id, start_date, end_date } = req.query
    
    let query = `
      SELECT 
        ps.*,
        t.title as task_title,
        t.category as task_category
      FROM pomodoro_sessions ps
      LEFT JOIN tasks t ON ps.task_id = t.id
      WHERE 1=1
    `
    const conditions = []
    const values = []
    let paramCount = 1
    
    if (user_id) {
      conditions.push(`ps.user_id = $${paramCount++}`)
      values.push(user_id)
    }
    
    if (task_id) {
      conditions.push(`ps.task_id = $${paramCount++}`)
      values.push(task_id)
    }
    
    if (start_date) {
      conditions.push(`ps.started_at >= $${paramCount++}`)
      values.push(start_date)
    }
    
    if (end_date) {
      conditions.push(`ps.started_at <= $${paramCount++}`)
      values.push(end_date)
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY ps.started_at DESC'
    
    const result = await pool.query(query, values)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error)
    res.status(500).json({ error: 'Failed to fetch pomodoro sessions' })
  }
})

// 获取单个时间追踪记录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT 
        ps.*,
        t.title as task_title,
        t.category as task_category
      FROM pomodoro_sessions ps
      LEFT JOIN tasks t ON ps.task_id = t.id
      WHERE ps.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pomodoro session not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching pomodoro session:', error)
    res.status(500).json({ error: 'Failed to fetch pomodoro session' })
  }
})

// 创建新的时间追踪记录
router.post('/', async (req, res) => {
  try {
    const { task_id, user_id, duration = 1500, session_type = 'work', completed = false } = req.body
    
    const result = await pool.query(
      `INSERT INTO pomodoro_sessions (task_id, user_id, duration, session_type, completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        task_id || null,
        user_id || null,
        duration,
        session_type,
        completed,
        completed ? new Date() : null
      ]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating pomodoro session:', error)
    res.status(500).json({ error: 'Failed to create pomodoro session' })
  }
})

// 更新时间追踪记录（标记为完成）
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { completed, duration } = req.body
    
    const updates = []
    const values = []
    let paramCount = 1
    
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`)
      values.push(completed)
      if (completed) {
        updates.push(`completed_at = $${paramCount++}`)
        values.push(new Date())
      }
    }
    
    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`)
      values.push(duration)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    values.push(id)
    
    const result = await pool.query(
      `UPDATE pomodoro_sessions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pomodoro session not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating pomodoro session:', error)
    res.status(500).json({ error: 'Failed to update pomodoro session' })
  }
})

// 删除时间追踪记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query('DELETE FROM pomodoro_sessions WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pomodoro session not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting pomodoro session:', error)
    res.status(500).json({ error: 'Failed to delete pomodoro session' })
  }
})

// 获取统计数据
router.get('/stats/summary', async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query
    
    let query = `
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN completed = true THEN duration ELSE 0 END) as total_duration,
        SUM(CASE WHEN session_type = 'work' AND completed = true THEN 1 ELSE 0 END) as work_sessions,
        SUM(CASE WHEN session_type = 'short_break' AND completed = true THEN 1 ELSE 0 END) as short_break_sessions,
        SUM(CASE WHEN session_type = 'long_break' AND completed = true THEN 1 ELSE 0 END) as long_break_sessions
      FROM pomodoro_sessions
      WHERE 1=1
    `
    const conditions = []
    const values = []
    let paramCount = 1
    
    if (user_id) {
      conditions.push(`user_id = $${paramCount++}`)
      values.push(user_id)
    }
    
    if (start_date) {
      conditions.push(`started_at >= $${paramCount++}`)
      values.push(start_date)
    }
    
    if (end_date) {
      conditions.push(`started_at <= $${paramCount++}`)
      values.push(end_date)
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ')
    }
    
    const result = await pool.query(query, values)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching pomodoro stats:', error)
    res.status(500).json({ error: 'Failed to fetch pomodoro stats' })
  }
})

// 获取每日时间追踪数据（用于图表）
router.get('/stats/daily', async (req, res) => {
  try {
    const { user_id, days = 7 } = req.query
    
    let query = `
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as total_sessions,
        SUM(CASE WHEN completed = true THEN duration ELSE 0 END) as total_duration,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_sessions
      FROM pomodoro_sessions
      WHERE 1=1
    `
    const conditions = []
    const values = []
    let paramCount = 1
    
    if (user_id) {
      conditions.push(`user_id = $${paramCount++}`)
      values.push(user_id)
    }
    
    // 默认显示最近7天
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))
    conditions.push(`started_at >= $${paramCount++}`)
    values.push(startDate.toISOString())
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ')
    }
    
    query += ' GROUP BY DATE(started_at) ORDER BY date DESC'
    
    const result = await pool.query(query, values)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching daily pomodoro stats:', error)
    res.status(500).json({ error: 'Failed to fetch daily pomodoro stats' })
  }
})

export default router
