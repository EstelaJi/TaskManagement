<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <component :is="icon" class="w-5 h-5" :class="iconColor" />
        {{ title }}
      </h3>
      <div class="flex items-center gap-2">
        <!-- Chart Type Selector -->
        <div class="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            @click="chartType = 'bar'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              chartType === 'bar'
                ? 'bg-emerald-500 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            ]"
          >
            Bar
          </button>
          <button
            @click="chartType = 'line'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              chartType === 'line'
                ? 'bg-emerald-500 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            ]"
          >
            Line
          </button>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="relative" :style="{ height: height + 'px' }">
      <!-- Bar Chart -->
      <div v-if="chartType === 'bar'" class="flex items-end gap-2 h-full">
        <!-- Y Axis with Units -->
        <div class="flex flex-col justify-between h-full pr-2 text-xs text-zinc-500">
          <span>{{ formatValue(maxValue) }}</span>
          <span>{{ formatValue(maxValue / 2) }}</span>
          <span>0{{ props.valueKey.includes('duration') ? 'h' : '' }}</span>
        </div>
        <div class="flex-1 flex items-end gap-2 h-full">
          <div
            v-for="(item, index) in chartData"
            :key="index"
            class="flex-1 flex flex-col items-center gap-2 group"
          >
            <div class="flex-1 w-full flex items-end relative">
              <div
                class="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                :class="getBarColor(item)"
                :style="{
                  height: `${getBarHeight(item)}%`,
                  minHeight: getValue(item) > 0 ? '4px' : '0'
                }"
                :title="getTooltip(item)"
              ></div>
              <!-- Value Label on Hover -->
              <div
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              >
                {{ formatValue(getValue(item)) }}
              </div>
            </div>
            <span class="text-xs text-zinc-500 text-center">{{ formatLabel(item) }}</span>
          </div>
        </div>
      </div>

      <!-- Line Chart -->
      <svg v-else-if="chartType === 'line'" class="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" :style="{ stopColor: lineColor, stopOpacity: 0.3 }" />
            <stop offset="100%" :style="{ stopColor: lineColor, stopOpacity: 0 }" />
          </linearGradient>
        </defs>
        
        <!-- Grid Lines -->
        <g v-for="i in 5" :key="'grid-' + i" class="text-zinc-800">
          <line
            :x1="40"
            :y1="(i - 1) * 40"
            :x2="800"
            :y2="(i - 1) * 40"
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="2,2"
          />
        </g>

        <!-- Y Axis Labels -->
        <g class="text-xs text-zinc-500">
          <text x="35" y="15" text-anchor="end">{{ formatValue(maxValue) }}</text>
          <text x="35" y="55" text-anchor="end">{{ formatValue(maxValue * 0.75) }}</text>
          <text x="35" y="95" text-anchor="end">{{ formatValue(maxValue * 0.5) }}</text>
          <text x="35" y="135" text-anchor="end">{{ formatValue(maxValue * 0.25) }}</text>
          <text x="35" y="175" text-anchor="end">0{{ props.valueKey.includes('duration') ? 'h' : '' }}</text>
        </g>

        <!-- X Axis Labels -->
        <g class="text-xs text-zinc-500">
          <g v-for="(item, index) in chartData" :key="'x-label-' + index">
            <text :x="getXPosition(index)" y="195" text-anchor="middle">{{ formatLabel(item) }}</text>
          </g>
        </g>

        <!-- Area Fill -->
        <path
          :d="getAreaPath()"
          fill="url(#lineGradient)"
          class="transition-all"
        />

        <!-- Line -->
        <path
          :d="getLinePath()"
          :stroke="lineColor"
          stroke-width="3"
          fill="none"
          class="transition-all"
        />

        <!-- Data Points -->
        <g v-for="(item, index) in chartData" :key="'point-' + index">
          <circle
            :cx="getXPosition(index)"
            :cy="getYPosition(item)"
            r="4"
            :fill="lineColor"
            class="transition-all hover:r-6 cursor-pointer"
            @mouseenter="hoveredPoint = { index, item, x: getXPosition(index), y: getYPosition(item) }"
            @mouseleave="hoveredPoint = null"
          />
          <!-- Custom Tooltip -->
          <g v-if="hoveredPoint && hoveredPoint.index === index" class="pointer-events-none">
            <rect
              :x="getXPosition(index) - 60"
              :y="getYPosition(item) - 30"
              width="120"
              height="20"
              rx="4"
              fill="#27272a"
              opacity="0.9"
            />
            <text
              :x="getXPosition(index)"
              :y="getYPosition(item) - 15"
              text-anchor="middle"
              fill="white"
              font-size="12"
            >
              {{ getTooltip(item) }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Empty State -->
      <div v-if="chartData.length === 0" class="absolute inset-0 flex items-center justify-center text-zinc-500">
        No data available
      </div>
    </div>

    <!-- Legend (if multiple series) -->
    <div v-if="showLegend && chartData.length > 0" class="mt-4 flex items-center justify-center gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full" :class="getBarColor(chartData[0])"></div>
        <span class="text-zinc-400">Focus Time</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: Object,
    default: null
  },
  iconColor: {
    type: String,
    default: 'text-emerald-400'
  },
  data: {
    type: Array,
    default: () => []
  },
  valueKey: {
    type: String,
    default: 'total_duration'
  },
  labelKey: {
    type: String,
    default: 'period'
  },
  height: {
    type: Number,
    default: 200
  },
  lineColor: {
    type: String,
    default: '#10b981' // emerald-500
  },
  showLegend: {
    type: Boolean,
    default: false
  }
})

const chartType = ref('bar')
const hoveredPoint = ref(null)

// 获取图表数据（处理空数据）
const chartData = computed(() => {
  return props.data || []
})

// 获取最大值用于计算高度
const maxValue = computed(() => {
  if (chartData.value.length === 0) return 1
  return Math.max(...chartData.value.map(item => getValue(item)), 1)
})

// 获取值
const getValue = (item) => {
  return parseInt(item[props.valueKey]) || 0
}

// 获取柱状图高度百分比
const getBarHeight = (item) => {
  const value = getValue(item)
  if (maxValue.value === 0) return 0
  return (value / maxValue.value) * 100
}

// 获取柱状图颜色
const getBarColor = (item) => {
  // 可以根据不同条件返回不同颜色
  return 'bg-emerald-500/80'
}

// 格式化标签
const formatLabel = (item) => {
  const label = item[props.labelKey]
  if (!label) return 'N/A'
  
  // 如果是日期，格式化
  if (label instanceof Date || typeof label === 'string') {
    const date = new Date(label)
    if (!isNaN(date.getTime())) {
      // 根据时间段类型格式化
      if (props.labelKey === 'period') {
        // 可能是日/周/月/年格式
        if (label.includes('T') || label.includes(' ')) {
          // ISO 格式日期
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
  
  // 如果是类别，返回首字母大写的格式
  if (props.labelKey === 'category') {
    return String(label).charAt(0).toUpperCase() + String(label).slice(1)
  }
  
  return String(label)
}

// 格式化值
const formatValue = (value) => {
  if (props.valueKey.includes('duration')) {
    const hours = (value / 3600).toFixed(1)
    return `${hours}h`
  }
  return value
}

// 获取提示信息
const getTooltip = (item) => {
  const label = formatLabel(item)
  const value = formatValue(getValue(item))
  return `${label}: ${value}`
}

// 获取 X 位置（用于折线图）
const getXPosition = (index) => {
  if (chartData.value.length <= 1) return 440
  const spacing = (800 - 40) / (chartData.value.length - 1) // 留出左侧40px空间
  return 40 + (index * spacing)
}

// 获取 Y 位置（用于折线图）
const getYPosition = (item) => {
  const value = getValue(item)
  const percentage = maxValue.value > 0 ? (value / maxValue.value) : 0
  return 180 - (percentage * 160) // 调整Y轴范围
}

// 获取折线路径
const getLinePath = () => {
  if (chartData.value.length === 0) return ''
  
  const points = chartData.value.map((item, index) => {
    const x = getXPosition(index)
    const y = getYPosition(item)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  
  return points.join(' ')
}

// 获取区域路径（用于填充）
const getAreaPath = () => {
  if (chartData.value.length === 0) return ''
  
  const linePath = getLinePath()
  const firstX = getXPosition(0)
  const lastX = getXPosition(chartData.value.length - 1)
  
  return `${linePath} L ${lastX} 180 L ${firstX} 180 Z`
}
</script>

<style scoped>
svg {
  overflow: visible;
}
</style>
