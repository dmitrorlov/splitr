<!-- HostForm Component - Preserves exact styling from HostsScreen.vue -->
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import { Button, Card, Input } from '@/components/ui'
import { useFormValidation, useHostNotifications, validationRules } from '@/composables'
import { useHostsStore } from '@/stores'
import type { Host } from '@/types'

interface Props {
  visible?: boolean
}

interface Emits {
  'update:visible': [visible: boolean]
  'host-added': [host: Host]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

// Stores and composables
const hostsStore = useHostsStore()
const notifications = useHostNotifications()

// Form setup
const formFields = {
  address: {
    label: 'Host Address',
    name: 'address',
    type: 'text' as const,
    required: true,
    validation: {
      required: true,
      custom: (value: string) => {
        if (!value || !value.trim()) {
          return 'Host address is required'
        }

        // Use the store's validation method
        const validationError = hostsStore.validateAddress(value.trim())
        if (validationError) {
          return validationError
        }

        return true
      },
    },
  },
  description: {
    label: 'Description',
    name: 'description',
    type: 'text' as const,
    required: false,
    validation: {
      maxLength: 200,
    },
  },
}

const { form, validate, setFieldValue, resetForm } = useFormValidation(formFields, {
  address: '',
  description: '',
})

// Loading states
const isSubmitting = ref(false)

// Actions
const handleSubmit = async () => {
  if (!validate()) return

  try {
    isSubmitting.value = true
    const host = await hostsStore.addHost(
      form.values.address.trim(),
      form.values.description?.trim()
    )

    notifications.notifyHostCreated(host.Address)
    emit('host-added', host)
    handleCancel()
  } catch (error) {
    notifications.notifyHostError('Add', form.values.address, error as Error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:visible', false)
  emit('cancel')
}

const handleAddressChange = (value: string | number) => {
  setFieldValue('address', String(value))
}

const handleDescriptionChange = (value: string | number) => {
  setFieldValue('description', String(value))
}
</script>

<template>
  <!-- Add Host Form - exact styling from HostsScreen.vue -->
  <Card v-if="visible">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">
        Add New Host
      </h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Host Address Input -->
      <Input
        :model-value="form.values.address"
        type="text"
        label="Host Address"
        placeholder="Enter IP address or hostname"
        :error="form.errors.address"
        required
        @update:model-value="handleAddressChange"
      />

      <!-- Description Input -->
      <Input
        :model-value="form.values.description"
        type="text"
        label="Description"
        placeholder="Optional description"
        :error="form.errors.description"
        @update:model-value="handleDescriptionChange"
      />

      <!-- Buttons - exact styling from HostsScreen.vue -->
      <div class="flex space-x-3">
        <Button
          type="submit"
          variant="primary"
          :loading="isSubmitting"
          :disabled="!form.valid"
          class="flex-1"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Host
        </Button>
        
        <Button
          type="button"
          variant="secondary"
          @click="handleCancel"
          class="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  </Card>
</template>