<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ExportFormat, ExportOptions, ImportMode, ImportOptions, ImportResult } from '../types/export'
import type { StorageItem } from '../types/storage'

interface Props {
  show: boolean
  mode: 'export' | 'import'
  items: StorageItem[]
  storageType: 'localStorage' | 'sessionStorage'
}

interface Emits {
  (e: 'close'): void
  (e: 'export', options: ExportOptions): void
  (e: 'import', file: File, options: ImportOptions): void
  (e: 'copy'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 导出选项
const exportFormat = ref<ExportFormat>('json')
const includeMetadata = ref(true)
const formatted = ref(true)
const selectedOnly = ref(false)

// 导入选项
const importMode = ref<ImportMode>('merge')
const skipExisting = ref(true)
const selectedFile = ref<File | null>(null)

// 导入结果
const importResult = ref<ImportResult | null>(null)
const isImporting = ref(false)
const importProgress = ref(0)

// 文件输入
const fileInput = ref<HTMLInputElement | null>(null)

// 计算总大小
const totalSize = computed(() => {
  return props.items.reduce((total: number, item: StorageItem) => {
    return total + new Blob([item.key + item.value]).size
  }, 0)
})

// 格式化大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

// 处理导出
const handleExport = () => {
  const options: ExportOptions = {
    format: exportFormat.value,
    includeMetadata: includeMetadata.value,
    formatted: formatted.value,
    selectedOnly: selectedOnly.value
  }
  emit('export', options)
  emit('close')
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    importResult.value = null
  }
}

// 处理导入
const handleImport = () => {
  if (!selectedFile.value) return

  const options: ImportOptions = {
    mode: importMode.value,
    skipExisting: skipExisting.value
  }

  emit('import', selectedFile.value, options)
}

// 重置
const reset = () => {
  selectedFile.value = null
  importResult.value = null
  importProgress.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 关闭对话框
const handleClose = () => {
  reset()
  emit('close')
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold">
          {{ mode === 'export' ? '导出数据' : '导入数据' }}
        </h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <!-- 内容 -->
      <div class="p-4">
        <!-- 导出模式 -->
        <div v-if="mode === 'export'" class="space-y-4">
          <!-- 数据统计 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-600">
              <div>存储类型: <span class="font-medium">{{ storageType }}</span></div>
              <div>数据项数: <span class="font-medium">{{ items.length }}</span></div>
              <div>总大小: <span class="font-medium">{{ formatSize(totalSize) }}</span></div>
            </div>
          </div>

          <!-- 导出格式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
            <div class="flex space-x-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="exportFormat"
                  value="json"
                  class="text-blue-500"
                />
                <span>JSON</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="exportFormat"
                  value="csv"
                  class="text-blue-500"
                />
                <span>CSV</span>
              </label>
            </div>
          </div>

          <!-- 导出选项 -->
          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="includeMetadata"
                class="text-blue-500"
              />
              <span class="text-sm">包含元数据（时间戳、统计信息等）</span>
            </label>
            <label v-if="exportFormat === 'json'" class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="formatted"
                class="text-blue-500"
              />
              <span class="text-sm">格式化输出（美化 JSON）</span>
            </label>
          </div>

          <!-- 操作按钮 -->
          <div class="flex space-x-2 pt-2">
            <button
              @click="handleExport"
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              导出文件
            </button>
            <button
              @click="emit('copy'); emit('close')"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="复制为 JSON"
            >
              📋 复制
            </button>
          </div>
        </div>

        <!-- 导入模式 -->
        <div v-else class="space-y-4">
          <!-- 文件选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择文件</label>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div v-if="selectedFile" class="mt-2 text-sm text-gray-600">
              已选择: {{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})
            </div>
          </div>

          <!-- 导入模式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">导入模式</label>
            <div class="space-y-2">
              <label class="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="importMode"
                  value="merge"
                  class="mt-1 text-blue-500"
                />
                <div>
                  <div class="font-medium">合并</div>
                  <div class="text-xs text-gray-500">保留现有数据，添加新数据</div>
                </div>
              </label>
              <label class="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="importMode"
                  value="overwrite"
                  class="mt-1 text-blue-500"
                />
                <div>
                  <div class="font-medium text-red-600">覆盖</div>
                  <div class="text-xs text-gray-500">清空现有数据后导入</div>
                </div>
              </label>
            </div>
          </div>

          <!-- 导入选项 -->
          <div>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="skipExisting"
                class="text-blue-500"
              />
              <span class="text-sm">跳过已存在的键</span>
            </label>
          </div>

          <!-- 导入进度 -->
          <div v-if="isImporting" class="space-y-2">
            <div class="text-sm text-gray-600">导入中...</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all"
                :style="{ width: `${importProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- 导入结果 -->
          <div v-if="importResult" class="bg-gray-50 p-3 rounded space-y-1 text-sm">
            <div class="text-green-600">✓ 成功: {{ importResult.success }}</div>
            <div v-if="importResult.skipped > 0" class="text-yellow-600">
              ⊘ 跳过: {{ importResult.skipped }}
            </div>
            <div v-if="importResult.failed > 0" class="text-red-600">
              ✗ 失败: {{ importResult.failed }}
            </div>
            <div v-if="importResult.errors.length > 0" class="mt-2 max-h-32 overflow-y-auto">
              <div class="text-xs text-gray-600 mb-1">错误详情:</div>
              <div
                v-for="(error, index) in importResult.errors"
                :key="index"
                class="text-xs text-red-600"
              >
                {{ error.key }}: {{ error.error }}
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex space-x-2 pt-2">
            <button
              @click="handleImport"
              :disabled="!selectedFile || isImporting"
              :class="[
                'flex-1 px-4 py-2 rounded transition-colors',
                selectedFile && !isImporting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              {{ isImporting ? '导入中...' : '开始导入' }}
            </button>
            <button
              @click="handleClose"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
