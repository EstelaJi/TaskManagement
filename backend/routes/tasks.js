import express from 'express'
import { Task, User } from '../models/index.js'
import { Op } from 'sequelize'

const router = express.Router()

// 获取所有任务（支持过滤、分页）
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      category,
      userId,
      search = '',
      fromDate,
      toDate
    } = req.query
    
    const offset = (page - 1) * limit
    
    const whereClause = {
      isActive: true
    }
    
    // 过滤条件
    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (category) whereClause.category = category
    if (userId) whereClause.userId = userId
    
    // 搜索标题或描述
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ]
    }
    
    // 日期范围
    if (fromDate || toDate) {
      whereClause.dueDate = {}
      if (fromDate) whereClause.dueDate[Op.gte] = new Date(fromDate)
      if (toDate) whereClause.dueDate[Op.lte] = new Date(toDate)
    }
    
    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['dueDate', 'ASC NULLS LAST'],
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    })
    
    res.json({
      tasks,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message })
  }
})

// 获取单个任务
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const task = await Task.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }]
    })
    
    if (!task || !task.isActive) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    res.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ error: 'Failed to fetch task', details: error.message })
  }
})

// 创建新任务
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status = 'pending', 
      priority = 'medium',
      category,
      dueDate,
      userId,
      tags = []
    } = req.body
    
    // 验证必填字段
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    
    // 验证用户是否存在
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const newTask = await Task.create({
      title,
      description: description || '',
      status,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId,
      tags
    })
    
    // 返回包含用户信息的任务
    const taskWithUser = await Task.findByPk(newTask.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    })
    
    res.status(201).json(taskWithUser)
  } catch (error) {
    console.error('Error creating task:', error)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    res.status(500).json({ error: 'Failed to create task', details: error.message })
  }
})

// 更新任务
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { 
      title, 
      description, 
      status, 
      priority,
      category,
      dueDate,
      userId,
      tags,
      isActive
    } = req.body
    
    const task = await Task.findByPk(id)
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // 如果要更改用户，验证新用户是否存在
    if (userId && userId !== task.userId) {
      const user = await User.findByPk(userId)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
    }
    
    await task.update({
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      category: category !== undefined ? category : task.category,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      userId: userId !== undefined ? userId : task.userId,
      tags: tags !== undefined ? tags : task.tags,
      isActive: isActive !== undefined ? isActive : task.isActive
    })
    
    // 返回更新后的任务（包含用户信息）
    const updatedTask = await Task.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    })
    
    res.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    res.status(500).json({ error: 'Failed to update task', details: error.message })
  }
})

// 删除任务（软删除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const task = await Task.findByPk(id)
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // 软删除
    await task.update({ isActive: false })
    
    // 硬删除：await task.destroy()
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Failed to delete task', details: error.message })
  }
})

// 批量删除任务
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid task IDs' })
    }
    
    await Task.update(
      { isActive: false },
      { where: { id: { [Op.in]: ids } } }
    )
    
    res.json({ message: `${ids.length} tasks deleted successfully` })
  } catch (error) {
    console.error('Error batch deleting tasks:', error)
    res.status(500).json({ error: 'Failed to batch delete tasks', details: error.message })
  }
})

// 获取任务统计
router.get('/stats/summary', async (req, res) => {
  try {
    const { userId } = req.query
    
    const whereClause = { isActive: true }
    if (userId) whereClause.userId = userId
    
    const [statusStats, priorityStats, totalCount] = await Promise.all([
      Task.count({ where: whereClause, group: ['status'] }),
      Task.count({ where: whereClause, group: ['priority'] }),
      Task.count({ where: whereClause })
    ])
    
    // 格式化状态统计
    const statusSummary = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    }
    
    statusStats.forEach(item => {
      statusSummary[item.status] = item.count
    })
    
    // 格式化优先级统计
    const prioritySummary = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    }
    
    priorityStats.forEach(item => {
      prioritySummary[item.priority] = item.count
    })
    
    res.json({
      total: totalCount,
      byStatus: statusSummary,
      byPriority: prioritySummary,
      completionRate: totalCount > 0 
        ? Math.round((statusSummary.completed / totalCount) * 100) 
        : 0
    })
  } catch (error) {
    console.error('Error fetching task stats:', error)
    res.status(500).json({ error: 'Failed to fetch task stats', details: error.message })
  }
})

export default router
