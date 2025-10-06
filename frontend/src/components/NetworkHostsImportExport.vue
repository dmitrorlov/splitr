<script lang="ts" setup>
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import {
  ExportNetworkHosts,
  ImportNetworkHosts,
  SaveFileWithDialog,
} from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'

interface Props {
  network: entity.NetworkWithStatus
}

const props = defineProps<Props>()

const emit = defineEmits<{
  error: [message: string]
  success: [message: string]
  loadingStart: [message: string]
  loadingEnd: []
  hostsUpdated: []
}>()

const showImportExport = ref(false)
const exportData = ref<string>('')
const importData = ref<string>('')
const loading = ref(false)

const handleExport = async () => {
  try {
    loading.value = true
    emit('loadingStart', 'Exporting network hosts...')

    const jsonData = await ExportNetworkHosts(props.network.ID)
    exportData.value = jsonData

    // Use native file dialog to save the file
    const filename = `${props.network.Name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_hosts_export`
    const savedPath = await SaveFileWithDialog(filename, jsonData)

    if (savedPath) {
      emit('success', `Network hosts exported successfully to: ${savedPath}`)
    }
    // If savedPath is empty, user cancelled the dialog - don't show any message
  } catch (error) {
    emit('error', `Failed to export network hosts: ${error}`)
  } finally {
    loading.value = false
    emit('loadingEnd')
  }
}

const handleImport = async () => {
  if (!importData.value.trim()) {
    emit('error', 'Please enter JSON data to import')
    return
  }

  try {
    loading.value = true
    emit('loadingStart', 'Importing network hosts...')

    // Validate JSON format
    JSON.parse(importData.value)

    await ImportNetworkHosts(props.network.ID, importData.value)

    emit('success', 'Network hosts imported successfully!')
    emit('hostsUpdated') // Notify parent to refresh the hosts list

    // Clear import data
    importData.value = ''
  } catch (error) {
    if (error instanceof SyntaxError) {
      emit('error', 'Invalid JSON format. Please check your data.')
    } else {
      emit('error', `Failed to import network hosts: ${error}`)
    }
  } finally {
    loading.value = false
    emit('loadingEnd')
  }
}

// File upload handler
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    emit('error', 'Please select a JSON file')
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    importData.value = e.target?.result as string
  }
  reader.readAsText(file)
}

// Copy export data to clipboard
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportData.value)
    emit('success', 'Export data copied to clipboard!')
  } catch (_error) {
    emit('error', 'Failed to copy to clipboard')
  }
}
</script>

<template>
    <div class="bg-white rounded-lg shadow">
        <!-- Toggle Button -->
        <div class="px-6 py-4 border-b border-gray-200">
            <button
                @click="showImportExport = !showImportExport"
                class="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
                <ArrowUpTrayIcon v-if="!showImportExport" class="w-4 h-4" />
                <ArrowDownTrayIcon v-if="showImportExport" class="w-4 h-4" />
                <span
                    >{{
                        showImportExport ? "Hide" : "Show"
                    }}
                    Import/Export</span
                >
            </button>
        </div>

        <!-- Import/Export Panel -->
        <div v-if="showImportExport" class="p-6 space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Export Section -->
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <DocumentArrowUpIcon class="w-5 h-5 text-blue-600" />
                        <h3 class="text-lg font-medium text-gray-900">
                            Export Hosts
                        </h3>
                    </div>

                    <p class="text-sm text-gray-600">
                        Export all hosts from this network to JSON format for
                        backup or sharing.
                    </p>

                    <button
                        @click="handleExport"
                        :disabled="loading"
                        class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <DocumentArrowUpIcon class="w-4 h-4 mr-2" />
                        Export Hosts
                    </button>

                    <!-- Export Result -->
                    <div v-if="exportData" class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700"
                                >Export Data:</span
                            >
                            <button
                                @click="copyToClipboard"
                                class="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                        <textarea
                            v-model="exportData"
                            readonly
                            class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-mono bg-gray-50"
                        ></textarea>
                    </div>
                </div>

                <!-- Import Section -->
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <DocumentArrowDownIcon class="w-5 h-5 text-green-600" />
                        <h3 class="text-lg font-medium text-gray-900">
                            Import Hosts
                        </h3>
                    </div>

                    <p class="text-sm text-gray-600">
                        Import hosts from JSON format. Existing hosts will be
                        skipped automatically.
                    </p>

                    <!-- File Upload -->
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Upload JSON File
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
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Or Paste JSON Data
                        </label>
                        <textarea
                            v-model="importData"
                            placeholder='{"export_date": "2024-08-16T16:41:59Z", "network_id": 1, "hosts": [{"address": "example.com", "description": "Example site"}]}'
                            class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>

                    <button
                        @click="handleImport"
                        :disabled="loading || !importData.trim()"
                        class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                        Import Hosts
                    </button>
                </div>
            </div>

            <!-- Help Section -->
            <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div class="flex">
                    <ExclamationTriangleIcon class="w-5 h-5 text-blue-400" />
                    <div class="ml-3">
                        <h4 class="text-sm font-medium text-blue-800">
                            Import/Export Format
                        </h4>
                        <div class="mt-2 text-sm text-blue-700">
                            <p>The JSON format should contain:</p>
                            <ul class="mt-1 list-disc list-inside">
                                <li><code>export_date</code>: ISO timestamp</li>
                                <li>
                                    <code>network_id</code>: Source network ID
                                    (informational)
                                </li>
                                <li>
                                    <code>hosts</code>: Array of host objects
                                    with <code>address</code> and optional
                                    <code>description</code>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
