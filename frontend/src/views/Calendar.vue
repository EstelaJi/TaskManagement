<template>
  <div class="p-6">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button
            @click="goToToday"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Today
          </button>
          <h3 class="text-xl font-semibold">{{ currentMonthYear }}</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="previousMonth"
            class="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          <button
            @click="nextMonth"
            class="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Selected Date Display -->
      <div v-if="selectedDate" class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
        <p class="text-sm text-zinc-400">Selected Date:</p>
        <p class="text-lg font-semibold text-emerald-400">{{ formatSelectedDate(selectedDate) }}</p>
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-sm text-zinc-500 py-2 font-medium"
        >
          {{ day }}
        </div>
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          @click="selectDate(day.fullDate)"
          :class="[
            'min-h-24 p-2 rounded-lg border transition-all cursor-pointer',
            day.isCurrentMonth
              ? 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'
              : 'border-transparent bg-zinc-900/20 hover:bg-zinc-900/30',
            day.isToday && 'border-emerald-500/50 bg-emerald-500/10',
            isSelected(day.fullDate) && 'ring-2 ring-emerald-500 bg-emerald-500/20 border-emerald-500'
          ]"
        >
          <p
            :class="[
              'text-sm mb-1 font-medium',
              day.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600',
              day.isToday && 'text-emerald-400 font-bold',
              isSelected(day.fullDate) && 'text-emerald-300'
            ]"
          >
            {{ day.date }}
          </p>
          <div class="space-y-1">
            <div
              v-for="task in day.tasks.slice(0, 3)"
              :key="task.id"
              :class="['text-xs px-1.5 py-0.5 rounded truncate', getPriorityBg(task.priority)]"
            >
              {{ task.title }}
            </div>
            <p v-if="day.tasks.length > 3" class="text-xs text-zinc-500 px-1">
              +{{ day.tasks.length - 3 }} more
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useTasks } from '../composables/useTasks'

const { tasks, fetchTasks } = useTasks()
const currentCalendarDate = ref(new Date())
const selectedDate = ref(null)

// 获取任务列表
onMounted(async () => {
  await fetchTasks()
  window.addEventListener('task-added', handleTaskAdded)
})

const handleTaskAdded = async () => {
  await fetchTasks()
}

const currentMonthYear = computed(() => {
  return currentCalendarDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarDays = computed(() => {
  const year = currentCalendarDate.value.getFullYear()
  const month = currentCalendarDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date().toISOString().split('T')[0]

  const days = []
  const startPadding = firstDay.getDay()

  // Previous month padding
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    const fullDate = date.toISOString().split('T')[0]
    days.push({
      date: date.getDate(),
      fullDate,
      isCurrentMonth: false,
      isToday: fullDate === today,
      tasks: getTasksForDate(fullDate)
    })
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const fullDate = date.toISOString().split('T')[0]
    days.push({
      date: i,
      fullDate,
      isCurrentMonth: true,
      isToday: fullDate === today,
      tasks: getTasksForDate(fullDate)
    })
  }

  // Next month padding
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    const fullDate = date.toISOString().split('T')[0]
    days.push({
      date: i,
      fullDate,
      isCurrentMonth: false,
      isToday: fullDate === today,
      tasks: getTasksForDate(fullDate)
    })
  }

  return days
})

// 获取指定日期的任务
const getTasksForDate = (dateString) => {
  return tasks.value.filter(
    t => (t.dueDate === dateString || t.due_date === dateString) && dateString
  )
}

// 选择日期
const selectDate = (dateString) => {
  if (dateString) {
    selectedDate.value = dateString
    // 如果选择的日期不在当前月份，切换到该日期所在的月份
    const selected = new Date(dateString)
    const current = currentCalendarDate.value
    if (
      selected.getFullYear() !== current.getFullYear() ||
      selected.getMonth() !== current.getMonth()
    ) {
      currentCalendarDate.value = new Date(selected)
    }
  }
}

// 检查日期是否被选中
const isSelected = (dateString) => {
  return selectedDate.value === dateString
}

// 格式化选中的日期
const formatSelectedDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 上一个月
const previousMonth = () => {
  const newDate = new Date(currentCalendarDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentCalendarDate.value = newDate
}

// 下一个月
const nextMonth = () => {
  const newDate = new Date(currentCalendarDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentCalendarDate.value = newDate
}

// 回到今天
const goToToday = () => {
  currentCalendarDate.value = new Date()
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const getPriorityBg = (priority) => {
  const colors = {
    high: 'bg-red-500/30 text-red-300',
    medium: 'bg-amber-500/30 text-amber-300',
    low: 'bg-blue-500/30 text-blue-300'
  }
  return colors[priority] || 'bg-zinc-500/30 text-zinc-300'
}
</script>   