<!-- HostCard Component - Preserves exact styling from HostsScreen.vue -->
<script setup lang="ts">
import { ServerIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { Card } from '@/components/ui'
import { useHostConfirmations, useHostNotifications } from '@/composables'
import { useHostsStore } from '@/stores'
import type { Host } from '@/types/entities'
import { formatTimestamp } from '@/utils'

interface Props {
  host: Host
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Composables
const hostsStore = useHostsStore()
const confirmations = useHostConfirmations()
const notifications = useHostNotifications()

const handleDelete = async () => {
  try {
    const confirmed = await confirmations.confirmHostDeletion(props.host.Address)
    if (!confirmed) return

    await hostsStore.deleteHost(props.host.ID)
    notifications.notifyHostDeleted(props.host.Address)
  } catch (error) {
    notifications.notifyHostError('Delete', props.host.Address, error as Error)
  }
}

const isDeleting = computed(() => hostsStore.isHostDeleting(props.host.ID))
</script>

<template>
  <Card>
    <!-- Main content - similar structure to NetworkCard but for hosts -->
    <div>
      <div class="flex items-start justify-between">
        <div class="flex items-center">
          <ServerIcon class="w-8 h-8 text-green-500 mr-3" />
          <div>
            <h3 class="font-medium text-gray-900 group-hover:text-green-600">
              {{ host.Address }}
            </h3>
            <p v-if="host.Description" class="text-sm text-gray-600 mt-1">
              {{ host.Description }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Created {{ formatTimestamp(host.CreatedAt.toString()) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions - exact styling from HostsScreen.vue -->
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