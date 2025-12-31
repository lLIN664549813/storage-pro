<script setup lang="ts">
import type { SearchHistory } from '../types/search'

interface Props {
  history: SearchHistory[]
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'replay', historyId: string): void
  (e: 'clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取搜索描述
const getSearchDescription = (history: SearchHistory): string => {
  const parts: string[] = []
  
  if (history.searchOptions.useRegex) parts.push('正则')
  if (history.searchOptions.caseSensitive) parts.push('区分大小写')
  if (history.searchOptions.deepSearch) parts.push('深度搜索')
  if (history.filterOptions.types.length > 0) {
    parts.push(`类型: ${history.filterOptions.types.join(', ')}`)
  }
  
  return parts.length > 0 ? parts.join(' | ') : '基础搜索'
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold">搜索历史</h3>
        <div class="flex items-center space-x-2">
          <button
            v-if="history.length > 0"
            @click="emit('clear')"
            class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            清空历史
          </button>
          <button
            @click="emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 内容 -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="history.length === 0" class="text-center text-gray-500 py-8">
          暂无搜索历史
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in history"
            :key="item.id"
            class="p-3 bg-gray-50 rounded border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
            @click="emit('replay', item.id); emit('close')"
          >
            <div class="flex items-start justify-between mb-1">
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ item.keyword }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ getSearchDescription(item) }}
                </div>
              </div>
              <div class="text-xs text-gray-400 ml-2">
                {{ formatTime(item.timestamp) }}
              </div>
            </div>
            <div class="text-xs text-blue-600">
              找到 {{ item.resultCount }} 个结果
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
