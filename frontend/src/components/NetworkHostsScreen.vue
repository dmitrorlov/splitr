<script lang="ts" setup>
import { ArrowLeftIcon, ComputerDesktopIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NetworkHostForm, NetworkHostList } from '@/components/features/network-hosts'
import { SearchInput } from '@/components/ui'
import { useHostsStore, useNetworkHostsStore } from '@/stores'
import type { entity } from '../wailsjs/go/models'
import NetworkHostsImportExport from './NetworkHostsImportExport.vue'

// Props
interface Props {
  network: entity.NetworkWithStatus
  onGoBack: () => void
}

const props = defineProps<Props>()

// Emit events
const emit = defineEmits<{
  error: [message: string]
  success: [message: string]
  loadingStart: [message: string]
  loadingEnd: []
}>()

const networkHostsStore = useNetworkHostsStore()
const hostsStore = useHostsStore()

const showAddNetworkHostForm = ref(false)

const searchTerm = computed(() => networkHostsStore.searchTerm)
const sortedNetworkHosts = computed(() => networkHostsStore.sortedNetworkHosts)
const searchResultCount = computed(() => sortedNetworkHosts.value.length)

const handleNetworkHostAdded = (_networkHost: entity.NetworkHost) => {
  showAddNetworkHostForm.value = false
}

const handleFormCancel = () => {
  showAddNetworkHostForm.value = false
}

const handleSearchInput = (value: string) => {
  networkHostsStore.setSearchTerm(value)
}

const handleClearSearch = () => {
  networkHostsStore.clearSearch()
}

const openAddNetworkHostForm = () => {
  showAddNetworkHostForm.value = true
}

const handleImportExportHostsUpdated = async () => {
  // Refresh network hosts after import
  await networkHostsStore.fetchNetworkHosts(props.network.ID)
}

// Pass through global loading events from import/export
const handleImportExportLoadingStart = (message: string) => {
  emit('loadingStart', message)
}

const handleImportExportLoadingEnd = () => {
  emit('loadingEnd')
}

const handleImportExportError = (message: string) => {
  emit('error', message)
}

const handleImportExportSuccess = (message: string) => {
  emit('success', message)
}

onMounted(async () => {
  emit('loadingStart', 'Loading network hosts...')
  try {
    await Promise.all([
      hostsStore.fetchHosts(),
      networkHostsStore.fetchNetworkHosts(props.network.ID),
    ])
  } finally {
    emit('loadingEnd')
  }
})

onUnmounted(() => {
  networkHostsStore.clearNetworkHosts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with back button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          @click="props.onGoBack"
          class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Network Hosts: {{ network.Name }}
          </h1>
          <p class="text-gray-600">Manage hosts for this network</p>
        </div>
      </div>
      <button
        @click="openAddNetworkHostForm"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Host
      </button>
    </div>

    <!-- Import/Export Panel -->
    <NetworkHostsImportExport
      :network="network"
      @error="handleImportExportError"
      @success="handleImportExportSuccess"
      @loading-start="handleImportExportLoadingStart"
      @loading-end="handleImportExportLoadingEnd"
      @hosts-updated="handleImportExportHostsUpdated"
    />

    <!-- Add Network Host Form -->
    <NetworkHostForm
      v-model:visible="showAddNetworkHostForm"
      :network-id="network.ID"
      @network-host-added="handleNetworkHostAdded"
      @cancel="handleFormCancel"
    />

    <!-- Search Input -->
    <SearchInput
      v-if="!showAddNetworkHostForm"
      :model-value="searchTerm"
      :result-count="searchResultCount"
      result-text="host"
      placeholder="Search hosts by address or description..."
      @update:model-value="handleSearchInput"
      @clear="handleClearSearch"
    />

    <!-- Network Hosts List -->
    <NetworkHostList
      :network-hosts="sortedNetworkHosts"
      :loading="networkHostsStore.loading"
      :search-term="searchTerm"
      :network-name="network.Name"
    />
  </div>
</template>
