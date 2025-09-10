<script lang="ts" setup>
import {
  CheckCircleIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  ServerIcon,
} from '@heroicons/vue/24/outline'
import { computed, onMounted } from 'vue'
import LoadingOverlay from '@/components/layout/LoadingOverlay.vue'
import { ConfirmDialog } from '@/components/ui'
import { useNavigationStore, useUIStore } from '@/stores'
import type { entity } from '../wailsjs/go/models'
import HostsScreen from './components/HostsScreen.vue'
import NetworkHostsScreen from './components/NetworkHostsScreen.vue'
import NetworksScreen from './components/NetworksScreen.vue'

const navigationStore = useNavigationStore()
const uiStore = useUIStore()

const currentScreen = computed(() => navigationStore.currentScreen)
const selectedNetwork = computed(() => navigationStore.selectedNetwork)
const globalLoading = computed(() => uiStore.globalLoading)
const globalLoadingMessage = computed(() => uiStore.globalLoadingMessage)
const notifications = computed(() => uiStore.notifications)
const confirmDialogOpen = computed(() => uiStore.confirmDialogOpen)
const confirmDialogProps = computed(() => uiStore.confirmDialogProps)

const handleScreenChange = (screen: typeof currentScreen.value) => {
  uiStore.clearAllNotifications()
  if (screen === 'networks') {
    navigationStore.navigateToNetworks()
  } else if (screen === 'hosts') {
    navigationStore.navigateToHosts()
  }
}

const handleNetworkSelect = (network: entity.NetworkWithStatus) => {
  uiStore.clearAllNotifications()
  navigationStore.navigateToNetworkHosts(network)
}

const handleError = (message: string) => {
  uiStore.showError('Error', message)
}

const handleSuccess = (message: string) => {
  uiStore.showSuccess('Success', message)
}

const handleLoadingStart = (message: string) => {
  uiStore.showGlobalLoading(message)
}

const handleLoadingEnd = () => {
  uiStore.hideGlobalLoading()
}

const goBackToNetworks = () => {
  navigationStore.navigateToNetworks()
}

const getNotificationClasses = (type: string) => {
  const baseClasses = 'mb-4 px-4 py-3 rounded-lg flex items-center'
  switch (type) {
    case 'error':
      return `${baseClasses} bg-red-100 border border-red-400 text-red-700`
    case 'success':
      return `${baseClasses} bg-green-100 border border-green-400 text-green-700`
    case 'warning':
      return `${baseClasses} bg-yellow-100 border border-yellow-400 text-yellow-700`
    case 'info':
      return `${baseClasses} bg-blue-100 border border-blue-400 text-blue-700`
    default:
      return baseClasses
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'error':
    case 'warning':
      return ExclamationTriangleIcon
    case 'success':
      return CheckCircleIcon
    default:
      return CheckCircleIcon
  }
}

onMounted(() => {
  navigationStore.navigateToNetworks()
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

            <!-- Notifications - using new notification system -->
            <div class="notification-wrapper">
                <TransitionGroup name="fade" tag="div">
                    <div
                        v-for="notification in notifications"
                        :key="notification.id"
                        :class="getNotificationClasses(notification.type)"
                    >
                        <component 
                            :is="getNotificationIcon(notification.type)" 
                            class="w-5 h-5 mr-2" 
                        />
                        <div>
                            <div class="font-medium">{{ notification.title }}</div>
                            <div v-if="notification.message" class="text-sm">{{ notification.message }}</div>
                        </div>
                        <button
                            @click="uiStore.removeNotification(notification.id)"
                            class="ml-auto pl-3 text-current hover:opacity-75"
                        >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </TransitionGroup>
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

        <!-- Global Confirm Dialog -->
        <ConfirmDialog
            :visible="confirmDialogOpen"
            :title="confirmDialogProps.title"
            :message="confirmDialogProps.message"
            :confirm-text="confirmDialogProps.confirmText"
            :cancel-text="confirmDialogProps.cancelText"
            :type="confirmDialogProps.type"
            @confirm="uiStore.confirmDialog"
            @cancel="uiStore.cancelDialog"
        />
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
