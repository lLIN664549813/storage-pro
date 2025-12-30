import { ref } from 'vue'
import type { StorageItem } from '../types/storage'

// 存储所有localStorage项的响应式数组
export function useStorage() {
  const storageItems = ref<StorageItem[]>([])

  // 从页面上下文中获取所有localStorage项
  const loadStorageItems = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            const items = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                const value = localStorage.getItem(key);
                items.push({ key, value });
              }
            }
            return items;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result, isException) => {
          if (isException) {
            reject(new Error(`获取localStorage失败: ${isException}`));
            return;
          }

          if (result && result.error) {
            reject(new Error(result.error));
            return;
          }

          storageItems.value = result || [];
          resolve();
        }
      );
    });
  }

  // 添加新的localStorage项
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
            localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result, isException) => {
          if (isException) {
            reject(new Error(`添加localStorage项失败: ${isException}`));
            return;
          }

          if (result && result.error) {
            reject(new Error(result.error));
            return;
          }

          // 如果成功，更新本地状态
          storageItems.value.push({ key, value });
          resolve();
        }
      );
    });
  }

  // 更新localStorage项
  const updateItem = async (key: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            if (localStorage.getItem(${JSON.stringify(key)}) === null) {
              return { error: '键不存在' };
            }
            localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result, isException) => {
          if (isException) {
            reject(new Error(`更新localStorage项失败: ${isException}`));
            return;
          }

          if (result && result.error) {
            reject(new Error(result.error));
            return;
          }

          // 如果成功，更新本地状态
          const index = storageItems.value.findIndex(item => item.key === key);
          if (index !== -1) {
            storageItems.value[index] = { key, value };
          }
          resolve();
        }
      );
    });
  }

  // 删除localStorage项
  const deleteItem = async (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(() => {
          try {
            if (localStorage.getItem(${JSON.stringify(key)}) === null) {
              return { error: '键不存在' };
            }
            localStorage.removeItem(${JSON.stringify(key)});
            return true;
          } catch (error) {
            return { error: error.message };
          }
        })()`,
        (result, isException) => {
          if (isException) {
            reject(new Error(`删除localStorage项失败: ${isException}`));
            return;
          }

          if (result && result.error) {
            reject(new Error(result.error));
            return;
          }

          // 如果成功，更新本地状态
          storageItems.value = storageItems.value.filter(item => item.key !== key);
          resolve();
        }
      );
    });
  }

  // 清空所有localStorage
  const clearStorage = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
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
          if (isException) {
            reject(new Error(`清空localStorage失败: ${isException}`));
            return;
          }

          if (result && result.error) {
            reject(new Error(result.error));
            return;
          }

          // 如果成功，更新本地状态
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
