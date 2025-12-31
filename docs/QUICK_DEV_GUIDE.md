# Storage Pro 快速开发指南

## 📖 开发新功能速查表

### 1. 添加新的搜索过滤器

```typescript
// 1. 在 src/types/search.ts 添加类型
export interface FilterOptions {
  // ... 现有选项
  customFilter?: {
    field: string
    operator: 'equals' | 'contains' | 'regex'
    value: any
  }
}

// 2. 在 src/composables/useSearchFilter.ts 实现逻辑
const matchesCustomFilter = (item: StorageItem): boolean => {
  if (!filterOptions.value.customFilter) return true
  // 实现自定义过滤逻辑
  return true
}

// 3. 在 SearchBar.vue 添加 UI
<div class="custom-filter">
  <input v-model="filterOptions.customFilter.field" placeholder="字段名" />
  <select v-model="filterOptions.customFilter.operator">
    <option value="equals">等于</option>
    <option value="contains">包含</option>
    <option value="regex">正则</option>
  </select>
  <input v-model="filterOptions.customFilter.value" placeholder="值" />
</div>
```

---

### 2. 添加新的导出格式

```typescript
// 1. 在 src/composables/useExportImport.ts 添加导出函数
const exportToXML = (
  items: StorageItem[],
  storageType: string,
  options: ExportOptions
): void => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<storage type="${storageType}">
  ${items.map(item => `
  <item>
    <key>${escapeXML(item.key)}</key>
    <value><![CDATA[${item.value}]]></value>
  </item>`).join('')}
</storage>`

  downloadFile(xml, `storage-${storageType}-${Date.now()}.xml`, 'text/xml')
}

// 2. 在 ExportImportDialog.vue 添加选项
<label>
  <input type="radio" v-model="exportFormat" value="xml" />
  XML
</label>
```

---

### 3. 添加新的 Storage Provider

```typescript
// 1. 创建 Provider 类
// src/providers/WebSQLProvider.ts
import type { IStorageProvider, StorageItem } from './IStorageProvider'

export class WebSQLProvider implements IStorageProvider {
  type = 'websql' as const
  private db: Database | null = null

  constructor() {
    this.initDB()
  }

  private initDB(): void {
    // 初始化 WebSQL 数据库
  }

  async loadItems(): Promise<StorageItem[]> {
    // 实现加载逻辑
    return []
  }

  // ... 实现其他方法
}

// 2. 注册 Provider
// src/stores/storageStore.ts
import { WebSQLProvider } from '@/providers/WebSQLProvider'

const providers = {
  localStorage: new LocalStorageProvider(),
  sessionStorage: new SessionStorageProvider(),
  cookie: new CookieProvider(),
  websql: new WebSQLProvider() // 新增
}

// 3. 在 UI 中添加切换按钮
<button @click="switchStorage('websql')">WebSQL</button>
```

---

### 4. 添加新的统计指标

```typescript
// 1. 在 src/composables/useMonitor.ts 添加计算逻辑
const averageValueSize = computed(() => {
  if (storageItems.value.length === 0) return 0
  const total = storageItems.value.reduce((sum, item) =>
    sum + new Blob([item.value]).size, 0
  )
  return Math.round(total / storageItems.value.length)
})

// 2. 在 StatsDashboard.vue 显示
<div class="stat-card">
  <div class="stat-value">{{ formatSize(averageValueSize) }}</div>
  <div class="stat-label">平均大小</div>
</div>
```

---

## 🎨 UI 组件开发规范

### 组件命名规范

```
✅ 正确:
- StorageItem.vue (实体组件)
- SearchBar.vue (功能组件)
- UserProfileCard.vue (复合名词)

❌ 错误:
- Item.vue (过于通用)
- search.vue (首字母小写)
- storage-item.vue (kebab-case，应使用 PascalCase)
```

### 组件结构模板

```vue
<script setup lang="ts">
// 1. 导入依赖
import { ref, computed, onMounted } from 'vue'
import type { Props, Emits } from './types'

// 2. 定义 Props 和 Emits
interface Props {
  modelValue: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

// 3. 响应式状态
const localValue = ref(props.modelValue)
const isValid = ref(true)

// 4. 计算属性
const displayValue = computed(() => {
  return localValue.value.toUpperCase()
})

// 5. 方法
const handleChange = () => {
  emit('update:modelValue', localValue.value)
  emit('change', localValue.value)
}

// 6. 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<template>
  <div class="component-wrapper">
    <!-- 组件内容 -->
  </div>
</template>

<style scoped>
/* 使用 Tailwind 优先，必要时补充 */
.component-wrapper {
  @apply p-4 bg-white rounded-lg;
}
</style>
```

---

## 🧪 测试开发规范

### 单元测试模板

```typescript
// tests/unit/useSearchFilter.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchFilter } from '@/composables/useSearchFilter'
import type { StorageItem } from '@/types/storage'

describe('useSearchFilter', () => {
  let searchFilter: ReturnType<typeof useSearchFilter>
  let mockItems: StorageItem[]

  beforeEach(() => {
    searchFilter = useSearchFilter()
    mockItems = [
      { key: 'user_name', value: 'John Doe' },
      { key: 'user_email', value: 'john@example.com' },
      { key: 'settings', value: '{"theme":"dark"}' }
    ]
  })

  describe('基础搜索', () => {
    it('应该能搜索键名', () => {
      searchFilter.searchOptions.value.keyword = 'user'
      searchFilter.searchOptions.value.searchIn = 'key'

      const result = searchFilter.filterItems(mockItems)

      expect(result).toHaveLength(2)
      expect(result[0].key).toContain('user')
    })

    it('空关键字应返回所有项', () => {
      searchFilter.searchOptions.value.keyword = ''

      const result = searchFilter.filterItems(mockItems)

      expect(result).toHaveLength(mockItems.length)
    })
  })

  describe('高级搜索', () => {
    it('应该支持正则表达式', () => {
      searchFilter.searchOptions.value.keyword = '^user_\\w+$'
      searchFilter.searchOptions.value.useRegex = true

      const result = searchFilter.filterItems(mockItems)

      expect(result).toHaveLength(2)
    })

    it('应该支持大小写敏感搜索', () => {
      searchFilter.searchOptions.value.keyword = 'JOHN'
      searchFilter.searchOptions.value.caseSensitive = true

      const result = searchFilter.filterItems(mockItems)

      expect(result).toHaveLength(0)
    })
  })

  describe('JSON 深度搜索', () => {
    it('应该能搜索 JSON 内部字段', () => {
      searchFilter.searchOptions.value.keyword = 'dark'
      searchFilter.searchOptions.value.deepSearch = true

      const result = searchFilter.filterItems(mockItems)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('settings')
    })
  })

  describe('类型过滤', () => {
    it('应该能按类型过滤', () => {
      searchFilter.filterOptions.value.types = ['json']

      const result = searchFilter.filterItems(mockItems)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('settings')
    })
  })
})
```

### E2E 测试模板

```typescript
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('搜索功能', () => {
  test.beforeEach(async ({ page }) => {
    // 打开测试页面
    await page.goto('http://localhost:5173')

    // 准备测试数据
    await page.evaluate(() => {
      localStorage.setItem('user_name', 'John Doe')
      localStorage.setItem('user_email', 'john@example.com')
      localStorage.setItem('settings', '{"theme":"dark"}')
    })

    // 刷新加载数据
    await page.click('[data-testid="refresh-button"]')
  })

  test('应该能搜索并显示结果', async ({ page }) => {
    // 输入搜索关键字
    await page.fill('[data-testid="search-input"]', 'user')

    // 等待搜索结果
    await page.waitForSelector('[data-testid="storage-item"]')

    // 验证结果数量
    const items = await page.locator('[data-testid="storage-item"]').count()
    expect(items).toBe(2)
  })

  test('应该能使用正则表达式搜索', async ({ page }) => {
    // 启用正则表达式
    await page.check('[data-testid="regex-checkbox"]')

    // 输入正则表达式
    await page.fill('[data-testid="search-input"]', '^user_\\w+$')

    // 验证结果
    const items = await page.locator('[data-testid="storage-item"]')
    await expect(items).toHaveCount(2)
  })

  test('应该能清空搜索', async ({ page }) => {
    // 搜索
    await page.fill('[data-testid="search-input"]', 'user')
    await expect(page.locator('[data-testid="storage-item"]')).toHaveCount(2)

    // 清空
    await page.click('[data-testid="clear-search"]')
    await expect(page.locator('[data-testid="storage-item"]')).toHaveCount(3)
  })
})
```

---

## 🔧 常用工具函数

### 数据格式化

```typescript
// src/utils/formatters.ts

/**
 * 格式化文件大小
 */
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

/**
 * 格式化时间
 */
export const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化 JSON
 */
export const formatJSON = (value: string): string | null => {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return null
  }
}

/**
 * 压缩 JSON
 */
export const compressJSON = (value: string): string | null => {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}
```

### 数据验证

```typescript
// src/utils/validators.ts

/**
 * 验证 JSON 格式
 */
export const isValidJSON = (value: string): boolean => {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * 验证键名合法性
 */
export const isValidKey = (key: string): boolean => {
  // 不能为空
  if (!key || key.trim().length === 0) return false

  // 不能包含特殊字符
  if (/[<>\"']/.test(key)) return false

  // 长度限制
  if (key.length > 256) return false

  return true
}

/**
 * 验证值大小
 */
export const isValidSize = (value: string, maxSize: number = 5242880): boolean => {
  const size = new Blob([value]).size
  return size <= maxSize // 默认 5MB
}

/**
 * 检测敏感数据
 */
export const hasSensitiveData = (value: string): boolean => {
  const patterns = {
    phone: /1[3-9]\d{9}/,
    idCard: /\d{17}[\dXx]/,
    email: /[\w.-]+@[\w.-]+\.\w+/,
    token: /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/i,
    password: /"password"\s*:\s*"[^"]+"/i
  }

  return Object.values(patterns).some(pattern => pattern.test(value))
}
```

---

## 🎯 性能优化技巧

### 1. 虚拟滚动

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVirtualList } from '@vueuse/core'

const items = ref<StorageItem[]>([]) // 大数据列表

const { list, containerProps, wrapperProps } = useVirtualList(
  items,
  {
    itemHeight: 50, // 每项高度
    overscan: 10 // 预渲染项数
  }
)
</script>

<template>
  <div v-bind="containerProps" class="virtual-container">
    <div v-bind="wrapperProps">
      <StorageItem
        v-for="{ data, index } in list"
        :key="data.key"
        :item="data"
      />
    </div>
  </div>
</template>

<style scoped>
.virtual-container {
  height: 600px;
  overflow-y: auto;
}
</style>
```

### 2. 防抖搜索

```typescript
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const searchKeyword = ref('')
const debouncedSearch = useDebounceFn((keyword: string) => {
  // 执行搜索
  performSearch(keyword)
}, 300) // 300ms 延迟

watch(searchKeyword, (newValue) => {
  debouncedSearch(newValue)
})
```

### 3. 懒加载组件

```typescript
// App.vue
import { defineAsyncComponent } from 'vue'

const MonacoEditor = defineAsyncComponent(() =>
  import('./components/editor/MonacoEditor.vue')
)

const JsonViewer = defineAsyncComponent(() =>
  import('./components/JsonViewer.vue')
)
```

### 4. 计算属性缓存

```typescript
// ❌ 不好：每次访问都重新计算
const filteredItems = () => {
  return items.value.filter(item => item.key.includes(keyword.value))
}

// ✅ 好：使用 computed 缓存
const filteredItems = computed(() => {
  return items.value.filter(item => item.key.includes(keyword.value))
})
```

---

## 🐛 调试技巧

### Chrome DevTools 调试

```typescript
// 1. 启用调试模式
const isDev = import.meta.env.DEV

// 2. 添加调试日志
if (isDev) {
  console.log('[DEBUG] Storage items loaded:', storageItems.value)
}

// 3. 性能监控
if (isDev) {
  console.time('Search operation')
  const result = filterItems(items)
  console.timeEnd('Search operation')
}

// 4. 断点调试
if (isDev) {
  debugger // 代码会在此处暂停
}
```

### Vue DevTools

```typescript
// 在组件中暴露调试信息
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
if (import.meta.env.DEV) {
  // @ts-ignore
  window.__STORAGE_PRO_DEBUG__ = {
    instance,
    storageItems: storageItems.value,
    searchOptions: searchOptions.value
  }
}
```

### 错误追踪

```typescript
// src/utils/errorHandler.ts
export class ErrorTracker {
  static track(error: Error, context?: any): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }

    // 在开发环境打印
    if (import.meta.env.DEV) {
      console.error('[Error]', errorInfo)
    }

    // 在生产环境上报
    if (import.meta.env.PROD) {
      // 发送到错误追踪服务（如 Sentry）
      // sendToErrorTracker(errorInfo)
    }
  }
}

// 全局错误处理
window.addEventListener('error', (event) => {
  ErrorTracker.track(event.error, {
    filename: event.filename,
    lineno: event.lineno
  })
})
```

---

## 📚 常见问题 FAQ

### Q1: 如何添加新的搜索算法？

```typescript
// 在 useSearchFilter.ts 中添加新的匹配函数
const fuzzyMatch = (text: string, pattern: string): boolean => {
  pattern = pattern.toLowerCase()
  text = text.toLowerCase()

  let patternIdx = 0
  let textIdx = 0

  while (patternIdx < pattern.length && textIdx < text.length) {
    if (pattern[patternIdx] === text[textIdx]) {
      patternIdx++
    }
    textIdx++
  }

  return patternIdx === pattern.length
}

// 在 matchesSearch 中使用
if (searchOptions.value.fuzzySearch) {
  return fuzzyMatch(item.key, searchOptions.value.keyword)
}
```

### Q2: 如何优化大数据量性能？

```typescript
// 1. 使用 Web Worker 处理搜索
// src/workers/search.worker.ts
self.addEventListener('message', (event) => {
  const { items, keyword } = event.data
  const filtered = items.filter(item => item.key.includes(keyword))
  self.postMessage(filtered)
})

// 2. 分页加载
const PAGE_SIZE = 50
const currentPage = ref(1)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredItems.value.slice(start, start + PAGE_SIZE)
})

// 3. 索引加速
const buildIndex = (items: StorageItem[]): Map<string, StorageItem[]> => {
  const index = new Map()
  items.forEach(item => {
    const firstChar = item.key[0].toLowerCase()
    if (!index.has(firstChar)) {
      index.set(firstChar, [])
    }
    index.get(firstChar).push(item)
  })
  return index
}
```

### Q3: 如何处理跨域问题？

```typescript
// manifest.json 中添加权限
{
  "host_permissions": [
    "http://localhost/*",
    "https://*.example.com/*"
  ]
}

// 或使用 content_scripts
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ]
}
```

---

## 🚀 发布检查清单

### 发布前

- [ ] 所有测试通过 (`npm run test`)
- [ ] 代码格式化 (`npm run lint && npm run format`)
- [ ] 类型检查通过 (`npm run type-check`)
- [ ] 构建成功 (`npm run build`)
- [ ] 手动测试所有核心功能
- [ ] 更新版本号 (`npm version patch/minor/major`)
- [ ] 更新 CHANGELOG.md
- [ ] 更新 README.md（如有新功能）

### 发布后

- [ ] 在多个 Chrome 版本测试
- [ ] 监控错误报告
- [ ] 收集用户反馈
- [ ] 规划下一个版本

---

## 📞 获取帮助

- **GitHub Issues**: [项目地址]/issues
- **文档**: ./docs/
- **示例代码**: ./examples/

---

**最后更新**: 2025-12-30
