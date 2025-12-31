<script setup lang="ts">
/**
 * 变更日志对话框组件
 * 显示 storage 的变更历史记录
 */
import { ref, computed } from 'vue'
import type { StorageChange } from '@/types/monitor'

interface Props {
  modelValue: boolean
  changeLog: StorageChange[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'clear'): void
  (e: 'export'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 过滤选项
const filterAction = ref<'all' | 'set' | 'remove' | 'clear'>('all')
const filterKeyword = ref('')

// 过滤后的日志
const filteredLog = computed(() => {
  let filtered = props.changeLog

  // 按操作类型过滤
  if (filterAction.value !== 'all') {
    filtered = filtered.filter(log => log.action === filterAction.value)
  }

  // 按关键字过滤
  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase()
    filtered = filtered.filter(log =>
      log.key?.toLowerCase().includes(keyword) ||
      log.oldValue?.toLowerCase().includes(keyword) ||
      log.newValue?.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取操作类型的显示文本和颜色
const getActionInfo = (action: string) => {
  switch (action) {
    case 'set':
      return { text: '设置', color: 'text-green-600 bg-green-50' }
    case 'remove':
      return { text: '删除', color: 'text-red-600 bg-red-50' }
    case 'clear':
      return { text: '清空', color: 'text-orange-600 bg-orange-50' }
    default:
      return { text: action, color: 'text-gray-600 bg-gray-50' }
  }
}

// 截断长文本
const truncate = (text: string | undefined, maxLength: number = 50): string => {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 关闭对话框
const close = () => {
  emit('update:modelValue', false)
}

// 清空日志
const handleClear = () => {
  if (confirm('确定要清空所有变更日志吗？')) {
    emit('clear')
  }
}

// 导出日志
const handleExport = () => {
  emit('export')
}
</script>

<template>
  <div v-if="modelValue" class="dialog-overlay" @click.self="close">
    <div class="dialog">
      <!-- 标题栏 -->
      <div class="dialog-header">
        <h3 class="text-lg font-semibold">变更日志</h3>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 过滤器 -->
        <div class="filters">
          <select v-model="filterAction" class="filter-select">
            <option value="all">全部操作</option>
            <option value="set">设置</option>
            <option value="remove">删除</option>
            <option value="clear">清空</option>
          </select>

          <input
            v-model="filterKeyword"
            type="text"
            placeholder="搜索键名或值..."
            class="filter-input"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button @click="handleExport" class="btn btn-secondary">
            导出日志
          </button>
          <button @click="handleClear" class="btn btn-danger">
            清空日志
          </button>
        </div>
      </div>

      <!-- 日志列表 -->
      <div class="log-list">
        <div v-if="filteredLog.length === 0" class="empty-state">
          <p class="text-gray-500">暂无变更记录</p>
        </div>

        <div
          v-for="log in filteredLog"
          :key="log.id"
          class="log-item"
        >
          <!-- 时间和操作类型 -->
          <div class="log-header">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span
              :class="['log-action', getActionInfo(log.action).color]"
            >
              {{ getActionInfo(log.action).text }}
            </span>
            <span class="log-storage-type">{{ log.storageType }}</span>
          </div>

          <!-- 变更详情 -->
          <div v-if="log.action !== 'clear'" class="log-details">
            <div class="log-detail-row">
              <span class="log-label">键名:</span>
              <span class="log-value">{{ log.key }}</span>
            </div>

            <div v-if="log.action === 'set'" class="log-detail-row">
              <span class="log-label">旧值:</span>
              <span class="log-value text-gray-500">
                {{ truncate(log.oldValue) }}
              </span>
            </div>

            <div v-if="log.action === 'set'" class="log-detail-row">
              <span class="log-label">新值:</span>
              <span class="log-value text-green-600">
                {{ truncate(log.newValue) }}
              </span>
            </div>

            <div v-if="log.action === 'remove'" class="log-detail-row">
              <span class="log-label">删除值:</span>
              <span class="log-value text-red-600">
                {{ truncate(log.oldValue) }}
              </span>
            </div>
          </div>

          <div v-else class="log-details">
            <p class="text-orange-600">清空了所有数据</p>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="dialog-footer">
        <span class="text-sm text-gray-600">
          共 {{ filteredLog.length }} 条记录
          <span v-if="filterAction !== 'all' || filterKeyword">
            （已过滤）
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.dialog {
  @apply bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col;
}

.dialog-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.close-btn {
  @apply text-gray-400 hover:text-gray-600 text-2xl;
}

.toolbar {
  @apply flex items-center justify-between gap-4 p-4 border-b border-gray-200 bg-gray-50;
}

.filters {
  @apply flex items-center gap-2 flex-1;
}

.filter-select {
  @apply px-3 py-2 border border-gray-300 rounded text-sm;
}

.filter-input {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded text-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.actions {
  @apply flex items-center gap-2;
}

.btn {
  @apply px-4 py-2 rounded text-sm transition-colors;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.log-list {
  @apply flex-1 overflow-auto p-4 space-y-3;
}

.empty-state {
  @apply flex items-center justify-center h-full;
}

.log-item {
  @apply bg-gray-50 rounded-lg p-3 space-y-2;
}

.log-header {
  @apply flex items-center gap-2;
}

.log-time {
  @apply text-xs text-gray-500;
}

.log-action {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.log-storage-type {
  @apply text-xs text-gray-400;
}

.log-details {
  @apply space-y-1 text-sm;
}

.log-detail-row {
  @apply flex items-start gap-2;
}

.log-label {
  @apply text-gray-600 font-medium min-w-[60px];
}

.log-value {
  @apply flex-1 break-all;
}

.dialog-footer {
  @apply p-4 border-t border-gray-200 bg-gray-50;
}
</style>
