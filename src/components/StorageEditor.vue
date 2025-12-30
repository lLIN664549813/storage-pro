<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = ref(props.modelValue)
const isJson = ref(false)
const formattedValue = ref('')
const errorMessage = ref('')

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
  checkJson()
})

// 初始化时检查JSON
checkJson()

// 检查是否为有效JSON并格式化
function checkJson() {
  try {
    const parsed = JSON.parse(localValue.value)
    isJson.value = true
    formattedValue.value = JSON.stringify(parsed, null, 2)
    errorMessage.value = ''
  } catch (e) {
    isJson.value = false
    formattedValue.value = localValue.value
    if (localValue.value.trim() && (localValue.value.startsWith('{') || localValue.value.startsWith('['))) {
      errorMessage.value = '无效的JSON格式'
    } else {
      errorMessage.value = ''
    }
  }
}

// 监听本地值变化
watch(localValue, () => {
  emit('update:modelValue', localValue.value)
  checkJson()
})

// 切换JSON格式化
function toggleFormat() {
  if (isJson.value) {
    localValue.value = formattedValue.value
  } else {
    localValue.value = formattedValue.value
  }
  checkJson()
}

// 保存
function save() {
  if (errorMessage.value) {
    alert('请修正JSON格式错误后再保存')
    return
  }
  emit('save')
}

// 取消
function cancel() {
  emit('cancel')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2">
        <button
          v-if="isJson"
          @click="toggleFormat"
          class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          格式化
        </button>
      </div>
      <div v-if="errorMessage" class="text-red-500 text-xs">
        {{ errorMessage }}
      </div>
    </div>

    <textarea
      v-model="localValue"
      class="flex-1 p-2 border border-gray-300 rounded font-mono text-sm resize-none"
      placeholder="输入值..."
    ></textarea>

    <div class="flex justify-end space-x-2 mt-2">
      <button
        @click="cancel"
        class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
      >
        取消
      </button>
      <button
        @click="save"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        保存
      </button>
    </div>
  </div>
</template>
