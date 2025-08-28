<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  AddNetworkHost,
  DeleteNetworkHost,
  ExportNetworkHosts,
  ImportNetworkHosts,
  ListHosts,
  ListNetworkHosts,
  SaveFileWithDialog,
} from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'
import type ConfirmDialog from './ConfirmDialog.vue'

// Types
type Host = entity.Host
type Network = entity.NetworkWithStatus
type NetworkHost = entity.NetworkHost

// Props
interface Props {
  network: Network
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

// Reactive state
const networkHosts = ref<NetworkHost[]>([])
const hosts = ref<Host[]>([])
const loading = ref(false)

// Search state
const searchTerm = ref('')
const searchTimeout = ref<number | null>(null)

// Dialog state
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const confirmResolver = ref<((value: boolean) => void) | null>(null)

// Form state
const showAddNetworkHostForm = ref(false)
const hostSelectionMode = ref<'manual' | 'existing'>('manual')
const selectedExistingHost = ref<Host | null>(null)
const newNetworkHost = ref({
  address: '',
  description: '',
})

// Import/Export state
const showImportExport = ref(false)
const exportData = ref<string>('')
const importData = ref<string>('')
const importLoading = ref(false)

// Computed
const selectedNetworkHosts = computed(() => {
  return networkHosts.value
})

const availableHostsComputed = computed(() => {
  const networkHostAddresses = new Set(networkHosts.value.map(nh => nh.Address))
  return hosts.value.filter(host => !networkHostAddresses.has(host.Address))
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

const loadNetworkHosts = async () => {
  try {
    loading.value = true
    const result = await ListNetworkHosts(props.network.ID, '')
    networkHosts.value = result || []
  } catch (error) {
    console.error('Failed to load network hosts:', error)
    networkHosts.value = []
  } finally {
    loading.value = false
  }
}

const searchNetworkHosts = async (search: string) => {
  try {
    loading.value = true
    const result = await ListNetworkHosts(props.network.ID, search)
    networkHosts.value = result || []
  } catch (error) {
    console.error('Failed to search network hosts:', error)
    networkHosts.value = []
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
      searchNetworkHosts(searchTerm.value.trim())
    } else {
      loadNetworkHosts()
    }
  }, 300) as unknown as number
}

const clearSearch = () => {
  searchTerm.value = ''
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  loadNetworkHosts()
}

const addNetworkHost = async () => {
  if (!newNetworkHost.value.address.trim()) {
    emit('error', 'Please enter a host address')
    return
  }

  try {
    // Emit global loading start with specific message
    emit('loadingStart', 'Adding host to network...')
    loading.value = true

    await AddNetworkHost(
      props.network.ID,
      newNetworkHost.value.address,
      newNetworkHost.value.description
    )
    emit('success', 'Host added to network successfully')
    await loadNetworkHosts()
    resetNetworkHostForm()
    showAddNetworkHostForm.value = false
  } catch (error) {
    emit('error', `Failed to add host to network: ${error}`)
  } finally {
    loading.value = false
    // Emit global loading end
    emit('loadingEnd')
  }
}

const deleteNetworkHost = async (id: number) => {
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
  const shouldDelete = await showCustomConfirm(
    'Are you sure you want to remove this host from the network?'
  )
  if (!shouldDelete) {
    return
  }

  try {
    // Emit global loading start with specific message
    emit('loadingStart', 'Removing host from network...')
    loading.value = true

    await DeleteNetworkHost(id)
    emit('success', 'Host removed from network successfully')
    await loadNetworkHosts()
  } catch (error) {
    emit('error', `Failed to remove host from network: ${error}`)
  } finally {
    loading.value = false
    // Emit global loading end
    emit('loadingEnd')
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

const resetNetworkHostForm = () => {
  newNetworkHost.value = { address: '', description: '' }
  selectedExistingHost.value = null
  hostSelectionMode.value = 'manual'
}

const handleHostSelectionModeChange = () => {
  // Only reset form fields, not the selection mode
  newNetworkHost.value = { address: '', description: '' }
  selectedExistingHost.value = null
}

const handleExistingHostSelect = () => {
  if (selectedExistingHost.value) {
    newNetworkHost.value.address = selectedExistingHost.value.Address
    newNetworkHost.value.description = selectedExistingHost.value.Description || ''
  }
}

// Import/Export handlers
const toggleImportExport = () => {
  showImportExport.value = !showImportExport.value
  if (!showImportExport.value) {
    // Clear data when closing
    exportData.value = ''
    importData.value = ''
  }
}

const exportNetworkHosts = async () => {
  try {
    emit('loadingStart', 'Exporting network hosts...')
    const jsonData = await ExportNetworkHosts(props.network.ID)
    exportData.value = jsonData
    emit('success', 'Network hosts exported successfully')
  } catch (error) {
    emit('error', `Failed to export network hosts: ${error}`)
  } finally {
    emit('loadingEnd')
  }
}

const downloadExportData = async () => {
  if (!exportData.value) {
    emit('error', 'No export data available')
    return
  }

  try {
    emit('loadingStart', 'Saving export file...')

    // Create a suggested filename
    const sanitizedNetworkName = props.network.Name.replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `${sanitizedNetworkName}_hosts_${timestamp}.json`

    // Use the native save dialog
    const savedPath = await SaveFileWithDialog(filename, exportData.value)

    if (savedPath) {
      emit('success', `Export file saved to: ${savedPath}`)
    } else {
      // User cancelled the dialog
      emit('success', 'Save cancelled by user')
    }
  } catch (error) {
    console.error('Save error:', error)
    emit('error', `Failed to save file: ${error}`)
  } finally {
    emit('loadingEnd')
  }
}

const copyExportData = async () => {
  if (!exportData.value) return

  try {
    await navigator.clipboard.writeText(exportData.value)
    emit('success', 'Export data copied to clipboard')
  } catch (_error) {
    emit('error', 'Failed to copy to clipboard')
  }
}

const importNetworkHosts = async () => {
  if (!importData.value.trim()) {
    emit('error', 'Please enter JSON data to import')
    return
  }

  try {
    importLoading.value = true
    emit('loadingStart', 'Importing network hosts...')

    await ImportNetworkHosts(props.network.ID, importData.value)

    emit('success', 'Network hosts imported successfully')
    await loadNetworkHosts()

    // Clear import data and close panel
    importData.value = ''
    showImportExport.value = false
  } catch (error) {
    emit('error', `Failed to import network hosts: ${error}`)
  } finally {
    importLoading.value = false
    emit('loadingEnd')
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    emit('error', 'Please select a JSON file')
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    const result = e.target?.result as string
    if (result) {
      importData.value = result
    }
  }
  reader.onerror = () => {
    emit('error', 'Failed to read file')
  }
  reader.readAsText(file)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadHosts(), loadNetworkHosts()])
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
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <button
                    @click="props.onGoBack"
                    class="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeftIcon class="w-5 h-5" />
                </button>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        {{ props.network.Name }} Hosts
                    </h1>
                    <p class="text-gray-600">
                        {{ selectedNetworkHosts.length }} hosts configured
                    </p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button
                    @click="toggleImportExport"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                    <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                    Import/Export
                </button>
                <button
                    @click="showAddNetworkHostForm = true"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Add Host
                </button>
            </div>
        </div>

        <!-- Search Input -->
        <div
            v-if="!showAddNetworkHostForm"
            class="bg-white rounded-lg shadow p-4"
        >
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
                {{ selectedNetworkHosts.length }} host{{
                    selectedNetworkHosts.length !== 1 ? "s" : ""
                }}
                found for "{{ searchTerm }}"
            </p>
        </div>

        <!-- Import/Export Panel -->
        <div v-if="showImportExport" class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">
                    Import/Export Network Hosts
                </h3>
                <button
                    @click="toggleImportExport"
                    class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Export Section -->
                <div class="space-y-4">
                    <div class="border-b border-gray-200 pb-2">
                        <h4 class="text-md font-medium text-gray-900 flex items-center">
                            <DocumentArrowUpIcon class="w-5 h-5 mr-2 text-blue-600" />
                            Export Hosts
                        </h4>
                        <p class="text-sm text-gray-600 mt-1">
                            Export all hosts from this network to JSON format.
                        </p>
                    </div>

                    <button
                        @click="exportNetworkHosts"
                        :disabled="loading"
                        class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
                        Export to JSON
                    </button>

                    <div v-if="exportData" class="space-y-3">
                        <div class="border border-gray-300 rounded-md">
                            <div class="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
                                <span class="text-sm font-medium text-gray-700">Exported Data:</span>
                                <div class="flex space-x-2">
                                    <button
                                        @click="copyExportData"
                                        class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        <ClipboardDocumentIcon class="w-3 h-3 mr-1" />
                                        Copy
                                    </button>
                                    <button
                                        @click="downloadExportData"
                                        class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        <ArrowDownTrayIcon class="w-3 h-3 mr-1" />
                                        Download
                                    </button>
                                </div>
                            </div>
                            <textarea
                                v-model="exportData"
                                readonly
                                rows="8"
                                class="w-full px-3 py-2 text-sm font-mono bg-white text-gray-900 border-0 focus:ring-0 resize-none"
                                placeholder="Exported JSON data will appear here..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                <!-- Import Section -->
                <div class="space-y-4">
                    <div class="border-b border-gray-200 pb-2">
                        <h4 class="text-md font-medium text-gray-900 flex items-center">
                            <DocumentArrowDownIcon class="w-5 h-5 mr-2 text-green-600" />
                            Import Hosts
                        </h4>
                        <p class="text-sm text-gray-600 mt-1">
                            Import hosts from JSON data or upload a JSON file.
                        </p>
                    </div>

                    <div class="space-y-3">
                        <!-- File Upload -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Upload JSON File:
                            </label>
                            <input
                                type="file"
                                accept=".json,application/json"
                                @change="handleFileUpload"
                                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        <!-- Manual Input -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Or paste JSON data:
                            </label>
                            <textarea
                                v-model="importData"
                                rows="8"
                                class="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Paste JSON data here or upload a file above..."
                            ></textarea>
                        </div>

                        <button
                            @click="importNetworkHosts"
                            :disabled="importLoading || !importData.trim()"
                            class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                            <span v-if="importLoading">Importing...</span>
                            <span v-else>Import from JSON</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Network Host Form -->
        <div
            v-if="showAddNetworkHostForm"
            class="bg-white rounded-lg shadow p-6"
        >
            <h3 class="text-lg font-medium text-gray-900 mb-4">
                Add Host to {{ props.network.Name }}
            </h3>
            <form @submit.prevent="addNetworkHost" class="space-y-4">
                <!-- Host Selection Mode -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        Host Input Method
                    </label>
                    <div class="flex space-x-4">
                        <label class="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                v-model="hostSelectionMode"
                                value="manual"
                                class="mr-2 text-blue-600 focus:ring-blue-500"
                                @change="handleHostSelectionModeChange"
                            />
                            <span class="text-sm text-gray-700"
                                >Manual Input</span
                            >
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                v-model="hostSelectionMode"
                                value="existing"
                                class="mr-2 text-blue-600 focus:ring-blue-500"
                                :disabled="availableHostsComputed.length === 0"
                                @change="handleHostSelectionModeChange"
                            />
                            <span
                                class="text-sm"
                                :class="
                                    availableHostsComputed.length === 0
                                        ? 'text-gray-400'
                                        : 'text-gray-700'
                                "
                            >
                                Select Existing Host ({{
                                    availableHostsComputed.length
                                }}
                                available)
                            </span>
                        </label>
                    </div>
                </div>

                <!-- Existing Host Selection -->
                <div v-if="hostSelectionMode === 'existing'">
                    <label
                        for="existing-host-select"
                        class="block text-sm font-medium text-gray-700"
                    >
                        Select Existing Host
                    </label>
                    <div
                        v-if="availableHostsComputed.length === 0"
                        class="mt-1 p-4 bg-yellow-50 border border-yellow-200 rounded-md"
                    >
                        <p class="text-sm text-yellow-700 flex items-center">
                            <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
                            <span v-if="hosts.length === 0">
                                No hosts available. Please add some hosts first,
                                or switch to manual input.
                            </span>
                            <span v-else>
                                All existing hosts are already added to this
                                network. Please use manual input to add a new
                                host.
                            </span>
                        </p>
                    </div>
                    <select
                        v-else
                        id="existing-host-select"
                        v-model="selectedExistingHost"
                        @change="handleExistingHostSelect"
                        required
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                        <option :value="null" disabled class="text-gray-500">
                            Choose a host from
                            {{ availableHostsComputed.length }} available...
                        </option>
                        <option
                            v-for="host in availableHostsComputed"
                            :key="host.ID"
                            :value="host"
                            class="text-gray-900"
                        >
                            {{ host.Address }}
                            {{
                                host.Description ? `(${host.Description})` : ""
                            }}
                        </option>
                    </select>
                </div>

                <!-- Manual Host Input -->
                <div v-if="hostSelectionMode === 'manual'">
                    <label
                        for="network-host-address"
                        class="block text-sm font-medium text-gray-700"
                    >
                        Host Address
                    </label>
                    <input
                        id="network-host-address"
                        v-model="newNetworkHost.address"
                        type="text"
                        required
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="IP address or hostname..."
                    />
                </div>

                <!-- Description (always shown) -->
                <div>
                    <label
                        for="network-host-description"
                        class="block text-sm font-medium text-gray-700"
                    >
                        Description
                    </label>
                    <input
                        id="network-host-description"
                        v-model="newNetworkHost.description"
                        type="text"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional description..."
                    />
                </div>

                <!-- Preview (when existing host is selected) -->
                <div
                    v-if="
                        hostSelectionMode === 'existing' && selectedExistingHost
                    "
                    class="bg-blue-50 border border-blue-200 rounded-md p-3"
                >
                    <p class="text-sm text-blue-700 flex items-center">
                        <CheckCircleIcon class="w-4 h-4 mr-2 text-blue-500" />
                        <strong>Selected Host:</strong>
                        <span class="ml-1">{{
                            selectedExistingHost.Address
                        }}</span>
                        <span
                            v-if="selectedExistingHost.Description"
                            class="ml-1 text-blue-600"
                        >
                            ({{ selectedExistingHost.Description }})
                        </span>
                    </p>
                </div>

                <div class="flex space-x-3">
                    <button
                        type="submit"
                        :disabled="
                            loading ||
                            !newNetworkHost.address.trim() ||
                            (hostSelectionMode === 'existing' &&
                                availableHostsComputed.length === 0)
                        "
                        class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        <PlusIcon class="w-4 h-4 mr-2" />
                        Add Host
                    </button>
                    <button
                        type="button"
                        @click="
                            showAddNetworkHostForm = false;
                            resetNetworkHostForm();
                        "
                        class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <!-- Network Hosts List -->
        <div
            v-if="selectedNetworkHosts.length === 0 && !loading"
            class="text-center py-12"
        >
            <ComputerDesktopIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
                {{ searchTerm ? "No hosts found" : "No hosts configured" }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
                {{
                    searchTerm
                        ? "Try a different search term or clear the search"
                        : "Add hosts to this network to get started"
                }}
            </p>
        </div>

        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-for="networkHost in selectedNetworkHosts"
                :key="networkHost.ID"
                class="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
                <div class="p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start">
                            <ComputerDesktopIcon
                                class="w-6 h-6 text-green-500 mr-3 mt-1"
                            />
                            <div>
                                <h4
                                    v-if="networkHost.Description"
                                    class="font-medium text-gray-900"
                                >
                                    {{ networkHost.Description }}
                                </h4>
                                <h4 v-else class="font-medium text-gray-900">
                                    {{ networkHost.Address }}
                                </h4>
                                <p class="text-sm text-gray-500 mt-1">
                                    {{ networkHost.Address }}
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                    Added
                                    {{
                                        formatTimestamp(
                                            networkHost.CreatedAt.toString(),
                                        )
                                    }}
                                </p>
                            </div>
                        </div>
                        <button
                            @click="deleteNetworkHost(networkHost.ID)"
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
            title="Remove Host"
            message="Are you sure you want to remove this host from the network?"
            confirm-text="Remove"
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
