<script lang="ts" setup>
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { nextTick, ref } from 'vue'

interface ConfirmDialogProps {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'warning',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const isVisible = ref(false)
const confirmButtonRef = ref<HTMLButtonElement>()

const show = async () => {
  isVisible.value = true
  await nextTick()
  confirmButtonRef.value?.focus()
}

const hide = () => {
  isVisible.value = false
}

const handleConfirm = () => {
  hide()
  emit('confirm')
}

const handleCancel = () => {
  hide()
  emit('cancel')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter') {
    handleConfirm()
  }
}

// Expose the show method to parent components
defineExpose({ show, hide })
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isVisible"
            class="fixed inset-0 z-50 flex items-center justify-center"
            @keydown="handleKeydown"
        >
            <!-- Backdrop -->
            <div
                class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                @click="handleCancel"
            ></div>

            <!-- Dialog -->
            <div
                class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                role="dialog"
                aria-modal="true"
            >
                <!-- Icon and Title -->
                <div class="flex items-center mb-4">
                    <div
                        :class="{
                            'bg-yellow-100': type === 'warning',
                            'bg-red-100': type === 'danger',
                            'bg-blue-100': type === 'info'
                        }"
                        class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    >
                        <ExclamationTriangleIcon
                            :class="{
                                'text-yellow-600': type === 'warning',
                                'text-red-600': type === 'danger',
                                'text-blue-600': type === 'info'
                            }"
                            class="w-6 h-6"
                        />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">
                        {{ title }}
                    </h3>
                </div>

                <!-- Message -->
                <div class="mb-6">
                    <p class="text-sm text-gray-600">{{ message }}</p>
                </div>

                <!-- Buttons -->
                <div class="flex justify-end space-x-3">
                    <button
                        @click="handleCancel"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {{ cancelText }}
                    </button>
                    <button
                        ref="confirmButtonRef"
                        @click="handleConfirm"
                        :class="{
                            'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500': type === 'warning',
                            'bg-red-600 hover:bg-red-700 focus:ring-red-500': type === 'danger',
                            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500': type === 'info'
                        }"
                        class="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                        {{ confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* Additional styles for better modal behavior */
.fixed {
    position: fixed;
}
</style>
