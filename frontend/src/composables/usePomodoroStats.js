import { ref, computed } from 'vue'
import axios from 'axios'

/**
 * Pomodoro 统计数据 Composable
 */
export function usePomodoroStats() {
  const sessions = ref([])
  const stats = ref(null)
  const dailyStats = ref([])
  const timelineStats = ref([])
  const categoryStats = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 获取所有会话
  const fetchSessions = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams(params).toString()
      const response = await axios.get(`/api/pomodoro?${queryParams}`)
      sessions.value = response.data
      return response.data
    } catch (err) {
      console.error('获取时间追踪记录失败:', err)
      error.value = err
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取统计数据
  const fetchStats = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams(params).toString()
      const response = await axios.get(`/api/pomodoro/stats/summary?${queryParams}`)
      stats.value = response.data
      return response.data
    } catch (err) {
      console.error('获取统计数据失败:', err)
      error.value = err
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取每日统计数据
  const fetchDailyStats = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams({ days: 7, ...params }).toString()
      const response = await axios.get(`/api/pomodoro/stats/daily?${queryParams}`)
      dailyStats.value = response.data
      return response.data
    } catch (err) {
      console.error('获取每日统计数据失败:', err)
      error.value = err
      return []
    } finally {
      loading.value = false
    }
  }

  // 计算属性：总专注时间（小时）
  const totalFocusHours = computed(() => {
    if (!stats.value || !stats.value.total_duration) return 0
    return (stats.value.total_duration / 3600).toFixed(1)
  })

  // 计算属性：完成率
  const completionRate = computed(() => {
    if (!stats.value || !stats.value.total_sessions || stats.value.total_sessions === 0) return 0
    return Math.round((stats.value.completed_sessions / stats.value.total_sessions) * 100)
  })

  // 计算属性：平均每日专注时间
  const averageDailyFocus = computed(() => {
    if (dailyStats.value.length === 0) return 0
    const total = dailyStats.value.reduce((sum, day) => sum + (parseInt(day.total_duration) || 0), 0)
    return (total / dailyStats.value.length / 3600).toFixed(1)
  })

  // 获取时间段统计数据（日/周/月/年）
  const fetchTimelineStats = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams({ period: 'day', ...params }).toString()
      const response = await axios.get(`/api/pomodoro/stats/timeline?${queryParams}`)
      timelineStats.value = response.data
      return response.data
    } catch (err) {
      console.error('获取时间段统计数据失败:', err)
      error.value = err
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取按类别统计数据
  const fetchCategoryStats = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams(params).toString()
      const response = await axios.get(`/api/pomodoro/stats/by-category?${queryParams}`)
      categoryStats.value = response.data
      return response.data
    } catch (err) {
      console.error('获取类别统计数据失败:', err)
      error.value = err
      return []
    } finally {
      loading.value = false
    }
  }

  // 格式化持续时间（秒转小时分钟）
  const formatDuration = (seconds) => {
    if (!seconds) return '0分钟'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  // 格式化持续时间（秒转小时，保留1位小数）
  const formatDurationHours = (seconds) => {
    if (!seconds) return '0'
    return (seconds / 3600).toFixed(1)
  }

  return {
    // 状态
    sessions,
    stats,
    dailyStats,
    timelineStats,
    categoryStats,
    loading,
    error,
    // 计算属性
    totalFocusHours,
    completionRate,
    averageDailyFocus,
    // 方法
    fetchSessions,
    fetchStats,
    fetchDailyStats,
    fetchTimelineStats,
    fetchCategoryStats,
    formatDuration,
    formatDurationHours
  }
}
