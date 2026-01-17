<template>
  <div class="p-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm">Total Tasks</p>
            <p class="text-3xl font-bold mt-1">{{ tasks.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <CheckSquare class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm">Completed</p>
            <p class="text-3xl font-bold mt-1">{{ completedTasks }}</p>
          </div>
          <div class="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div class="mt-3">
          <div class="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 rounded-full transition-all"
              :style="{ width: `${completionRate}%` }"
            ></div>
          </div>
          <p class="text-xs text-zinc-500 mt-1">{{ completionRate }}% completion rate</p>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm">In Progress</p>
            <p class="text-3xl font-bold mt-1">{{ inProgressTasks }}</p>
          </div>
          <div class="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Clock class="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm">Overdue</p>
            <p class="text-3xl font-bold mt-1 text-red-400">{{ overdueTasks }}</p>
          </div>
          <div class="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent & Upcoming -->
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 class="font-semibold mb-4 flex items-center gap-2">
          <Zap class="w-4 h-4 text-amber-400" />
          High Priority Tasks
        </h3>
        <div class="space-y-3">
          <div
            v-for="task in highPriorityTasks.slice(0, 5)"
            :key="task.id"
            class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
          >
            <button
              @click="toggleTaskStatus(task.id)"
              :class="[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                task.status === 'completed'
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-zinc-600 hover:border-emerald-500'
              ]"
            >
              <Check v-if="task.status === 'completed'" class="w-3 h-3 text-white" />
            </button>
            <div class="flex-1 min-w-0">
              <p
                :class="[
                  'text-sm truncate',
                  task.status === 'completed' && 'line-through text-zinc-500'
                ]"
              >
                {{ task.title }}
              </p>
              <p class="text-xs text-zinc-500">{{ task.dueDate }}</p>
            </div>
            <span class="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">High</span>
          </div>
          <p v-if="highPriorityTasks.length === 0" class="text-zinc-500 text-sm text-center py-4">
            No high priority tasks
          </p>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 class="font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-4 h-4 text-blue-400" />
          Upcoming Deadlines
        </h3>
        <div class="space-y-3">
          <div
            v-for="task in upcomingTasks.slice(0, 5)"
            :key="task.id"
            class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
          >
            <div :class="['w-2 h-2 rounded-full', getPriorityColor(task.priority)]"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm truncate">{{ task.title }}</p>
              <p class="text-xs text-zinc-500">{{ getCategoryLabel(task.category) }}</p>
            </div>
            <span class="text-xs text-zinc-400">{{ task.dueDate }}</span>
          </div>
          <p v-if="upcomingTasks.length === 0" class="text-zinc-500 text-sm text-center py-4">
            No upcoming deadlines
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {  onMounted } from 'vue'
import {
  CheckSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  Check
} from 'lucide-vue-next'
import axios from 'axios'
import { useTasks } from '../composables/useTasks'
import { getCategoryLabel } from '../constants/categories'

const { tasks, completedTasks, inProgressTasks, overdueTasks, completionRate, highPriorityTasks, upcomingTasks } = useTasks()

const getPriorityColor = priority => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500'
  }
  return colors[priority] || 'bg-zinc-500'
}

// 获取任务数据
const fetchTasks = async () => {
  try {
    const response = await axios.get('/api/tasks')
    if (response.data && response.data.length > 0) {
      tasks.value = response.data
    }
  } catch (error) {
    console.error('获取任务失败:', error)
    // 使用本地数据作为后备，不更新 tasks.value
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTasks()
})
</script>