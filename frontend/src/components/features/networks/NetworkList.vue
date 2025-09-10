<!-- NetworkList Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { CloudIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import type { NetworkWithStatus } from '@/types'
import NetworkCard from './NetworkCard.vue'

interface Props {
  networks: NetworkWithStatus[]
  loading?: boolean
  searchTerm?: string
}

interface Emits {
  'network-select': [network: NetworkWithStatus]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchTerm: '',
})

const emit = defineEmits<Emits>()

const handleNetworkSelect = (network: NetworkWithStatus) => {
  emit('network-select', network)
}

const showEmptyState = computed(() => {
  return props.networks.length === 0 && !props.loading
})

const emptyStateTitle = computed(() => {
  return props.searchTerm ? 'No networks found' : 'No networks'
})

const emptyStateMessage = computed(() => {
  return props.searchTerm
    ? 'Try a different search term or clear the search'
    : 'Get started by adding your first network'
})
</script>

<template>
  <!-- Empty state - exact styling from NetworksScreen.vue -->
  <div v-if="showEmptyState" class="text-center py-12">
    <CloudIcon class="mx-auto h-12 w-12 text-gray-400" />
    <h3 class="mt-2 text-sm font-medium text-gray-900">
      {{ emptyStateTitle }}
    </h3>
    <p class="mt-1 text-sm text-gray-500">
      {{ emptyStateMessage }}
    </p>
  </div>

  <!-- Networks grid - exact styling from NetworksScreen.vue -->
  <div
    v-else
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  >
    <NetworkCard
      v-for="network in networks"
      :key="network.ID"
      :network="network"
      @select="handleNetworkSelect"
    />
  </div>

  <!-- Loading state - exact styling from NetworksScreen.vue -->
  <div v-if="loading" class="flex justify-center items-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
</template>