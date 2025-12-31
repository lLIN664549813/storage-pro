/**
 * 实时监控系统 Composable
 * 用于监控 storage 的变化并记录日志
 */

import { ref, computed, watch } from 'vue'
import type { StorageChange, MonitorState, StorageStats } from '@/types/monitor'
import type { StorageItem } from '@/types/storage'

// 最大日志记录数
const MAX_CHANGE_LOG_SIZE = 1000

// 高亮持续时间（毫秒）
const HIGHLIGHT_DURATION = 3000

export function useMonitor() {
  // 监控状态
  const monitorState = ref<MonitorState>({
    isMonitoring: false,
    startTime: null,
    changeCount: 0,
    lastChangeTime: null
  })

  // 变更日志
  const changeLog = ref<StorageChange[]>([])

  // 最近变更的键（用于高亮显示）
  const recentChangedKeys = ref<Set<string>>(new Set())

  /**
   * 启动监控
   */
  const startMonitoring = () => {
    if (monitorState.value.isMonitoring) {
      console.warn('监控已在运行中')
      return
    }

    monitorState.value.isMonitoring = true
    monitorState.value.startTime = Date.now()
    monitorState.value.changeCount = 0

    // 初始化快照（不记录初始值）
    initializeSnapshot()

    // 注入监控脚本到页面
    injectMonitorScript()

    // 启动运行时长更新
    startDurationUpdate()

    console.log('✅ 监控已启动')
  }

  /**
   * 初始化快照（获取当前状态但不记录）
   */
  const initializeSnapshot = () => {
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items[key] = localStorage.getItem(key);
          }
        }
        return items;
      })()
      `,
      (result: any) => {
        if (result) {
          lastSnapshot = result as Record<string, string>
          console.log('📸 初始快照已创建，共', Object.keys(lastSnapshot).length, '项')
        }
      }
    )
  }

  /**
   * 停止监控
   */
  const stopMonitoring = () => {
    if (!monitorState.value.isMonitoring) {
      console.warn('监控未运行')
      return
    }

    monitorState.value.isMonitoring = false
    monitorState.value.startTime = null

    // 移除监控脚本
    removeMonitorScript()

    // 停止运行时长更新
    stopDurationUpdate()

    console.log('⏹️ 监控已停止')
  }

  /**
   * 注入监控脚本到页面
   */
  const injectMonitorScript = () => {
    // 使用轮询方式检测 storage 变化
    const pollInterval = setInterval(() => {
      if (!monitorState.value.isMonitoring) {
        clearInterval(pollInterval)
        return
      }

      // 检测 storage 变化
      checkStorageChanges()
    }, 500) // 每500ms检查一次

    console.log('✅ 监控已启动（轮询模式）')
  }

  // 存储上一次的快照
  let lastSnapshot: Record<string, string> = {}
  // 标记是否已初始化（避免首次检测时记录所有现有数据）
  let isInitialized = false

  /**
   * 检测 storage 变化
   */
  const checkStorageChanges = () => {
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items[key] = localStorage.getItem(key);
          }
        }
        return items;
      })()
      `,
      (result: any) => {
        if (!result) return

        const currentSnapshot = result as Record<string, string>

        // 如果是首次检测，只初始化快照，不记录变化
        if (!isInitialized) {
          lastSnapshot = { ...currentSnapshot }
          isInitialized = true
          return
        }

        // 检测新增和修改
        for (const [key, value] of Object.entries(currentSnapshot)) {
          if (!(key in lastSnapshot)) {
            // 新增
            handleStorageChange({
              id: `${Date.now()}-${Math.random()}`,
              action: 'set',
              key,
              oldValue: null,
              newValue: value,
              timestamp: Date.now(),
              storageType: 'localStorage'
            })
          } else if (lastSnapshot[key] !== value) {
            // 修改
            handleStorageChange({
              id: `${Date.now()}-${Math.random()}`,
              action: 'set',
              key,
              oldValue: lastSnapshot[key],
              newValue: value,
              timestamp: Date.now(),
              storageType: 'localStorage'
            })
          }
        }

        // 检测删除
        for (const key of Object.keys(lastSnapshot)) {
          if (!(key in currentSnapshot)) {
            handleStorageChange({
              id: `${Date.now()}-${Math.random()}`,
              action: 'remove',
              key,
              oldValue: lastSnapshot[key],
              newValue: null,
              timestamp: Date.now(),
              storageType: 'localStorage'
            })
          }
        }

        // 更新快照
        lastSnapshot = { ...currentSnapshot }
      }
    )
  }

  /**
   * 移除监控脚本
   */
  const removeMonitorScript = () => {
    // 清空快照
    lastSnapshot = {}
    isInitialized = false
    console.log('Storage Pro: 监控已停止')
  }

  /**
   * 处理 storage 变更
   */
  const handleStorageChange = (change: StorageChange) => {
    // 添加到日志
    addChangeLog(change)

    // 更新监控状态
    monitorState.value.changeCount++
    monitorState.value.lastChangeTime = change.timestamp

    // 添加到最近变更（用于高亮）
    if (change.key) {
      recentChangedKeys.value.add(change.key)

      // 3秒后移除高亮
      setTimeout(() => {
        recentChangedKeys.value.delete(change.key!)
      }, HIGHLIGHT_DURATION)
    }
  }

  /**
   * 添加变更日志
   */
  const addChangeLog = (change: StorageChange) => {
    changeLog.value.unshift(change)

    // 限制日志大小
    if (changeLog.value.length > MAX_CHANGE_LOG_SIZE) {
      changeLog.value = changeLog.value.slice(0, MAX_CHANGE_LOG_SIZE)
    }

    // 持久化到本地存储
    saveChangeLog()
  }

  /**
   * 清空变更日志
   */
  const clearChangeLog = () => {
    changeLog.value = []
    monitorState.value.changeCount = 0
    localStorage.removeItem('storage-pro-change-log')
  }

  /**
   * 保存变更日志到本地存储
   */
  const saveChangeLog = () => {
    try {
      localStorage.setItem(
        'storage-pro-change-log',
        JSON.stringify(changeLog.value.slice(0, 100)) // 只保存最近100条
      )
    } catch (error) {
      console.error('保存变更日志失败:', error)
    }
  }

  /**
   * 加载变更日志
   */
  const loadChangeLog = () => {
    try {
      const stored = localStorage.getItem('storage-pro-change-log')
      if (stored) {
        changeLog.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载变更日志失败:', error)
    }
  }

  /**
   * 检查键是否最近被修改
   */
  const isRecentlyChanged = (key: string): boolean => {
    return recentChangedKeys.value.has(key)
  }

  /**
   * 计算存储统计信息
   */
  const calculateStats = (items: StorageItem[]): StorageStats => {
    let totalSize = 0
    let largestItem: { key: string; size: number } | null = null
    let largestSize = 0

    const typeDistribution = {
      string: 0,
      number: 0,
      boolean: 0,
      json: 0,
      null: 0
    }

    items.forEach(item => {
      // 计算大小
      const size = new Blob([item.value]).size
      totalSize += size

      // 找出最大项
      if (size > largestSize) {
        largestSize = size
        largestItem = { key: item.key, size }
      }

      // 统计类型分布
      const type = detectType(item.value)
      if (type in typeDistribution) {
        typeDistribution[type as keyof typeof typeDistribution]++
      }
    })

    // 计算配额使用情况（localStorage 通常为 5-10MB）
    const estimatedQuota = 5 * 1024 * 1024 // 5MB
    const quotaUsage = {
      used: totalSize,
      total: estimatedQuota,
      percentage: Math.round((totalSize / estimatedQuota) * 100)
    }

    return {
      totalItems: items.length,
      totalSize,
      typeDistribution,
      largestItem,
      quotaUsage
    }
  }

  /**
   * 检测数据类型
   */
  const detectType = (value: string): string => {
    if (value === 'null') return 'null'
    if (value === 'true' || value === 'false') return 'boolean'
    if (/^\d+$/.test(value)) return 'number'

    try {
      JSON.parse(value)
      return 'json'
    } catch {
      return 'string'
    }
  }

  /**
   * 导出变更日志
   */
  const exportChangeLog = () => {
    const data = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      monitorState: monitorState.value,
      changeLog: changeLog.value
    }

    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `storage-change-log-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 监控运行时长（使用 ref 以便实时更新）
  const monitorDuration = ref(0)

  // 定时更新运行时长
  let durationUpdateTimer: number | undefined

  /**
   * 启动运行时长更新
   */
  const startDurationUpdate = () => {
    // 清除旧的定时器
    if (durationUpdateTimer) {
      clearInterval(durationUpdateTimer)
    }

    // 每秒更新一次
    durationUpdateTimer = window.setInterval(() => {
      if (monitorState.value.isMonitoring && monitorState.value.startTime) {
        monitorDuration.value = Date.now() - monitorState.value.startTime
      }
    }, 1000)
  }

  /**
   * 停止运行时长更新
   */
  const stopDurationUpdate = () => {
    if (durationUpdateTimer) {
      clearInterval(durationUpdateTimer)
      durationUpdateTimer = undefined
    }
    monitorDuration.value = 0
  }

  // 格式化运行时长
  const formattedDuration = computed(() => {
    const duration = monitorDuration.value
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  })

  // 初始化时加载日志
  loadChangeLog()

  return {
    // 状态
    monitorState,
    changeLog,
    monitorDuration,
    formattedDuration,

    // 方法
    startMonitoring,
    stopMonitoring,
    clearChangeLog,
    isRecentlyChanged,
    calculateStats,
    exportChangeLog
  }
}
