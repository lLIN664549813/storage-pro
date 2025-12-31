# Storage Pro 功能扩展实施文档

## 📋 文档信息

**文档版本**: v1.0.0
**创建日期**: 2025-12-30
**最后更新**: 2025-12-30
**项目代号**: Storage Pro Extended
**技术栈**: Vue 3 + TypeScript + Vite + Chrome Extension API

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构设计](#2-技术架构设计)
3. [功能实施方案](#3-功能实施方案)
4. [数据存储设计](#4-数据存储设计)
5. [API 接口设计](#5-api-接口设计)
6. [UI/UX 设计规范](#6-uiux-设计规范)
7. [测试计划](#7-测试计划)
8. [部署方案](#8-部署方案)
9. [风险评估](#9-风险评估)
10. [开发排期](#10-开发排期)

---

## 1. 项目概述

### 1.1 项目背景

Storage Pro 是一个 Chrome DevTools 扩展，当前支持 localStorage 和 sessionStorage 的基础管理功能。为提升竞争力和用户体验，计划新增 10 大功能模块。

### 1.2 实施目标

- ✅ **短期目标**（1-2 周）：实现搜索过滤和数据导入导出
- ✅ **中期目标**（3-4 周）：完成实时监控和智能编辑器
- ✅ **长期目标**（5-8 周）：实现全部高级特性

### 1.3 成功指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 功能完整度 | 40% | 95% |
| 用户满意度 | N/A | 4.5/5.0 |
| 性能（大数据量） | 支持 50 项 | 支持 1000+ 项 |
| 代码覆盖率 | 0% | 80% |

---

## 2. 技术架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Chrome DevTools                       │
│                     (Storage Pro Panel)                      │
├─────────────────────────────────────────────────────────────┤
│                      Presentation Layer                      │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Storage  │ Editor   │ Search   │ Snapshot │ Monitor  │  │
│  │ List     │ Component│ Component│ Manager  │ Dashboard│  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                       Business Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Composables (Business Logic)                           │ │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┤ │
│  │useWeb    │useSearch │useExport │useMonitor│useMock   │ │
│  │Storage   │Filter    │Import    │          │Data      │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                        Data Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Storage Providers (Adapter Pattern)                    │ │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┤ │
│  │Local     │Session   │Cookie    │IndexedDB │Cache     │ │
│  │Storage   │Storage   │Provider  │Provider  │Provider  │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Chrome Extension APIs                     │
│  chrome.devtools.inspectedWindow.eval()                     │
│  chrome.runtime.onMessage / postMessage                     │
└─────────────────────────────────────────────────────────────┘
         │                         │                    │
         ▼                         ▼                    ▼
  ┌─────────────┐         ┌─────────────┐      ┌─────────────┐
  │ Page Context│         │ Background  │      │ Content     │
  │ (Injected)  │         │ Script      │      │ Script      │
  └─────────────┘         └─────────────┘      └─────────────┘
```

### 2.2 技术选型

#### 2.2.1 核心依赖

| 类别 | 技术方案 | 版本 | 用途 |
|------|----------|------|------|
| **代码编辑器** | Monaco Editor | ^0.45.0 | JSON 智能编辑 |
| **数据模拟** | @faker-js/faker | ^8.3.1 | Mock 数据生成 |
| **图表可视化** | Chart.js | ^4.4.1 | 数据统计图表 |
| **Diff 工具** | diff | ^5.1.0 | 快照对比 |
| **二维码** | qrcode | ^1.5.3 | 分享功能 |
| **加密** | crypto-js | ^4.2.0 | 敏感数据加密 |
| **状态管理** | Pinia | ^2.1.7 | 全局状态 |

#### 2.2.2 开发工具

```json
{
  "devDependencies": {
    "@types/chrome": "^0.0.243",
    "@types/diff": "^5.0.9",
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "playwright": "^1.40.0"
  }
}
```

### 2.3 模块划分

```
src/
├── components/                # UI 组件
│   ├── storage/
│   │   ├── StorageItem.vue
│   │   ├── StorageList.vue
│   │   └── StorageToolbar.vue
│   ├── editor/
│   │   ├── MonacoEditor.vue      # 新增
│   │   ├── JsonViewer.vue
│   │   └── EditorToolbar.vue     # 新增
│   ├── search/
│   │   ├── SearchBar.vue         # 新增
│   │   └── FilterPanel.vue       # 新增
│   ├── snapshot/
│   │   ├── SnapshotList.vue
│   │   ├── SnapshotCompare.vue   # 新增
│   │   └── DiffViewer.vue        # 新增
│   ├── monitor/
│   │   ├── ChangeLog.vue         # 新增
│   │   ├── StatsDashboard.vue    # 新增
│   │   └── RealtimeChart.vue     # 新增
│   └── mock/
│       ├── MockDataGenerator.vue # 新增
│       └── TemplateManager.vue   # 新增
│
├── composables/               # 业务逻辑
│   ├── storage/
│   │   ├── useWebStorage.ts
│   │   ├── useCookieStorage.ts   # 新增
│   │   └── useIndexedDB.ts       # 新增
│   ├── useSearchFilter.ts        # 新增
│   ├── useExportImport.ts        # 新增
│   ├── useMonitor.ts             # 新增
│   ├── useMockData.ts            # 新增
│   └── useSnapshot.ts
│
├── providers/                 # 存储适配器
│   ├── IStorageProvider.ts       # 新增（接口）
│   ├── LocalStorageProvider.ts   # 新增
│   ├── SessionStorageProvider.ts # 新增
│   ├── CookieProvider.ts         # 新增
│   ├── IndexedDBProvider.ts      # 新增
│   └── CacheStorageProvider.ts   # 新增
│
├── utils/                     # 工具函数
│   ├── jsonParser.ts
│   ├── dataValidator.ts          # 新增
│   ├── sensitiveDetector.ts      # 新增
│   ├── encryption.ts             # 新增
│   └── formatters.ts             # 新增
│
├── types/                     # 类型定义
│   ├── storage.ts
│   ├── search.ts                 # 新增
│   ├── monitor.ts                # 新增
│   └── mock.ts                   # 新增
│
├── stores/                    # Pinia 状态
│   ├── storageStore.ts           # 新增
│   ├── searchStore.ts            # 新增
│   └── monitorStore.ts           # 新增
│
├── injected/                  # 注入脚本
│   └── storageMonitor.ts         # 新增
│
└── background/                # 后台脚本
    └── messageHandler.ts         # 新增
```

---

## 3. 功能实施方案

### 3.1 P0 功能：搜索与过滤系统

#### 3.1.1 需求定义

**核心功能**：
- ✅ 键名搜索（支持正则表达式）
- ✅ 值内容搜索（支持 JSON 深度搜索）
- ✅ 类型过滤（字符串/数字/JSON/布尔/null）
- ✅ 大小范围过滤
- ✅ 高级组合过滤
- ✅ 搜索历史记录

**用户故事**：
> 作为开发者，我希望能快速搜索包含特定关键字的 storage 项，
> 这样我就能在大量数据中快速定位目标数据。

#### 3.1.2 技术实现

**类型定义**：

```typescript
// src/types/search.ts
export interface SearchOptions {
  keyword: string
  searchIn: 'key' | 'value' | 'both'
  caseSensitive: boolean
  useRegex: boolean
  deepSearch: boolean // JSON 深度搜索
}

export interface FilterOptions {
  types: Array<'string' | 'number' | 'boolean' | 'json' | 'null'>
  sizeRange: {
    min: number
    max: number
  }
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface SearchHistory {
  id: string
  keyword: string
  timestamp: number
  resultCount: number
}
```

**核心逻辑**：

```typescript
// src/composables/useSearchFilter.ts
import { ref, computed } from 'vue'
import type { StorageItem } from '@/types/storage'
import type { SearchOptions, FilterOptions } from '@/types/search'

export function useSearchFilter() {
  const searchOptions = ref<SearchOptions>({
    keyword: '',
    searchIn: 'both',
    caseSensitive: false,
    useRegex: false,
    deepSearch: true
  })

  const filterOptions = ref<FilterOptions>({
    types: [],
    sizeRange: { min: 0, max: Infinity }
  })

  const searchHistory = ref<SearchHistory[]>([])

  /**
   * 检测数据类型
   */
  const detectType = (value: string): string => {
    if (value === 'null') return 'null'
    if (value === 'true' || value === 'false') return 'boolean'
    if (/^\d+$/.test(value)) return 'number'

    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return 'array'
      if (typeof parsed === 'object') return 'json'
    } catch {
      // 不是 JSON
    }

    return 'string'
  }

  /**
   * 深度搜索 JSON 对象
   */
  const deepSearchJSON = (obj: any, regex: RegExp): boolean => {
    if (obj === null || obj === undefined) return false

    if (typeof obj === 'string') {
      return regex.test(obj)
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return regex.test(String(obj))
    }

    if (Array.isArray(obj)) {
      return obj.some(item => deepSearchJSON(item, regex))
    }

    if (typeof obj === 'object') {
      return Object.entries(obj).some(([key, value]) =>
        regex.test(key) || deepSearchJSON(value, regex)
      )
    }

    return false
  }

  /**
   * 搜索匹配
   */
  const matchesSearch = (item: StorageItem): boolean => {
    if (!searchOptions.value.keyword) return true

    let pattern: RegExp
    try {
      if (searchOptions.value.useRegex) {
        pattern = new RegExp(
          searchOptions.value.keyword,
          searchOptions.value.caseSensitive ? '' : 'i'
        )
      } else {
        const escaped = searchOptions.value.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        pattern = new RegExp(
          escaped,
          searchOptions.value.caseSensitive ? '' : 'i'
        )
      }
    } catch {
      // 正则表达式错误，使用普通匹配
      const keyword = searchOptions.value.keyword
      const match = searchOptions.value.caseSensitive
        ? (str: string) => str.includes(keyword)
        : (str: string) => str.toLowerCase().includes(keyword.toLowerCase())

      return (
        (searchOptions.value.searchIn === 'both' || searchOptions.value.searchIn === 'key') &&
        match(item.key)
      ) || (
        (searchOptions.value.searchIn === 'both' || searchOptions.value.searchIn === 'value') &&
        match(item.value)
      )
    }

    // 键名匹配
    if (
      searchOptions.value.searchIn === 'both' ||
      searchOptions.value.searchIn === 'key'
    ) {
      if (pattern.test(item.key)) return true
    }

    // 值匹配
    if (
      searchOptions.value.searchIn === 'both' ||
      searchOptions.value.searchIn === 'value'
    ) {
      // 普通字符串匹配
      if (pattern.test(item.value)) return true

      // JSON 深度搜索
      if (searchOptions.value.deepSearch) {
        try {
          const parsed = JSON.parse(item.value)
          if (deepSearchJSON(parsed, pattern)) return true
        } catch {
          // 不是 JSON，已经在普通字符串匹配中处理
        }
      }
    }

    return false
  }

  /**
   * 类型过滤
   */
  const matchesFilter = (item: StorageItem): boolean => {
    // 类型过滤
    if (filterOptions.value.types.length > 0) {
      const type = detectType(item.value)
      if (!filterOptions.value.types.includes(type as any)) {
        return false
      }
    }

    // 大小过滤
    const size = new Blob([item.value]).size
    if (
      size < filterOptions.value.sizeRange.min ||
      size > filterOptions.value.sizeRange.max
    ) {
      return false
    }

    return true
  }

  /**
   * 执行搜索和过滤
   */
  const filterItems = (items: StorageItem[]): StorageItem[] => {
    const filtered = items.filter(item =>
      matchesSearch(item) && matchesFilter(item)
    )

    // 保存搜索历史
    if (searchOptions.value.keyword) {
      const historyItem: SearchHistory = {
        id: Date.now().toString(),
        keyword: searchOptions.value.keyword,
        timestamp: Date.now(),
        resultCount: filtered.length
      }

      // 避免重复
      const existing = searchHistory.value.findIndex(
        h => h.keyword === searchOptions.value.keyword
      )
      if (existing !== -1) {
        searchHistory.value.splice(existing, 1)
      }

      searchHistory.value.unshift(historyItem)

      // 最多保留 20 条历史
      if (searchHistory.value.length > 20) {
        searchHistory.value = searchHistory.value.slice(0, 20)
      }

      // 持久化到本地存储
      localStorage.setItem(
        'storage-pro-search-history',
        JSON.stringify(searchHistory.value)
      )
    }

    return filtered
  }

  /**
   * 加载搜索历史
   */
  const loadSearchHistory = () => {
    try {
      const stored = localStorage.getItem('storage-pro-search-history')
      if (stored) {
        searchHistory.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  }

  /**
   * 清空搜索历史
   */
  const clearSearchHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('storage-pro-search-history')
  }

  /**
   * 重放历史搜索
   */
  const replaySearch = (historyItem: SearchHistory) => {
    searchOptions.value.keyword = historyItem.keyword
  }

  // 初始化时加载历史
  loadSearchHistory()

  return {
    searchOptions,
    filterOptions,
    searchHistory,
    filterItems,
    clearSearchHistory,
    replaySearch
  }
}
```

**UI 组件**：

```vue
<!-- src/components/search/SearchBar.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSearchFilter } from '@/composables/useSearchFilter'

const {
  searchOptions,
  filterOptions,
  searchHistory,
  clearSearchHistory,
  replaySearch
} = useSearchFilter()

const showAdvanced = ref(false)
const showHistory = ref(false)

const typeOptions = [
  { label: '字符串', value: 'string', color: 'text-green-600' },
  { label: '数字', value: 'number', color: 'text-blue-600' },
  { label: 'JSON', value: 'json', color: 'text-purple-600' },
  { label: '布尔', value: 'boolean', color: 'text-orange-600' },
  { label: 'Null', value: 'null', color: 'text-gray-400' }
]

const toggleTypeFilter = (type: string) => {
  const index = filterOptions.types.indexOf(type as any)
  if (index > -1) {
    filterOptions.types.splice(index, 1)
  } else {
    filterOptions.types.push(type as any)
  }
}
</script>

<template>
  <div class="search-bar">
    <!-- 基础搜索框 -->
    <div class="search-input-wrapper">
      <input
        v-model="searchOptions.keyword"
        type="text"
        placeholder="搜索键名或值内容..."
        class="search-input"
        @focus="showHistory = true"
        @blur="() => setTimeout(() => showHistory = false, 200)"
      />

      <!-- 搜索图标 -->
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
      </svg>

      <!-- 清除按钮 -->
      <button
        v-if="searchOptions.keyword"
        @click="searchOptions.keyword = ''"
        class="clear-button"
      >
        ✕
      </button>

      <!-- 搜索历史下拉 -->
      <div v-if="showHistory && searchHistory.length > 0" class="search-history-dropdown">
        <div class="history-header">
          <span>搜索历史</span>
          <button @click="clearSearchHistory" class="text-xs text-gray-500 hover:text-gray-700">
            清空
          </button>
        </div>
        <div
          v-for="item in searchHistory"
          :key="item.id"
          @click="replaySearch(item)"
          class="history-item"
        >
          <span class="history-keyword">{{ item.keyword }}</span>
          <span class="history-meta">{{ item.resultCount }} 个结果</span>
        </div>
      </div>
    </div>

    <!-- 快速选项 -->
    <div class="search-options">
      <label class="search-option">
        <input type="checkbox" v-model="searchOptions.caseSensitive" />
        <span>区分大小写</span>
      </label>

      <label class="search-option">
        <input type="checkbox" v-model="searchOptions.useRegex" />
        <span>正则表达式</span>
      </label>

      <label class="search-option">
        <input type="checkbox" v-model="searchOptions.deepSearch" />
        <span>深度搜索</span>
      </label>

      <select v-model="searchOptions.searchIn" class="search-in-select">
        <option value="both">键名和值</option>
        <option value="key">仅键名</option>
        <option value="value">仅值</option>
      </select>

      <button
        @click="showAdvanced = !showAdvanced"
        class="advanced-toggle"
      >
        {{ showAdvanced ? '收起' : '高级' }} ▼
      </button>
    </div>

    <!-- 高级过滤面板 -->
    <div v-if="showAdvanced" class="advanced-filters">
      <!-- 类型过滤 -->
      <div class="filter-group">
        <label class="filter-label">数据类型：</label>
        <div class="type-filters">
          <button
            v-for="type in typeOptions"
            :key="type.value"
            @click="toggleTypeFilter(type.value)"
            :class="[
              'type-filter-btn',
              filterOptions.types.includes(type.value) ? 'active' : '',
              type.color
            ]"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- 大小范围 -->
      <div class="filter-group">
        <label class="filter-label">大小范围（字节）：</label>
        <div class="size-range">
          <input
            v-model.number="filterOptions.sizeRange.min"
            type="number"
            placeholder="最小"
            class="size-input"
          />
          <span>-</span>
          <input
            v-model.number="filterOptions.sizeRange.max"
            type="number"
            placeholder="最大"
            class="size-input"
          />
        </div>
      </div>

      <!-- 重置按钮 -->
      <button @click="resetFilters" class="reset-filters-btn">
        重置过滤器
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  @apply bg-white border-b border-gray-200 p-4 space-y-3;
}

.search-input-wrapper {
  @apply relative;
}

.search-input {
  @apply w-full px-10 py-2 border border-gray-300 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2;
  @apply w-5 h-5 text-gray-400;
}

.clear-button {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply text-gray-400 hover:text-gray-600;
}

.search-history-dropdown {
  @apply absolute top-full left-0 right-0 mt-1;
  @apply bg-white border border-gray-200 rounded-lg shadow-lg;
  @apply max-h-64 overflow-auto z-10;
}

.history-header {
  @apply flex items-center justify-between;
  @apply px-3 py-2 border-b border-gray-200;
  @apply text-sm font-medium text-gray-700;
}

.history-item {
  @apply flex items-center justify-between;
  @apply px-3 py-2 hover:bg-gray-50 cursor-pointer;
}

.history-keyword {
  @apply text-sm text-gray-700;
}

.history-meta {
  @apply text-xs text-gray-500;
}

.search-options {
  @apply flex items-center gap-4 flex-wrap;
}

.search-option {
  @apply flex items-center gap-1 text-sm text-gray-700 cursor-pointer;
}

.search-in-select {
  @apply px-3 py-1 border border-gray-300 rounded text-sm;
}

.advanced-toggle {
  @apply px-3 py-1 text-sm text-blue-600 hover:text-blue-700;
}

.advanced-filters {
  @apply bg-gray-50 p-4 rounded-lg space-y-3;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply text-sm font-medium text-gray-700;
}

.type-filters {
  @apply flex gap-2 flex-wrap;
}

.type-filter-btn {
  @apply px-3 py-1 text-sm border border-gray-300 rounded;
  @apply transition-colors;
}

.type-filter-btn.active {
  @apply bg-blue-100 border-blue-500;
}

.size-range {
  @apply flex items-center gap-2;
}

.size-input {
  @apply flex-1 px-3 py-1 border border-gray-300 rounded text-sm;
}

.reset-filters-btn {
  @apply px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded;
  @apply hover:bg-gray-100 transition-colors;
}
</style>
```

#### 3.1.3 集成到 App.vue

```typescript
// 在 App.vue 中使用
import { useSearchFilter } from '@/composables/useSearchFilter'
import SearchBar from '@/components/search/SearchBar.vue'

const { filterItems } = useSearchFilter()

// 过滤后的数据
const filteredStorageItems = computed(() => {
  return filterItems(storageItems.value)
})
```

#### 3.1.4 测试用例

```typescript
// tests/search.spec.ts
import { describe, it, expect } from 'vitest'
import { useSearchFilter } from '@/composables/useSearchFilter'

describe('useSearchFilter', () => {
  it('应该能搜索键名', () => {
    const { searchOptions, filterItems } = useSearchFilter()

    searchOptions.value.keyword = 'user'
    searchOptions.value.searchIn = 'key'

    const items = [
      { key: 'user_name', value: 'John' },
      { key: 'settings', value: 'data' }
    ]

    const result = filterItems(items)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('user_name')
  })

  it('应该支持正则表达式搜索', () => {
    const { searchOptions, filterItems } = useSearchFilter()

    searchOptions.value.keyword = '^user_\\d+$'
    searchOptions.value.useRegex = true

    const items = [
      { key: 'user_123', value: 'data1' },
      { key: 'user_name', value: 'data2' },
      { key: 'user_456', value: 'data3' }
    ]

    const result = filterItems(items)
    expect(result).toHaveLength(2)
  })

  it('应该支持 JSON 深度搜索', () => {
    const { searchOptions, filterItems } = useSearchFilter()

    searchOptions.value.keyword = 'john'
    searchOptions.value.deepSearch = true

    const items = [
      {
        key: 'user',
        value: JSON.stringify({
          name: 'John Doe',
          profile: { email: 'john@example.com' }
        })
      }
    ]

    const result = filterItems(items)
    expect(result).toHaveLength(1)
  })
})
```

---

### 3.2 P0 功能：导入/导出系统

#### 3.2.1 需求定义

**核心功能**：
- ✅ 导出为 JSON 格式
- ✅ 导出为 CSV 格式
- ✅ 导入 JSON 文件（合并/覆盖模式）
- ✅ 复制为 JSON 到剪贴板
- ✅ 选择性导出（部分数据）
- ✅ 导出元数据（时间戳、统计信息）

**数据格式**：

```typescript
// 导出 JSON 格式
interface ExportData {
  version: string // 格式版本
  timestamp: number
  storageType: 'localStorage' | 'sessionStorage'
  metadata: {
    totalItems: number
    totalSize: number
    exportedBy: string
  }
  items: StorageItem[]
}

// 导出 CSV 格式
// Key, Value, Type, Size (bytes), Created At
```

#### 3.2.2 技术实现

```typescript
// src/composables/useExportImport.ts
import { ref } from 'vue'
import type { StorageItem } from '@/types/storage'

export interface ExportOptions {
  format: 'json' | 'csv'
  includeMetadata: boolean
  selectedKeys?: string[] // 选择性导出
  prettyPrint: boolean
}

export interface ImportOptions {
  mode: 'merge' | 'overwrite'
  skipExisting: boolean
  validateData: boolean
}

export function useExportImport() {
  const isExporting = ref(false)
  const isImporting = ref(false)

  /**
   * 导出为 JSON
   */
  const exportToJSON = (
    items: StorageItem[],
    storageType: string,
    options: ExportOptions
  ): void => {
    isExporting.value = true

    try {
      // 过滤选中的项
      let exportItems = items
      if (options.selectedKeys && options.selectedKeys.length > 0) {
        exportItems = items.filter(item =>
          options.selectedKeys!.includes(item.key)
        )
      }

      // 构建导出数据
      const exportData: any = {
        version: '1.0.0',
        timestamp: Date.now(),
        storageType,
        items: exportItems
      }

      // 添加元数据
      if (options.includeMetadata) {
        exportData.metadata = {
          totalItems: exportItems.length,
          totalSize: exportItems.reduce((sum, item) =>
            sum + new Blob([item.value]).size, 0
          ),
          exportedBy: 'Storage Pro',
          exportDate: new Date().toISOString()
        }
      }

      // 生成 JSON 字符串
      const jsonString = options.prettyPrint
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData)

      // 创建下载
      downloadFile(
        jsonString,
        `storage-${storageType}-${Date.now()}.json`,
        'application/json'
      )
    } catch (error) {
      console.error('导出失败:', error)
      throw new Error('导出失败: ' + (error as Error).message)
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 导出为 CSV
   */
  const exportToCSV = (
    items: StorageItem[],
    storageType: string,
    options: ExportOptions
  ): void => {
    isExporting.value = true

    try {
      // 过滤选中的项
      let exportItems = items
      if (options.selectedKeys && options.selectedKeys.length > 0) {
        exportItems = items.filter(item =>
          options.selectedKeys!.includes(item.key)
        )
      }

      // CSV 表头
      const headers = ['Key', 'Value', 'Type', 'Size (bytes)', 'Created At']

      // CSV 行
      const rows = exportItems.map(item => {
        const type = detectType(item.value)
        const size = new Blob([item.value]).size
        const createdAt = new Date().toISOString()

        return [
          escapeCSV(item.key),
          escapeCSV(item.value),
          escapeCSV(type),
          size.toString(),
          createdAt
        ].join(',')
      })

      // 组合 CSV
      const csvContent = [headers.join(','), ...rows].join('\n')

      // 添加 BOM 以支持 Excel 中文
      const BOM = '\uFEFF'
      downloadFile(
        BOM + csvContent,
        `storage-${storageType}-${Date.now()}.csv`,
        'text/csv;charset=utf-8'
      )
    } catch (error) {
      console.error('导出失败:', error)
      throw new Error('导出失败: ' + (error as Error).message)
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = async (items: StorageItem[]): Promise<void> => {
    try {
      const data = {
        version: '1.0.0',
        timestamp: Date.now(),
        items
      }

      const jsonString = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(jsonString)

      return Promise.resolve()
    } catch (error) {
      throw new Error('复制失败: ' + (error as Error).message)
    }
  }

  /**
   * 从 JSON 导入
   */
  const importFromJSON = async (
    file: File,
    options: ImportOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<ImportResult> => {
    isImporting.value = true

    try {
      // 读取文件
      const text = await file.text()
      const data = JSON.parse(text)

      // 验证数据格式
      if (options.validateData) {
        validateImportData(data)
      }

      const items: StorageItem[] = data.items || []
      const imported: string[] = []
      const skipped: string[] = []
      const errors: string[] = []

      // 导入数据
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        try {
          // 检查是否跳过已存在的项
          if (options.skipExisting) {
            const exists = await checkIfKeyExists(item.key)
            if (exists) {
              skipped.push(item.key)
              continue
            }
          }

          // 添加到 storage
          await addStorageItem(item.key, item.value)
          imported.push(item.key)

          // 报告进度
          if (onProgress) {
            onProgress(i + 1, items.length)
          }
        } catch (error) {
          errors.push(`${item.key}: ${(error as Error).message}`)
        }
      }

      return {
        success: true,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          imported,
          skipped,
          errors
        }
      }
    } catch (error) {
      console.error('导入失败:', error)
      throw new Error('导入失败: ' + (error as Error).message)
    } finally {
      isImporting.value = false
    }
  }

  /**
   * 下载文件
   */
  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ): void => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * CSV 转义
   */
  const escapeCSV = (value: string): string => {
    // 包含逗号、引号或换行符时需要转义
    if (/[,"\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * 检测数据类型
   */
  const detectType = (value: string): string => {
    if (value === 'null') return 'null'
    if (value === 'true' || value === 'false') return 'boolean'
    if (/^\d+$/.test(value)) return 'number'

    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return 'array'
      if (typeof parsed === 'object') return 'object'
    } catch {
      // 不是 JSON
    }

    return 'string'
  }

  /**
   * 验证导入数据
   */
  const validateImportData = (data: any): void => {
    if (!data || typeof data !== 'object') {
      throw new Error('无效的数据格式')
    }

    if (!Array.isArray(data.items)) {
      throw new Error('缺少 items 数组')
    }

    for (const item of data.items) {
      if (!item.key || typeof item.key !== 'string') {
        throw new Error('项目缺少有效的 key')
      }
      if (item.value === undefined) {
        throw new Error(`项目 "${item.key}" 缺少 value`)
      }
    }
  }

  /**
   * 检查键是否存在（需要注入）
   */
  const checkIfKeyExists = async (key: string): Promise<boolean> => {
    return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `localStorage.getItem(${JSON.stringify(key)}) !== null`,
        (result) => resolve(!!result)
      )
    })
  }

  /**
   * 添加存储项（需要注入）
   */
  const addStorageItem = async (key: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result, isException) => {
          if (isException || (result && (result as any).error)) {
            reject(new Error(isException || (result as any).error))
          } else {
            resolve()
          }
        }
      )
    })
  }

  return {
    isExporting,
    isImporting,
    exportToJSON,
    exportToCSV,
    copyToClipboard,
    importFromJSON
  }
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: number
  details: {
    imported: string[]
    skipped: string[]
    errors: string[]
  }
}
```

**UI 组件**：

```vue
<!-- src/components/storage/ExportImportDialog.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useExportImport } from '@/composables/useExportImport'
import type { StorageItem } from '@/types/storage'

interface Props {
  items: StorageItem[]
  storageType: string
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'imported'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  isExporting,
  isImporting,
  exportToJSON,
  exportToCSV,
  copyToClipboard,
  importFromJSON
} = useExportImport()

const activeTab = ref<'export' | 'import'>('export')

// 导出选项
const exportFormat = ref<'json' | 'csv'>('json')
const includeMetadata = ref(true)
const prettyPrint = ref(true)
const selectedKeys = ref<string[]>([])
const selectAll = ref(false)

// 导入选项
const importMode = ref<'merge' | 'overwrite'>('merge')
const skipExisting = ref(true)
const importFile = ref<File | null>(null)
const importProgress = ref({ current: 0, total: 0 })
const importResult = ref<any>(null)

// 选择所有
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedKeys.value = props.items.map(item => item.key)
  } else {
    selectedKeys.value = []
  }
}

// 执行导出
const handleExport = async () => {
  try {
    const options = {
      format: exportFormat.value,
      includeMetadata: includeMetadata.value,
      selectedKeys: selectedKeys.value.length > 0 ? selectedKeys.value : undefined,
      prettyPrint: prettyPrint.value
    }

    if (exportFormat.value === 'json') {
      exportToJSON(props.items, props.storageType, options)
    } else {
      exportToCSV(props.items, props.storageType, options)
    }

    alert('导出成功!')
  } catch (error) {
    alert((error as Error).message)
  }
}

// 复制到剪贴板
const handleCopy = async () => {
  try {
    const itemsToCopy = selectedKeys.value.length > 0
      ? props.items.filter(item => selectedKeys.value.includes(item.key))
      : props.items

    await copyToClipboard(itemsToCopy)
    alert('已复制到剪贴板!')
  } catch (error) {
    alert((error as Error).message)
  }
}

// 选择文件
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0]
  }
}

// 执行导入
const handleImport = async () => {
  if (!importFile.value) {
    alert('请选择文件')
    return
  }

  try {
    const options = {
      mode: importMode.value,
      skipExisting: skipExisting.value,
      validateData: true
    }

    importResult.value = await importFromJSON(
      importFile.value,
      options,
      (current, total) => {
        importProgress.value = { current, total }
      }
    )

    emit('imported')
  } catch (error) {
    alert((error as Error).message)
  }
}

// 关闭对话框
const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="dialog-overlay" @click.self="close">
    <div class="dialog">
      <!-- 标题栏 -->
      <div class="dialog-header">
        <h3>数据导入/导出</h3>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <!-- 标签页 -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'export' }]"
          @click="activeTab = 'export'"
        >
          导出
        </button>
        <button
          :class="['tab', { active: activeTab === 'import' }]"
          @click="activeTab = 'import'"
        >
          导入
        </button>
      </div>

      <!-- 导出面板 -->
      <div v-if="activeTab === 'export'" class="tab-content">
        <!-- 格式选择 -->
        <div class="form-group">
          <label>导出格式：</label>
          <div class="radio-group">
            <label>
              <input type="radio" v-model="exportFormat" value="json" />
              JSON
            </label>
            <label>
              <input type="radio" v-model="exportFormat" value="csv" />
              CSV
            </label>
          </div>
        </div>

        <!-- JSON 选项 -->
        <div v-if="exportFormat === 'json'" class="form-group">
          <label>
            <input type="checkbox" v-model="includeMetadata" />
            包含元数据
          </label>
          <label>
            <input type="checkbox" v-model="prettyPrint" />
            格式化输出
          </label>
        </div>

        <!-- 选择性导出 -->
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            全选 ({{ selectedKeys.length }} / {{ items.length }})
          </label>

          <div v-if="selectedKeys.length > 0" class="selected-items">
            <span
              v-for="key in selectedKeys.slice(0, 5)"
              :key="key"
              class="selected-tag"
            >
              {{ key }}
            </span>
            <span v-if="selectedKeys.length > 5" class="more-tag">
              +{{ selectedKeys.length - 5 }} 更多
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button
            @click="handleExport"
            :disabled="isExporting"
            class="btn btn-primary"
          >
            {{ isExporting ? '导出中...' : '下载文件' }}
          </button>
          <button
            @click="handleCopy"
            class="btn btn-secondary"
          >
            复制到剪贴板
          </button>
        </div>
      </div>

      <!-- 导入面板 -->
      <div v-if="activeTab === 'import'" class="tab-content">
        <!-- 文件选择 -->
        <div class="form-group">
          <label>选择文件：</label>
          <input
            type="file"
            accept=".json"
            @change="handleFileSelect"
            class="file-input"
          />
          <div v-if="importFile" class="file-info">
            已选择: {{ importFile.name }} ({{ (importFile.size / 1024).toFixed(2) }} KB)
          </div>
        </div>

        <!-- 导入模式 -->
        <div class="form-group">
          <label>导入模式：</label>
          <div class="radio-group">
            <label>
              <input type="radio" v-model="importMode" value="merge" />
              合并（保留现有数据）
            </label>
            <label>
              <input type="radio" v-model="importMode" value="overwrite" />
              覆盖（清空后导入）
            </label>
          </div>
        </div>

        <!-- 跳过已存在 -->
        <div v-if="importMode === 'merge'" class="form-group">
          <label>
            <input type="checkbox" v-model="skipExisting" />
            跳过已存在的键
          </label>
        </div>

        <!-- 进度条 -->
        <div v-if="isImporting" class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(importProgress.current / importProgress.total) * 100}%` }"
          ></div>
          <span class="progress-text">
            {{ importProgress.current }} / {{ importProgress.total }}
          </span>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="import-result">
          <div class="result-summary">
            <div class="result-item success">
              ✓ 成功导入: {{ importResult.imported }}
            </div>
            <div v-if="importResult.skipped > 0" class="result-item skipped">
              ⊘ 跳过: {{ importResult.skipped }}
            </div>
            <div v-if="importResult.errors > 0" class="result-item error">
              ✗ 失败: {{ importResult.errors }}
            </div>
          </div>

          <!-- 详细信息 -->
          <details v-if="importResult.details.errors.length > 0">
            <summary>查看错误详情</summary>
            <ul class="error-list">
              <li v-for="(error, index) in importResult.details.errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </details>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button
            @click="handleImport"
            :disabled="!importFile || isImporting"
            class="btn btn-primary"
          >
            {{ isImporting ? '导入中...' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.dialog {
  @apply bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto;
}

.dialog-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.close-btn {
  @apply text-gray-400 hover:text-gray-600 text-2xl;
}

.tabs {
  @apply flex border-b border-gray-200;
}

.tab {
  @apply flex-1 px-4 py-3 text-center transition-colors;
  @apply hover:bg-gray-50;
}

.tab.active {
  @apply border-b-2 border-blue-500 text-blue-600 font-medium;
}

.tab-content {
  @apply p-6 space-y-4;
}

.form-group {
  @apply space-y-2;
}

.radio-group {
  @apply space-y-2;
}

.file-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded;
}

.file-info {
  @apply text-sm text-gray-600 mt-1;
}

.selected-items {
  @apply flex flex-wrap gap-2 mt-2;
}

.selected-tag {
  @apply px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded;
}

.more-tag {
  @apply px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded;
}

.progress-bar {
  @apply relative h-8 bg-gray-200 rounded overflow-hidden;
}

.progress-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.progress-text {
  @apply absolute inset-0 flex items-center justify-center text-sm font-medium;
}

.import-result {
  @apply p-4 bg-gray-50 rounded space-y-3;
}

.result-summary {
  @apply grid grid-cols-3 gap-2;
}

.result-item {
  @apply px-3 py-2 rounded text-sm font-medium text-center;
}

.result-item.success {
  @apply bg-green-100 text-green-700;
}

.result-item.skipped {
  @apply bg-yellow-100 text-yellow-700;
}

.result-item.error {
  @apply bg-red-100 text-red-700;
}

.error-list {
  @apply list-disc list-inside text-sm text-red-600 space-y-1 mt-2;
}

.actions {
  @apply flex gap-3 justify-end;
}

.btn {
  @apply px-6 py-2 rounded transition-colors;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}
</style>
```

---

## 4. 数据存储设计

### 4.1 扩展自身存储

**存储位置**: Chrome Extension Local Storage

```typescript
// 存储结构
interface ExtensionStorage {
  // 搜索历史
  'storage-pro-search-history': SearchHistory[]

  // 快照数据
  'storage-pro-snapshots': Snapshot[]

  // 用户偏好设置
  'storage-pro-preferences': {
    theme: 'light' | 'dark'
    defaultStorageType: 'localStorage' | 'sessionStorage'
    autoSnapshot: boolean
    autoSnapshotInterval: number
    editorFontSize: number
    editorTheme: string
  }

  // Mock 数据模板
  'storage-pro-mock-templates': MockTemplate[]

  // 监控历史记录
  'storage-pro-monitor-history': HistoryRecord[]
}
```

### 4.2 数据迁移策略

```typescript
// src/utils/migration.ts
export class DataMigration {
  static async migrateToV2(): Promise<void> {
    // 从 v1 迁移到 v2
    const v1Data = localStorage.getItem('storage-pro-data')
    if (v1Data) {
      const parsed = JSON.parse(v1Data)

      // 拆分数据
      localStorage.setItem('storage-pro-snapshots', JSON.stringify(parsed.snapshots || []))
      localStorage.setItem('storage-pro-preferences', JSON.stringify(parsed.preferences || {}))

      // 删除旧数据
      localStorage.removeItem('storage-pro-data')
    }
  }
}
```

---

## 5. API 接口设计

### 5.1 Storage Provider 接口

```typescript
// src/providers/IStorageProvider.ts
export interface IStorageProvider {
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

  // 监听变化（可选）
  onChange?: (callback: (change: StorageChange) => void) => () => void
}

export type StorageType =
  | 'localStorage'
  | 'sessionStorage'
  | 'cookie'
  | 'indexedDB'
  | 'cache'

export interface StorageChange {
  action: 'set' | 'remove' | 'clear'
  key?: string
  oldValue?: string
  newValue?: string
  timestamp: number
}
```

### 5.2 Provider 实现示例

```typescript
// src/providers/CookieProvider.ts
import type { IStorageProvider, StorageItem, StorageChange } from './IStorageProvider'

export class CookieProvider implements IStorageProvider {
  type = 'cookie' as const

  async loadItems(): Promise<StorageItem[]> {
    return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `document.cookie.split('; ').filter(c => c).map(c => {
          const [key, ...valueParts] = c.split('=')
          return { key: decodeURIComponent(key), value: decodeURIComponent(valueParts.join('=')) }
        })`,
        (result) => resolve(result || [])
      )
    })
  }

  async getItem(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          const match = document.cookie.match(new RegExp('(^| )' + ${JSON.stringify(key)} + '=([^;]+)'))
          return match ? decodeURIComponent(match[2]) : null
        })()`,
        (result) => resolve(result)
      )
    })
  }

  async setItem(key: string, value: string, options?: CookieOptions): Promise<void> {
    const expires = options?.maxAge
      ? new Date(Date.now() + options.maxAge * 1000).toUTCString()
      : ''

    const cookieString = [
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      expires && `expires=${expires}`,
      options?.path && `path=${options.path}`,
      options?.domain && `domain=${options.domain}`,
      options?.secure && 'secure',
      options?.sameSite && `sameSite=${options.sameSite}`
    ].filter(Boolean).join('; ')

    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `document.cookie = ${JSON.stringify(cookieString)}`,
        (result, isException) => {
          if (isException) reject(new Error('设置 Cookie 失败'))
          else resolve()
        }
      )
    })
  }

  async removeItem(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `document.cookie = ${JSON.stringify(key)} + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'`,
        () => resolve()
      )
    })
  }

  async clear(): Promise<void> {
    const items = await this.loadItems()
    for (const item of items) {
      await this.removeItem(item.key)
    }
  }

  async keys(): Promise<string[]> {
    const items = await this.loadItems()
    return items.map(item => item.key)
  }

  async size(): Promise<number> {
    return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `new Blob([document.cookie]).size`,
        (result) => resolve(result || 0)
      )
    })
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.getItem(key)
    return value !== null
  }

  async setItems(items: StorageItem[]): Promise<void> {
    for (const item of items) {
      await this.setItem(item.key, item.value)
    }
  }

  async removeItems(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key)
    }
  }
}

export interface CookieOptions {
  maxAge?: number // 秒
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}
```

---

## 6. UI/UX 设计规范

### 6.1 布局结构

```
┌────────────────────────────────────────────────────────────┐
│ [Storage Type Tabs] [🔍 Search] [工具栏]                    │
├──────────────┬─────────────────────────────────────────────┤
│ 侧边栏        │ 主内容区                                     │
│ (25%)        │ (75%)                                        │
│              │                                              │
│ [Storage     │ ┌─────────────────────────────────────────┐ │
│  List]       │ │ 编辑器 / 查看器                          │ │
│              │ │                                          │ │
│ [Filters]    │ │                                          │ │
│              │ │                                          │ │
│ [Stats]      │ │                                          │ │
│              │ └─────────────────────────────────────────┘ │
│              │                                              │
├──────────────┴─────────────────────────────────────────────┤
│ 底部面板 (可折叠)                                             │
│ [快照] [监控日志] [图表]                                      │
└────────────────────────────────────────────────────────────┘
```

### 6.2 颜色系统

```typescript
// Tailwind 配置
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4'
}
```

### 6.3 交互规范

**操作确认**：
- 删除操作：始终需要确认
- 清空操作：需要二次确认
- 覆盖导入：显示影响范围后确认

**加载状态**：
- 使用骨架屏（Skeleton）
- 大数据加载显示进度条
- 异步操作显示 Loading 指示器

**错误处理**：
- Toast 提示轻量级错误
- Alert 对话框显示严重错误
- 行内错误提示表单验证错误

---

## 7. 测试计划

### 7.1 单元测试

```bash
# 测试覆盖率目标: 80%
npm run test:unit
```

**测试清单**：
- [ ] useSearchFilter 搜索逻辑
- [ ] useExportImport 导入导出
- [ ] Storage Providers CRUD 操作
- [ ] 数据验证工具函数
- [ ] 类型检测函数

### 7.2 集成测试

```typescript
// tests/integration/storage.spec.ts
describe('Storage Management', () => {
  it('应该能搜索、编辑、导出数据', async () => {
    // 1. 加载数据
    await loadStorageItems()

    // 2. 搜索
    searchOptions.value.keyword = 'user'
    const filtered = filterItems(storageItems.value)
    expect(filtered.length).toBeGreaterThan(0)

    // 3. 编辑
    await updateItem(filtered[0].key, 'new value')

    // 4. 导出
    exportToJSON(storageItems.value, 'localStorage', {
      format: 'json',
      includeMetadata: true,
      prettyPrint: true
    })
  })
})
```

### 7.3 E2E 测试

```typescript
// tests/e2e/workflow.spec.ts
import { test, expect } from '@playwright/test'

test('完整工作流', async ({ page }) => {
  // 1. 打开 DevTools
  await page.goto('https://example.com')
  const devtools = await page.context().newCDPSession(page)

  // 2. 打开 Storage Pro 面板
  await devtools.send('DevTools.open')

  // 3. 添加数据
  await page.click('[data-testid="add-item"]')
  await page.fill('[data-testid="key-input"]', 'test_key')
  await page.fill('[data-testid="value-input"]', 'test_value')
  await page.click('[data-testid="save-button"]')

  // 4. 验证数据已添加
  const item = await page.locator('[data-key="test_key"]')
  await expect(item).toBeVisible()

  // 5. 搜索数据
  await page.fill('[data-testid="search-input"]', 'test')
  const results = await page.locator('[data-testid="storage-item"]')
  await expect(results).toHaveCount(1)

  // 6. 导出数据
  await page.click('[data-testid="export-button"]')
  const download = await page.waitForEvent('download')
  expect(download.suggestedFilename()).toContain('storage-localStorage')
})
```

---

## 8. 部署方案

### 8.1 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
```

### 8.2 发布流程

```bash
# 1. 版本更新
npm version patch  # 或 minor / major

# 2. 构建生产版本
npm run build

# 3. 打包 CRX
cd dist
zip -r ../storage-pro-v1.1.0.zip *

# 4. 上传到 Chrome Web Store
# 访问: https://chrome.google.com/webstore/devconsole
```

### 8.3 更新策略

**语义化版本**：
- `1.0.0` → `1.1.0`: 新增功能（搜索、导出）
- `1.1.0` → `1.1.1`: Bug 修复
- `1.1.0` → `2.0.0`: 重大更新（架构变更）

**更新通知**：
```typescript
// src/background/updateHandler.ts
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    const previousVersion = details.previousVersion
    const currentVersion = chrome.runtime.getManifest().version

    // 显示更新日志
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/assets/icon-128.png',
      title: 'Storage Pro 已更新',
      message: `从 v${previousVersion} 更新到 v${currentVersion}\n查看新功能 →`
    })
  }
})
```

---

## 9. 风险评估

### 9.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| Monaco Editor 体积过大 | 影响加载速度 | 中 | 按需加载、Tree Shaking |
| Chrome API 兼容性 | 功能不可用 | 低 | Polyfill、降级方案 |
| 大数据量性能问题 | 卡顿、崩溃 | 中 | 虚拟滚动、分页加载 |
| IndexedDB 复杂性 | 开发周期延长 | 高 | 使用成熟库（Dexie.js） |

### 9.2 用户体验风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 学习曲线陡峭 | 用户流失 | 提供教程、快速上手指南 |
| 功能过于复杂 | 降低易用性 | 渐进式展示、高级功能折叠 |
| 数据丢失 | 用户信任度下降 | 自动快照、操作历史 |

### 9.3 安全风险

| 风险 | 应对措施 |
|------|----------|
| XSS 注入 | 严格转义所有用户输入 |
| 敏感数据泄露 | 脱敏显示、导出时警告 |
| 恶意数据导入 | 导入前验证、沙箱执行 |

---

## 10. 开发排期

### 10.1 第一阶段（Week 1-2）

**目标**: P0 功能完成

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| 搜索与过滤系统 | 3 天 | - | ⏳ 待开始 |
| 导入/导出功能 | 3 天 | - | ⏳ 待开始 |
| 单元测试 | 2 天 | - | ⏳ 待开始 |
| 文档编写 | 2 天 | - | ⏳ 待开始 |

### 10.2 第二阶段（Week 3-4）

**目标**: P1 功能完成

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| 实时监控面板 | 4 天 | - | ⏳ 待开始 |
| Monaco 编辑器集成 | 3 天 | - | ⏳ 待开始 |
| 集成测试 | 2 天 | - | ⏳ 待开始 |
| UI 优化 | 1 天 | - | ⏳ 待开始 |

### 10.3 第三阶段（Week 5-6）

**目标**: P2 功能完成

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| 快照系统升级 | 3 天 | - | ⏳ 待开始 |
| Cookie Provider | 2 天 | - | ⏳ 待开始 |
| IndexedDB Provider | 4 天 | - | ⏳ 待开始 |
| E2E 测试 | 2 天 | - | ⏳ 待开始 |

### 10.4 第四阶段（Week 7-8）

**目标**: 打磨与发布

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| 数据模拟工具 | 3 天 | - | ⏳ 待开始 |
| 性能优化 | 2 天 | - | ⏳ 待开始 |
| 安全审计 | 2 天 | - | ⏳ 待开始 |
| 发布准备 | 1 天 | - | ⏳ 待开始 |

---

## 11. 附录

### 11.1 参考资料

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Faker.js](https://fakerjs.dev/)

### 11.2 代码规范

```bash
# ESLint + Prettier
npm run lint
npm run format
```

### 11.3 提交规范

```
feat: 新增搜索过滤功能
fix: 修复导出时的编码问题
docs: 更新实施文档
style: 优化搜索框样式
refactor: 重构 Storage Provider 架构
test: 添加导入导出单元测试
chore: 升级依赖版本
```

---

## 文档审核

| 角色 | 姓名 | 审核日期 | 签名 |
|------|------|----------|------|
| 技术负责人 | - | - | - |
| 产品经理 | - | - | - |
| 开发工程师 | - | - | - |

---

**文档结束**
