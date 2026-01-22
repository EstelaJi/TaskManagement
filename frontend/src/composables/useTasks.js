import { ref, computed } from 'vue'
import axios from 'axios'

// 模拟任务数据（作为后备数据）
export const mockTasks = [
  {
    id: 1,
    title: 'Complete project proposal',
    description: 'Finalize the Q1 project proposal document with budget estimates',
    priority: 'high',
    status: 'in-progress',
    category: 'work',
    dueDate: '2026-01-18',
    tags: ['urgent', 'proposal'],
    subtasks: [
      { title: 'Research competitors', completed: true },
      { title: 'Draft budget', completed: true },
      { title: 'Review with team', completed: false }
    ]
  },
  {
    id: 2,
    title: 'Review design mockups',
    description: 'Review and provide feedback on the new landing page designs',
    priority: 'medium',
    status: 'todo',
    category: 'work',
    dueDate: '2026-01-19',
    tags: ['design', 'review'],
    subtasks: []
  },
  {
    id: 3,
    title: 'Schedule dentist appointment',
    description: 'Book annual dental checkup',
    priority: 'low',
    status: 'todo',
    category: 'health',
    dueDate: '2026-01-25',
    tags: ['health'],
    subtasks: []
  },
  {
    id: 4,
    title: 'Prepare team presentation',
    description: 'Create slides for the quarterly team meeting',
    priority: 'high',
    status: 'todo',
    category: 'work',
    dueDate: '2026-01-17',
    tags: ['presentation', 'meeting'],
    subtasks: [
      { title: 'Gather metrics', completed: false },
      { title: 'Create slides', completed: false },
      { title: 'Practice presentation', completed: false }
    ]
  },
  {
    id: 5,
    title: 'Buy groceries',
    description: 'Weekly grocery shopping for essentials',
    priority: 'medium',
    status: 'completed',
    category: 'personal',
    dueDate: '2026-01-16',
    tags: ['shopping'],
    subtasks: []
  },
  {
    id: 6,
    title: 'Update portfolio website',
    description: 'Add recent projects and update bio section',
    priority: 'medium',
    status: 'in-progress',
    category: 'work',
    dueDate: '2026-01-22',
    tags: ['website', 'portfolio'],
    subtasks: [
      { title: 'Add new projects', completed: true },
      { title: 'Update bio', completed: false },
      { title: 'Fix mobile layout', completed: false }
    ]
  },
  {
    id: 7,
    title: 'Morning workout routine',
    description: '30-minute exercise session',
    priority: 'medium',
    status: 'completed',
    category: 'health',
    dueDate: '2026-01-16',
    tags: ['fitness', 'daily'],
    subtasks: []
  },
  {
    id: 8,
    title: 'Read Vue 3 documentation',
    description: 'Study composition API and new features',
    priority: 'low',
    status: 'in-progress',
    category: 'learning',
    dueDate: '2026-01-30',
    tags: ['learning', 'vue'],
    subtasks: [
      { title: 'Composition API basics', completed: true },
      { title: 'Reactivity in depth', completed: true },
      { title: 'Advanced patterns', completed: false }
    ]
  }
]

/**
 * 将后端返回的 snake_case 数据转换为前端使用的格式
 */
const normalizeTask = (task) => {
  if (!task) return task
  return {
    ...task,
    dueDate: task.due_date || task.dueDate,
    due_date: task.due_date || task.dueDate,
    userId: task.user_id || task.userId,
    createdAt: task.created_at || task.createdAt,
    updatedAt: task.updated_at || task.updatedAt
  }
}

/**
 * 任务管理的 Composable
 * 提供任务数据的响应式状态和相关方法
 */
export function useTasks() {
  const tasks = ref([...mockTasks])
  const loading = ref(false)
  const error = ref(null)

  // 获取任务列表
  const fetchTasks = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/tasks')
      if (response.data && response.data.length > 0) {
        tasks.value = response.data.map(normalizeTask)
      }
    } catch (err) {
      console.error('获取任务失败:', err)
      error.value = err
      // 使用模拟数据作为后备
      tasks.value = [...mockTasks]
    } finally {
      loading.value = false
    }
  }

  // 添加任务
  const addTask = async taskData => {
    try {
      const response = await axios.post('/api/tasks', taskData)
      const normalizedTask = normalizeTask(response.data)
      tasks.value.push(normalizedTask)
      return normalizedTask
    } catch (err) {
      console.error('添加任务失败:', err)
      throw err
    }
  }

  // 更新任务
  const updateTask = async (id, updates) => {
    try {
      const response = await axios.patch(`/api/tasks/${id}`, updates)
      const normalizedTask = normalizeTask(response.data)
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...normalizedTask }
      }
      return normalizedTask
    } catch (err) {
      console.error('更新任务失败:', err)
      throw err
    }
  }

  // 删除任务
  const deleteTask = async id => {
    try {
      await axios.delete(`/api/tasks/${id}`)
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (err) {
      console.error('删除任务失败:', err)
      throw err
    }
  }

  // 切换任务状态
  const toggleTaskStatus = async taskId => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    try {
      await updateTask(taskId, { status: newStatus })
    } catch (err) {
      console.error('更新任务状态失败:', err)
      // 如果 API 调用失败，仍然更新本地状态
      task.status = newStatus
    }
  }

  // 计算属性：已完成任务数
  const completedTasks = computed(() => {
    return tasks.value.filter(t => t.status === 'completed').length
  })

  // 计算属性：进行中任务数
  const inProgressTasks = computed(() => {
    return tasks.value.filter(t => t.status === 'in-progress').length
  })

  // 计算属性：逾期任务数
  const overdueTasks = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.value.filter(task => {
      if (task.status === 'completed') return false
      const dueDateStr = task.dueDate || task.due_date
      if (!dueDateStr) return false
      const dueDate = new Date(dueDateStr)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    }).length
  })

  // 计算属性：完成率
  const completionRate = computed(() => {
    if (tasks.value.length === 0) return 0
    return Math.round((completedTasks.value / tasks.value.length) * 100)
  })

  // 计算属性：高优先级任务
  const highPriorityTasks = computed(() => {
    return tasks.value
      .filter(t => t.priority === 'high' && t.status !== 'completed')
      .sort((a, b) => {
        const dateA = new Date(a.dueDate || a.due_date || 0)
        const dateB = new Date(b.dueDate || b.due_date || 0)
        return dateA - dateB
      })
  })

  // 计算属性：即将到期的任务
  const upcomingTasks = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return tasks.value
      .filter(task => {
        if (task.status === 'completed') return false
        const dueDateStr = task.dueDate || task.due_date
        if (!dueDateStr) return false
        const dueDate = new Date(dueDateStr)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate >= today && dueDate <= nextWeek
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate || a.due_date || 0)
        const dateB = new Date(b.dueDate || b.due_date || 0)
        return dateA - dateB
      })
  })

  return {
    // 状态
    tasks,
    loading,
    error,
    // 方法
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    // 计算属性
    completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
    highPriorityTasks,
    upcomingTasks
  }
}
