<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
    <!-- Session Type Selector -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <button
        @click="setSessionType('work')"
        :class="[
          'px-4 py-2 rounded-lg transition-colors',
          sessionType === 'work'
            ? 'bg-emerald-500 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        ]"
      >
        Work
      </button>
      <button
        @click="setSessionType('short_break')"
        :class="[
          'px-4 py-2 rounded-lg transition-colors',
          sessionType === 'short_break'
            ? 'bg-blue-500 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        ]"
      >
        Short Break
      </button>
      <button
        @click="setSessionType('long_break')"
        :class="[
          'px-4 py-2 rounded-lg transition-colors',
          sessionType === 'long_break'
            ? 'bg-purple-500 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        ]"
      >
        Long Break
      </button>
    </div>

    <!-- Timer Display -->
    <div class="flex flex-col items-center mb-8">
      <!-- Circular Progress -->
      <div class="relative w-64 h-64 mb-6">
        <svg class="transform -rotate-90 w-full h-full">
          <!-- Background Circle -->
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            stroke-width="8"
            fill="none"
            class="text-zinc-800"
          />
          <!-- Progress Circle -->
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            stroke-width="8"
            fill="none"
            :stroke-dasharray="2 * Math.PI * 120"
            :stroke-dashoffset="2 * Math.PI * 120 * (1 - progress / 100)"
            :class="getProgressColor()"
            class="transition-all duration-1000 ease-linear"
          />
        </svg>
        <!-- Time Display -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-5xl font-bold mb-2" :class="getTextColor()">
              {{ formattedTime }}
            </div>
            <div class="text-sm text-zinc-500">
              {{ getSessionLabel() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Task Selector (if work session) -->
      <div v-if="sessionType === 'work'" class="w-full max-w-md mb-4">
        <select
          v-model="selectedTaskId"
          @change="setTask(selectedTaskId)"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">Select a task (optional)</option>
          <option v-for="task in availableTasks" :key="task.id" :value="task.id">
            {{ task.title }}
          </option>
        </select>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center gap-4">
        <button
          v-if="!isRunning && !isPaused"
          @click="start(selectedTaskId || null)"
          class="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Play class="w-5 h-5" />
          Start
        </button>
        <button
          v-else-if="isRunning"
          @click="pause"
          class="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Pause class="w-5 h-5" />
          Pause
        </button>
        <button
          v-else-if="isPaused"
          @click="resume"
          class="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Play class="w-5 h-5" />
          Resume
        </button>
        <button
          v-if="isRunning || isPaused"
          @click="stop"
          class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Square class="w-5 h-5" />
          Stop
        </button>
      </div>
    </div>

    <!-- Completed Sessions Counter -->
    <div class="text-center text-zinc-500 text-sm">
      <span class="text-emerald-400 font-semibold">{{ completedSessions }}</span>
      completed sessions today
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Play, Pause, Square } from 'lucide-vue-next'
import { usePomodoro } from '../composables/usePomodoro'
import { useTasks } from '../composables/useTasks'

const {
  timeLeft,
  formattedTime,
  isRunning,
  isPaused,
  sessionType,
  completedSessions,
  progress,
  start,
  pause,
  resume,
  stop,
  setSessionType,
  setTask
} = usePomodoro()

const { tasks, fetchTasks } = useTasks()
const selectedTaskId = ref(null)

// 获取可用的任务（未完成的）
const availableTasks = computed(() => {
  return tasks.value.filter(task => task.status !== 'completed')
})

// 获取进度条颜色
const getProgressColor = () => {
  switch (sessionType.value) {
    case 'work':
      return 'text-emerald-500'
    case 'short_break':
      return 'text-blue-500'
    case 'long_break':
      return 'text-purple-500'
    default:
      return 'text-emerald-500'
  }
}

// 获取文字颜色
const getTextColor = () => {
  switch (sessionType.value) {
    case 'work':
      return 'text-emerald-400'
    case 'short_break':
      return 'text-blue-400'
    case 'long_break':
      return 'text-purple-400'
    default:
      return 'text-emerald-400'
  }
}

// 获取会话标签
const getSessionLabel = () => {
  switch (sessionType.value) {
    case 'work':
      return 'Focus Time'
    case 'short_break':
      return 'Short Break'
    case 'long_break':
      return 'Long Break'
    default:
      return 'Focus Time'
  }
}

onMounted(async () => {
  await fetchTasks()
})
</script>

<style scoped>
/* 确保圆形进度条平滑过渡 */
circle {
  transition: stroke-dashoffset 1s linear;
}
</style>
