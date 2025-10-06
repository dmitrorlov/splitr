// Navigation store - manages application screen navigation and state
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Screen } from '@/types'
import type { entity } from '../wailsjs/go/models'

export const useNavigationStore = defineStore('navigation', () => {
  const currentScreen = ref<Screen>('networks')
  const selectedNetwork = ref<entity.NetworkWithStatus | null>(null)
  const navigationHistory = ref<Screen[]>(['networks'])

  // Computed
  const canGoBack = computed(() => navigationHistory.value.length > 1)

  const currentScreenTitle = computed(() => {
    switch (currentScreen.value) {
      case 'networks':
        return 'Networks'
      case 'hosts':
        return 'Hosts'
      case 'networkHosts':
        return selectedNetwork.value ? `${selectedNetwork.value.Name} Hosts` : 'Network Hosts'
      default:
        return 'Splitr'
    }
  })

  // Actions
  const navigateToNetworks = () => {
    currentScreen.value = 'networks'
    selectedNetwork.value = null
    addToHistory('networks')
  }

  const navigateToNetworkHosts = (network: entity.NetworkWithStatus) => {
    selectedNetwork.value = network
    currentScreen.value = 'networkHosts'
    addToHistory('networkHosts')
  }

  const navigateToHosts = () => {
    currentScreen.value = 'hosts'
    selectedNetwork.value = null
    addToHistory('hosts')
  }

  const goBack = () => {
    if (navigationHistory.value.length > 1) {
      navigationHistory.value.pop() // Remove current
      const previous = navigationHistory.value[navigationHistory.value.length - 1]
      currentScreen.value = previous

      // Clear selected network if not navigating to networkHosts
      if (previous !== 'networkHosts') {
        selectedNetwork.value = null
      }
    }
  }

  const addToHistory = (screen: Screen) => {
    // Avoid duplicate consecutive entries
    if (navigationHistory.value[navigationHistory.value.length - 1] !== screen) {
      navigationHistory.value.push(screen)

      // Keep history reasonable size
      if (navigationHistory.value.length > 10) {
        navigationHistory.value = navigationHistory.value.slice(-10)
      }
    }
  }

  const resetNavigation = () => {
    currentScreen.value = 'networks'
    selectedNetwork.value = null
    navigationHistory.value = ['networks']
  }

  return {
    // State
    currentScreen,
    selectedNetwork,
    navigationHistory,

    // Getters
    canGoBack,
    currentScreenTitle,

    // Actions
    navigateToNetworks,
    navigateToNetworkHosts,
    navigateToHosts,
    goBack,
    resetNavigation,
  }
})
