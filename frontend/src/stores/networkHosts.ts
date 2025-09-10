// Network hosts store - manages network host-related state and operations
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { networkHostsService } from '@/services'
import type { entity } from '../../wailsjs/go/models'

export const useNetworkHostsStore = defineStore('networkHosts', () => {
  // State
  const networkHosts = ref<entity.NetworkHost[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  const currentNetworkId = ref<number | null>(null)

  // Loading states for specific operations
  const deletingHostId = ref<number | null>(null)

  // Getters
  const filteredNetworkHosts = computed(() => {
    if (!searchTerm.value) return networkHosts.value

    const term = searchTerm.value.toLowerCase()
    return networkHosts.value.filter(
      host =>
        host.Address.toLowerCase().includes(term) || host.Description?.toLowerCase().includes(term)
    )
  })

  const sortedNetworkHosts = computed(() => {
    return [...filteredNetworkHosts.value].sort(
      (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    )
  })

  const totalNetworkHosts = computed(() => networkHosts.value.length)

  const networkHostsByAddress = computed(() => {
    const hostsMap = new Map<string, entity.NetworkHost>()
    networkHosts.value.forEach(host => {
      hostsMap.set(host.Address, host)
    })
    return hostsMap
  })

  // Actions
  const fetchNetworkHosts = async (networkId: number) => {
    try {
      loading.value = true
      error.value = null
      currentNetworkId.value = networkId
      networkHosts.value = await networkHostsService.list(networkId, searchTerm.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch network hosts'
      console.error('Failed to fetch network hosts:', err)
    } finally {
      loading.value = false
    }
  }

  const addNetworkHost = async (
    networkId: number,
    address: string,
    description?: string
  ): Promise<entity.NetworkHost> => {
    try {
      const newHost = await networkHostsService.add(networkId, address, description)

      // Add to local state if we're viewing the same network
      if (currentNetworkId.value === networkId) {
        networkHosts.value.push(newHost)
      }

      return newHost
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add network host'
      throw err
    }
  }

  const deleteNetworkHost = async (id: number): Promise<void> => {
    try {
      deletingHostId.value = id
      await networkHostsService.delete(id)

      // Remove from local state
      networkHosts.value = networkHosts.value.filter(h => h.ID !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete network host'
      throw err
    } finally {
      deletingHostId.value = null
    }
  }

  const setSearchTerm = (term: string) => {
    searchTerm.value = term
  }

  const clearSearch = () => {
    searchTerm.value = ''
  }

  const clearError = () => {
    error.value = null
  }

  const clearNetworkHosts = () => {
    networkHosts.value = []
    currentNetworkId.value = null
    clearSearch()
  }

  const getNetworkHostById = (id: number): entity.NetworkHost | undefined => {
    return networkHosts.value.find(host => host.ID === id)
  }

  const getNetworkHostByAddress = (address: string): entity.NetworkHost | undefined => {
    return networkHosts.value.find(host => host.Address === address)
  }

  const isNetworkHostDeleting = (id: number): boolean => {
    return deletingHostId.value === id
  }

  // Validation helpers
  const isAddressExists = (address: string, excludeId?: number): boolean => {
    return networkHosts.value.some(
      host => host.Address === address && (!excludeId || host.ID !== excludeId)
    )
  }

  const validateAddress = (address: string): string | null => {
    if (!address.trim()) {
      return 'Address is required'
    }

    // Basic IP address or hostname validation
    const ipPattern =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const hostnamePattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    if (!ipPattern.test(address) && !hostnamePattern.test(address)) {
      return 'Please enter a valid IP address or hostname'
    }

    if (isAddressExists(address)) {
      return 'This address already exists in this network'
    }

    return null
  }

  // Statistics
  const getNetworkHostStats = computed(() => {
    if (!currentNetworkId.value) return null

    return {
      networkId: currentNetworkId.value,
      totalHosts: totalNetworkHosts.value,
      filteredCount: filteredNetworkHosts.value.length,
    }
  })

  return {
    // State
    networkHosts,
    loading,
    error,
    searchTerm,
    currentNetworkId,
    deletingHostId,

    // Getters
    filteredNetworkHosts,
    sortedNetworkHosts,
    totalNetworkHosts,
    networkHostsByAddress,
    getNetworkHostStats,

    // Actions
    fetchNetworkHosts,
    addNetworkHost,
    deleteNetworkHost,
    setSearchTerm,
    clearSearch,
    clearError,
    clearNetworkHosts,
    getNetworkHostById,
    getNetworkHostByAddress,
    isNetworkHostDeleting,

    // Validation
    isAddressExists,
    validateAddress,
  }
})
