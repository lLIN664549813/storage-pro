<script setup lang="ts">
interface Emits {
  (e: 'refresh'): void
  (e: 'add'): void
  (e: 'clear'): void
  (e: 'create-snapshot'): void
}

const emit = defineEmits<Emits>()
</script>

<template>
  <div class="bg-white border-b border-gray-200 p-2 flex items-center space-x-2">
    <button
      @click="$emit('refresh')"
      class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center"
      title="刷新"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
      </svg>
      刷新
    </button>

    <button
      @click="$emit('add')"
      class="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded flex items-center"
      title="添加新项"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      添加
    </button>

    <button
      @click="$emit('clear')"
      class="px-3 py-1 text-sm bg-red-500 text-white hover:bg-red-600 rounded flex items-center"
      title="清空所有"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      清空
    </button>

    <div class="border-l border-gray-300 h-6 mx-1"></div>

    <button
      @click="$emit('create-snapshot')"
      class="px-3 py-1 text-sm bg-green-500 text-white hover:bg-green-600 rounded flex items-center"
      title="创建快照"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
      </svg>
      创建快照
    </button>
  </div>
</template>
