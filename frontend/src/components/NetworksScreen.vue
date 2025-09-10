<script lang="ts" setup>
import { PlusIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, ref } from 'vue'
import NetworkForm from '@/components/features/networks/NetworkForm.vue'
import NetworkList from '@/components/features/networks/NetworkList.vue'
import { SearchInput } from '@/components/ui'
import { useNetworksStore } from '@/stores'
import type { NetworkWithStatus } from '@/types/entities'
import type { entity } from '../wailsjs/go/models'

// Props
interface Props {
  onNetworkSelect: (network: entity.NetworkWithStatus) => void
}

const props = defineProps<Props>()

// Emit events
const emit = defineEmits<{
  error: [message: string]
  success: [message: string]
}>()

// Stores
const networksStore = useNetworksStore()

// Form state
const showAddNetworkForm = ref(false)

// Computed properties
const searchTerm = computed(() => networksStore.searchTerm)
const sortedNetworks = computed(() => networksStore.sortedNetworks)
const searchResultCount = computed(() => sortedNetworks.value.length)

// Event handlers
const handleNetworkSelect = (network: entity.NetworkWithStatus) => {
  props.onNetworkSelect(network)
}

const handleNetworkAdded = (_network: NetworkWithStatus) => {
  emit('success', 'Network added successfully')
  showAddNetworkForm.value = false
}

const handleFormCancel = () => {
  showAddNetworkForm.value = false
}

const handleSearchInput = (value: string) => {
  networksStore.setSearchTerm(value)
}

const handleClearSearch = () => {
  networksStore.clearSearch()
}

const openAddNetworkForm = () => {
  showAddNetworkForm.value = true
}

// Lifecycle
onMounted(async () => {
  await networksStore.fetchNetworks()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Networks</h1>
        <p class="text-gray-600">Manage your networks</p>
      </div>
      <button
        @click="openAddNetworkForm"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Network
      </button>
    </div>

    <!-- Add Network Form -->
    <NetworkForm
      v-model:visible="showAddNetworkForm"
      @network-added="handleNetworkAdded"
      @cancel="handleFormCancel"
    />

    <!-- Search Input -->
    <SearchInput
      v-if="!showAddNetworkForm"
      :model-value="searchTerm"
      :result-count="searchResultCount"
      result-text="network"
      placeholder="Search networks by name..."
      @update:model-value="handleSearchInput"
      @clear="handleClearSearch"
    />

    <!-- Networks List -->
    <NetworkList
      :networks="sortedNetworks"
      :loading="networksStore.loading"
      :search-term="searchTerm"
      @network-select="handleNetworkSelect"
    />
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
