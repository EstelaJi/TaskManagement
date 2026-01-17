import express from 'express'
import Task from '../models/Task.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { user_id, status, priority } = req.query
    const filters = {}
    
    if (user_id) filters.user_id = parseInt(user_id)
    if (status) filters.status = status
    if (priority) filters.priority = priority
    
    const tasks = await Task.findAll(filters)
    res.json({ success: true, data: tasks })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const task = await Task.findById(id)
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { user_id, title, description, status, priority, due_date } = req.body
    
    if (!user_id || !title) {
      return res.status(400).json({ success: false, error: 'user_id and title are required' })
    }
    
    const newTask = await Task.create({
      user_id: parseInt(user_id),
      title,
      description,
      status,
      priority,
      due_date
    })
    
    res.status(201).json({ success: true, data: newTask })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { title, description, status, priority, due_date, completed_at } = req.body
    
    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    
    const updatedTask = await Task.update(id, {
      title,
      description,
      status,
      priority,
      due_date,
      completed_at
    })
    
    res.json({ success: true, data: updatedTask })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    
    await Task.delete(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/user/:user_id/stats', async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id)
    const stats = await Task.getStatsByUserId(user_id)
    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router

