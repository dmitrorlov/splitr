<!-- NetworkCard Component - Preserves exact styling from NetworksScreen.vue -->
<script setup lang="ts">
import { ArrowPathIcon, ArrowRightIcon, CloudIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { Card } from '@/components/ui'
import { useNetworkConfirmations, useNetworkNotifications } from '@/composables'
import { useNetworksStore } from '@/stores'
import type { NetworkWithStatus } from '@/types/entities'
import { formatTimestamp } from '@/utils'

interface Props {
  network: NetworkWithStatus
  loading?: boolean
}

interface Emits {
  select: [network: NetworkWithStatus]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const networksStore = useNetworksStore()
const confirmations = useNetworkConfirmations()
const notifications = useNetworkNotifications()

const handleSelect = () => {
  // Prevent navigation if any operation is in progress
  if (isAnyLoading.value) {
    return
  }
  emit('select', props.network)
}

const handleSync = async () => {
  try {
    await networksStore.syncNetwork(props.network.ID)
    notifications.notifyNetworkSynced(props.network.Name)
  } catch (error) {
    notifications.notifyNetworkError('Sync', props.network.Name, error as Error)
  }
}

const handleReset = async () => {
  try {
    await networksStore.resetNetwork(props.network.ID)
    notifications.notifyNetworkReset(props.network.Name)
  } catch (error) {
    notifications.notifyNetworkError('Reset', props.network.Name, error as Error)
  }
}

const handleDelete = async () => {
  try {
    const confirmed = await confirmations.confirmNetworkDeletion(props.network.Name)
    if (!confirmed) return

    await networksStore.deleteNetwork(props.network.ID)
    notifications.notifyNetworkDeleted(props.network.Name)
  } catch (error) {
    notifications.notifyNetworkError('Delete', props.network.Name, error as Error)
  }
}

const isSyncing = computed(() => networksStore.isNetworkSyncing(props.network.ID))
const isResetting = computed(() => networksStore.isNetworkResetting(props.network.ID))
const isDeleting = computed(() => networksStore.isNetworkDeleting(props.network.ID))
const isAnyLoading = computed(() => isSyncing.value || isResetting.value || isDeleting.value)
</script>

<template>
  <Card 
    :hoverable="!isAnyLoading" 
    :clickable="!isAnyLoading" 
    :class="{ 'opacity-75 cursor-not-allowed': isAnyLoading }"
    @click="handleSelect"
  >
    <!-- Main content - exact structure from NetworksScreen.vue -->
    <div>
      <div class="flex items-start justify-between">
        <div class="flex items-center">
          <CloudIcon class="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <h3 class="font-medium text-gray-900 group-hover:text-blue-600">
              {{ network.Name }}
            </h3>
            <p class="text-xs text-gray-400 mt-1">
              Created {{ formatTimestamp(network.CreatedAt.toString()) }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <ArrowRightIcon class="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </div>

    <!-- Actions - exact styling from NetworksScreen.vue -->
    <template #actions>
      <!-- Sync button - only show if network is active -->
      <button
        v-if="network.IsActive"
        @click.stop="handleSync"
        :disabled="isAnyLoading"
        class="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        <ArrowPathIcon 
          :class="isSyncing ? 'animate-spin' : ''" 
          class="w-3 h-3 mr-1" 
        />
        Sync
      </button>

      <!-- Reset button -->
      <button
        @click.stop="handleReset"
        :disabled="isAnyLoading"
        class="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-red-400 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        <ArrowPathIcon class="w-3 h-3 mr-1 rotate-180" />
        Reset
      </button>

      <!-- Delete button -->
      <button
        @click.stop="handleDelete"
        :disabled="isAnyLoading"
        :class="[
          'p-1 rounded-full transition-colors',
          isAnyLoading
            ? 'cursor-not-allowed opacity-40 text-gray-400'
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
        ]"
      >
        <TrashIcon class="w-4 h-4" />
      </button>
    </template>
  </Card>
</template>