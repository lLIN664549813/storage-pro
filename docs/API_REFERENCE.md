# Storage Pro API 参考文档

## 📚 目录

1. [Composables API](#composables-api)
2. [Storage Providers API](#storage-providers-api)
3. [组件 Props & Events](#组件-props--events)
4. [工具函数 API](#工具函数-api)
5. [类型定义](#类型定义)

---

## Composables API

### useSearchFilter()

搜索和过滤 Storage 数据的核心逻辑。

#### 返回值

```typescript
interface UseSearchFilterReturn {
  // 响应式状态
  searchOptions: Ref<SearchOptions>
  filterOptions: Ref<FilterOptions>
  searchHistory: Ref<SearchHistory[]>

  // 方法
  filterItems: (items: StorageItem[]) => StorageItem[]
  clearSearchHistory: () => void
  replaySearch: (historyItem: SearchHistory) => void
}
```

#### 使用示例

```typescript
import { useSearchFilter } from '@/composables/useSearchFilter'

const {
  searchOptions,
  filterOptions,
  filterItems
} = useSearchFilter()

// 设置搜索选项
searchOptions.value.keyword = 'user'
searchOptions.value.useRegex = true
searchOptions.value.deepSearch = true

// 执行过滤
const filtered = filterItems(storageItems.value)
```

#### SearchOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| keyword | `string` | `''` | 搜索关键字 |
| searchIn | `'key' \| 'value' \| 'both'` | `'both'` | 搜索范围 |
| caseSensitive | `boolean` | `false` | 是否区分大小写 |
| useRegex | `boolean` | `false` | 是否使用正则表达式 |
| deepSearch | `boolean` | `true` | 是否深度搜索 JSON |

#### FilterOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| types | `Array<'string' \| 'number' \| 'boolean' \| 'json' \| 'null'>` | `[]` | 类型过滤 |
| sizeRange | `{ min: number, max: number }` | `{ min: 0, max: Infinity }` | 大小范围 |

---

### useExportImport()

数据导入导出功能。

#### 返回值

```typescript
interface UseExportImportReturn {
  // 状态
  isExporting: Ref<boolean>
  isImporting: Ref<boolean>

  // 方法
  exportToJSON: (
    items: StorageItem[],
    storageType: string,
    options: ExportOptions
  ) => void
  exportToCSV: (
    items: StorageItem[],
    storageType: string,
    options: ExportOptions
  ) => void
  copyToClipboard: (items: StorageItem[]) => Promise<void>
  importFromJSON: (
    file: File,
    options: ImportOptions,
    onProgress?: (current: number, total: number) => void
  ) => Promise<ImportResult>
}
```

#### 使用示例

```typescript
import { useExportImport } from '@/composables/useExportImport'

const {
  exportToJSON,
  importFromJSON,
  isExporting,
  isImporting
} = useExportImport()

// 导出为 JSON
exportToJSON(items, 'localStorage', {
  format: 'json',
  includeMetadata: true,
  prettyPrint: true
})

// 导入 JSON
const result = await importFromJSON(file, {
  mode: 'merge',
  skipExisting: true,
  validateData: true
})

console.log(`导入成功: ${result.imported} 项`)
```

#### ExportOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| format | `'json' \| 'csv'` | `'json'` | 导出格式 |
| includeMetadata | `boolean` | `true` | 是否包含元数据 |
| selectedKeys | `string[]?` | `undefined` | 选择性导出的键 |
| prettyPrint | `boolean` | `true` | 是否格式化 JSON |

#### ImportOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| mode | `'merge' \| 'overwrite'` | `'merge'` | 导入模式 |
| skipExisting | `boolean` | `true` | 是否跳过已存在的键 |
| validateData | `boolean` | `true` | 是否验证数据格式 |

#### ImportResult

```typescript
interface ImportResult {
  success: boolean
  imported: number      // 成功导入数量
  skipped: number       // 跳过数量
  errors: number        // 失败数量
  details: {
    imported: string[]  // 成功导入的键
    skipped: string[]   // 跳过的键
    errors: string[]    // 失败的键及原因
  }
}
```

---

### useWebStorage()

通用 Web Storage 操作接口。

#### 参数

```typescript
function useWebStorage(
  storageType: 'localStorage' | 'sessionStorage' = 'localStorage'
): UseWebStorageReturn
```

#### 返回值

```typescript
interface UseWebStorageReturn {
  storageItems: Ref<StorageItem[]>

  // CRUD 操作
  loadStorageItems: () => Promise<void>
  addItem: (key: string, value: string) => Promise<void>
  updateItem: (key: string, value: string) => Promise<void>
  deleteItem: (key: string) => Promise<void>
  clearStorage: () => Promise<void>
}
```

#### 使用示例

```typescript
import { useWebStorage } from '@/composables/useWebStorage'

// 创建 localStorage 实例
const storage = useWebStorage('localStorage')

// 加载数据
await storage.loadStorageItems()

// 添加项
await storage.addItem('user_name', 'John Doe')

// 更新项
await storage.updateItem('user_name', 'Jane Doe')

// 删除项
await storage.deleteItem('user_name')

// 清空
await storage.clearStorage()
```

---

### useSnapshot()

快照管理功能。

#### 返回值

```typescript
interface UseSnapshotReturn {
  snapshots: Ref<Snapshot[]>

  createSnapshot: (name: string, items: StorageItem[]) => Promise<void>
  restoreSnapshot: (id: string) => Promise<void>
  deleteSnapshot: (id: string) => void
}
```

#### 使用示例

```typescript
import { useSnapshot } from '@/composables/useSnapshot'

const {
  snapshots,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot
} = useSnapshot()

// 创建快照
await createSnapshot('初始状态', storageItems.value)

// 恢复快照
await restoreSnapshot(snapshots.value[0].id)

// 删除快照
deleteSnapshot(snapshots.value[0].id)
```

---

### useMonitor()

实时监控功能（新增）。

#### 返回值

```typescript
interface UseMonitorReturn {
  changeLogs: Ref<ChangeLog[]>
  recentlyChanged: Ref<Set<string>>
  statistics: Ref<StorageStatistics>

  startMonitoring: () => void
  stopMonitoring: () => void
  clearLogs: () => void
}
```

#### 使用示例

```typescript
import { useMonitor } from '@/composables/useMonitor'

const {
  changeLogs,
  recentlyChanged,
  startMonitoring,
  stopMonitoring
} = useMonitor()

// 开始监控
startMonitoring()

// 停止监控
stopMonitoring()

// 监听变化
watch(changeLogs, (logs) => {
  console.log('最新变更:', logs[0])
})
```

---

## Storage Providers API

### IStorageProvider

所有 Storage Provider 必须实现的接口。

```typescript
interface IStorageProvider {
  type: StorageType

  // 基础 CRUD
  loadItems(): Promise<StorageItem[]>
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>

  // 高级功能
  keys(): Promise<string[]>
  size(): Promise<number>
  exists(key: string): Promise<boolean>

  // 批量操作
  setItems(items: StorageItem[]): Promise<void>
  removeItems(keys: string[]): Promise<void>

  // 变更监听（可选）
  onChange?: (callback: (change: StorageChange) => void) => () => void
}
```

### LocalStorageProvider

```typescript
class LocalStorageProvider implements IStorageProvider {
  type = 'localStorage' as const

  async loadItems(): Promise<StorageItem[]>
  async getItem(key: string): Promise<string | null>
  async setItem(key: string, value: string): Promise<void>
  async removeItem(key: string): Promise<void>
  async clear(): Promise<void>
  async keys(): Promise<string[]>
  async size(): Promise<number>
  async exists(key: string): Promise<boolean>
  async setItems(items: StorageItem[]): Promise<void>
  async removeItems(keys: string[]): Promise<void>
}
```

### CookieProvider

```typescript
class CookieProvider implements IStorageProvider {
  type = 'cookie' as const

  async setItem(
    key: string,
    value: string,
    options?: CookieOptions
  ): Promise<void>

  // ... 其他方法同 IStorageProvider
}

interface CookieOptions {
  maxAge?: number        // 过期时间（秒）
  path?: string          // 路径
  domain?: string        // 域名
  secure?: boolean       // 仅 HTTPS
  sameSite?: 'Strict' | 'Lax' | 'None'
}
```

### IndexedDBProvider

```typescript
class IndexedDBProvider implements IStorageProvider {
  type = 'indexedDB' as const

  constructor(
    dbName: string,
    storeName: string
  )

  // 特有方法
  async getDatabases(): Promise<DatabaseInfo[]>
  async getObjectStores(dbName: string): Promise<string[]>
  async query(
    filter: (item: any) => boolean
  ): Promise<StorageItem[]>

  // ... 其他方法同 IStorageProvider
}
```

---

## 组件 Props & Events

### StorageItem.vue

#### Props

```typescript
interface Props {
  item: StorageItem
  selected?: boolean
  highlighted?: boolean
}
```

#### Events

```typescript
interface Emits {
  (e: 'select', key: string): void
  (e: 'edit', key: string, value: string): void
  (e: 'delete', key: string): void
}
```

#### 使用示例

```vue
<StorageItem
  :item="{ key: 'user_name', value: 'John' }"
  :selected="true"
  @select="handleSelect"
  @edit="handleEdit"
  @delete="handleDelete"
/>
```

---

### SearchBar.vue

#### Props

```typescript
interface Props {
  modelValue?: string    // v-model 绑定
  placeholder?: string
  disabled?: boolean
}
```

#### Events

```typescript
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', keyword: string): void
  (e: 'clear'): void
}
```

#### 使用示例

```vue
<SearchBar
  v-model="searchKeyword"
  placeholder="搜索 Storage 数据..."
  @search="handleSearch"
  @clear="handleClear"
/>
```

---

### MonacoEditor.vue

#### Props

```typescript
interface Props {
  modelValue: string
  language?: 'json' | 'javascript' | 'html' | 'css'
  theme?: 'vs' | 'vs-dark' | 'hc-black'
  readOnly?: boolean
  height?: string | number
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}
```

#### Events

```typescript
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'save'): void
  (e: 'error', error: Error): void
}
```

#### 使用示例

```vue
<MonacoEditor
  v-model="jsonContent"
  language="json"
  theme="vs-dark"
  height="600px"
  :options="{ minimap: { enabled: false } }"
  @save="handleSave"
  @error="handleError"
/>
```

---

### JsonViewer.vue

#### Props

```typescript
interface Props {
  data: any
  depth?: number
  expandLevel?: number
}
```

#### 使用示例

```vue
<JsonViewer
  :data="{ name: 'John', age: 30, skills: ['JS', 'TS'] }"
  :expand-level="2"
/>
```

---

## 工具函数 API

### formatSize()

格式化字节大小。

```typescript
function formatSize(bytes: number): string

// 示例
formatSize(0)          // '0 B'
formatSize(1024)       // '1.00 KB'
formatSize(1048576)    // '1.00 MB'
```

---

### formatTime()

格式化时间戳为相对时间。

```typescript
function formatTime(timestamp: number): string

// 示例
formatTime(Date.now())               // '刚刚'
formatTime(Date.now() - 120000)      // '2 分钟前'
formatTime(Date.now() - 7200000)     // '2 小时前'
```

---

### isValidJSON()

验证 JSON 格式。

```typescript
function isValidJSON(value: string): boolean

// 示例
isValidJSON('{"name":"John"}')  // true
isValidJSON('{invalid}')        // false
```

---

### detectType()

检测数据类型。

```typescript
function detectType(value: string): DataType

type DataType = 'string' | 'number' | 'boolean' | 'json' | 'array' | 'null'

// 示例
detectType('hello')              // 'string'
detectType('123')                // 'number'
detectType('{"a":1}')            // 'json'
detectType('[1,2,3]')            // 'array'
```

---

### hasSensitiveData()

检测敏感数据。

```typescript
function hasSensitiveData(value: string): boolean

// 示例
hasSensitiveData('13812345678')               // true (手机号)
hasSensitiveData('user@example.com')          // true (邮箱)
hasSensitiveData('Bearer eyJhbGc...')         // true (Token)
hasSensitiveData('{"password":"123456"}')     // true (密码)
```

---

### maskSensitiveData()

脱敏显示敏感数据。

```typescript
function maskSensitiveData(
  value: string,
  type: SensitiveDataType
): string

type SensitiveDataType = 'phone' | 'idCard' | 'email' | 'token' | 'password'

// 示例
maskSensitiveData('13812345678', 'phone')
// '138****5678'

maskSensitiveData('john@example.com', 'email')
// 'j***@example.com'

maskSensitiveData('Bearer eyJhbGc...xyz', 'token')
// 'Bearer eyJhbGc...xyz'
```

---

## 类型定义

### StorageItem

```typescript
interface StorageItem {
  key: string
  value: string
}
```

### Snapshot

```typescript
interface Snapshot {
  id: string
  name: string
  createdAt: number
  items: StorageItem[]
  tags?: string[]
  description?: string
}
```

### ChangeLog

```typescript
interface ChangeLog {
  action: 'set' | 'remove' | 'clear'
  key?: string
  oldValue?: string
  newValue?: string
  timestamp: number
}
```

### StorageStatistics

```typescript
interface StorageStatistics {
  totalItems: number
  totalSize: number
  typeDistribution: Record<DataType, number>
  averageSize: number
  largestItem: {
    key: string
    size: number
  }
  quotaUsage: number // 百分比
}
```

### SearchHistory

```typescript
interface SearchHistory {
  id: string
  keyword: string
  timestamp: number
  resultCount: number
}
```

### MockTemplate

```typescript
interface MockTemplate {
  name: string
  description?: string
  fields: Array<{
    key: string
    type: 'string' | 'number' | 'boolean' | 'json' | 'uuid' | 'email' | 'date'
    count?: number
  }>
}
```

---

## 事件总线

### StorageEventBus

全局事件总线，用于组件间通信。

```typescript
import { mitt } from 'mitt'

type Events = {
  'storage:changed': StorageItem
  'storage:cleared': void
  'search:performed': { keyword: string, results: number }
  'snapshot:created': Snapshot
  'snapshot:restored': string
}

export const eventBus = mitt<Events>()

// 使用示例
// 发送事件
eventBus.emit('storage:changed', { key: 'user', value: 'John' })

// 监听事件
eventBus.on('storage:changed', (item) => {
  console.log('Storage changed:', item)
})

// 取消监听
const handler = (item: StorageItem) => { /* ... */ }
eventBus.on('storage:changed', handler)
eventBus.off('storage:changed', handler)
```

---

## 错误处理

### StorageError

```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_DATA = 'INVALID_DATA',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// 使用示例
try {
  await storage.addItem('key', 'value')
} catch (error) {
  if (error instanceof StorageError) {
    switch (error.code) {
      case ErrorCode.ALREADY_EXISTS:
        alert('键已存在')
        break
      case ErrorCode.QUOTA_EXCEEDED:
        alert('存储空间已满')
        break
    }
  }
}
```

---

## Chrome Extension API 包装

### inspectedWindow

```typescript
// src/utils/chromeAPI.ts
export const chromeAPI = {
  /**
   * 在页面上下文中执行代码
   */
  eval: <T = any>(
    expression: string
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        expression,
        (result, isException) => {
          if (isException) {
            reject(new Error(String(isException)))
          } else {
            resolve(result as T)
          }
        }
      )
    })
  },

  /**
   * 重新加载页面
   */
  reload: (): void => {
    chrome.devtools.inspectedWindow.reload({})
  }
}

// 使用示例
const items = await chromeAPI.eval<StorageItem[]>(`
  (() => {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items.push({ key, value: localStorage.getItem(key) });
      }
    }
    return items;
  })()
`)
```

---

## 版本信息

- **当前版本**: 1.0.0
- **最后更新**: 2025-12-30
- **兼容 Chrome 版本**: 88+

---

## 更新日志

### v1.1.0 (计划中)
- ✨ 新增搜索过滤功能
- ✨ 新增导入导出功能
- 🐛 修复若干已知问题

### v1.0.0
- 🎉 首次发布
- ✅ localStorage 管理
- ✅ sessionStorage 管理
- ✅ JSON 对象树查看
- ✅ 快照功能

---

**维护团队**: Storage Pro Team
**许可证**: MIT
