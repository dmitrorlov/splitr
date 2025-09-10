<!-- Button Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from '@/types'

interface Props extends ButtonProps {
  // Additional props
  as?: string
  type?: 'button' | 'submit' | 'reset'
}

interface Emits {
  click: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
  as: 'button',
  type: 'button',
})

const emit = defineEmits<Emits>()

const buttonClasses = computed(() => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'

  // Size classes - matching original button sizes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  }

  // Variant classes - exact colors from NetworksScreen.vue
  const variantClasses = {
    primary:
      'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 border border-transparent shadow-sm',
    secondary: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500 border border-gray-300',
    danger:
      'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-sm',
    ghost: 'text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-red-500',
    outline:
      'text-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500 border border-blue-600',
  }

  const classes = [base, sizeClasses[props.size], variantClasses[props.variant]]

  if (props.fullWidth) {
    classes.push('w-full')
  }

  if (props.disabled || props.loading) {
    classes.push('disabled:opacity-50 cursor-not-allowed')
  }

  return classes.join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :class="buttonClasses"
    :disabled="disabled || loading"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- Loading spinner - matching original loading states -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    
    <!-- Button content -->
    <slot />
  </component>
</template>