<script setup lang="ts">
import { onMounted, ref, computed, watch, shallowRef, onUnmounted } from 'vue'
import { useWebStorage } from './composables/useWebStorage'
import { useSnapshot } from './composables/useSnapshot'
import { useSearchFilter } from './composables/useSearchFilter'
import { useExportImport } from './composables/useExportImport'
import StorageItem from './components/StorageItem.vue'
import StorageEditor from './components/StorageEditor.vue'
import JsonViewer from './components/JsonViewer.vue'
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
const showSnapshotDialog = ref(false)
const showMoreMenu = ref(false)

// 本地搜索关键字（带防抖）
const localSearchKeyword = ref('')
let searchDebounceTimer: number | undefined

// 监听本地搜索关键字变化
watch(localSearchKeyword, (newValue: string) => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = window.setTimeout(() => {
    searchOptions.value.keyword = newValue
  }, 300)
})

// 清空搜索
const handleClearSearch = () => {
  localSearchKeyword.value = ''
  resetSearch()
}

// 点击外部关闭更多菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.more-menu') && !target.closest('.icon-btn')) {
    showMoreMenu.value = false
  }
}

onMounted(() => {
  currentStorage.value.loadStorageItems()
  document.addEventListener('click', handleClickOutside)
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
  const item = storageItems.value.find((item) => item.key === selectedItem.value)
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
  const item = storageItems.value.find((item) => item.key === selectedItem.value)
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
  <div class="flex flex-col h-full" style="background: #FFFFFF;">
    <!-- Header 区域 -->
    <div class="header">
      <div class="header-content">
        <!-- 左侧：Storage Tabs -->
        <div class="storage-tabs">
          <button
            @click="switchStorageType('localStorage')"
            :class="['tab-button', storageType === 'localStorage' ? 'tab-active' : '']"
          >
            localStorage
          </button>
          <button
            @click="switchStorageType('sessionStorage')"
            :class="['tab-button', storageType === 'sessionStorage' ? 'tab-active' : '']"
          >
            sessionStorage
          </button>
        </div>

        <!-- 右侧：主操作按钮 -->
        <button @click="handleAdd" class="btn-primary">
          + 添加
        </button>
      </div>
    </div>

    <!-- Toolbar 区域 -->
    <div class="toolbar">
      <div class="toolbar-content">
        <!-- 搜索框 -->
        <div class="search-wrapper">
          <input
            v-model="localSearchKeyword"
            type="text"
            placeholder="搜索键名或值..."
            class="search-input"
          />
          <button
            v-if="localSearchKeyword"
            @click="handleClearSearch"
            class="search-clear"
          >
            ✕
          </button>
        </div>

        <!-- 次级操作按钮 -->
        <div class="toolbar-actions">
          <button @click="showImportDialog = true" class="icon-btn" title="导入">
            📥
          </button>
          <button @click="showExportDialog = true" class="icon-btn" title="导出">
            📤
          </button>
          <button @click="handleRefresh" class="icon-btn" title="刷新">
            🔄
          </button>
          <button @click="showMoreMenu = !showMoreMenu" class="icon-btn" title="更多">
            ⋯
          </button>
        </div>

        <!-- 更多菜单 -->
        <div v-if="showMoreMenu" class="more-menu">
          <button @click="handleClear" class="menu-item menu-item-danger">
            清空
          </button>
          <button @click="handleCreateSnapshot" class="menu-item">
            创建快照
          </button>
          <button @click="showSearchHistory = true" class="menu-item">
            搜索历史
          </button>
        </div>
      </div>
    </div>

    <!-- Content 区域 -->
    <div class="content-area">
      <!-- 左侧: Key 列表 -->
      <div class="key-list">
        <div v-if="storageItems.length === 0" class="empty-state">
          当前页面没有 {{ storageType === 'localStorage' ? 'localStorage' : 'sessionStorage' }} 数据
        </div>

        <div v-else-if="filteredItems.length === 0" class="empty-state">
          没有找到匹配的数据
        </div>

        <div v-else>
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

      <!-- 右侧: Value 详情 -->
      <div class="value-detail">
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

        <div v-else class="empty-state">
          选择一个项目查看详情
        </div>
      </div>
    </div>

    <!-- Footer 区域 -->
    <div class="footer">
      <span class="footer-text">
        快照：{{ snapshots.length === 0 ? '暂无快照' : `${snapshots.length} 个快照` }}
      </span>
      <button
        v-if="snapshots.length > 0"
        @click="showSnapshotDialog = true"
        class="footer-link"
      >
        查看全部
      </button>
    </div>

    <!-- 快照对话框 -->
    <div
      v-if="showSnapshotDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showSnapshotDialog = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">快照管理</h3>
          <button @click="showSnapshotDialog = false" class="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="snapshots.length === 0" class="text-center text-gray-500 py-8">
            暂无快照
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="snapshot in snapshots"
              :key="snapshot.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
            >
              <div>
                <div class="font-medium">{{ snapshot.name }}</div>
                <div class="text-sm text-gray-500">
                  {{ snapshot.items.length }} 项 · {{ new Date(snapshot.createdAt).toLocaleString() }}
                </div>
              </div>
              <div class="space-x-2">
                <button
                  @click="handleRestoreSnapshot(snapshot.id); showSnapshotDialog = false"
                  class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  恢复
                </button>
                <button
                  @click="handleDeleteSnapshot(snapshot.id)"
                  class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
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


<style scoped>
/* Design Tokens */
:root {
  --primary: #1677FF;
  --danger: #FF4D4F;
  --text-main: #1F1F1F;
  --text-secondary: #8C8C8C;
  --border: #F0F0F0;
  --bg-light: #FAFAFA;
  --hover: #F5F7FA;
}

/* Header 区域 */
.header {
  height: 48px;
  background: #FFFFFF;
  border-bottom: 1px solid var(--border);
}

.header-content {
  height: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.storage-tabs {
  display: flex;
  gap: 12px;
}

.tab-button {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: var(--text-main);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: var(--hover);
}

.tab-active {
  background: var(--primary) !important;
  color: #FFFFFF !important;
  font-weight: 600 !important;
}

.btn-primary {
  width: 80px;
  height: 32px;
  background: var(--primary);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #0958d9;
}

/* Toolbar 区域 */
.toolbar {
  height: 44px;
  background: var(--bg-light);
  border-bottom: 1px solid var(--border);
  position: relative;
}

.toolbar-content {
  height: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrapper {
  flex: 1;
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 32px 0 12px;
  border: 1px solid #D9D9D9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  color: var(--text-main);
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #F5F5F5;
}

/* 更多菜单 */
.more-menu {
  position: absolute;
  top: 48px;
  right: 16px;
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 140px;
}

.menu-item {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--hover);
}

.menu-item:first-child {
  border-radius: 6px 6px 0 0;
}

.menu-item:last-child {
  border-radius: 0 0 6px 6px;
}

.menu-item-danger {
  color: var(--danger);
}

.menu-item-danger:hover {
  background: #FFF1F0;
}

/* Content 区域 */
.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.key-list {
  width: 280px;
  background: #FFFFFF;
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.value-detail {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Footer 区域 */
.footer {
  height: 32px;
  background: var(--bg-light);
  border-top: 1px solid var(--border);
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.footer-link {
  font-size: 12px;
  color: var(--primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.footer-link:hover {
  text-decoration: underline;
}
</style>
