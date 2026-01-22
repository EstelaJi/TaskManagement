<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckSquare class="w-8 h-8 text-zinc-600" />
      </div>
      <p class="text-zinc-400 text-lg">No tasks found</p>
      <p class="text-zinc-500 text-sm mt-2">Create your first task to get started</p>
    </div>

    <!-- Task Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
      >
        <!-- Task Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-start gap-3 flex-1">
            <button
              @click="toggleTaskStatus(task.id)"
              :class="[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                task.status === 'completed'
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-zinc-600 hover:border-emerald-500'
              ]"
            >
              <Check v-if="task.status === 'completed'" class="w-3 h-3 text-white" />
            </button>
            <div class="flex-1 min-w-0">
              <h3
                :class="[
                  'font-semibold text-lg mb-1',
                  task.status === 'completed' && 'line-through text-zinc-500'
                ]"
              >
                {{ task.title }}
              </h3>
              <p v-if="task.description" class="text-zinc-400 text-sm line-clamp-2">
                {{ task.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Task Meta -->
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <!-- Priority Badge -->
          <span
            :class="[
              'px-2 py-1 text-xs rounded-full font-medium',
              getPriorityClass(task.priority)
            ]"
          >
            {{ task.priority.charAt(0).toUpperCase() + task.priority.slice(1) }}
          </span>

          <!-- Status Badge -->
          <span
            :class="[
              'px-2 py-1 text-xs rounded-full font-medium',
              getStatusClass(task.status)
            ]"
          >
            {{ formatStatus(task.status) }}
          </span>

          <!-- Category Badge -->
          <span
            v-if="task.category"
            class="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-400"
          >
            {{ getCategoryLabel(task.category) }}
          </span>
        </div>

        <!-- Due Date -->
        <div v-if="task.due_date || task.dueDate" class="flex items-center gap-2 text-sm text-zinc-400">
          <Calendar class="w-4 h-4" />
          <span>{{ formatDate(task.due_date || task.dueDate) }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
          <button
            @click="deleteTask(task.id)"
            class="text-zinc-400 hover:text-red-400 transition-colors"
            title="Delete task"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CheckSquare, Check, Calendar, Trash2, Loader2 } from 'lucide-vue-next'
import { useTasks } from '../composables/useTasks'
import { getCategoryLabel } from '../constants/categories'

const { tasks, loading, fetchTasks, toggleTaskStatus, deleteTask: removeTask } = useTasks()

// 获取任务列表
onMounted(async () => {
  await fetchTasks()
  
  // 监听任务添加事件
  window.addEventListener('task-added', handleTaskAdded)
})

onUnmounted(() => {
  window.removeEventListener('task-added', handleTaskAdded)
})

const handleTaskAdded = async () => {
  await fetchTasks()
}

// 格式化状态
const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return statusMap[status] || status
}

// 获取优先级样式
const getPriorityClass = (priority) => {
  const classes = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-blue-500/20 text-blue-400'
  }
  return classes[priority] || 'bg-zinc-800 text-zinc-400'
}

// 获取状态样式
const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-zinc-500/20 text-zinc-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-emerald-500/20 text-emerald-400'
  }
  return classes[status] || 'bg-zinc-800 text-zinc-400'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// 删除任务
const deleteTask = async (id) => {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      await removeTask(id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }
}

// 过滤后的任务（目前显示所有任务，可以根据需要添加过滤逻辑）
const filteredTasks = computed(() => {
  return tasks.value
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
