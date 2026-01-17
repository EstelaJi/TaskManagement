import pool from '../config/db.js';

class Task {
  static async findAll() {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async create(taskData) {
    const { title, description, status, priority, due_date, user_id } = taskData;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, status, priority, due_date, user_id]
    );
    return result.rows[0];
  }

  static async update(id, taskData) {
    const { title, description, status, priority, due_date } = taskData;
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5 WHERE id = $6 RETURNING *',
      [title, description, status, priority, due_date, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

export default Task;