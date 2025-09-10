<!-- Input Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

interface Emits {
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
})

const emit = defineEmits<Emits>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string | number) => emit('update:modelValue', value),
})

// Exact input classes from NetworksScreen.vue forms
const inputClasses = computed(() => {
  const base =
    'block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  }

  const stateClasses = props.error
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'

  const disabledClasses = props.disabled
    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
    : 'text-gray-900 bg-white'

  return [base, sizeClasses[props.size], stateClasses, disabledClasses].join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}
</script>

<template>
  <div>
    <!-- Label - exact styling from NetworksScreen.vue -->
    <label 
      v-if="label" 
      class="block text-sm font-medium text-gray-700"
      :for="`input-${Math.random().toString(36).substr(2, 9)}`"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <!-- Description -->
    <p v-if="description" class="mt-1 text-sm text-gray-600">
      {{ description }}
    </p>
    
    <!-- Input field -->
    <div :class="label || description ? 'mt-1' : ''">
      <input
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        v-bind="$attrs"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    
    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>