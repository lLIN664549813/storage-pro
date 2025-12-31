import { ref } from 'vue'
import type { StorageItem } from '../types/storage'

/**
 * 通用的 Web Storage 操作 Hook
 * 支持 localStorage 和 sessionStorage
 */
export function useWebStorage(storageType: 'localStorage' | 'sessionStorage' = 'localStorage') {
  const storageItems = ref<StorageItem[]>([])

  /**
   * 从页面上下文中获取所有 storage 项
   */
  const loadStorageItems = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            const items = [];
            const storage = ${storageType};
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key) {
                const value = storage.getItem(key);
                items.push({ key, value });
              }
            }
            return items;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result: any, isException: any) => {
          if (isException) {
            reject(new Error(`获取 ${storageType} 失败: ${isException}`));
            return;
          }

          if (result && typeof result === 'object' && 'error' in result) {
            reject(new Error(result.error));
            return;
          }

          storageItems.value = (result as StorageItem[]) || [];
          resolve();
        }
      );
    });
  }

  /**
   * 添加新的 storage 项
   */
  const addItem = async (key: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 检查是否已存在
      if (storageItems.value.some(item => item.key === key)) {
        reject(new Error(`键 "${key}" 已存在`));
        return;
      }

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
          if (isException) {
            reject(new Error(`添加 ${storageType} 项失败: ${isException}`));
            return;
          }

          if (result && typeof result === 'object' && 'error' in result) {
            reject(new Error(result.error));
            return;
          }

          // 更新本地状态
          storageItems.value.push({ key, value });
          resolve();
        }
      );
    });
  }

  /**
   * 更新 storage 项
   */
  const updateItem = async (key: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            if (${storageType}.getItem(${JSON.stringify(key)}) === null) {
              return { error: '键不存在' };
            }
            ${storageType}.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result: any, isException: any) => {
          if (isException) {
            reject(new Error(`更新 ${storageType} 项失败: ${isException}`));
            return;
          }

          if (result && typeof result === 'object' && 'error' in result) {
            reject(new Error(result.error));
            return;
          }

          // 更新本地状态
          const index = storageItems.value.findIndex(item => item.key === key);
          if (index !== -1) {
            storageItems.value[index] = { key, value };
          }
          resolve();
        }
      );
    });
  }

  /**
   * 删除 storage 项
   */
  const deleteItem = async (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            if (${storageType}.getItem(${JSON.stringify(key)}) === null) {
              return { error: '键不存在' };
            }
            ${storageType}.removeItem(${JSON.stringify(key)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result: any, isException: any) => {
          if (isException) {
            reject(new Error(`删除 ${storageType} 项失败: ${isException}`));
            return;
          }

          if (result && typeof result === 'object' && 'error' in result) {
            reject(new Error(result.error));
            return;
          }

          // 更新本地状态
          storageItems.value = storageItems.value.filter(item => item.key !== key);
          resolve();
        }
      );
    });
  }

  /**
   * 清空所有 storage
   */
  const clearStorage = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            ${storageType}.clear();
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result: any, isException: any) => {
          if (isException) {
            reject(new Error(`清空 ${storageType} 失败: ${isException}`));
            return;
          }

          if (result && typeof result === 'object' && 'error' in result) {
            reject(new Error(result.error));
            return;
          }

          // 更新本地状态
          storageItems.value = [];
          resolve();
        }
      );
    });
  }

  return {
    storageItems,
    loadStorageItems,
    addItem,
    updateItem,
    deleteItem,
    clearStorage
  }
}
