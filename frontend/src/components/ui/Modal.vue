<!-- Modal Component - Preserves exact styling from ConfirmDialog.vue -->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ModalProps } from '@/types'

interface Props extends ModalProps {
  // Additional props
}

interface Emits {
  'update:modelValue': [value: boolean]
  close: []
  opened: []
  closed: []
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  closable: true,
  persistent: false,
})

const emit = defineEmits<Emits>()

const modalRef = ref<HTMLElement>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

const show = async () => {
  emit('update:modelValue', true)
  await nextTick()
  modalRef.value?.focus()
  emit('opened')
}

const hide = () => {
  emit('update:modelValue', false)
  emit('close')
  emit('closed')
}

const handleBackdropClick = () => {
  if (!props.persistent && props.closable) {
    hide()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable && !props.persistent) {
    hide()
  }
}

// Watch for external changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      nextTick(() => {
        modalRef.value?.focus()
        emit('opened')
      })
    } else {
      emit('closed')
    }
  }
)

// Expose methods
defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @keydown="handleKeydown"
    >
      <!-- Backdrop - exact styling from ConfirmDialog.vue -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="handleBackdropClick"
      />

      <!-- Modal Dialog - exact styling from ConfirmDialog.vue -->
      <div
        ref="modalRef"
        :class="[
          'relative bg-white rounded-lg shadow-xl w-full mx-4 p-6',
          sizeClasses[size]
        ]"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <!-- Header -->
        <div v-if="title || $slots.header" class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <slot name="header">
              <h3 v-if="title" class="text-lg font-medium text-gray-900">
                {{ title }}
              </h3>
            </slot>
          </div>
          
          <!-- Close button -->
          <button
            v-if="closable"
            @click="hide"
            class="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="mb-6">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="flex justify-end space-x-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>