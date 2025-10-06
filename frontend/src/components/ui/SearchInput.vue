<!-- SearchInput Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import type { SearchInputProps } from '@/types'

interface Props extends SearchInputProps {
  // Additional props if needed
}

interface Emits {
  'update:modelValue': [value: string]
  clear: []
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  clearable: true,
  resultText: 'results',
  debounceMs: 300,
})

const emit = defineEmits<Emits>()

const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const handleInput = () => {
  emit('update:modelValue', searchValue.value)
}

const clear = () => {
  searchValue.value = ''
  emit('clear')
}
</script>

<template>
  <!-- Exact styling from NetworksScreen.vue search input -->
  <div class="bg-white rounded-lg shadow p-4">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        v-model="searchValue"
        v-bind="$attrs"
        type="text"
        :placeholder="placeholder"
        class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10 pr-10"
        @input="handleInput"
      />
      <button
        v-if="searchValue && clearable"
        @click="clear"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>
    
    <!-- Result count display - exact styling from original -->
    <p v-if="resultCount !== null" class="mt-2 text-sm text-gray-500">
      {{ resultCount }} {{ resultText }} found
      <span v-if="searchValue">for "{{ searchValue }}"</span>
    </p>
  </div>
</template>