<script setup lang="ts">
import { onMounted, ref, computed, watch, shallowRef } from 'vue'
import { useWebStorage } from './composables/useWebStorage'
import { useSnapshot } from './composables/useSnapshot'
import { useSearchFilter } from './composables/useSearchFilter'
import { useExportImport } from './composables/useExportImport'
import StorageItem from './components/StorageItem.vue'
import StorageEditor from './components/StorageEditor.vue'
import StorageToolbar from './components/StorageToolbar.vue'
import JsonViewer from './components/JsonViewer.vue'
import SearchBar from './components/SearchBar.vue'
import SearchHistoryDialog from './components/SearchHistoryDialog.vue'
import ExportImportDialog from './components/ExportImportDialog.vue'
import type { ExportOptions, ImportOptions } from './types/export'

// Storage 类型：localStorage 或 sessionStorage
const storageType = ref<'localStorage' | 'sessionStorage'>('localStorage')

// 当前使用的 storage 实例（使用 shallowRef 以便响应式更新）
const currentStorage = shallowRef(useWebStorage(storageType.value))

const storageItems = computed(() => currentStorage.value.storageItems.value)

// 搜索过滤功能
const {
  searchOptions,
  filterOptions,
  searchHistory,
  filterItems,
  saveSearchHistory,
  replaySearchHistory,
  clearSearchHistory,
  resetSearch
} = useSearchFilter()

// 导入导出功能
const {
  exportData,
  copyToClipboard,
  importFromJSON
} = useExportImport()

// 过滤后的数据
const filteredItems = computed(() => filterItems(storageItems.value))

// 对话框状态
const showSearchHistory = ref(false)
const showExportDialog = ref(false)
const showImportDialog = ref(false)

const {
  snapshots,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot
} = useSnapshot()

const selectedItem = ref<string | null>(null)
const isEditing = ref(false)
const currentEditKey = ref('')
const currentEditValue = ref('')

// 查看模式：'raw' 原始文本 | 'json' JSON 对象树
const viewMode = ref<'raw' | 'json'>('json')

// 获取选中项的数据
const selectedItemData = computed(() => {
  const item = storageItems.value.find((item: any) => item.key === selectedItem.value)
  if (!item) return null
  
  // 尝试解析为 JSON
  try {
    return JSON.parse(item.value)
  } catch {
    return item.value
  }
})

// 判断选中项是否为 JSON
const isSelectedItemJson = computed(() => {
  const item = storageItems.value.find((item: any) => item.key === selectedItem.value)
  if (!item) return false
  
  try {
    JSON.parse(item.value)
    return true
  } catch {
    return false
  }
})

// 监听 storage 类型变化，重新创建实例
watch(storageType, async (newType: 'localStorage' | 'sessionStorage') => {
  currentStorage.value = useWebStorage(newType)
  selectedItem.value = null
  isEditing.value = false
  viewMode.value = 'json' // 重置为对象树视图
  try {
    await currentStorage.value.loadStorageItems()
  } catch (error: any) {
    console.error('加载数据失败:', error)
  }
})

// 切换 storage 类型
const switchStorageType = (type: 'localStorage' | 'sessionStorage') => {
  storageType.value = type
}

// 刷新数据
const handleRefresh = async () => {
  try {
    await currentStorage.value.loadStorageItems()
  } catch (error: any) {
    console.error('刷新失败:', error)
    alert('刷新失败: ' + error.message)
  }
}

// 初始化时加载数据
onMounted(() => {
  currentStorage.value.loadStorageItems()
})

// 处理编辑操作
const handleEdit = (key: string, value: string) => {
  currentEditKey.value = key
  currentEditValue.value = value
  isEditing.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (!currentEditKey.value) return

  try {
    await currentStorage.value.updateItem(currentEditKey.value, currentEditValue.value)
    isEditing.value = false
    currentEditKey.value = ''
    currentEditValue.value = ''
  } catch (error: any) {
    console.error('保存失败:', error)
    alert('保存失败: ' + error.message)
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  currentEditKey.value = ''
  currentEditValue.value = ''
}

// 处理添加新项
const handleAdd = async () => {
  const key = prompt('请输入新键名:')
  if (!key) return

  const value = prompt('请输入新值:')
  if (value === null) return

  try {
    await currentStorage.value.addItem(key, value)
  } catch (error: any) {
    console.error('添加失败:', error)
    alert('添加失败: ' + error.message)
  }
}

// 处理删除操作
const handleDelete = async (key: string) => {
  if (confirm(`确定要删除键 "${key}" 吗？此操作不可撤销。`)) {
    try {
      await currentStorage.value.deleteItem(key)
    } catch (error: any) {
      console.error('删除失败:', error)
      alert('删除失败: ' + error.message)
    }
  }
}

// 处理清空操作
const handleClear = async () => {
  const storageTypeName = storageType.value === 'localStorage' ? 'localStorage' : 'sessionStorage'
  if (confirm(`确定要清空所有 ${storageTypeName} 数据吗？此操作不可撤销。`)) {
    try {
      await currentStorage.value.clearStorage()
    } catch (error: any) {
      console.error('清空失败:', error)
      alert('清空失败: ' + error.message)
    }
  }
}

// 处理创建快照
const handleCreateSnapshot = async () => {
  const name = prompt('请输入快照名称:')
  if (!name) return

  try {
    await createSnapshot(name, storageItems.value)
  } catch (error: any) {
    console.error('创建快照失败:', error)
    alert('创建快照失败: ' + error.message)
  }
}

// 处理恢复快照
const handleRestoreSnapshot = async (id: string) => {
  const snapshot = snapshots.value.find((s: any) => s.id === id)
  if (!snapshot) return

  if (confirm(`确定要恢复快照 "${snapshot.name}" 吗？这将覆盖当前所有 ${storageType.value} 数据。`)) {
    try {
      await restoreSnapshot(id)
      // 恢复后重新加载数据
      await currentStorage.value.loadStorageItems()
    } catch (error: any) {
      console.error('恢复快照失败:', error)
      alert('恢复快照失败: ' + error.message)
    }
  }
}

// 处理删除快照
const handleDeleteSnapshot = async (id: string) => {
  const snapshot = snapshots.value.find((s: any) => s.id === id)
  if (!snapshot) return

  if (confirm(`确定要删除快照 "${snapshot.name}" 吗？`)) {
    try {
      await deleteSnapshot(id)
    } catch (error: any) {
      console.error('删除快照失败:', error)
      alert('删除快照失败: ' + error.message)
    }
  }
}

// 处理搜索变化
watch([searchOptions, filterOptions], () => {
  // 保存搜索历史
  if (searchOptions.value.keyword.trim()) {
    saveSearchHistory(filteredItems.value.length)
  }
}, { deep: true })

// 处理导出
const handleExport = async (options: ExportOptions) => {
  try {
    const itemsToExport = options.selectedOnly && selectedItem.value
      ? storageItems.value.filter(item => item.key === selectedItem.value)
      : storageItems.value

    await exportData(itemsToExport, storageType.value, options)
  } catch (error: any) {
    console.error('导出失败:', error)
    alert('导出失败: ' + error.message)
  }
}

// 处理复制到剪贴板
const handleCopy = async () => {
  try {
    await copyToClipboard(storageItems.value)
    alert('已复制到剪贴板')
  } catch (error: any) {
    console.error('复制失败:', error)
    alert('复制失败: ' + error.message)
  }
}

// 处理导入
const handleImport = async (file: File, options: ImportOptions) => {
  try {
    const result = await importFromJSON(
      file,
      storageType.value,
      options,
      (progress) => {
        console.log('导入进度:', progress)
      }
    )

    // 显示结果
    const message = `导入完成！\n成功: ${result.success}\n跳过: ${result.skipped}\n失败: ${result.failed}`
    alert(message)

    // 刷新数据
    await currentStorage.value.loadStorageItems()
    showImportDialog.value = false
  } catch (error: any) {
    console.error('导入失败:', error)
    alert('导入失败: ' + error.message)
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- 工具栏 -->
    <div class="bg-white border-b border-gray-200 p-2">
      <div class="flex items-center justify-between">
        <!-- Storage 类型切换 -->
        <div class="flex items-center space-x-2">
          <button
            @click="switchStorageType('localStorage')"
            :class="[
              'px-4 py-2 text-sm font-medium rounded transition-colors',
              storageType === 'localStorage'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            localStorage
          </button>
          <button
            @click="switchStorageType('sessionStorage')"
            :class="[
              'px-4 py-2 text-sm font-medium rounded transition-colors',
              storageType === 'sessionStorage'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            sessionStorage
          </button>
        </div>

        <!-- 工具栏按钮 -->
        <div class="flex items-center space-x-2">
          <button
            @click="showExportDialog = true"
            class="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="导出数据"
          >
            📤 导出
          </button>
          <button
            @click="showImportDialog = true"
            class="px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            title="导入数据"
          >
            📥 导入
          </button>
          <StorageToolbar
            @refresh="handleRefresh"
            @add="handleAdd"
            @clear="handleClear"
            @create-snapshot="handleCreateSnapshot"
          />
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <SearchBar
      :keyword="searchOptions.keyword"
      :search-in="searchOptions.searchIn"
      :use-regex="searchOptions.useRegex"
      :case-sensitive="searchOptions.caseSensitive"
      :deep-search="searchOptions.deepSearch"
      :types="filterOptions.types"
      :min-size="filterOptions.minSize"
      :max-size="filterOptions.maxSize"
      :result-count="filteredItems.length"
      @update:keyword="searchOptions.keyword = $event"
      @update:search-in="searchOptions.searchIn = $event"
      @update:use-regex="searchOptions.useRegex = $event"
      @update:case-sensitive="searchOptions.caseSensitive = $event"
      @update:deep-search="searchOptions.deepSearch = $event"
      @update:types="filterOptions.types = $event"
      @update:min-size="filterOptions.minSize = $event"
      @update:max-size="filterOptions.maxSize = $event"
      @clear="resetSearch"
      @show-history="showSearchHistory = true"
    />

    <!-- 主内容区 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧: Storage列表 -->
      <div class="w-2/5 overflow-auto p-4 border-r border-gray-200">
        <h2 class="text-lg font-semibold mb-4">
          {{ storageType === 'localStorage' ? 'LocalStorage' : 'SessionStorage' }} Items
        </h2>

        <div v-if="storageItems.length === 0" class="text-gray-500 text-center py-8">
          当前页面没有 {{ storageType === 'localStorage' ? 'localStorage' : 'sessionStorage' }} 数据
        </div>

        <div v-else-if="filteredItems.length === 0" class="text-gray-500 text-center py-8">
          没有找到匹配的数据
        </div>

        <div v-else class="space-y-2">
          <StorageItem
            v-for="item in filteredItems"
            :key="item.key"
            :item="item"
            :selected="selectedItem === item.key"
            @select="selectedItem = item.key"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- 右侧: 编辑器/查看器 -->
      <div class="flex-1 overflow-auto bg-white">
        <template v-if="isEditing">
          <div class="p-4 h-full flex flex-col">
            <h3 class="text-lg font-semibold mb-4">编辑: {{ currentEditKey }}</h3>
            <div class="flex-1 min-h-0">
              <StorageEditor
                v-model="currentEditValue"
                @save="saveEdit"
                @cancel="cancelEdit"
              />
            </div>
          </div>
        </template>

        <template v-else-if="selectedItem">
          <div class="p-4 flex flex-col h-full">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">查看: {{ selectedItem }}</h3>
              
              <!-- 视图切换按钮（仅 JSON 数据显示） -->
              <div v-if="isSelectedItemJson" class="flex items-center space-x-2">
                <button
                  @click="viewMode = 'json'"
                  :class="[
                    'px-3 py-1 text-xs rounded transition-colors',
                    viewMode === 'json'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
                >
                  对象树
                </button>
                <button
                  @click="viewMode = 'raw'"
                  :class="[
                    'px-3 py-1 text-xs rounded transition-colors',
                    viewMode === 'raw'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
                >
                  原始文本
                </button>
              </div>
            </div>

            <!-- JSON 对象树视图 -->
            <div
              v-if="isSelectedItemJson && viewMode === 'json'"
              class="flex-1 bg-gray-50 p-4 rounded border border-gray-200 overflow-auto"
            >
              <JsonViewer :data="selectedItemData" />
            </div>

            <!-- 原始文本视图 -->
            <div
              v-else
              class="flex-1 font-mono text-sm bg-gray-100 p-4 rounded overflow-auto"
            >
              <pre class="whitespace-pre-wrap break-words">{{ storageItems.find(item => item.key === selectedItem)?.value }}</pre>
            </div>
          </div>
        </template>

        <div v-else class="flex items-center justify-center h-full text-gray-500">
          选择一个项目查看详情
        </div>
      </div>
    </div>

    <!-- 底部: 快照列表 -->
    <div class="border-t border-gray-200 p-4 bg-white" style="max-height: 200px; overflow-y: auto;">
      <h3 class="text-lg font-semibold mb-2">快照</h3>

      <div v-if="snapshots.length === 0" class="text-gray-500 text-sm">
        暂无快照
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="snapshot in snapshots"
          :key="snapshot.id"
          class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
        >
          <div>
            <span class="font-medium">{{ snapshot.name }}</span>
            <span class="text-sm text-gray-500 ml-2">
              ({{ snapshot.items.length }} 项, {{ new Date(snapshot.createdAt).toLocaleString() }})
            </span>
          </div>
          <div class="space-x-2">
            <button
              @click="handleRestoreSnapshot(snapshot.id)"
              class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              恢复
            </button>
            <button
              @click="handleDeleteSnapshot(snapshot.id)"
              class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索历史对话框 -->
    <SearchHistoryDialog
      :history="searchHistory"
      :show="showSearchHistory"
      @close="showSearchHistory = false"
      @replay="replaySearchHistory"
      @clear="clearSearchHistory"
    />

    <!-- 导出对话框 -->
    <ExportImportDialog
      :show="showExportDialog"
      mode="export"
      :items="storageItems"
      :storage-type="storageType"
      @close="showExportDialog = false"
      @export="handleExport"
      @copy="handleCopy"
    />

    <!-- 导入对话框 -->
    <ExportImportDialog
      :show="showImportDialog"
      mode="import"
      :items="storageItems"
      :storage-type="storageType"
      @close="showImportDialog = false"
      @import="handleImport"
    />
  </div>
</template>
