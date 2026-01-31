import express from 'express';
import { query } from '../config/database.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let sql, params;

    if (status && user_id) {
      sql = 'SELECT * FROM tasks WHERE status = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4';
      params = [status, user_id, limit, offset];
    } else if (status) {
      sql = 'SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params = [status, limit, offset];
    } else if (user_id) {
      sql = 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params = [user_id, limit, offset];
    } else {
      sql = 'SELECT * FROM tasks ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      params = [limit, offset];
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, status = 'pending', priority = 'medium', category, due_date, user_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const sql = `
      INSERT INTO tasks (title, description, status, priority, category, due_date, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await query(sql, [title, description || '', status, priority, category, due_date, user_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category, due_date, user_id } = req.body;

    const checkResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const sql = `
      UPDATE tasks
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          priority = COALESCE($4, priority),
          category = COALESCE($5, category),
          due_date = COALESCE($6, due_date),
          user_id = COALESCE($7, user_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    const result = await query(sql, [title, description, status, priority, category, due_date, user_id, id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
