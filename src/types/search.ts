/**
 * 搜索相关类型定义
 */

// 搜索范围
export type SearchScope = 'key' | 'value' | 'both'

// 数据类型
export type DataType = 'string' | 'number' | 'json' | 'boolean' | 'null'

// 搜索选项
export interface SearchOptions {
  keyword: string // 搜索关键字
  searchIn: SearchScope // 搜索范围
  useRegex: boolean // 是否使用正则表达式
  caseSensitive: boolean // 是否区分大小写
  deepSearch: boolean // 是否深度搜索 JSON
}

// 过滤选项
export interface FilterOptions {
  types: DataType[] // 数据类型过滤
  minSize?: number // 最小大小（字节）
  maxSize?: number // 最大大小（字节）
}

// 搜索历史记录
export interface SearchHistory {
  id: string
  keyword: string
  searchOptions: SearchOptions
  filterOptions: FilterOptions
  timestamp: number
  resultCount: number
}
