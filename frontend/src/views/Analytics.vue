<template>
  <div class="p-6">
    <div class="grid grid-cols-3 gap-6">
            <!-- Priority Distribution -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 class="font-semibold mb-4">Priority Distribution</h3>
              <div class="space-y-3">
                <div v-for="priority in ['high', 'medium', 'low']" :key="priority">
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="capitalize">{{ priority }}</span>
                    <span class="text-zinc-500">{{ getPriorityCount(priority) }} tasks</span>
                  </div>
                  <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full', getPriorityBarColor(priority)]"
                      :style="{ width: `${getPriorityPercentage(priority)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Status Overview -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 class="font-semibold mb-4">Status Overview</h3>
              <div class="space-y-3">
                <div v-for="status in ['todo', 'in-progress', 'completed']" :key="status">
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span>{{ formatStatus(status) }}</span>
                    <span class="text-zinc-500">{{ getStatusCount(status) }} tasks</span>
                  </div>
                  <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full', getStatusBarColor(status)]"
                      :style="{ width: `${getStatusPercentage(status)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Category Breakdown -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 class="font-semibold mb-4">Category Breakdown</h3>
              <div class="space-y-3">
                <div v-for="cat in categories" :key="cat.id">
                  <div class="flex items-center justify-between text-sm mb-1">
                    <div class="flex items-center gap-2">
                      <div :class="['w-2 h-2 rounded-full', cat.color]"></div>
                      <span>{{ cat.label }}</span>
                    </div>
                    <span class="text-zinc-500">{{ getCategoryCount(cat.id) }}</span>
                  </div>
                  <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full', cat.color]"
                      :style="{ width: `${getCategoryPercentage(cat.id)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Weekly Activity -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-6">
            <h3 class="font-semibold mb-4">Weekly Activity</h3>
            <div class="flex items-end gap-4 h-40">
              <div v-for="day in weeklyActivity" :key="day.day" class="flex-1 flex flex-col items-center gap-2">
                <div class="flex-1 w-full flex items-end gap-1">
                  <div
                    class="flex-1 bg-emerald-500/80 rounded-t"
                    :style="{ height: `${(day.completed / maxWeeklyValue) * 100}%` }"
                  ></div>
                  <div
                    class="flex-1 bg-blue-500/80 rounded-t"
                    :style="{ height: `${(day.created / maxWeeklyValue) * 100}%` }"
                  ></div>
                </div>
                <span class="text-xs text-zinc-500">{{ day.day }}</span>
              </div>
            </div>
            <div class="flex items-center justify-center gap-6 mt-4">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-emerald-500/80 rounded"></div>
                <span class="text-sm text-zinc-500">Completed</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500/80 rounded"></div>
                <span class="text-sm text-zinc-500">Created</span>
              </div>
            </div>
          </div>
        </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTasks } from '../composables/useTasks'
import { CATEGORIES } from '../constants/categories'

const { tasks } = useTasks()

const categories = computed(() => CATEGORIES)

const getPriorityBg = priority => {
  const colors = {
    high: 'bg-red-500/30 text-red-300',
    medium: 'bg-amber-500/30 text-amber-300',
    low: 'bg-blue-500/30 text-blue-300'
  }
  return colors[priority]
}

const getPriorityCount = priority => tasks.value.filter(t => t.priority === priority).length
const getPriorityPercentage = priority =>
  tasks.value.length ? (getPriorityCount(priority) / tasks.value.length) * 100 : 0
const getPriorityBarColor = priority => {
  const colors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-500' }
  return colors[priority]
}

const getStatusCount = status => tasks.value.filter(t => t.status === status).length
const getStatusPercentage = status =>
  tasks.value.length ? (getStatusCount(status) / tasks.value.length) * 100 : 0
const getStatusBarColor = status => {
  const colors = {
    todo: 'bg-blue-500',
    'in-progress': 'bg-amber-500',
    completed: 'bg-emerald-500'
  }
  return colors[status] || 'bg-zinc-500'
}

const formatStatus = status => {
  const labels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

const getCategoryCount = categoryId => tasks.value.filter(t => t.category === categoryId).length
const getCategoryPercentage = categoryId =>
  tasks.value.length ? (getCategoryCount(categoryId) / tasks.value.length) * 100 : 0

// 模拟周活动数据
const weeklyActivity = ref([
  { day: 'Mon', completed: 5, created: 3 },
  { day: 'Tue', completed: 8, created: 4 },
  { day: 'Wed', completed: 6, created: 5 },
  { day: 'Thu', completed: 10, created: 2 },
  { day: 'Fri', completed: 7, created: 6 },
  { day: 'Sat', completed: 4, created: 1 },
  { day: 'Sun', completed: 3, created: 2 }
])

const maxWeeklyValue = computed(() => {
  return Math.max(
    ...weeklyActivity.value.map(day => Math.max(day.completed, day.created))
  )
})
</script>