import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 获取所有任务（支持按用户筛选）
router.get('/', async (req, res) => {
  const { user_id, status, priority, category } = req.query;
  
  try {
    let sql = `SELECT t.*, u.username as user_name 
               FROM tasks t 
               LEFT JOIN users u ON t.user_id = u.id 
               WHERE 1=1`;
    const values = [];
    let paramIndex = 1;
    
    if (user_id) {
      sql += ` AND t.user_id = $${paramIndex++}`;
      values.push(user_id);
    }
    if (status) {
      sql += ` AND t.status = $${paramIndex++}`;
      values.push(status);
    }
    if (priority) {
      sql += ` AND t.priority = $${paramIndex++}`;
      values.push(priority);
    }
    if (category) {
      sql += ` AND t.category = $${paramIndex++}`;
      values.push(category);
    }
    
    sql += ` ORDER BY t.created_at DESC`;
    
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 获取单个任务
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT t.*, u.username as user_name 
       FROM tasks t 
       LEFT JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// 创建新任务
router.post('/', async (req, res) => {
  const { user_id, title, description, status, priority, category, due_date } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  try {
    const result = await query(
      `INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, title, description, status || 'pending', priority || 'medium', category, due_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid user_id' });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 更新任务
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, title, description, status, priority, category, due_date } = req.body;
  
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (user_id !== undefined) {
      fields.push(`user_id = $${paramIndex++}`);
      values.push(user_id);
    }
    if (title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }
    if (category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (due_date !== undefined) {
      fields.push(`due_date = $${paramIndex++}`);
      values.push(due_date);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid user_id' });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
