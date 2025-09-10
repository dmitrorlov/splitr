<!-- NetworkHostList Component - Preserves exact styling from NetworkHostsScreen.vue -->
<script setup lang="ts">
import { ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import type { NetworkHost } from '@/types/entities'
import NetworkHostCard from './NetworkHostCard.vue'

interface Props {
  networkHosts: NetworkHost[]
  loading?: boolean
  searchTerm?: string
  networkName?: string
}

type Emits = Record<string, never>

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchTerm: '',
})

const emit = defineEmits<Emits>()

// No event handlers needed currently
// const handleNetworkHostSelect = (networkHost: NetworkHost) => {
//   emit('network-host-select', networkHost)
// }

const showEmptyState = computed(() => {
  return props.networkHosts.length === 0 && !props.loading
})

const emptyStateTitle = computed(() => {
  return props.searchTerm ? 'No hosts found' : 'No hosts in this network'
})

const emptyStateMessage = computed(() => {
  if (props.searchTerm) {
    return 'Try a different search term or clear the search'
  }
  return props.networkName
    ? `Get started by adding hosts to ${props.networkName}`
    : 'Get started by adding hosts to this network'
})
</script>

<template>
  <!-- Empty state - exact styling from NetworkHostsScreen.vue -->
  <div v-if="showEmptyState" class="text-center py-12">
    <ComputerDesktopIcon class="mx-auto h-12 w-12 text-gray-400" />
    <h3 class="mt-2 text-sm font-medium text-gray-900">
      {{ emptyStateTitle }}
    </h3>
    <p class="mt-1 text-sm text-gray-500">
      {{ emptyStateMessage }}
    </p>
  </div>

  <!-- Network hosts grid - similar to NetworksScreen but for network hosts -->
  <div
    v-else
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  >
    <NetworkHostCard
      v-for="networkHost in networkHosts"
      :key="networkHost.ID"
      :network-host="networkHost"
    />
  </div>

  <!-- Loading state - exact styling from NetworkHostsScreen.vue -->
  <div v-if="loading" class="flex justify-center items-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
</template>