// Hosts store - manages host-related state and operations
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { hostsService } from '@/services'
import type { entity } from '../../wailsjs/go/models'

export const useHostsStore = defineStore('hosts', () => {
  // State
  const hosts = ref<entity.Host[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')

  // Loading states for specific operations
  const deletingHostId = ref<number | null>(null)

  // Getters
  const filteredHosts = computed(() => {
    if (!searchTerm.value) return hosts.value

    const term = searchTerm.value.toLowerCase()
    return hosts.value.filter(
      host =>
        host.Address.toLowerCase().includes(term) || host.Description?.toLowerCase().includes(term)
    )
  })

  const sortedHosts = computed(() => {
    return [...filteredHosts.value].sort(
      (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    )
  })

  const totalHosts = computed(() => hosts.value.length)

  const hostsByAddress = computed(() => {
    const hostsMap = new Map<string, entity.Host>()
    hosts.value.forEach(host => {
      hostsMap.set(host.Address, host)
    })
    return hostsMap
  })

  // Actions
  const fetchHosts = async () => {
    try {
      loading.value = true
      error.value = null
      hosts.value = await hostsService.list()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch hosts'
      console.error('Failed to fetch hosts:', err)
    } finally {
      loading.value = false
    }
  }

  const addHost = async (address: string, description?: string): Promise<entity.Host> => {
    try {
      const newHost = await hostsService.add(address, description)

      // Add to local state
      hosts.value.push(newHost)

      return newHost
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add host'
      throw err
    }
  }

  const deleteHost = async (id: number): Promise<void> => {
    try {
      deletingHostId.value = id
      await hostsService.delete(id)

      // Remove from local state
      hosts.value = hosts.value.filter(h => h.ID !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete host'
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

  const getHostById = (id: number): entity.Host | undefined => {
    return hosts.value.find(host => host.ID === id)
  }

  const getHostByAddress = (address: string): entity.Host | undefined => {
    return hosts.value.find(host => host.Address === address)
  }

  const isHostDeleting = (id: number): boolean => {
    return deletingHostId.value === id
  }

  // Validation helpers
  const isAddressExists = (address: string, excludeId?: number): boolean => {
    return hosts.value.some(
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
      return 'This address already exists'
    }

    return null
  }

  return {
    // State
    hosts,
    loading,
    error,
    searchTerm,
    deletingHostId,

    // Getters
    filteredHosts,
    sortedHosts,
    totalHosts,
    hostsByAddress,

    // Actions
    fetchHosts,
    addHost,
    deleteHost,
    setSearchTerm,
    clearSearch,
    clearError,
    getHostById,
    getHostByAddress,
    isHostDeleting,

    // Validation
    isAddressExists,
    validateAddress,
  }
})
