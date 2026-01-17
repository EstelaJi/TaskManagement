import express from 'express'
const router = express.Router()

// 临时内存存储（后续可以替换为数据库）
let tasks = [
  {
    id: 1,
    title: 'Learn Vue 3 basics',
    description: 'Know the core concepts and Composition API of Vue 3',
    status: 'pending',
    createdAt: new Date().toISOString()
  },
]

let nextId = 3

// 获取所有任务
router.get('/', (req, res) => {
  res.json(tasks)
})

// 获取单个任务
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const task = tasks.find(t => t.id === id)
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }
  
  res.json(task)
})

// 创建新任务
router.post('/', (req, res) => {
  const { title, description, status = 'pending' } = req.body
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' })
  }
  
  const newTask = {
    id: nextId++,
    title,
    description: description || '',
    status,
    createdAt: new Date().toISOString()
  }
  
  tasks.push(newTask)
  res.status(201).json(newTask)
})

// 更新任务
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const task = tasks.find(t => t.id === id)
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }
  
  const { title, description, status } = req.body
  
  if (title !== undefined) task.title = title
  if (description !== undefined) task.description = description
  if (status !== undefined) task.status = status
  
  res.json(task)
})

// 删除任务
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const taskIndex = tasks.findIndex(t => t.id === id)
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' })
  }
  
  tasks.splice(taskIndex, 1)
  res.status(204).send()
})

export default router

