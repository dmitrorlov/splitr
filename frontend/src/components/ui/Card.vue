<!-- Card Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { CardProps } from '@/types'

interface Props extends CardProps {
  // Additional props specific to this component
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  clickable: false,
  padding: 'md',
  shadow: 'md',
  as: 'div',
})

// Using the exact same classes from original NetworksScreen.vue
const cardClasses = computed(() => [
  'bg-white rounded-lg shadow',
  {
    // Exact hover effect from original
    'hover:shadow-md transition-all': props.hoverable,
    'cursor-pointer': props.clickable,
    // Add group class for nested hover effects
    group: props.hoverable || props.clickable,
  },
])

const contentClasses = computed(() => {
  switch (props.padding) {
    case 'none':
      return ''
    case 'sm':
      return 'p-4'
    case 'lg':
      return 'p-8'
    default:
      return 'p-6'
  }
})
</script>

<template>
  <component :is="as" :class="cardClasses" v-bind="$attrs">
    <!-- Header slot -->
    <div v-if="$slots.header" :class="contentClasses + ' pb-0'">
      <slot name="header" />
    </div>
    
    <!-- Main content - preserve exact structure from original -->
    <div v-if="$slots.default" :class="contentClasses">
      <slot />
    </div>
    
    <!-- Actions slot with exact spacing from original -->
    <div v-if="$slots.actions" class="px-6 pb-4 flex items-center justify-end space-x-2">
      <slot name="actions" />
    </div>
  </component>
</template>