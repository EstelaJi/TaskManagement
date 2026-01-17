<template>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold">{{ currentMonthYear }}</h3>
              <div class="flex items-center gap-2">
                <button @click="previousMonth" class="p-2 hover:bg-zinc-800 rounded-lg">
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <button @click="nextMonth" class="p-2 hover:bg-zinc-800 rounded-lg">
                  <ChevronRight class="w-5 h-5" />
                </button>
              </div>
            </div>
            <!-- Calendar Grid -->
            <div class="grid grid-cols-7 gap-1">
              <div v-for="day in weekDays" :key="day" class="text-center text-sm text-zinc-500 py-2 font-medium">
                {{ day }}
              </div>
              <div
                v-for="(day, index) in calendarDays"
                :key="index"
                :class="[
                  'min-h-24 p-2 rounded-lg border transition-colors',
                  day.isCurrentMonth ? 'border-zinc-800 bg-zinc-900/50' : 'border-transparent bg-zinc-900/20',
                  day.isToday && 'border-emerald-500/50 bg-emerald-500/10'
                ]"
              >
                <p :class="['text-sm mb-1', day.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600', day.isToday && 'text-emerald-400 font-bold']">
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTasks } from '../composables/useTasks'
const { tasks } = useTasks()
const currentCalendarDate = ref(new Date())

const currentMonthYear = computed(() => {
  return currentCalendarDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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
    days.push({
      date: date.getDate(),
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: false,
      tasks: []
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
      tasks: tasks.value.filter(t => t.dueDate === fullDate)
    })
  }
  
  // Next month padding
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: false,
      tasks: []
    })
  }
  
  return days
})

const previousMonth = () => {
    const date = new Date(currentMonthYear.value)
    date.setMonth(date.getMonth() - 1)
    currentMonthYear.value = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}
const nextMonth = () => {
    const date = new Date(currentMonthYear.value)
    date.setMonth(date.getMonth() + 1)
    currentMonthYear.value = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}
const getPriorityBg = (priority) => {
  const colors = { high: 'bg-red-500/30 text-red-300', medium: 'bg-amber-500/30 text-amber-300', low: 'bg-blue-500/30 text-blue-300' }
  return colors[priority]
}
</script>   