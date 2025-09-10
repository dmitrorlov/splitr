<!-- Select Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  label?: string
  description?: string
  loading?: boolean
  loadingText?: string
  emptyText?: string
}

interface Emits {
  'update:modelValue': [value: string | number]
  change: [value: string | number, option: Option | null]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option...',
  loadingText: 'Loading...',
  emptyText: 'No options available',
})

const emit = defineEmits<Emits>()

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: string | number) => {
    emit('update:modelValue', value)
    const option = props.options.find(opt => opt.value === value) || null
    emit('change', value, option)
  },
})

// Exact select classes from NetworksScreen.vue
const selectClasses = computed(() => {
  const base =
    'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white'

  const stateClasses = props.error
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'

  const disabledClasses = props.disabled
    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
    : 'text-gray-900 bg-white'

  return [base, stateClasses, disabledClasses].join(' ')
})
</script>

<template>
  <div>
    <!-- Label - exact styling from NetworksScreen.vue -->
    <label 
      v-if="label" 
      class="block text-sm font-medium text-gray-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <!-- Description -->
    <p v-if="description" class="mt-1 text-sm text-gray-600">
      {{ description }}
    </p>
    
    <!-- Select field -->
    <select
      v-model="selectValue"
      :disabled="disabled || loading"
      :required="required"
      :class="selectClasses"
      v-bind="$attrs"
    >
      <!-- Placeholder option -->
      <option value="" disabled class="text-gray-500">
        {{ loading ? loadingText : placeholder }}
      </option>
      
      <!-- Options -->
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        class="text-gray-900"
      >
        {{ option.label }}
      </option>
    </select>
    
    <!-- Loading/Empty state messages - exact styling from NetworksScreen.vue -->
    <p v-if="loading" class="mt-2 text-sm text-blue-600">
      {{ loadingText }}
    </p>
    <p v-else-if="options.length === 0" class="mt-2 text-sm text-orange-600">
      {{ emptyText }}
    </p>
    
    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>