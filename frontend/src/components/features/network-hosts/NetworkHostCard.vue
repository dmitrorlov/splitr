<!-- NetworkHostCard Component - Preserves exact styling from NetworkHostsScreen.vue -->
<script setup lang="ts">
import { ComputerDesktopIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { Card } from '@/components/ui'
import { useHostConfirmations, useHostNotifications } from '@/composables'
import { useNetworkHostsStore } from '@/stores'
import type { NetworkHost } from '@/types/entities'
import { formatTimestamp } from '@/utils'

interface Props {
  networkHost: NetworkHost
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Composables
const networkHostsStore = useNetworkHostsStore()
const confirmations = useHostConfirmations()
const notifications = useHostNotifications()

const handleDelete = async () => {
  try {
    const confirmed = await confirmations.confirmHostDeletion(props.networkHost.Address)
    if (!confirmed) return

    await networkHostsStore.deleteNetworkHost(props.networkHost.ID)
    notifications.notifyHostDeleted(props.networkHost.Address)
  } catch (error) {
    notifications.notifyHostError('Delete', props.networkHost.Address, error as Error)
  }
}

const isDeleting = computed(() => networkHostsStore.isNetworkHostDeleting(props.networkHost.ID))
</script>

<template>
  <Card>
    <!-- Main content - similar structure to NetworkCard but for network hosts -->
    <div>
      <div class="flex items-start justify-between">
        <div class="flex items-center">
          <ComputerDesktopIcon class="w-8 h-8 text-purple-500 mr-3 flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <h3 class="font-medium text-gray-900 group-hover:text-purple-600">
              {{ networkHost.Address }}
            </h3>
            <p v-if="networkHost.Description" class="text-sm text-gray-600 mt-1">
              {{ networkHost.Description }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Added {{ formatTimestamp(networkHost.CreatedAt.toString()) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions - exact styling from NetworkHostsScreen.vue -->
    <template #actions>
      <!-- Delete button -->
      <button
        @click.stop="handleDelete"
        :disabled="isDeleting"
        :class="[
          'p-1 rounded-full transition-colors',
          isDeleting
            ? 'cursor-not-allowed opacity-40 text-gray-400'
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
        ]"
      >
        <TrashIcon class="w-4 h-4" />
      </button>
    </template>
  </Card>
</template>