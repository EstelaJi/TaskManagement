/**
 * 任务分类常量
 */
export const CATEGORIES = [
  { id: 'work', label: 'Work', color: 'bg-blue-500' },
  { id: 'personal', label: 'Personal', color: 'bg-purple-500' },
  { id: 'shopping', label: 'Shopping', color: 'bg-pink-500' },
  { id: 'health', label: 'Health', color: 'bg-green-500' },
  { id: 'learning', label: 'Learning', color: 'bg-indigo-500' }
]

/**
 * 根据分类 ID 获取分类信息
 * @param {string} categoryId - 分类 ID
 * @returns {Object|null} 分类对象或 null
 */
export function getCategoryById(categoryId) {
  return CATEGORIES.find(cat => cat.id === categoryId) || null
}

/**
 * 根据分类 ID 获取分类标签
 * @param {string} categoryId - 分类 ID
 * @returns {string} 分类标签
 */
export function getCategoryLabel(categoryId) {
  if (!categoryId || categoryId === 'uncategorized' || categoryId === 'null') {
    return 'Uncategorized'
  }
  const category = getCategoryById(categoryId)
  return category ? category.label : categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
}

/**
 * 根据分类 ID 获取分类颜色
 * @param {string} categoryId - 分类 ID
 * @returns {string} 分类颜色类名
 */
export function getCategoryColor(categoryId) {
  if (!categoryId || categoryId === 'uncategorized' || categoryId === 'null') {
    return 'bg-zinc-500'
  }
  const category = getCategoryById(categoryId)
  return category ? category.color : 'bg-zinc-500'
}
