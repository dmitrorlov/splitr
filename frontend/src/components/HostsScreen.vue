<script lang="ts" setup>
import { PlusIcon, ServerIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { onMounted, onUnmounted, ref } from 'vue'
import { AddHost, DeleteHost, ListHosts } from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'
import type ConfirmDialog from './ConfirmDialog.vue'

// Types
type Host = entity.Host

// Emit events
const emit = defineEmits<{
  error: [message: string]
  success: [message: string]
}>()

// Reactive state
const hosts = ref<Host[]>([])
const loading = ref(false)

// Search state
const searchTerm = ref('')
const searchTimeout = ref<number | null>(null)

// Dialog state
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const confirmResolver = ref<((value: boolean) => void) | null>(null)

// Form state
const showAddHostForm = ref(false)
const newHost = ref({
  address: '',
  description: '',
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
const loadHosts = async () => {
  try {
    loading.value = true
    const result = await ListHosts('')
    hosts.value = result || []
  } catch (error) {
    emit('error', `Failed to load hosts: ${error}`)
  } finally {
    loading.value = false
  }
}

const searchHosts = async (search: string) => {
  try {
    loading.value = true
    const result = await ListHosts(search)
    hosts.value = result || []
  } catch (error) {
    console.error('Failed to search hosts:', error)
    hosts.value = []
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
      searchHosts(searchTerm.value.trim())
    } else {
      loadHosts()
    }
  }, 300) as unknown as number
}

const clearSearch = () => {
  searchTerm.value = ''
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  loadHosts()
}

const addHost = async () => {
  if (!newHost.value.address.trim()) {
    emit('error', 'Please enter a host address')
    return
  }

  try {
    loading.value = true
    await AddHost(newHost.value.address, newHost.value.description)
    emit('success', 'Host added successfully')
    await loadHosts()
    resetHostForm()
    showAddHostForm.value = false
  } catch (error) {
    emit('error', `Failed to add host: ${error}`)
  } finally {
    loading.value = false
  }
}

const deleteHost = async (id: number) => {
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
  const shouldDelete = await showCustomConfirm('Are you sure you want to delete this host?')
  if (!shouldDelete) {
    return
  }

  try {
    loading.value = true
    await DeleteHost(id)
    emit('success', 'Host deleted successfully')
    await loadHosts()
  } catch (error) {
    emit('error', `Failed to delete host: ${error}`)
  } finally {
    loading.value = false
  }
}

const showCustomConfirm = (_message: string): Promise<boolean> => {
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

const resetHostForm = () => {
  newHost.value = { address: '', description: '' }
}

// Lifecycle
onMounted(async () => {
  await loadHosts()
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
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
                @click="showAddHostForm = true"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
                <PlusIcon class="w-4 h-4 mr-2" />
                Add Host
            </button>
        </div>

        <!-- Search Input -->
        <div v-if="!showAddHostForm" class="bg-white rounded-lg shadow p-4">
            <div class="relative">
                <input
                    v-model="searchTerm"
                    @input="handleSearchInput"
                    type="text"
                    placeholder="Search hosts by address or description..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10 pr-10"
                />
                <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                    <svg
                        class="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <button
                    v-if="searchTerm"
                    @click="clearSearch"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <svg
                        class="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                        />
                    </svg>
                </button>
            </div>
            <p v-if="searchTerm" class="mt-2 text-sm text-gray-500">
                {{ hosts.length }} host{{ hosts.length !== 1 ? "s" : "" }} found
                for "{{ searchTerm }}"
            </p>
        </div>

        <!-- Add Host Form -->
        <div v-if="showAddHostForm" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Host</h3>
            <form @submit.prevent="addHost" class="space-y-4">
                <div>
                    <label
                        for="host-address"
                        class="block text-sm font-medium text-gray-700"
                    >
                        Host Address
                    </label>
                    <input
                        id="host-address"
                        v-model="newHost.address"
                        type="text"
                        required
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="IP address or hostname..."
                    />
                </div>

                <div>
                    <label
                        for="host-description"
                        class="block text-sm font-medium text-gray-700"
                    >
                        Description
                    </label>
                    <input
                        id="host-description"
                        v-model="newHost.description"
                        type="text"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional description..."
                    />
                </div>

                <div class="flex space-x-3">
                    <button
                        type="submit"
                        :disabled="loading"
                        class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <PlusIcon class="w-4 h-4 mr-2" />
                        Add Host
                    </button>
                    <button
                        type="button"
                        @click="
                            showAddHostForm = false;
                            resetHostForm();
                        "
                        class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Hosts List -->
        <div v-if="hosts.length === 0 && !loading" class="text-center py-12">
            <ServerIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
                {{ searchTerm ? "No hosts found" : "No hosts" }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
                {{
                    searchTerm
                        ? "Try a different search term or clear the search"
                        : "Get started by adding your first host"
                }}
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-for="host in hosts"
                :key="host.ID"
                class="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
                <div class="p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start">
                            <ServerIcon
                                class="w-8 h-8 text-blue-500 mr-3 mt-1"
                            />
                            <div>
                                <h4
                                    v-if="host.Description"
                                    class="font-medium text-gray-900"
                                >
                                    {{ host.Description }}
                                </h4>
                                <h4 v-else class="font-medium text-gray-900">
                                    {{ host.Address }}
                                </h4>
                                <p class="text-sm text-gray-500 mt-1">
                                    {{ host.Address }}
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                    Added
                                    {{
                                        formatTimestamp(
                                            host.CreatedAt.toString(),
                                        )
                                    }}
                                </p>
                            </div>
                        </div>
                        <button
                            @click="deleteHost(host.ID)"
                            class="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                        >
                            <TrashIcon class="w-4 h-4" />
                        </button>
                    </div>
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
            title="Delete Host"
            message="Are you sure you want to delete this host?"
            confirm-text="Delete"
            cancel-text="Cancel"
            type="danger"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        />
    </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
