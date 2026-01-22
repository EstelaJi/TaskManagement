<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">Time Tracker</h1>
        <p class="text-zinc-400">Track your focus time with Pomodoro technique</p>
      </div>
      <!-- Time Period Selector -->
      <div class="flex items-center gap-2">
        <select
          v-model="selectedPeriod"
          @change="handlePeriodChange"
          class="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
      </div>
    </div>

    <!-- Pomodoro Timer -->
    <PomodoroTimer />

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm mb-1">Total Sessions</p>
            <p class="text-2xl font-bold">{{ stats?.total_sessions || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Clock class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm mb-1">Completed</p>
            <p class="text-2xl font-bold">{{ stats?.completed_sessions || 0 }}</p>
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

      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm mb-1">Total Focus Time</p>
            <p class="text-2xl font-bold">{{ totalFocusHours }}h</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp class="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-500 text-sm mb-1">Daily Average</p>
            <p class="text-2xl font-bold">{{ averageDailyFocus }}h</p>
          </div>
          <div class="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <BarChart3 class="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Timeline Chart -->
      <TimeChart
        :title="`Focus Time (${getPeriodLabel()})`"
        :icon="BarChart3"
        icon-color="text-emerald-400"
        :data="timelineStats"
        value-key="total_duration"
        label-key="period"
        :height="250"
        line-color="#10b981"
      />

      <!-- Category Chart -->
      <TimeChart
        title="Focus Time by Category"
        :icon="PieChart"
        icon-color="text-blue-400"
        :data="categoryStats"
        value-key="total_duration"
        label-key="category"
        :height="250"
        line-color="#3b82f6"
      />

      <!-- Session Type Distribution -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <PieChart class="w-5 h-5 text-blue-400" />
          Session Type Distribution
        </h3>
        <div class="space-y-4">
          <div>
            <div class="flex items-center justify-between text-sm mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Work Sessions</span>
              </div>
              <span class="text-zinc-500">{{ stats?.work_sessions || 0 }}</span>
            </div>
            <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-emerald-500 rounded-full"
                :style="{
                  width: `${getSessionTypePercentage('work')}%`
                }"
              ></div>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between text-sm mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Short Breaks</span>
              </div>
              <span class="text-zinc-500">{{ stats?.short_break_sessions || 0 }}</span>
            </div>
            <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full"
                :style="{
                  width: `${getSessionTypePercentage('short_break')}%`
                }"
              ></div>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between text-sm mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Long Breaks</span>
              </div>
              <span class="text-zinc-500">{{ stats?.long_break_sessions || 0 }}</span>
            </div>
            <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-purple-500 rounded-full"
                :style="{
                  width: `${getSessionTypePercentage('long_break')}%`
                }"
              ></div>
            </div>
          </div>
        </div>
        <div v-if="!stats || stats.total_sessions === 0" class="text-center py-8 text-zinc-500">
          No sessions yet
        </div>
      </div>
    </div>

    <!-- Recent Sessions -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock class="w-5 h-5 text-amber-400" />
        Recent Sessions
      </h3>
      <div v-if="loading" class="text-center py-8 text-zinc-500">Loading...</div>
      <div v-else-if="sessions.length === 0" class="text-center py-8 text-zinc-500">
        No sessions recorded yet
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="session in sessions.slice(0, 10)"
          :key="session.id"
          class="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
        >
          <div class="flex items-center gap-4">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                session.completed ? 'bg-emerald-500' : 'bg-zinc-600',
                session.session_type === 'work' ? 'bg-emerald-500' : '',
                session.session_type === 'short_break' ? 'bg-blue-500' : '',
                session.session_type === 'long_break' ? 'bg-purple-500' : ''
              ]"
            ></div>
            <div>
              <p class="font-medium">
                {{ session.task_title || 'No task' }}
              </p>
              <p class="text-sm text-zinc-500">
                {{ formatSessionType(session.session_type) }} • {{ formatDate(session.started_at) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold">{{ formatDuration(session.duration) }}</p>
            <p
              :class="[
                'text-xs',
                session.completed ? 'text-emerald-400' : 'text-zinc-500'
              ]"
            >
              {{ session.completed ? 'Completed' : 'Incomplete' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-vue-next'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import TimeChart from '../components/TimeChart.vue'
import { usePomodoroStats } from '../composables/usePomodoroStats'
import { getCategoryLabel, getCategoryColor } from '../constants/categories'

const {
  sessions,
  stats,
  dailyStats,
  timelineStats,
  categoryStats,
  loading,
  totalFocusHours,
  completionRate,
  averageDailyFocus,
  fetchSessions,
  fetchStats,
  fetchDailyStats,
  fetchTimelineStats,
  fetchCategoryStats,
  formatDuration,
  formatDurationHours
} = usePomodoroStats()

const selectedPeriod = ref('day')

// 获取时间段标签
const getPeriodLabel = () => {
  const labels = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly'
  }
  return labels[selectedPeriod.value] || 'Daily'
}

// 处理时间段变化
const handlePeriodChange = async () => {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (selectedPeriod.value) {
    case 'day':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'week':
      startDate.setDate(startDate.getDate() - 8 * 7) // 8 weeks
      break
    case 'month':
      startDate.setMonth(startDate.getMonth() - 6) // 6 months
      break
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 2) // 2 years
      break
  }
  
  await Promise.all([
    fetchTimelineStats({
      period: selectedPeriod.value,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }),
    fetchCategoryStats({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
  ])
}


// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// 格式化日期为星期
const formatDay = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

// 格式化会话类型
const formatSessionType = (type) => {
  const types = {
    work: 'Work',
    short_break: 'Short Break',
    long_break: 'Long Break'
  }
  return types[type] || type
}

// 获取会话类型百分比
const getSessionTypePercentage = (type) => {
  if (!stats || !stats.total_sessions || stats.total_sessions === 0) return 0
  let count = 0
  switch (type) {
    case 'work':
      count = stats.work_sessions || 0
      break
    case 'short_break':
      count = stats.short_break_sessions || 0
      break
    case 'long_break':
      count = stats.long_break_sessions || 0
      break
  }
  return (count / stats.total_sessions) * 100
}

// 获取类别百分比
const getCategoryPercentage = (item) => {
  if (categoryStats.value.length === 0) return 0
  const maxDuration = Math.max(
    ...categoryStats.value.map(c => parseInt(c.total_duration) || 0),
    1
  )
  const duration = parseInt(item.total_duration) || 0
  return (duration / maxDuration) * 100
}

// 加载数据
onMounted(async () => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  
  await Promise.all([
    fetchSessions(),
    fetchStats(),
    fetchDailyStats(),
    fetchTimelineStats({
      period: selectedPeriod.value,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }),
    fetchCategoryStats({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
  ])
})
</script>
