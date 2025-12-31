/**
 * 导入导出相关类型定义
 */

import type { StorageItem } from './storage'

// 导出格式
export type ExportFormat = 'json' | 'csv'

// 导出选项
export interface ExportOptions {
  format: ExportFormat // 导出格式
  includeMetadata: boolean // 是否包含元数据
  formatted: boolean // 是否格式化（JSON）
  selectedOnly: boolean // 是否仅导出选中项
}

// 导入模式
export type ImportMode = 'merge' | 'overwrite'

// 导入选项
export interface ImportOptions {
  mode: ImportMode // 导入模式
  skipExisting: boolean // 是否跳过已存在项
}

// 导入结果
export interface ImportResult {
  success: number // 成功导入数量
  skipped: number // 跳过数量
  failed: number // 失败数量
  errors: Array<{ key: string; error: string }> // 错误详情
}

// 导出数据结构（包含元数据）
export interface ExportData {
  metadata: {
    exportedAt: number
    storageType: 'localStorage' | 'sessionStorage'
    totalItems: number
    totalSize: number
    version: string
  }
  items: StorageItem[]
}
