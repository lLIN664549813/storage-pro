<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  data: any
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
})

// 判断数据类型
const dataType = computed(() => {
  if (props.data === null) return 'null'
  if (Array.isArray(props.data)) return 'array'
  return typeof props.data
})

// 判断是否为对象或数组
const isExpandable = computed(() => {
  return dataType.value === 'object' || dataType.value === 'array'
})

// 展开/折叠状态
const isExpanded = ref(props.depth < 2) // 默认展开前两层

// 获取对象的键值对
const entries = computed(() => {
  if (dataType.value === 'object') {
    return Object.entries(props.data)
  } else if (dataType.value === 'array') {
    return props.data.map((item: any, index: number) => [index, item])
  }
  return []
})

// 获取值的显示文本
const getValueDisplay = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return value.toString()
  if (typeof value === 'number') return value.toString()
  return ''
}

// 获取值的类型样式
const getValueClass = (value: any): string => {
  if (value === null || value === undefined) return 'text-gray-400'
  if (typeof value === 'string') return 'text-green-600'
  if (typeof value === 'boolean') return 'text-purple-600'
  if (typeof value === 'number') return 'text-blue-600'
  return 'text-gray-700'
}

// 切换展开状态
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 获取预览文本
const getPreview = computed(() => {
  if (dataType.value === 'array') {
    return `Array(${props.data.length})`
  } else if (dataType.value === 'object') {
    const keys = Object.keys(props.data)
    return `Object {${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`
  }
  return ''
})
</script>

<template>
  <div class="json-viewer">
    <!-- 简单类型直接显示 -->
    <span v-if="!isExpandable" :class="getValueClass(data)">
      {{ getValueDisplay(data) }}
    </span>

    <!-- 对象或数组 -->
    <div v-else>
      <!-- 展开/折叠按钮 -->
      <div class="flex items-start">
        <button
          @click="toggleExpand"
          class="flex-shrink-0 w-4 h-4 mr-1 mt-0.5 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            v-if="isExpanded"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <!-- 类型标识 -->
        <span class="text-gray-600">
          <span v-if="dataType === 'array'" class="text-gray-500">[</span>
          <span v-else class="text-gray-500">{</span>
          <span v-if="!isExpanded" class="text-gray-400 text-xs ml-1">
            {{ getPreview }}
          </span>
        </span>
      </div>

      <!-- 展开的内容 -->
      <div v-if="isExpanded" class="ml-4 border-l border-gray-200 pl-2 mt-1">
        <div
          v-for="[key, value] in entries"
          :key="key"
          class="py-0.5 flex items-start"
        >
          <!-- 键名 -->
          <span class="text-purple-700 font-mono text-sm mr-2 flex-shrink-0">
            <span v-if="dataType === 'array'" class="text-gray-500">{{ key }}:</span>
            <span v-else>"{{ key }}":</span>
          </span>

          <!-- 值 -->
          <div class="flex-1 min-w-0">
            <JsonViewer :data="value" :depth="depth + 1" />
          </div>
        </div>
      </div>

      <!-- 闭合标识 -->
      <div v-if="isExpanded" class="text-gray-500">
        <span v-if="dataType === 'array'">]</span>
        <span v-else>}</span>
      </div>
      <span v-else class="text-gray-500">
        <span v-if="dataType === 'array'">]</span>
        <span v-else>}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.json-viewer {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
