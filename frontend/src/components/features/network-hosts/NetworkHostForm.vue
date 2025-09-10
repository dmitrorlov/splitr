<!-- NetworkHostForm Component - Preserves exact styling from NetworkHostsScreen.vue -->
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { Button, Card, Input, Select } from '@/components/ui'
import { useFormValidation, useHostNotifications } from '@/composables'
import { useHostsStore, useNetworkHostsStore } from '@/stores'
import type { Host, NetworkHost } from '@/types/entities'

interface Props {
  visible?: boolean
  networkId: number
}

interface Emits {
  'update:visible': [visible: boolean]
  'network-host-added': [networkHost: NetworkHost]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

// Stores and composables
const networkHostsStore = useNetworkHostsStore()
const hostsStore = useHostsStore()
const notifications = useHostNotifications()

// Form setup
const hostSelectionMode = ref<'manual' | 'existing'>('manual')
const selectedExistingHost = ref<Host | null>(null)

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
        const validationError = networkHostsStore.validateAddress(value.trim())
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

// Computed
const availableHosts = computed(() => {
  const networkHostAddresses = new Set(
    networkHostsStore.networkHosts.map((nh: NetworkHost) => nh.Address)
  )
  return hostsStore.hosts.filter((host: Host) => !networkHostAddresses.has(host.Address))
})

const hostOptions = computed(() => {
  return availableHosts.value.map((host: Host) => ({
    value: host.Address,
    label: host.Description ? `${host.Address} (${host.Description})` : host.Address,
    host: host,
  }))
})

// Watch for form visibility to load hosts
watch(
  () => props.visible,
  async visible => {
    if (visible) {
      await hostsStore.fetchHosts()
    }
  }
)

// Watch for existing host selection
watch(selectedExistingHost, host => {
  if (host) {
    setFieldValue('address', host.Address)
    setFieldValue('description', host.Description || '')
  }
})

// Actions
const handleSubmit = async () => {
  if (!validate()) return

  try {
    isSubmitting.value = true
    const networkHost = await networkHostsStore.addNetworkHost(
      props.networkId,
      form.values.address.trim(),
      form.values.description?.trim()
    )

    notifications.notifyHostCreated(networkHost.Address)
    emit('network-host-added', networkHost)
    handleCancel()
  } catch (error) {
    notifications.notifyHostError('Add', form.values.address, error as Error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
  selectedExistingHost.value = null
  hostSelectionMode.value = 'manual'
  emit('update:visible', false)
  emit('cancel')
}

const handleAddressChange = (value: string | number) => {
  setFieldValue('address', String(value))
}

const handleDescriptionChange = (value: string | number) => {
  setFieldValue('description', String(value))
}

const handleModeChange = () => {
  resetForm()
  selectedExistingHost.value = null
}

const handleExistingHostSelect = (value: string | number) => {
  const hostAddress = String(value)
  const host = availableHosts.value.find((h: Host) => h.Address === hostAddress)
  if (host) {
    selectedExistingHost.value = host
  }
}
</script>

<template>
  <!-- Add Network Host Form - exact styling from NetworkHostsScreen.vue -->
  <Card v-if="visible">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">
        Add Host to Network
      </h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Host Selection Mode - exact styling from original -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          How would you like to add the host?
        </label>
        <div class="flex space-x-4">
          <label class="flex items-center">
            <input
              v-model="hostSelectionMode"
              type="radio"
              value="manual"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              @change="handleModeChange"
            />
            <span class="ml-2 text-sm text-gray-700">Enter manually</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="hostSelectionMode"
              type="radio"
              value="existing"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              @change="handleModeChange"
            />
            <span class="ml-2 text-sm text-gray-700">Select from existing hosts</span>
          </label>
        </div>
      </div>

      <!-- Existing Host Selection -->
      <Select
        v-if="hostSelectionMode === 'existing'"
        :model-value="selectedExistingHost?.Address || ''"
        :options="hostOptions"
        label="Existing Host"
        placeholder="Select a host to add to this network"
        :empty-text="availableHosts.length === 0 ? 'No available hosts (all hosts are already in this network)' : 'No hosts found'"
        @update:model-value="handleExistingHostSelect"
      />

      <!-- Manual Host Entry -->
      <template v-if="hostSelectionMode === 'manual'">
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
      </template>

      <!-- Auto-filled fields for existing host selection -->
      <template v-if="hostSelectionMode === 'existing' && selectedExistingHost">
        <Input
          :model-value="form.values.address"
          type="text"
          label="Host Address"
          :disabled="true"
          readonly
        />

        <Input
          :model-value="form.values.description"
          type="text"
          label="Description"
          placeholder="Optional description"
          :error="form.errors.description"
          @update:model-value="handleDescriptionChange"
        />
      </template>

      <!-- Buttons - exact styling from NetworkHostsScreen.vue -->
      <div class="flex space-x-3">
        <Button
          type="submit"
          variant="primary"
          :loading="isSubmitting"
          :disabled="!form.valid || (hostSelectionMode === 'existing' && !selectedExistingHost)"
          class="flex-1"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add to Network
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