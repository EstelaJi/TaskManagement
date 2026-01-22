<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div
          class="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 class="text-xl font-semibold">Add New Task</h2>
            <button
              @click="closeModal"
              class="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">
                Title <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formData.title"
                type="text"
                required
                placeholder="Enter task title"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                v-model="formData.description"
                rows="3"
                placeholder="Enter task description"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
              ></textarea>
            </div>

            <!-- Priority and Status -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">
                  Priority
                </label>
                <select
                  v-model="formData.priority"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">
                  Status
                </label>
                <select
                  v-model="formData.status"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <!-- Category and Due Date -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">
                  Category
                </label>
                <select
                  v-model="formData.category"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="shopping">Shopping</option>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">
                  Due Date
                </label>
                <input
                  v-model="formData.due_date"
                  type="date"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p class="text-sm text-red-400">{{ error }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
                <span>{{ loading ? 'Adding...' : 'Add Task' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useTasks } from '../composables/useTasks'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'task-added'])

const { addTask, fetchTasks } = useTasks()

const formData = ref({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  category: '',
  due_date: ''
})

const loading = ref(false)
const error = ref(null)

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    category: '',
    due_date: ''
  }
  error.value = null
}

// 关闭 modal
const closeModal = () => {
  resetForm()
  emit('close')
}

// 监听 isOpen 变化，重置表单
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.title.trim()) {
    error.value = 'Title is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    // 准备发送到后端的数据
    const taskData = {
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || null,
      priority: formData.value.priority,
      status: formData.value.status,
      category: formData.value.category || null,
      due_date: formData.value.due_date || null
    }

    // 添加任务
    await addTask(taskData)
    
    // 刷新任务列表
    await fetchTasks()
    
    // 触发事件通知其他组件
    emit('task-added')
    window.dispatchEvent(new CustomEvent('task-added'))
    
    // 成功后才关闭 modal
    closeModal()
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to add task. Please try again.'
    console.error('Error adding task:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
