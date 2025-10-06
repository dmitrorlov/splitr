<script lang="ts" setup>
import { PlusIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import HostForm from '@/components/features/hosts/HostForm.vue'
import HostList from '@/components/features/hosts/HostList.vue'
import { SearchInput } from '@/components/ui'
import { useHostsStore } from '@/stores'
import type { entity } from '../wailsjs/go/models'

const emit = defineEmits<{
  error: [message: string]
  success: [message: string]
}>()

const hostsStore = useHostsStore()

const showAddHostForm = ref(false)

const searchTerm = computed(() => hostsStore.searchTerm)
const sortedHosts = computed(() => hostsStore.sortedHosts)
const searchResultCount = computed(() => sortedHosts.value.length)

const handleHostAdded = (_host: entity.Host) => {
  showAddHostForm.value = false
}

const handleFormCancel = () => {
  showAddHostForm.value = false
}

const handleSearchInput = (value: string) => {
  hostsStore.setSearchTerm(value)
}

const handleClearSearch = () => {
  hostsStore.clearSearch()
}

const openAddHostForm = () => {
  showAddHostForm.value = true
}

onMounted(async () => {
  await hostsStore.fetchHosts()
})

onUnmounted(() => {
  // Clean up any pending timeouts if needed
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Hosts</h1>
        <p class="text-gray-600">Manage your hosts</p>
      </div>
      <button
        @click="openAddHostForm"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Host
      </button>
    </div>

    <!-- Add Host Form -->
    <HostForm
      v-model:visible="showAddHostForm"
      @host-added="handleHostAdded"
      @cancel="handleFormCancel"
    />

    <!-- Search Input -->
    <SearchInput
      v-if="!showAddHostForm"
      :model-value="searchTerm"
      :result-count="searchResultCount"
      result-text="host"
      placeholder="Search hosts by address or description..."
      @update:model-value="handleSearchInput"
      @clear="handleClearSearch"
    />

    <!-- Hosts List -->
    <HostList
      :hosts="sortedHosts"
      :loading="hostsStore.loading"
      :search-term="searchTerm"
    />
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
