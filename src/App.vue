<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useStorage } from './composables/useStorage'
import { useSnapshot } from './composables/useSnapshot'
import StorageItem from './components/StorageItem.vue'
import StorageEditor from './components/StorageEditor.vue'
import StorageToolbar from './components/StorageToolbar.vue'
import JsonViewer from './components/JsonViewer.vue'

const {
  storageItems,
  loadStorageItems,
  addItem,
  updateItem,
  deleteItem,
  clearStorage
} = useStorage()

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
  const item = storageItems.value.find(item => item.key === selectedItem.value)
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
  const item = storageItems.value.find(item => item.key === selectedItem.value)
  if (!item) return false
  
  try {
    JSON.parse(item.value)
    return true
  } catch {
    return false
  }
})

// 初始化时加载数据
onMounted(() => {
  loadStorageItems()
})

// 处理编辑操作
const handleEdit = (key: string, value: string) => {
  currentEditKey.value = key
  currentEditValue.value = value
  isEditing.value = true
}

// 保存编辑
const saveEdit = () => {
  if (!currentEditKey.value) return

  updateItem(currentEditKey.value, currentEditValue.value)
    .then(() => {
      isEditing.value = false
      currentEditKey.value = ''
      currentEditValue.value = ''
    })
    .catch(error => {
      console.error('保存失败:', error)
      alert('保存失败: ' + error.message)
    })
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  currentEditKey.value = ''
  currentEditValue.value = ''
}

// 处理添加新项
const handleAdd = () => {
  const key = prompt('请输入新键名:')
  if (!key) return

  const value = prompt('请输入新值:')
  if (value === null) return

  addItem(key, value)
    .catch(error => {
      console.error('添加失败:', error)
      alert('添加失败: ' + error.message)
    })
}

// 处理删除操作
const handleDelete = (key: string) => {
  if (confirm(`确定要删除键 "${key}" 吗？此操作不可撤销。`)) {
    deleteItem(key)
      .catch(error => {
        console.error('删除失败:', error)
        alert('删除失败: ' + error.message)
      })
  }
}

// 处理清空操作
const handleClear = () => {
  if (confirm('确定要清空所有localStorage数据吗？此操作不可撤销。')) {
    clearStorage()
      .catch(error => {
        console.error('清空失败:', error)
        alert('清空失败: ' + error.message)
      })
  }
}

// 处理创建快照
const handleCreateSnapshot = () => {
  const name = prompt('请输入快照名称:')
  if (!name) return

  createSnapshot(name, storageItems.value)
    .catch(error => {
      console.error('创建快照失败:', error)
      alert('创建快照失败: ' + error.message)
    })
}

// 处理恢复快照
const handleRestoreSnapshot = (id: string) => {
  const snapshot = snapshots.value.find(s => s.id === id)
  if (!snapshot) return

  if (confirm(`确定要恢复快照 "${snapshot.name}" 吗？这将覆盖当前所有localStorage数据。`)) {
    restoreSnapshot(id)
      .catch(error => {
        console.error('恢复快照失败:', error)
        alert('恢复快照失败: ' + error.message)
      })
  }
}

// 处理删除快照
const handleDeleteSnapshot = (id: string) => {
  const snapshot = snapshots.value.find(s => s.id === id)
  if (!snapshot) return

  if (confirm(`确定要删除快照 "${snapshot.name}" 吗？`)) {
    deleteSnapshot(id)
      .catch(error => {
        console.error('删除快照失败:', error)
        alert('删除快照失败: ' + error.message)
      })
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- 工具栏 -->
    <StorageToolbar
      @refresh="loadStorageItems"
      @add="handleAdd"
      @clear="handleClear"
      @create-snapshot="handleCreateSnapshot"
    />

    <!-- 主内容区 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧: Storage列表 -->
      <div class="flex-1 overflow-auto p-4">
        <h2 class="text-lg font-semibold mb-4">LocalStorage Items</h2>

        <div v-if="storageItems.length === 0" class="text-gray-500 text-center py-8">
          当前页面没有localStorage数据
        </div>

        <div v-else class="space-y-2">
          <StorageItem
            v-for="item in storageItems"
            :key="item.key"
            :item="item"
            :selected="selectedItem === item.key"
            @select="selectedItem = item.key"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- 右侧: 编辑器 -->
      <div class="w-1/2 border-l border-gray-200 overflow-auto">
        <template v-if="isEditing">
          <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">编辑: {{ currentEditKey }}</h3>
            <StorageEditor
              v-model="currentEditValue"
              @save="saveEdit"
              @cancel="cancelEdit"
            />
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
              v-if="viewMode === 'json' && isSelectedItemJson"
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
    <div class="border-t border-gray-200 p-4">
      <h3 class="text-lg font-semibold mb-2">快照</h3>

      <div v-if="snapshots.length === 0" class="text-gray-500">
        暂无快照
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="snapshot in snapshots"
          :key="snapshot.id"
          class="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
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
  </div>
</template>
