<!-- NetworkForm Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { Button, Card, Select } from '@/components/ui'
import { useFormValidation, useNetworkNotifications, validationRules } from '@/composables'
import { useNetworksStore } from '@/stores'
import type { Network } from '@/types'

interface Props {
  visible?: boolean
}

interface Emits {
  'update:visible': [visible: boolean]
  'network-added': [network: Network]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

// Stores and composables
const networksStore = useNetworksStore()
const notifications = useNetworkNotifications()

// Form setup
const formFields = {
  name: {
    label: 'VPN Service',
    name: 'name',
    type: 'select' as const,
    required: true,
    validation: {
      required: true,
      custom: (value: string) => {
        if (!value || !value.trim()) {
          return 'Please select a VPN service'
        }
        return true
      },
    },
  },
}

const { form, validate, setFieldValue, resetForm } = useFormValidation(formFields, { name: '' })

// VPN services options
const vpnServiceOptions = computed(() => {
  return networksStore.vpnServices.map(service => ({
    value: service,
    label: service,
  }))
})

// Loading states
const isSubmitting = ref(false)

// Load VPN services when form becomes visible
watch(
  () => props.visible,
  async visible => {
    if (visible) {
      await networksStore.fetchVPNServices()
    }
  }
)

// Actions
const handleSubmit = async () => {
  if (!validate()) return

  try {
    isSubmitting.value = true
    const network = await networksStore.addNetwork(form.values.name)

    notifications.notifyNetworkCreated(network.Name)
    emit('network-added', network)
    handleCancel()
  } catch (error) {
    notifications.notifyNetworkError('Add', form.values.name, error as Error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:visible', false)
  emit('cancel')
}

const handleNetworkNameChange = (value: string | number) => {
  setFieldValue('name', String(value))
}
</script>

<template>
  <!-- Add Network Form - exact styling from NetworksScreen.vue -->
  <Card v-if="visible">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">
        Add New Network
      </h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <Select
        :model-value="form.values.name"
        :options="vpnServiceOptions"
        :loading="networksStore.loading"
        :error="form.errors.name"
        label="VPN Service"
        placeholder="Select a VPN service..."
        loading-text="Loading VPN services..."
        empty-text="No VPN services available. Please ensure VPN services are configured on your system."
        required
        @update:model-value="handleNetworkNameChange"
      />

      <!-- Buttons - exact styling from NetworksScreen.vue -->
      <div class="flex space-x-3">
        <Button
          type="submit"
          variant="primary"
          :loading="isSubmitting"
          :disabled="!form.valid || vpnServiceOptions.length === 0"
          class="flex-1"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Network
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