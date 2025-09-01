<script lang="ts" setup>
import {
  CheckCircleIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  ServerIcon,
} from '@heroicons/vue/24/outline'
import { onMounted, ref } from 'vue'
import type { entity } from '../wailsjs/go/models'
import HostsScreen from './components/HostsScreen.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import NetworkHostsScreen from './components/NetworkHostsScreen.vue'
import NetworksScreen from './components/NetworksScreen.vue'

// Types
type Network = entity.NetworkWithStatus

// UI state
type Screen = 'networks' | 'networkHosts' | 'hosts'
const currentScreen = ref<Screen>('networks')
const selectedNetwork = ref<Network | null>(null)

// Global loading state
const globalLoading = ref<boolean>(false)
const globalLoadingMessage = ref<string>('Loading...')

// Notification state
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Global loading functions
const showGlobalLoading = (message: string = 'Loading...') => {
  globalLoadingMessage.value = message
  globalLoading.value = true
}

const hideGlobalLoading = () => {
  globalLoading.value = false
}

// Notification functions
const showSuccess = (message: string) => {
  success.value = message
  setTimeout(() => {
    success.value = null
  }, 3000)
}

const showError = (message: string) => {
  error.value = message
  setTimeout(() => {
    error.value = null
  }, 5000)
}

// Navigation functions
const navigateToNetworks = () => {
  currentScreen.value = 'networks'
  selectedNetwork.value = null
}

const navigateToNetworkHosts = (network: Network) => {
  selectedNetwork.value = network
  currentScreen.value = 'networkHosts'
}

const navigateToHosts = () => {
  currentScreen.value = 'hosts'
  selectedNetwork.value = null
}

const goBackToNetworks = () => {
  currentScreen.value = 'networks'
  selectedNetwork.value = null
}

// Clear notifications when route changes
const clearNotifications = () => {
  error.value = null
  success.value = null
}

// Handle screen changes
const handleScreenChange = (screen: Screen) => {
  clearNotifications()
  if (screen === 'networks') {
    navigateToNetworks()
  } else if (screen === 'hosts') {
    navigateToHosts()
  }
}

// Component event handlers
const handleNetworkSelect = (network: Network) => {
  clearNotifications()
  navigateToNetworkHosts(network)
}

const handleError = (message: string) => {
  showError(message)
}

const handleSuccess = (message: string) => {
  showSuccess(message)
}

// Global loading event handlers
const handleLoadingStart = (message: string) => {
  showGlobalLoading(message)
}

const handleLoadingEnd = () => {
  hideGlobalLoading()
}

// Lifecycle
onMounted(() => {
  // Initialize with networks screen
  currentScreen.value = 'networks'
})
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto py-8 px-4">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="flex justify-center items-center mb-4">
                    <CloudIcon class="w-12 h-12 text-blue-600 mr-3" />
                    <h1 class="text-4xl font-bold text-gray-900">Splitr</h1>
                </div>
                <p class="text-gray-600">
                    L2TP VPN Split Tunneling
                </p>
            </div>

            <!-- Notifications -->
            <div class="notification-wrapper">
                <transition name="fade">
                    <div
                        v-if="error"
                        class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center"
                    >
                        <ExclamationTriangleIcon class="w-5 h-5 mr-2" />
                        {{ error }}
                    </div>
                </transition>
                <transition name="fade">
                    <div
                        v-if="success"
                        class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center"
                    >
                        <CheckCircleIcon class="w-5 h-5 mr-2" />
                        {{ success }}
                    </div>
                </transition>
            </div>

            <!-- Navigation Tabs (only show on main screens) -->
            <div v-if="currentScreen !== 'networkHosts'" class="mb-8">
                <nav class="flex space-x-8 justify-center">
                    <button
                        @click="handleScreenChange('networks')"
                        :class="
                            currentScreen === 'networks'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        "
                        class="flex items-center py-2 px-1 border-b-2 font-medium text-sm"
                        :disabled="globalLoading"
                    >
                        <CloudIcon class="w-5 h-5 mr-2" />
                        Networks
                    </button>
                    <button
                        @click="handleScreenChange('hosts')"
                        :class="
                            currentScreen === 'hosts'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        "
                        class="flex items-center py-2 px-1 border-b-2 font-medium text-sm"
                        :disabled="globalLoading"
                    >
                        <ServerIcon class="w-5 h-5 mr-2" />
                        Hosts
                    </button>
                </nav>
            </div>

            <!-- Screen Content -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <!-- Networks Screen -->
                <NetworksScreen
                    v-if="currentScreen === 'networks'"
                    :onNetworkSelect="handleNetworkSelect"
                    @error="handleError"
                    @success="handleSuccess"
                />

                <!-- Network Hosts Screen -->
                <NetworkHostsScreen
                    v-else-if="
                        currentScreen === 'networkHosts' && selectedNetwork
                    "
                    :network="selectedNetwork"
                    :onGoBack="goBackToNetworks"
                    @error="handleError"
                    @success="handleSuccess"
                    @loading-start="handleLoadingStart"
                    @loading-end="handleLoadingEnd"
                />

                <!-- Hosts Screen -->
                <HostsScreen
                    v-else-if="currentScreen === 'hosts'"
                    @error="handleError"
                    @success="handleSuccess"
                />
            </div>
        </div>

        <!-- Global Loading Overlay -->
        <LoadingOverlay :show="globalLoading" :message="globalLoadingMessage" />
    </div>
</template>

<style scoped>
.notification-wrapper {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9998; /* Lower than loading overlay */
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0;
}

/* Disable interaction when globally loading */
button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
