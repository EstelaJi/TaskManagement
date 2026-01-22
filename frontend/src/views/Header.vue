<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">{{ currentViewTitle }}</h1>
      <p class="text-zinc-500 text-sm mt-1">{{ currentDate }}</p>
    </div>
    <div class="flex items-center gap-3">
      <!-- Search -->
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks..."
          class="bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
        />
      </div>
      <!-- View Toggle -->
      <div class="flex bg-zinc-800 rounded-lg p-1">
        <button
          @click="viewMode = 'grid'"
          :class="['p-2 rounded', viewMode === 'grid' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50']"
        >
          <LayoutGrid class="w-4 h-4" />
        </button>
        <button
          @click="viewMode = 'list'"
          :class="['p-2 rounded', viewMode === 'list' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50']"
        >
          <List class="w-4 h-4" />
        </button>
      </div>
      <!-- Add Task Button -->
      <button
        @click="openNewTaskDialog"
        class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus class="w-4 h-4" />
        <span>Add Task</span>
      </button>
    </div>
  </div>

  <!-- Task Modal -->
  <TaskModal :isOpen="isModalOpen" @close="closeModal" @task-added="handleTaskAdded" />

  <!-- Filters Row -->
  <div v-if="currentView === 'tasks'" class="flex items-center gap-4 mt-4">
    <select
      v-model="filterStatus"
      class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
    >
      <option value="all">All Status</option>
      <option value="todo">To Do</option>
      <option value="in-progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
    <select
      v-model="filterPriority"
      class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
    >
      <option value="all">All Priority</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
    <select
      v-model="sortBy"
      class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
    >
      <option value="dueDate">Sort by Due Date</option>
      <option value="priority">Sort by Priority</option>
      <option value="created">Sort by Created</option>
      <option value="title">Sort by Title</option>
    </select>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Search, LayoutGrid, List, Plus } from 'lucide-vue-next'
import TaskModal from '../components/TaskModal.vue'

const route = useRoute()

// 路由到标题的映射
const routeTitleMap = {
  '/': 'Dashboard',
  '/tasks': 'All Tasks',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/about': 'About'
}

// 根据当前路由动态获取标题
const currentViewTitle = computed(() => {
  return routeTitleMap[route.path] || 'Dashboard'
})

const currentView = computed(() => {
  if (route.path === '/') return 'dashboard'
  if (route.path === '/tasks') return 'tasks'
  if (route.path === '/calendar') return 'calendar'
  if (route.path === '/analytics') return 'analytics'
  return 'tasks'
})

const currentDate = ref(new Date().toLocaleDateString())
const searchQuery = ref('')
const viewMode = ref('grid')
const filterStatus = ref('all')
const filterPriority = ref('all')
const sortBy = ref('dueDate')

// Modal 状态
const isModalOpen = ref(false)

const openNewTaskDialog = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

// 处理任务添加完成（用于刷新数据）
const handleTaskAdded = () => {
  // TaskModal 已经处理了添加和刷新，这里只需要确保数据同步
  // 可以在这里添加额外的逻辑，比如显示成功提示等
}
</script>
