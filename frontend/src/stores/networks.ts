// Networks store - manages network-related state and operations
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { networksService, vpnService } from '@/services'
import type { entity } from '../../wailsjs/go/models'

export const useNetworksStore = defineStore('networks', () => {
  // State
  const networks = ref<entity.NetworkWithStatus[]>([])
  const vpnServices = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')

  // Loading states for specific operations
  const syncingNetworkId = ref<number | null>(null)
  const resettingNetworkId = ref<number | null>(null)
  const deletingNetworkId = ref<number | null>(null)

  // Getters
  const filteredNetworks = computed(() => {
    if (!searchTerm.value) return networks.value

    const term = searchTerm.value.toLowerCase()
    return networks.value.filter(network => network.Name.toLowerCase().includes(term))
  })

  const sortedNetworks = computed(() => {
    return [...filteredNetworks.value].sort(
      (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    )
  })

  const activeNetworks = computed(() => networks.value.filter(network => network.IsActive))

  const totalNetworks = computed(() => networks.value.length)
  const activeNetworkCount = computed(() => activeNetworks.value.length)

  // Actions
  const fetchNetworks = async () => {
    try {
      loading.value = true
      error.value = null
      networks.value = await networksService.list(searchTerm.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch networks'
      console.error('Failed to fetch networks:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchVPNServices = async () => {
    try {
      vpnServices.value = await vpnService.listServices()
    } catch (err) {
      console.error('Failed to fetch VPN services:', err)
      // Don't set error state for VPN services as it's not critical
    }
  }

  const addNetwork = async (name: string): Promise<entity.Network> => {
    try {
      const newNetwork = await networksService.add(name)

      // Add to local state (assuming it starts as inactive)
      const networkWithStatus: entity.NetworkWithStatus = {
        ...newNetwork,
        IsActive: false,
      }
      networks.value.push(networkWithStatus)

      return newNetwork
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add network'
      throw err
    }
  }

  const deleteNetwork = async (id: number): Promise<void> => {
    try {
      deletingNetworkId.value = id
      await networksService.delete(id)

      // Remove from local state
      networks.value = networks.value.filter(n => n.ID !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete network'
      throw err
    } finally {
      deletingNetworkId.value = null
    }
  }

  const syncNetwork = async (id: number): Promise<void> => {
    try {
      syncingNetworkId.value = id
      await networksService.sync(id)

      // Refresh networks to get updated status
      await fetchNetworks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sync network'
      throw err
    } finally {
      syncingNetworkId.value = null
    }
  }

  const resetNetwork = async (id: number): Promise<void> => {
    try {
      resettingNetworkId.value = id
      await networksService.reset(id)

      // Refresh networks to get updated status
      await fetchNetworks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reset network'
      throw err
    } finally {
      resettingNetworkId.value = null
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

  const getNetworkById = (id: number): entity.NetworkWithStatus | undefined => {
    return networks.value.find(network => network.ID === id)
  }

  // Utility methods
  const isNetworkSyncing = (id: number): boolean => {
    return syncingNetworkId.value === id
  }

  const isNetworkResetting = (id: number): boolean => {
    return resettingNetworkId.value === id
  }

  const isNetworkDeleting = (id: number): boolean => {
    return deletingNetworkId.value === id
  }

  const isNetworkLoading = (id: number): boolean => {
    return isNetworkSyncing(id) || isNetworkResetting(id) || isNetworkDeleting(id)
  }

  return {
    // State
    networks,
    vpnServices,
    loading,
    error,
    searchTerm,
    syncingNetworkId,
    resettingNetworkId,
    deletingNetworkId,

    // Getters
    filteredNetworks,
    sortedNetworks,
    activeNetworks,
    totalNetworks,
    activeNetworkCount,

    // Actions
    fetchNetworks,
    fetchVPNServices,
    addNetwork,
    deleteNetwork,
    syncNetwork,
    resetNetwork,
    setSearchTerm,
    clearSearch,
    clearError,
    getNetworkById,

    // Utility methods
    isNetworkSyncing,
    isNetworkResetting,
    isNetworkDeleting,
    isNetworkLoading,
  }
})
