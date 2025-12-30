<script setup lang="ts">
import { computed } from 'vue'
import type { StorageItem as StorageItemType } from '../types/storage'

interface Props {
  item: StorageItemType
  selected: boolean
}

interface Emits {
  (e: 'select', key: string): void
  (e: 'edit', key: string, value: string): void
  (e: 'delete', key: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算值的显示文本，如果是JSON则格式化显示
const displayValue = computed(() => {
  try {
    const parsed = JSON.parse(props.item.value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return props.item.value
  }
})

// 判断是否为JSON
const isJson = computed(() => {
  try {
    JSON.parse(props.item.value)
    return true
  } catch {
    return false
  }
})

// 截断长值以适应列表显示
const truncatedValue = computed(() => {
  const value = displayValue.value
  return value.length > 100 ? value.substring(0, 97) + '...' : value
})
</script>

<template>
  <div
    class="p-3 rounded cursor-pointer transition-colors"
    :class="{
      'bg-blue-50 border border-blue-200': selected,
      'bg-white border border-gray-200 hover:bg-gray-50': !selected
    }"
    @click="$emit('select', item.key)"
  >
    <div class="flex justify-between items-start">
      <div class="flex-1 min-w-0">
        <div class="font-mono font-medium text-sm truncate">{{ item.key }}</div>
        <div class="font-mono text-xs text-gray-600 mt-1 truncate">
          {{ truncatedValue }}
        </div>
        <div v-if="isJson" class="text-xs text-blue-500 mt-1">JSON</div>
      </div>
      <div class="flex space-x-1 ml-2">
        <button
          @click.stop="$emit('edit', item.key, item.value)"
          class="p-1 text-blue-600 hover:bg-blue-100 rounded"
          title="编辑"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          @click.stop="$emit('delete', item.key)"
          class="p-1 text-red-600 hover:bg-red-100 rounded"
          title="删除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
