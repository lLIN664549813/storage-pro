// localStorage项的数据结构
export interface StorageItem {
  key: string
  value: string
}

// 快照项的数据结构
export interface Snapshot {
  id: string
  name: string
  createdAt: number
  items: StorageItem[]
}
