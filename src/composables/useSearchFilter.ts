/**
 * 搜索与过滤功能 Composable
 */

import { ref } from 'vue'
import type { StorageItem } from '../types/storage'
import type { SearchOptions, FilterOptions, SearchHistory, DataType } from '../types/search'

export function useSearchFilter() {
  // 搜索选项
  const searchOptions = ref<SearchOptions>({
    keyword: '',
    searchIn: 'both',
    useRegex: false,
    caseSensitive: false,
    deepSearch: false
  })

  // 过滤选项
  const filterOptions = ref<FilterOptions>({
    types: [],
    minSize: undefined,
    maxSize: undefined
  })

  // 搜索历史
  const searchHistory = ref<SearchHistory[]>([])

  /**
   * 判断数据类型
   */
  const getDataType = (value: string): DataType => {
    if (value === 'null' || value === '') return 'null'
    if (value === 'true' || value === 'false') return 'boolean'
    
    // 尝试解析为数字
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return 'number'
    
    // 尝试解析为 JSON
    try {
      JSON.parse(value)
      return 'json'
    } catch {
      return 'string'
    }
  }

  /**
   * 获取值的大小（字节）
   */
  const getValueSize = (value: string): number => {
    return new Blob([value]).size
  }

  /**
   * 深度搜索 JSON 对象
   */
  const deepSearchJSON = (obj: any, keyword: string, caseSensitive: boolean): boolean => {
    const searchText = caseSensitive ? keyword : keyword.toLowerCase()
    
    const search = (value: any): boolean => {
      if (value === null || value === undefined) return false
      
      // 如果是对象或数组，递归搜索
      if (typeof value === 'object') {
        return Object.values(value).some(v => search(v))
      }
      
      // 转换为字符串进行搜索
      const str = String(value)
      const text = caseSensitive ? str : str.toLowerCase()
      return text.includes(searchText)
    }
    
    return search(obj)
  }

  /**
   * 检查项是否匹配搜索条件
   */
  const matchesSearch = (item: StorageItem): boolean => {
    const { keyword, searchIn, useRegex, caseSensitive, deepSearch } = searchOptions.value
    
    // 如果没有关键字，返回 true
    if (!keyword.trim()) return true
    
    let searchText = keyword
    let keyText = item.key
    let valueText = item.value
    
    // 处理大小写
    if (!caseSensitive) {
      searchText = searchText.toLowerCase()
      keyText = keyText.toLowerCase()
      valueText = valueText.toLowerCase()
    }
    
    // 正则表达式搜索
    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi'
        const regex = new RegExp(searchText, flags)
        
        if (searchIn === 'key') return regex.test(item.key)
        if (searchIn === 'value') return regex.test(item.value)
        return regex.test(item.key) || regex.test(item.value)
      } catch {
        // 正则表达式无效，回退到普通搜索
        return false
      }
    }
    
    // JSON 深度搜索
    if (deepSearch && searchIn !== 'key') {
      try {
        const parsed = JSON.parse(item.value)
        if (deepSearchJSON(parsed, keyword, caseSensitive)) return true
      } catch {
        // 不是有效的 JSON，继续普通搜索
      }
    }
    
    // 普通搜索
    if (searchIn === 'key') return keyText.includes(searchText)
    if (searchIn === 'value') return valueText.includes(searchText)
    return keyText.includes(searchText) || valueText.includes(searchText)
  }

  /**
   * 检查项是否匹配过滤条件
   */
  const matchesFilter = (item: StorageItem): boolean => {
    const { types, minSize, maxSize } = filterOptions.value
    
    // 类型过滤
    if (types.length > 0) {
      const itemType = getDataType(item.value)
      if (!types.includes(itemType)) return false
    }
    
    // 大小过滤
    const size = getValueSize(item.value)
    if (minSize !== undefined && size < minSize) return false
    if (maxSize !== undefined && size > maxSize) return false
    
    return true
  }

  /**
   * 过滤项目列表
   */
  const filterItems = (items: StorageItem[]): StorageItem[] => {
    return items.filter(item => matchesSearch(item) && matchesFilter(item))
  }

  /**
   * 保存搜索历史
   */
  const saveSearchHistory = (resultCount: number) => {
    const { keyword } = searchOptions.value
    
    // 如果关键字为空，不保存
    if (!keyword.trim()) return
    
    const history: SearchHistory = {
      id: `${Date.now()}-${Math.random()}`,
      keyword,
      searchOptions: { ...searchOptions.value },
      filterOptions: { ...filterOptions.value },
      timestamp: Date.now(),
      resultCount
    }
    
    // 添加到历史记录（最多保存 20 条）
    searchHistory.value.unshift(history)
    if (searchHistory.value.length > 20) {
      searchHistory.value = searchHistory.value.slice(0, 20)
    }
    
    // 保存到 localStorage
    try {
      localStorage.setItem('storage-pro-search-history', JSON.stringify(searchHistory.value))
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  /**
   * 加载搜索历史
   */
  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('storage-pro-search-history')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  }

  /**
   * 重放搜索历史
   */
  const replaySearchHistory = (historyId: string) => {
    const history = searchHistory.value.find(h => h.id === historyId)
    if (!history) return
    
    searchOptions.value = { ...history.searchOptions }
    filterOptions.value = { ...history.filterOptions }
  }

  /**
   * 清空搜索历史
   */
  const clearSearchHistory = () => {
    searchHistory.value = []
    try {
      localStorage.removeItem('storage-pro-search-history')
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  }

  /**
   * 重置搜索选项
   */
  const resetSearch = () => {
    searchOptions.value = {
      keyword: '',
      searchIn: 'both',
      useRegex: false,
      caseSensitive: false,
      deepSearch: false
    }
    filterOptions.value = {
      types: [],
      minSize: undefined,
      maxSize: undefined
    }
  }

  // 初始化时加载历史记录
  loadSearchHistory()

  return {
    searchOptions,
    filterOptions,
    searchHistory,
    filterItems,
    saveSearchHistory,
    replaySearchHistory,
    clearSearchHistory,
    resetSearch,
    getDataType,
    getValueSize
  }
}
