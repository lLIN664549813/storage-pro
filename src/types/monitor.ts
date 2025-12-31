/**
 * 监控系统类型定义
 */

/**
 * 存储变更记录
 */
export interface StorageChange {
  id: string
  action: 'set' | 'remove' | 'clear'
  key?: string
  oldValue?: string
  newValue?: string
  timestamp: number
  storageType: 'localStorage' | 'sessionStorage'
}

/**
 * 监控状态
 */
export interface MonitorState {
  isMonitoring: boolean
  startTime: number | null
  changeCount: number
  lastChangeTime: number | null
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  totalItems: number
  totalSize: number
  typeDistribution: {
    string: number
    number: number
    boolean: number
    json: number
    null: number
  }
  largestItem: {
    key: string
    size: number
  } | null
  quotaUsage: {
    used: number
    total: number
    percentage: number
  }
}

/**
 * 变更日志过滤选项
 */
export interface ChangeLogFilter {
  actions: Array<'set' | 'remove' | 'clear'>
  keyword: string
  dateRange?: {
    from: Date
    to: Date
  }
}
