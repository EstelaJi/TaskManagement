import { ref, computed, onUnmounted } from 'vue'
import axios from 'axios'

const POMODORO_DURATION = 25 * 60 // 25分钟，单位：秒
const SHORT_BREAK_DURATION = 5 * 60 // 5分钟
const LONG_BREAK_DURATION = 15 * 60 // 15分钟
const SESSIONS_BEFORE_LONG_BREAK = 4 // 4个番茄钟后长休息

/**
 * Pomodoro 时间追踪 Composable
 */
export function usePomodoro() {
  const timeLeft = ref(POMODORO_DURATION) // 剩余时间（秒）
  const isRunning = ref(false)
  const isPaused = ref(false)
  const currentTaskId = ref(null)
  const sessionType = ref('work') // 'work', 'short_break', 'long_break'
  const completedSessions = ref(0) // 完成的番茄钟数量
  const timerInterval = ref(null)
  const currentSessionId = ref(null)

  // 格式化时间显示（MM:SS）
  const formattedTime = computed(() => {
    const minutes = Math.floor(timeLeft.value / 60)
    const seconds = timeLeft.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  // 进度百分比
  const progress = computed(() => {
    const total = getDurationForType(sessionType.value)
    return ((total - timeLeft.value) / total) * 100
  })

  // 获取当前类型的持续时间
  const getDurationForType = (type) => {
    switch (type) {
      case 'work':
        return POMODORO_DURATION
      case 'short_break':
        return SHORT_BREAK_DURATION
      case 'long_break':
        return LONG_BREAK_DURATION
      default:
        return POMODORO_DURATION
    }
  }

  // 开始计时
  const start = async (taskId = null) => {
    if (isRunning.value) return

    isRunning.value = true
    isPaused.value = false

    // 创建新的会话记录
    try {
      const response = await axios.post('/api/pomodoro', {
        task_id: taskId,
        duration: getDurationForType(sessionType.value),
        session_type: sessionType.value,
        completed: false
      })
      currentSessionId.value = response.data.id
      currentTaskId.value = taskId
    } catch (error) {
      console.error('Failed to create pomodoro session:', error)
    }

    // 开始倒计时
    timerInterval.value = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        complete()
      }
    }, 1000)
  }

  // 暂停
  const pause = () => {
    if (!isRunning.value) return
    isRunning.value = false
    isPaused.value = true
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // 继续
  const resume = () => {
    if (!isPaused.value) return
    start(currentTaskId.value)
  }

  // 停止
  const stop = async () => {
    isRunning.value = false
    isPaused.value = false
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    // 更新会话记录
    if (currentSessionId.value) {
      try {
        await axios.patch(`/api/pomodoro/${currentSessionId.value}`, {
          completed: false,
          duration: getDurationForType(sessionType.value) - timeLeft.value
        })
      } catch (error) {
        console.error('Failed to update pomodoro session:', error)
      }
      currentSessionId.value = null
    }

    reset()
  }

  // 完成
  const complete = async () => {
    isRunning.value = false
    isPaused.value = false
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    // 更新会话记录为完成
    if (currentSessionId.value) {
      try {
        await axios.patch(`/api/pomodoro/${currentSessionId.value}`, {
          completed: true,
          duration: getDurationForType(sessionType.value)
        })
      } catch (error) {
        console.error('Failed to complete pomodoro session:', error)
      }
      currentSessionId.value = null
    }

    // 如果是工作会话，增加计数
    if (sessionType.value === 'work') {
      completedSessions.value++
    }

    // 自动切换到下一个类型
    nextSession()
  }

  // 下一个会话
  const nextSession = () => {
    reset()
    
    // 决定下一个会话类型
    if (sessionType.value === 'work') {
      // 完成4个番茄钟后长休息，否则短休息
      if (completedSessions.value % SESSIONS_BEFORE_LONG_BREAK === 0) {
        sessionType.value = 'long_break'
      } else {
        sessionType.value = 'short_break'
      }
    } else {
      // 休息后回到工作
      sessionType.value = 'work'
    }
  }

  // 重置
  const reset = () => {
    timeLeft.value = getDurationForType(sessionType.value)
    isRunning.value = false
    isPaused.value = false
    currentTaskId.value = null
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // 设置会话类型
  const setSessionType = (type) => {
    if (isRunning.value) return
    sessionType.value = type
    reset()
  }

  // 设置任务
  const setTask = (taskId) => {
    if (isRunning.value) return
    currentTaskId.value = taskId
  }

  // 清理
  onUnmounted(() => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
  })

  return {
    // 状态
    timeLeft,
    formattedTime,
    isRunning,
    isPaused,
    sessionType,
    completedSessions,
    progress,
    currentTaskId,
    // 方法
    start,
    pause,
    resume,
    stop,
    complete,
    reset,
    setSessionType,
    setTask,
    nextSession,
    // 常量
    POMODORO_DURATION,
    SHORT_BREAK_DURATION,
    LONG_BREAK_DURATION
  }
}
