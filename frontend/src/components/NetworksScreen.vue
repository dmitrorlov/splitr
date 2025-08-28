<script lang="ts" setup>
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CloudIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { computed, onMounted, ref } from 'vue'
import {
  AddNetwork,
  DeleteNetwork,
  ListNetworks,
  ListVPNServices,
  ResetNetworkHostSetup,
  SyncNetworkHostSetup,
} from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'
import type ConfirmDialog from './ConfirmDialog.vue'

// Types
type Network = entity.NetworkWithStatus

// Props
interface Props {
  onNetworkSelect: (network: Network) => void
}

const props = defineProps<Props>()

// Emit events
const emit = defineEmits<{
  error: [message: string]
  success: [message: string]
}>()

// Reactive state
const networks = ref<Network[]>([])
const vpnServices = ref<string[]>([])
const loading = ref(false)
const vpnServicesLoading = ref(false)
const syncLoading = ref(false)
const resetLoading = ref(false)

// Search state
const searchTerm = ref('')
const searchTimeout = ref<number | null>(null)

// Dialog state
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const resetConfirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const confirmResolver = ref<((value: boolean) => void) | null>(null)
const resetConfirmResolver = ref<((value: boolean) => void) | null>(null)

// Form state
const showAddNetworkForm = ref(false)
const newNetwork = ref({
  name: '',
})

// Computed
const sortedNetworks = computed(() => {
  return [...networks.value].sort((a, b) => {
    const dateA = new Date(a.CreatedAt.toString())
    const dateB = new Date(b.CreatedAt.toString())
    return dateB.getTime() - dateA.getTime()
  })
})

// Utility functions
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  } catch (_error) {
    return 'unknown'
  }
}

// API functions
const loadNetworks = async () => {
  try {
    loading.value = true
    const result = await ListNetworks('')
    networks.value = result || []
  } catch (error) {
    emit('error', `Failed to load networks: ${error}`)
  } finally {
    loading.value = false
  }
}

const loadVPNServices = async () => {
  try {
    vpnServicesLoading.value = true
    const result = await ListVPNServices()
    vpnServices.value = result || []
  } catch (error) {
    emit('error', `Failed to load VPN services: ${error}`)
  } finally {
    vpnServicesLoading.value = false
  }
}

const searchNetworks = async (search: string) => {
  try {
    loading.value = true
    const result = await ListNetworks(search)
    networks.value = result || []
  } catch (error) {
    console.error('Failed to search networks:', error)
    networks.value = []
  } finally {
    loading.value = false
  }
}

const handleSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    if (searchTerm.value.trim()) {
      searchNetworks(searchTerm.value.trim())
    } else {
      loadNetworks()
    }
  }, 300) as unknown as number
}

const clearSearch = () => {
  searchTerm.value = ''
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  loadNetworks()
}

const addNetwork = async () => {
  if (!newNetwork.value.name.trim()) {
    emit('error', 'Please select a VPN service')
    return
  }

  try {
    loading.value = true
    await AddNetwork(newNetwork.value.name)
    emit('success', 'Network added successfully')
    await loadNetworks()
    cancelAddNetworkForm()
  } catch (error) {
    emit('error', `Failed to add network: ${error}`)
  } finally {
    loading.value = false
  }
}

const deleteNetwork = async (id: number) => {
  // Check if runtime is available
  if (!window.go) {
    emit('error', 'Application runtime not available')
    return
  }

  if (!window.go.main) {
    emit('error', 'Application binding not available')
    return
  }

  // Use a custom confirmation dialog
  const shouldDelete = await showCustomConfirm()
  if (!shouldDelete) {
    return
  }

  try {
    loading.value = true
    await DeleteNetwork(id)
    emit('success', 'Network deleted successfully')
    await loadNetworks()
  } catch (error) {
    emit('error', `Failed to delete network: ${error}`)
  } finally {
    loading.value = false
  }
}

const syncNetworkSetup = async (networkID: number) => {
  try {
    syncLoading.value = true
    await SyncNetworkHostSetup(networkID)
    emit('success', 'Network setup synced successfully')
  } catch (error) {
    emit('error', `Failed to sync network setup: ${error}`)
  } finally {
    syncLoading.value = false
  }
}

const resetNetworkSetup = async (networkID: number) => {
  // Show confirmation dialog
  const shouldReset = await showResetConfirm()
  if (!shouldReset) {
    return
  }

  try {
    resetLoading.value = true
    await ResetNetworkHostSetup(networkID)
    emit('success', 'Network setup reset successfully')
  } catch (error) {
    emit('error', `Failed to reset network setup: ${error}`)
  } finally {
    resetLoading.value = false
  }
}

const showCustomConfirm = (): Promise<boolean> => {
  return new Promise(resolve => {
    if (confirmDialog.value) {
      // Store the resolver for later use
      confirmResolver.value = resolve
      // Show the dialog
      confirmDialog.value.show()
    } else {
      resolve(false)
    }
  })
}

const showResetConfirm = (): Promise<boolean> => {
  return new Promise(resolve => {
    if (resetConfirmDialog.value) {
      // Store the resolver for later use
      resetConfirmResolver.value = resolve
      // Show the dialog
      resetConfirmDialog.value.show()
    } else {
      resolve(false)
    }
  })
}

const handleConfirm = () => {
  if (confirmResolver.value) {
    confirmResolver.value(true)
    confirmResolver.value = null
  }
}

const handleCancel = () => {
  if (confirmResolver.value) {
    confirmResolver.value(false)
    confirmResolver.value = null
  }
}

const handleResetConfirm = () => {
  if (resetConfirmResolver.value) {
    resetConfirmResolver.value(true)
    resetConfirmResolver.value = null
  }
}

const handleResetCancel = () => {
  if (resetConfirmResolver.value) {
    resetConfirmResolver.value(false)
    resetConfirmResolver.value = null
  }
}

const openAddNetworkForm = async () => {
  showAddNetworkForm.value = true
  await loadVPNServices()
}

const cancelAddNetworkForm = () => {
  showAddNetworkForm.value = false
  newNetwork.value = { name: '' }
}

const handleNetworkSelect = (network: Network) => {
  props.onNetworkSelect(network)
}

// Lifecycle
onMounted(async () => {
  await loadNetworks()
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
        <div v-if="showAddNetworkForm" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
                Add New Network
            </h3>
            <form @submit.prevent="addNetwork" class="space-y-4">
                <div>
                    <label
                        for="network-name"
                        class="block text-sm font-medium text-gray-700"
                    >
                        VPN Service
                    </label>
                    <select
                        id="network-name"
                        v-model="newNetwork.name"
                        required
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                        <option value="" disabled class="text-gray-500">
                            Select a VPN service...
                        </option>
                        <option
                            v-for="service in vpnServices"
                            :key="service"
                            :value="service"
                            class="text-gray-900"
                        >
                            {{ service }}
                        </option>
                    </select>
                    <p
                        v-if="vpnServicesLoading"
                        class="mt-2 text-sm text-blue-600"
                    >
                        Loading VPN services...
                    </p>
                    <p
                        v-else-if="vpnServices.length === 0"
                        class="mt-2 text-sm text-orange-600"
                    >
                        No VPN services available. Please ensure VPN services
                        are configured on your system.
                    </p>
                </div>

                <div></div>

                <div class="flex space-x-3">
                    <button
                        type="submit"
                        :disabled="
                            loading ||
                            vpnServicesLoading ||
                            vpnServices.length === 0 ||
                            !newNetwork.name.trim()
                        "
                        :title="
                            vpnServicesLoading
                                ? 'Loading VPN services...'
                                : vpnServices.length === 0
                                  ? 'No VPN services available'
                                  : !newNetwork.name.trim()
                                    ? 'Please select a VPN service'
                                    : ''
                        "
                        class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <PlusIcon class="w-4 h-4 mr-2" />
                        Add Network
                    </button>
                    <button
                        type="button"
                        @click="cancelAddNetworkForm"
                        class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Search Input -->
        <div v-if="!showAddNetworkForm" class="bg-white rounded-lg shadow p-4">
            <div class="relative">
                <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                    <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                </div>
                <input
                    v-model="searchTerm"
                    @input="handleSearchInput"
                    type="text"
                    placeholder="Search networks by name..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10 pr-10"
                />
                <button
                    v-if="searchTerm"
                    @click="clearSearch"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <XMarkIcon class="h-5 w-5" />
                </button>
            </div>
            <p v-if="searchTerm" class="mt-2 text-sm text-gray-500">
                {{ sortedNetworks.length }} network{{
                    sortedNetworks.length !== 1 ? "s" : ""
                }}
                found for "{{ searchTerm }}"
            </p>
        </div>

        <!-- Networks List -->
        <div
            v-if="sortedNetworks.length === 0 && !loading"
            class="text-center py-12"
        >
            <CloudIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
                {{ searchTerm ? "No networks found" : "No networks" }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
                {{
                    searchTerm
                        ? "Try a different search term or clear the search"
                        : "Get started by adding your first network"
                }}
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-for="network in sortedNetworks"
                :key="network.ID"
                class="bg-white rounded-lg shadow hover:shadow-md transition-all group"
            >
                <div
                    class="p-6 cursor-pointer"
                    @click="handleNetworkSelect(network)"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex items-center">
                            <CloudIcon class="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                                <h3
                                    class="font-medium text-gray-900 group-hover:text-blue-600"
                                >
                                    {{ network.Name }}
                                </h3>
                                <p class="text-xs text-gray-400 mt-1">
                                    Created
                                    {{
                                        formatTimestamp(
                                            network.CreatedAt.toString(),
                                        )
                                    }}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <ArrowRightIcon
                                class="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                            />
                        </div>
                    </div>
                </div>
                <div class="px-6 pb-4 flex items-center justify-end space-x-2">
                    <button
                        v-if="network.IsActive"
                        @click.stop="syncNetworkSetup(network.ID)"
                        :disabled="syncLoading || resetLoading"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowPathIcon
                            :class="syncLoading ? 'animate-spin' : ''"
                            class="w-3 h-3 mr-1"
                        />
                        Sync
                    </button>
                    <button
                        @click.stop="resetNetworkSetup(network.ID)"
                        :disabled="resetLoading || syncLoading"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-red-400 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowPathIcon class="w-3 h-3 mr-1 rotate-180" /> Reset
                    </button>
                    <button
                        @click.stop="deleteNetwork(network.ID)"
                        :disabled="syncLoading || resetLoading"
                        :class="[
                            'p-1 rounded-full transition-colors',
                            syncLoading || resetLoading
                                ? 'cursor-not-allowed opacity-40 text-gray-400'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50',
                        ]"
                    >
                        <TrashIcon class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            ></div>
        </div>

        <!-- Confirmation Dialog -->
        <ConfirmDialog
            ref="confirmDialog"
            title="Delete Network"
            message="Are you sure you want to delete this network?"
            confirm-text="Delete"
            cancel-text="Cancel"
            type="danger"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        />

        <!-- Reset Confirmation Dialog -->
        <ConfirmDialog
            ref="resetConfirmDialog"
            title="Reset Network Setup"
            message="Reset setup for this network?"
            confirm-text="Reset"
            cancel-text="Cancel"
            type="warning"
            @confirm="handleResetConfirm"
            @cancel="handleResetCancel"
        />
    </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
