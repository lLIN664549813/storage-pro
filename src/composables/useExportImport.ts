/**
 * 数据导入导出功能 Composable
 */

import { ref } from 'vue'
import type { StorageItem } from '../types/storage'
import type { ExportOptions, ImportOptions, ImportResult, ExportData } from '../types/export'

export function useExportImport() {
  const isExporting = ref(false)
  const isImporting = ref(false)
  const importProgress = ref(0)

  /**
   * 下载文件
   */
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 计算总大小
   */
  const calculateTotalSize = (items: StorageItem[]): number => {
    return items.reduce((total, item) => {
      return total + new Blob([item.key + item.value]).size
    }, 0)
  }

  /**
   * 导出为 JSON
   */
  const exportToJSON = (
    items: StorageItem[],
    storageType: 'localStorage' | 'sessionStorage',
    options: ExportOptions
  ): void => {
    let data: any

    if (options.includeMetadata) {
      const exportData: ExportData = {
        metadata: {
          exportedAt: Date.now(),
          storageType,
          totalItems: items.length,
          totalSize: calculateTotalSize(items),
          version: '1.1.0'
        },
        items
      }
      data = exportData
    } else {
      // 简化格式：键值对对象
      data = items.reduce((obj, item) => {
        obj[item.key] = item.value
        return obj
      }, {} as Record<string, string>)
    }

    const json = options.formatted
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data)

    const filename = `storage-${storageType}-${Date.now()}.json`
    downloadFile(json, filename, 'application/json')
  }

  /**
   * 导出为 CSV
   */
  const exportToCSV = (
    items: StorageItem[],
    storageType: 'localStorage' | 'sessionStorage',
    options: ExportOptions
  ): void => {
    // CSV 头部
    let csv = '\uFEFF' // UTF-8 BOM
    
    if (options.includeMetadata) {
      csv += `# Storage Type: ${storageType}\n`
      csv += `# Exported At: ${new Date().toISOString()}\n`
      csv += `# Total Items: ${items.length}\n`
      csv += `# Total Size: ${calculateTotalSize(items)} bytes\n`
      csv += '\n'
    }
    
    csv += 'Key,Value,Size (bytes),Type\n'

    // CSV 数据行
    items.forEach(item => {
      const size = new Blob([item.value]).size
      const type = detectType(item.value)
      
      // 转义 CSV 特殊字符
      const escapedKey = escapeCSV(item.key)
      const escapedValue = escapeCSV(item.value)
      
      csv += `${escapedKey},${escapedValue},${size},${type}\n`
    })

    const filename = `storage-${storageType}-${Date.now()}.csv`
    downloadFile(csv, filename, 'text/csv;charset=utf-8')
  }

  /**
   * 转义 CSV 特殊字符
   */
  const escapeCSV = (value: string): string => {
    // 如果包含逗号、引号或换行符，需要用引号包裹
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // 引号需要转义为两个引号
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * 检测数据类型
   */
  const detectType = (value: string): string => {
    if (value === 'null' || value === '') return 'null'
    if (value === 'true' || value === 'false') return 'boolean'
    
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return 'number'
    
    try {
      JSON.parse(value)
      return 'json'
    } catch {
      return 'string'
    }
  }

  /**
   * 导出数据
   */
  const exportData = async (
    items: StorageItem[],
    storageType: 'localStorage' | 'sessionStorage',
    options: ExportOptions
  ): Promise<void> => {
    try {
      isExporting.value = true

      if (options.format === 'json') {
        exportToJSON(items, storageType, options)
      } else if (options.format === 'csv') {
        exportToCSV(items, storageType, options)
      }
    } catch (error) {
      console.error('导出失败:', error)
      throw error
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = async (items: StorageItem[]): Promise<void> => {
    try {
      const data = items.reduce((obj, item) => {
        obj[item.key] = item.value
        return obj
      }, {} as Record<string, string>)

      const json = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(json)
    } catch (error) {
      console.error('复制失败:', error)
      throw error
    }
  }

  /**
   * 导入 JSON 数据
   */
  const importFromJSON = async (
    file: File,
    storageType: 'localStorage' | 'sessionStorage',
    options: ImportOptions,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          let items: StorageItem[] = []

          // 判断数据格式
          if (data.metadata && data.items) {
            // 包含元数据的格式
            items = data.items
          } else if (Array.isArray(data)) {
            // 数组格式
            items = data
          } else {
            // 键值对对象格式
            items = Object.entries(data).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : JSON.stringify(value)
            }))
          }

          // 执行导入
          const result = await importItems(items, storageType, options, onProgress)
          resolve(result)
        } catch (error: any) {
          reject(new Error(`解析 JSON 失败: ${error.message}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * 导入数据项
   */
  const importItems = async (
    items: StorageItem[],
    storageType: 'localStorage' | 'sessionStorage',
    options: ImportOptions,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> => {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    isImporting.value = true
    importProgress.value = 0

    try {
      // 如果是覆盖模式，先清空
      if (options.mode === 'overwrite') {
        await new Promise<void>((resolve, reject) => {
          chrome.devtools.inspectedWindow.eval(
            `${storageType}.clear(); true;`,
            (result: any, isException: any) => {
              if (isException) {
                reject(new Error('清空失败'))
              } else {
                resolve()
              }
            }
          )
        })
      }

      // 逐个导入
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        try {
          // 检查是否已存在
          const exists = await checkKeyExists(item.key, storageType)

          if (exists && options.skipExisting) {
            result.skipped++
            continue
          }

          // 设置值
          await setStorageItem(item.key, item.value, storageType)
          result.success++
        } catch (error: any) {
          result.failed++
          result.errors.push({
            key: item.key,
            error: error.message
          })
        }

        // 更新进度
        const progress = Math.round(((i + 1) / items.length) * 100)
        importProgress.value = progress
        onProgress?.(progress)
      }
    } finally {
      isImporting.value = false
      importProgress.value = 0
    }

    return result
  }

  /**
   * 检查键是否存在
   */
  const checkKeyExists = (key: string, storageType: string): Promise<boolean> => {
    return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
        `${storageType}.getItem(${JSON.stringify(key)}) !== null`,
        (exists: any) => {
          resolve(!!exists)
        }
      )
    })
  }

  /**
   * 设置 storage 项
   */
  const setStorageItem = (key: string, value: string, storageType: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            ${storageType}.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result: any, isException: any) => {
          if (isException || (result && result.error)) {
            reject(new Error(result?.error || '设置失败'))
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
    importProgress,
    exportData,
    copyToClipboard,
    importFromJSON
  }
}
