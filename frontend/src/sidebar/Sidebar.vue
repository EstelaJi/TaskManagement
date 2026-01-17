<template>
  <aside
    :class="[
      'bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Logo -->
    <div class="p-4 border-b border-zinc-800 flex items-center gap-3">
      <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <CheckSquare class="w-5 h-5 text-white" />
      </div>
      <span v-if="!sidebarCollapsed" class="font-bold text-lg">TaskFlow</span>
      <button
        @click="sidebarCollapsed = !sidebarCollapsed"
        class="ml-auto p-1 hover:bg-zinc-800 rounded"
      >
        <ChevronLeft :class="['w-4 h-4 transition-transform', sidebarCollapsed && 'rotate-180']" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="p-2 flex-1">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="navigateToPage(item.path)"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1',
          isActiveRoute(item.path)
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'hover:bg-zinc-800 text-zinc-400'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        <span
          v-if="!sidebarCollapsed && item.count"
          class="ml-auto text-xs bg-zinc-800 px-2 py-0.5 rounded-full"
        >
          {{ item.count }}
        </span>
      </button>

      <!-- Quick Filters -->
      <div v-if="!sidebarCollapsed" class="mt-6">
        <p class="text-xs text-zinc-500 uppercase tracking-wider px-3 mb-2">Quick Filters</p>
        <button
          v-for="filter in quickFilters"
          :key="filter.id"
          @click="applyQuickFilter(filter.id)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1',
            activeFilter === filter.id
              ? 'bg-zinc-800 text-white'
              : 'hover:bg-zinc-800/50 text-zinc-400'
          ]"
        >
          <component :is="filter.icon" :class="['w-4 h-4', filter.color]" />
          <span class="text-sm">{{ filter.label }}</span>
          <span class="ml-auto text-xs text-zinc-500">{{ filter.count }}</span>
        </button>
      </div>

      <!-- Categories -->
      <div v-if="!sidebarCollapsed" class="mt-6">
        <p class="text-xs text-zinc-500 uppercase tracking-wider px-3 mb-2">Categories</p>
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = selectedCategory === cat.id ? null : cat.id"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1',
            selectedCategory === cat.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
          ]"
        >
          <div :class="['w-3 h-3 rounded-full', cat.color]"></div>
          <span class="text-sm text-zinc-300">{{ cat.label }}</span>
          <span class="ml-auto text-xs text-zinc-500">{{ getCategoryCount(cat.id) }}</span>
        </button>
      </div>

      <!-- User Section -->
      <div v-if="!sidebarCollapsed" class="p-4 border-t border-zinc-800">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm font-medium"
          >
            JD
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">John Doe</p>
            <p class="text-xs text-zinc-500 truncate">john@example.com</p>
          </div>
          <button class="p-1 hover:bg-zinc-800 rounded">
            <Settings class="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTasks } from '../composables/useTasks'
import { CATEGORIES } from '../constants/categories'
import {
  CheckSquare,
  ChevronLeft,
  List,
  Info,
  Home,
  ListTodo,
  Calendar,
  BarChart3,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-vue-next'

export default {
  name: 'Sidebar',
  components: {
    CheckSquare,
    ChevronLeft,
    List,
    Info,
    Home,
    ListTodo,
    Calendar,
    BarChart3,
    Settings
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const sidebarCollapsed = ref(false)
    const activeFilter = ref(null)
    const selectedCategory = ref(null)

    // 使用任务管理的 composable
    const { tasks } = useTasks()

    const navItems = computed(() => [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/', count: null },
      { id: 'tasks', label: 'All Tasks', icon: ListTodo, path: '/tasks', count: tasks.value.length },
      { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar', count: null },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', count: null }
    ])

    // 导航到指定页面
    const navigateToPage = path => {
      router.push(path)
    }

    // 检查当前路由是否激活
    const isActiveRoute = path => {
      if (path === '/') {
        return route.path === '/'
      }
      return route.path.startsWith(path)
    }

    const quickFilters = computed(() => [
      {
        id: 'all',
        label: 'All Tasks',
        icon: List,
        color: 'text-zinc-400',
        count: tasks.value.length
      },
      {
        id: 'pending',
        label: 'Pending',
        icon: Clock,
        color: 'text-yellow-400',
        count: tasks.value.filter(t => t.status === 'pending').length
      },
      {
        id: 'completed',
        label: 'Completed',
        icon: CheckCircle2,
        color: 'text-emerald-400',
        count: tasks.value.filter(t => t.status === 'completed').length
      },
      { id: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'text-red-400', count: 0 }
    ])

    const categories = computed(() => CATEGORIES)

    const applyQuickFilter = filterId => {
      activeFilter.value = filterId
      // 跳转到任务列表页面，并可以传递过滤参数
      router.push('/tasks')
    }

    // 获取分类的任务数量
    const getCategoryCount = categoryId => {
      return tasks.value.filter(t => t.category === categoryId).length
    }

    return {
      sidebarCollapsed,
      navItems,
      quickFilters,
      activeFilter,
      categories,
      selectedCategory,
      applyQuickFilter,
      getCategoryCount,
      navigateToPage,
      isActiveRoute
    }
  }
}
</script>
