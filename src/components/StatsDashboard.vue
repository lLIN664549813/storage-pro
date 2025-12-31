<script setup lang="ts">
/**
 * 统计面板组件
 * 显示 storage 的实时统计信息
 */
import { computed } from 'vue'
import type { StorageStats } from '@/types/monitor'

interface Props {
  stats: StorageStats
}

const props = defineProps<Props>()

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 类型分布百分比
const typePercentages = computed(() => {
  const total = props.stats.totalItems
  if (total === 0) return {}

  return {
    string: Math.round((props.stats.typeDistribution.string / total) * 100),
    number: Math.round((props.stats.typeDistribution.number / total) * 100),
    boolean: Math.round((props.stats.typeDistribution.boolean / total) * 100),
    json: Math.round((props.stats.typeDistribution.json / total) * 100),
    null: Math.round((props.stats.typeDistribution.null / total) * 100)
  }
})

// 配额使用情况颜色
const quotaColor = computed(() => {
  const percentage = props.stats.quotaUsage.percentage
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-orange-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
})

// 配额警告级别
const quotaWarning = computed(() => {
  const percentage = props.stats.quotaUsage.percentage
  if (percentage >= 90) return { level: 'danger', text: '配额即将用尽！' }
  if (percentage >= 70) return { level: 'warning', text: '配额使用较高' }
  return null
})
</script>

<template>
  <div class="stats-dashboard">
    <!-- 总览卡片 -->
    <div class="stats-grid">
      <!-- 总项数 -->
      <div class="stat-card">
        <div class="stat-icon bg-blue-100 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">总项数</div>
          <div class="stat-value">{{ stats.totalItems }}</div>
        </div>
      </div>

      <!-- 总大小 -->
      <div class="stat-card">
        <div class="stat-icon bg-purple-100 text-purple-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">总大小</div>
          <div class="stat-value">{{ formatSize(stats.totalSize) }}</div>
        </div>
      </div>

      <!-- 最大项 -->
      <div class="stat-card">
        <div class="stat-icon bg-orange-100 text-orange-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">最大项</div>
          <div class="stat-value text-sm" :title="stats.largestItem?.key">
            {{ stats.largestItem ? formatSize(stats.largestItem.size) : '-' }}
          </div>
          <div v-if="stats.largestItem" class="stat-subtitle">
            {{ stats.largestItem.key.slice(0, 20) }}{{ stats.largestItem.key.length > 20 ? '...' : '' }}
          </div>
        </div>
      </div>

      <!-- 配额使用 -->
      <div class="stat-card">
        <div class="stat-icon bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">配额使用</div>
          <div class="stat-value">{{ stats.quotaUsage.percentage }}%</div>
          <div class="stat-subtitle">
            {{ formatSize(stats.quotaUsage.used) }} / {{ formatSize(stats.quotaUsage.total) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 配额进度条 -->
    <div class="quota-section">
      <div class="quota-header">
        <span class="text-sm font-medium text-gray-700">存储配额</span>
        <span v-if="quotaWarning" :class="['quota-warning', `text-${quotaWarning.level}`]">
          {{ quotaWarning.text }}
        </span>
      </div>
      <div class="quota-bar">
        <div
          :class="['quota-fill', quotaColor]"
          :style="{ width: `${stats.quotaUsage.percentage}%` }"
        ></div>
      </div>
    </div>

    <!-- 类型分布 -->
    <div class="type-distribution">
      <h4 class="section-title">数据类型分布</h4>
      <div class="type-list">
        <div class="type-item">
          <div class="type-info">
            <span class="type-dot bg-green-500"></span>
            <span class="type-label">字符串</span>
          </div>
          <div class="type-stats">
            <span class="type-count">{{ stats.typeDistribution.string }}</span>
            <span class="type-percentage">{{ typePercentages.string }}%</span>
          </div>
        </div>

        <div class="type-item">
          <div class="type-info">
            <span class="type-dot bg-blue-500"></span>
            <span class="type-label">数字</span>
          </div>
          <div class="type-stats">
            <span class="type-count">{{ stats.typeDistribution.number }}</span>
            <span class="type-percentage">{{ typePercentages.number }}%</span>
          </div>
        </div>

        <div class="type-item">
          <div class="type-info">
            <span class="type-dot bg-purple-500"></span>
            <span class="type-label">JSON</span>
          </div>
          <div class="type-stats">
            <span class="type-count">{{ stats.typeDistribution.json }}</span>
            <span class="type-percentage">{{ typePercentages.json }}%</span>
          </div>
        </div>

        <div class="type-item">
          <div class="type-info">
            <span class="type-dot bg-orange-500"></span>
            <span class="type-label">布尔</span>
          </div>
          <div class="type-stats">
            <span class="type-count">{{ stats.typeDistribution.boolean }}</span>
            <span class="type-percentage">{{ typePercentages.boolean }}%</span>
          </div>
        </div>

        <div class="type-item">
          <div class="type-info">
            <span class="type-dot bg-gray-400"></span>
            <span class="type-label">Null</span>
          </div>
          <div class="type-stats">
            <span class="type-count">{{ stats.typeDistribution.null }}</span>
            <span class="type-percentage">{{ typePercentages.null }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-dashboard {
  @apply space-y-4;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply bg-white rounded-lg p-4 flex items-start gap-3 border border-gray-200;
}

.stat-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0;
}

.stat-content {
  @apply flex-1 min-w-0;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 mt-1;
}

.stat-subtitle {
  @apply text-xs text-gray-500 mt-1 truncate;
}

.quota-section {
  @apply bg-white rounded-lg p-4 border border-gray-200;
}

.quota-header {
  @apply flex items-center justify-between mb-2;
}

.quota-warning {
  @apply text-sm font-medium;
}

.text-danger {
  @apply text-red-600;
}

.text-warning {
  @apply text-orange-600;
}

.quota-bar {
  @apply w-full h-4 bg-gray-200 rounded-full overflow-hidden;
}

.quota-fill {
  @apply h-full transition-all duration-300;
}

.type-distribution {
  @apply bg-white rounded-lg p-4 border border-gray-200;
}

.section-title {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.type-list {
  @apply space-y-2;
}

.type-item {
  @apply flex items-center justify-between py-2;
}

.type-info {
  @apply flex items-center gap-2;
}

.type-dot {
  @apply w-3 h-3 rounded-full;
}

.type-label {
  @apply text-sm text-gray-700;
}

.type-stats {
  @apply flex items-center gap-3;
}

.type-count {
  @apply text-sm font-medium text-gray-900;
}

.type-percentage {
  @apply text-xs text-gray-500;
}
</style>
