<!-- HostList Component - Preserves exact styling from HostsScreen.vue -->
<script setup lang="ts">
import { ServerIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import type { Host } from '@/types'
import HostCard from './HostCard.vue'

interface Props {
  hosts: Host[]
  loading?: boolean
  searchTerm?: string
}

type Emits = Record<string, never>

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchTerm: '',
})

const emit = defineEmits<Emits>()

// No event handlers needed currently
// const handleHostSelect = (host: Host) => {
//   emit('host-select', host)
// }

const showEmptyState = computed(() => {
  return props.hosts.length === 0 && !props.loading
})

const emptyStateTitle = computed(() => {
  return props.searchTerm ? 'No hosts found' : 'No hosts'
})

const emptyStateMessage = computed(() => {
  return props.searchTerm
    ? 'Try a different search term or clear the search'
    : 'Get started by adding your first host'
})
</script>

<template>
  <!-- Empty state - exact styling from HostsScreen.vue -->
  <div v-if="showEmptyState" class="text-center py-12">
    <ServerIcon class="mx-auto h-12 w-12 text-gray-400" />
    <h3 class="mt-2 text-sm font-medium text-gray-900">
      {{ emptyStateTitle }}
    </h3>
    <p class="mt-1 text-sm text-gray-500">
      {{ emptyStateMessage }}
    </p>
  </div>

  <!-- Hosts grid - similar to NetworksScreen but for hosts -->
  <div
    v-else
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  >
    <HostCard
      v-for="host in hosts"
      :key="host.ID"
      :host="host"
    />
  </div>

  <!-- Loading state - exact styling from HostsScreen.vue -->
  <div v-if="loading" class="flex justify-center items-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
</template>