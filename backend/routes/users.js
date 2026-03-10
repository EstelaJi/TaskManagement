import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, first_name, last_name, avatar, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 获取单个用户
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'SELECT id, username, email, first_name, last_name, avatar, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 创建新用户
router.post('/', async (req, res) => {
  const { username, email, password, first_name, last_name, avatar } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  
  try {
    const result = await query(
      `INSERT INTO users (username, email, password, first_name, last_name, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name, last_name, avatar, created_at`,
      [username, email, password, first_name, last_name, avatar]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 更新用户
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password, first_name, last_name, avatar } = req.body;
  
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(password);
    }
    if (first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(last_name);
    }
    if (avatar !== undefined) {
      fields.push(`avatar = $${paramIndex++}`);
      values.push(avatar);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, first_name, last_name, avatar, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
