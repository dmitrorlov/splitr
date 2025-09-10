<!-- NetworksView - Refactored version with preserved UI styling -->
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, ref } from 'vue'
import NetworkForm from '../components/features/networks/NetworkForm.vue'
import NetworkList from '../components/features/networks/NetworkList.vue'
import { Button, SearchInput } from '../components/ui'
import { useNotifications } from '../composables/useNotifications'
import { useNetworksStore } from '../stores/networks'
import type { NetworkWithStatus } from '../types/entities'

// Emits - maintain compatibility with App.vue
interface Emits {
  'network-select': [network: NetworkWithStatus]
  error: [message: string]
  success: [message: string]
}

const emit = defineEmits<Emits>()

// Store and composables
const networksStore = useNetworksStore()
const notifications = useNotifications()

// Local state
const showAddForm = ref(false)

// Computed
const networks = computed(() => networksStore.sortedNetworks)
const loading = computed(() => networksStore.loading)
const searchTerm = computed({
  get: () => networksStore.searchTerm,
  set: (value: string) => networksStore.setSearchTerm(value),
})

// Actions
const handleNetworkSelect = (network: NetworkWithStatus) => {
  emit('network-select', network)
}

const handleSearch = (term: string) => {
  networksStore.setSearchTerm(term)
}

const handleClearSearch = () => {
  networksStore.clearSearch()
}

const openAddForm = async () => {
  showAddForm.value = true
}

const handleNetworkAdded = (_network: NetworkWithStatus) => {
  emit('success', 'Network added successfully')
}

const handleFormCancel = () => {
  showAddForm.value = false
}

const handleError = (message: string) => {
  emit('error', message)
}

// Lifecycle
onMounted(async () => {
  try {
    await networksStore.fetchNetworks()
  } catch (error) {
    handleError('Failed to load networks')
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header - exact styling from NetworksScreen.vue -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Networks</h1>
        <p class="text-gray-600">Manage your networks</p>
      </div>
      <Button
        variant="primary"
        @click="openAddForm"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Network
      </Button>
    </div>

    <!-- Add Network Form -->
    <NetworkForm
      v-model:visible="showAddForm"
      @network-added="handleNetworkAdded"
      @cancel="handleFormCancel"
    />

    <!-- Search Input -->
    <SearchInput
      v-if="!showAddForm"
      v-model="searchTerm"
      placeholder="Search networks by name..."
      :result-count="networks.length"
      result-text="network"
      @search="handleSearch"
      @clear="handleClearSearch"
    />

    <!-- Networks List -->
    <NetworkList
      :networks="networks"
      :loading="loading"
      :search-term="searchTerm"
      @network-select="handleNetworkSelect"
    />
  </div>
</template>