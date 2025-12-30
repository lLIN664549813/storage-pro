import { ref } from 'vue'
import type { StorageItem } from '../types/storage'

// 快照数据结构
interface Snapshot {
  id: string
  name: string
  createdAt: number
  items: StorageItem[]
}

// 存储所有快照的响应式数组
export function useSnapshot() {
  const snapshots = ref<Snapshot[]>([])

  // 本地存储键名
  const STORAGE_KEY = 'storage-pro-snapshots'

  // 加载快照
  const loadSnapshots = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        snapshots.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载快照失败:', error)
      snapshots.value = []
    }
  }

  // 保存快照到本地存储
  const saveSnapshots = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots.value))
    } catch (error) {
      console.error('保存快照失败:', error)
      throw new Error('保存快照失败: ' + error.message)
    }
  }

  // 创建新快照
  const createSnapshot = async (name: string, items: StorageItem[]): Promise<void> => {
    const newSnapshot: Snapshot = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      items: [...items] // 深拷贝，避免引用问题
    }

    snapshots.value.push(newSnapshot)
    saveSnapshots()
  }

  // 恢复快照
  const restoreSnapshot = async (id: string): Promise<void> => {
    const snapshot = snapshots.value.find(s => s.id === id)
    if (!snapshot) {
      throw new Error('快照不存在')
    }

    // 先清空当前localStorage
    await new Promise<void>((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            localStorage.clear();
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result, isException) => {
          if (isException || (result && result.error)) {
            reject(new Error(isException || result.error))
            return
          }
          resolve()
        }
      )
    })

    // 然后恢复快照中的所有项
    for (const item of snapshot.items) {
      await new Promise<void>((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(
          `(() => {
            try {
              localStorage.setItem(${JSON.stringify(item.key)}, ${JSON.stringify(item.value)});
              return true;
            } catch (error) {
              return { error: error.message };
            }
          })()`,
          (result, isException) => {
            if (isException || (result && result.error)) {
              reject(new Error(isException || result.error))
              return
            }
            resolve()
          }
        )
      })
    }
  }

  // 删除快照
  const deleteSnapshot = (id: string): void => {
    snapshots.value = snapshots.value.filter(s => s.id !== id)
    saveSnapshots()
  }

  // 初始化时加载快照
  loadSnapshots()

  return {
    snapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot
  }
}
