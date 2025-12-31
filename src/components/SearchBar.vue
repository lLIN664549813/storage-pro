<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SearchScope, DataType } from '../types/search'

interface Props {
  keyword: string
  searchIn: SearchScope
  useRegex: boolean
  caseSensitive: boolean
  deepSearch: boolean
  types: DataType[]
  minSize?: number
  maxSize?: number
  resultCount: number
}

interface Emits {
  (e: 'update:keyword', value: string): void
  (e: 'update:searchIn', value: SearchScope): void
  (e: 'update:useRegex', value: boolean): void
  (e: 'update:caseSensitive', value: boolean): void
  (e: 'update:deepSearch', value: boolean): void
  (e: 'update:types', value: DataType[]): void
  (e: 'update:minSize', value: number | undefined): void
  (e: 'update:maxSize', value: number | undefined): void
  (e: 'clear'): void
  (e: 'showHistory'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showAdvanced = ref(false)
const localKeyword = ref(props.keyword)

// 监听 keyword 变化，使用防抖
let debounceTimer: number | undefined
watch(localKeyword, (newValue) => {
  clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    emit('update:keyword', newValue)
  }, 300)
})

// 类型选项
const typeOptions: { value: DataType; label: string }[] = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'json', label: 'JSON' },
  { value: 'boolean', label: '布尔值' },
  { value: 'null', label: '空值' }
]

// 切换类型过滤
const toggleType = (type: DataType) => {
  const types = [...props.types]
  const index = types.indexOf(type)
  if (index > -1) {
    types.splice(index, 1)
  } else {
    types.push(type)
  }
  emit('update:types', types)
}

// 清空搜索
const handleClear = () => {
  localKeyword.value = ''
  emit('clear')
}
</script>

<template>
  <div class="search-bar bg-white border-b border-gray-200 p-3">
    <!-- 主搜索框 -->
    <div class="flex items-center space-x-2 mb-2">
      <div class="flex-1 relative">
        <input
          v-model="localKeyword"
          type="text"
          placeholder="搜索键名或值..."
          class="w-full px-3 py-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="search-input"
        />
        <button
          v-if="localKeyword"
          @click="handleClear"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          data-testid="clear-search"
        >
          ✕
        </button>
      </div>
      
      <button
        @click="showAdvanced = !showAdvanced"
        :class="[
          'px-3 py-2 text-sm rounded transition-colors',
          showAdvanced ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        高级
      </button>
      
      <button
        @click="emit('showHistory')"
        class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        title="搜索历史"
      >
        📜
      </button>
    </div>

    <!-- 搜索结果统计 -->
    <div class="text-xs text-gray-500 mb-2">
      找到 <span class="font-semibold text-blue-600">{{ resultCount }}</span> 个结果
    </div>

    <!-- 高级选项 -->
    <div v-if="showAdvanced" class="space-y-3 pt-3 border-t border-gray-200">
      <!-- 搜索范围 -->
      <div>
        <label class="text-xs font-medium text-gray-700 mb-1 block">搜索范围</label>
        <div class="flex space-x-2">
          <label class="flex items-center space-x-1 cursor-pointer">
            <input
              type="radio"
              :checked="searchIn === 'both'"
              @change="emit('update:searchIn', 'both')"
              class="text-blue-500"
            />
            <span class="text-sm">键名和值</span>
          </label>
          <label class="flex items-center space-x-1 cursor-pointer">
            <input
              type="radio"
              :checked="searchIn === 'key'"
              @change="emit('update:searchIn', 'key')"
              class="text-blue-500"
            />
            <span class="text-sm">仅键名</span>
          </label>
          <label class="flex items-center space-x-1 cursor-pointer">
            <input
              type="radio"
              :checked="searchIn === 'value'"
              @change="emit('update:searchIn', 'value')"
              class="text-blue-500"
            />
            <span class="text-sm">仅值</span>
          </label>
        </div>
      </div>

      <!-- 搜索选项 -->
      <div>
        <label class="text-xs font-medium text-gray-700 mb-1 block">搜索选项</label>
        <div class="flex flex-wrap gap-2">
          <label class="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              :checked="useRegex"
              @change="emit('update:useRegex', !useRegex)"
              class="text-blue-500"
              data-testid="regex-checkbox"
            />
            <span class="text-sm">正则表达式</span>
          </label>
          <label class="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              :checked="caseSensitive"
              @change="emit('update:caseSensitive', !caseSensitive)"
              class="text-blue-500"
            />
            <span class="text-sm">区分大小写</span>
          </label>
          <label class="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              :checked="deepSearch"
              @change="emit('update:deepSearch', !deepSearch)"
              class="text-blue-500"
            />
            <span class="text-sm">JSON 深度搜索</span>
          </label>
        </div>
      </div>

      <!-- 类型过滤 -->
      <div>
        <label class="text-xs font-medium text-gray-700 mb-1 block">数据类型</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            @click="toggleType(option.value)"
            :class="[
              'px-2 py-1 text-xs rounded transition-colors',
              types.includes(option.value)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 大小过滤 -->
      <div>
        <label class="text-xs font-medium text-gray-700 mb-1 block">大小范围（字节）</label>
        <div class="flex items-center space-x-2">
          <input
            type="number"
            :value="minSize"
            @input="(e) => emit('update:minSize', (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : undefined)"
            placeholder="最小"
            class="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-gray-500">-</span>
          <input
            type="number"
            :value="maxSize"
            @input="(e) => emit('update:maxSize', (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : undefined)"
            placeholder="最大"
            class="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  </div>
</template>
