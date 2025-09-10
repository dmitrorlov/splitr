import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNetworksStore } from '@/stores/networks'
import { networksService, vpnService } from '@/services'
import { createMockNetwork, createMockNetworkWithStatus, createMockNetworks } from '../../__mocks__/entities'

// Mock the services
vi.mock('@/services', () => ({
  networksService: {
    list: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
    sync: vi.fn(),
    reset: vi.fn(),
  },
  vpnService: {
    listServices: vi.fn(),
  },
}))

describe('useNetworksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useNetworksStore()
      
      expect(store.networks).toEqual([])
      expect(store.vpnServices).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.searchTerm).toBe('')
      expect(store.syncingNetworkId).toBe(null)
      expect(store.resettingNetworkId).toBe(null)
      expect(store.deletingNetworkId).toBe(null)
    })
  })

  describe('computed properties', () => {
    it('should filter networks based on search term', () => {
      const store = useNetworksStore()
      const mockNetworks = [
        createMockNetworkWithStatus({ ID: 1, Name: 'Home Network' }),
        createMockNetworkWithStatus({ ID: 2, Name: 'Office Network' }),
        createMockNetworkWithStatus({ ID: 3, Name: 'Test Network' }),
      ]
      store.networks = mockNetworks
      
      store.setSearchTerm('Home')
      expect(store.filteredNetworks).toHaveLength(1)
      expect(store.filteredNetworks[0].Name).toBe('Home Network')
    })

    it('should sort networks by creation date (newest first)', () => {
      const store = useNetworksStore()
      const oldDate = '2024-01-01T00:00:00Z'
      const newDate = '2024-01-02T00:00:00Z'
      
      const mockNetworks = [
        createMockNetworkWithStatus({ ID: 1, CreatedAt: oldDate }),
        createMockNetworkWithStatus({ ID: 2, CreatedAt: newDate }),
      ]
      store.networks = mockNetworks
      
      expect(store.sortedNetworks[0].ID).toBe(2) // newer one first
      expect(store.sortedNetworks[1].ID).toBe(1)
    })

    it('should filter active networks', () => {
      const store = useNetworksStore()
      const mockNetworks = [
        createMockNetworkWithStatus({ ID: 1, IsActive: true }),
        createMockNetworkWithStatus({ ID: 2, IsActive: false }),
        createMockNetworkWithStatus({ ID: 3, IsActive: true }),
      ]
      store.networks = mockNetworks
      
      expect(store.activeNetworks).toHaveLength(2)
      expect(store.activeNetworkCount).toBe(2)
    })

    it('should return correct total networks count', () => {
      const store = useNetworksStore()
      store.networks = createMockNetworks(5)
      
      expect(store.totalNetworks).toBe(5)
    })
  })

  describe('actions', () => {
    describe('fetchNetworks', () => {
      it('should fetch networks successfully', async () => {
        const store = useNetworksStore()
        const mockNetworks = createMockNetworks(3)
        vi.mocked(networksService.list).mockResolvedValue(mockNetworks)
        
        await store.fetchNetworks()
        
        expect(networksService.list).toHaveBeenCalledWith('')
        expect(store.networks).toEqual(mockNetworks)
        expect(store.loading).toBe(false)
        expect(store.error).toBe(null)
      })

      it('should fetch networks with search term', async () => {
        const store = useNetworksStore()
        store.setSearchTerm('test')
        vi.mocked(networksService.list).mockResolvedValue([])
        
        await store.fetchNetworks()
        
        expect(networksService.list).toHaveBeenCalledWith('test')
      })

      it('should handle fetch error', async () => {
        const store = useNetworksStore()
        const errorMessage = 'Failed to fetch'
        vi.mocked(networksService.list).mockRejectedValue(new Error(errorMessage))
        
        await store.fetchNetworks()
        
        expect(store.error).toBe(errorMessage)
        expect(store.loading).toBe(false)
        expect(store.networks).toEqual([])
      })

      it('should set loading state during fetch', async () => {
        const store = useNetworksStore()
        let loadingDuringFetch = false
        
        vi.mocked(networksService.list).mockImplementation(() => {
          loadingDuringFetch = store.loading
          return Promise.resolve([])
        })
        
        await store.fetchNetworks()
        
        expect(loadingDuringFetch).toBe(true)
        expect(store.loading).toBe(false)
      })
    })

    describe('fetchVPNServices', () => {
      it('should fetch VPN services successfully', async () => {
        const store = useNetworksStore()
        const mockServices = ['WireGuard', 'OpenVPN']
        vi.mocked(vpnService.listServices).mockResolvedValue(mockServices)
        
        await store.fetchVPNServices()
        
        expect(vpnService.listServices).toHaveBeenCalled()
        expect(store.vpnServices).toEqual(mockServices)
      })

      it('should handle VPN services fetch error silently', async () => {
        const store = useNetworksStore()
        vi.mocked(vpnService.listServices).mockRejectedValue(new Error('Failed'))
        
        await store.fetchVPNServices()
        
        expect(store.vpnServices).toEqual([])
        expect(store.error).toBe(null) // Should not set error for VPN services
      })
    })

    describe('addNetwork', () => {
      it('should add network successfully', async () => {
        const store = useNetworksStore()
        const newNetwork = createMockNetwork({ ID: 4, Name: 'New Network' })
        vi.mocked(networksService.add).mockResolvedValue(newNetwork)
        
        const result = await store.addNetwork('New Network')
        
        expect(networksService.add).toHaveBeenCalledWith('New Network')
        expect(store.networks).toHaveLength(1)
        expect(store.networks[0].Name).toBe('New Network')
        expect(store.networks[0].IsActive).toBe(false) // Should start as inactive
        expect(result).toEqual(newNetwork)
      })

      it('should handle add error', async () => {
        const store = useNetworksStore()
        const errorMessage = 'Failed to add network'
        vi.mocked(networksService.add).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.addNetwork('New Network')).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
      })
    })

    describe('deleteNetwork', () => {
      it('should delete network successfully', async () => {
        const store = useNetworksStore()
        const mockNetworks = createMockNetworks(3)
        store.networks = mockNetworks
        vi.mocked(networksService.delete).mockResolvedValue()
        
        await store.deleteNetwork(1)
        
        expect(networksService.delete).toHaveBeenCalledWith(1)
        expect(store.networks).toHaveLength(2)
        expect(store.networks.find(n => n.ID === 1)).toBeUndefined()
        expect(store.deletingNetworkId).toBe(null)
      })

      it('should handle delete error', async () => {
        const store = useNetworksStore()
        const mockNetworks = createMockNetworks(3)
        store.networks = mockNetworks
        const errorMessage = 'Failed to delete network'
        vi.mocked(networksService.delete).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.deleteNetwork(1)).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
        expect(store.deletingNetworkId).toBe(null)
        expect(store.networks).toHaveLength(3) // Should not remove on error
      })

      it('should set deleting state during delete', async () => {
        const store = useNetworksStore()
        const mockNetworks = createMockNetworks(3)
        store.networks = mockNetworks
        let deletingDuringCall = null
        
        vi.mocked(networksService.delete).mockImplementation(() => {
          deletingDuringCall = store.deletingNetworkId
          return Promise.resolve()
        })
        
        await store.deleteNetwork(1)
        
        expect(deletingDuringCall).toBe(1)
        expect(store.deletingNetworkId).toBe(null)
      })
    })

    describe('syncNetwork', () => {
      it('should sync network successfully', async () => {
        const store = useNetworksStore()
        vi.mocked(networksService.sync).mockResolvedValue()
        vi.mocked(networksService.list).mockResolvedValue([])
        
        await store.syncNetwork(1)
        
        expect(networksService.sync).toHaveBeenCalledWith(1)
        expect(networksService.list).toHaveBeenCalled() // Should refresh
        expect(store.syncingNetworkId).toBe(null)
      })

      it('should handle sync error', async () => {
        const store = useNetworksStore()
        const errorMessage = 'Failed to sync network'
        vi.mocked(networksService.sync).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.syncNetwork(1)).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
        expect(store.syncingNetworkId).toBe(null)
      })
    })

    describe('resetNetwork', () => {
      it('should reset network successfully', async () => {
        const store = useNetworksStore()
        vi.mocked(networksService.reset).mockResolvedValue()
        vi.mocked(networksService.list).mockResolvedValue([])
        
        await store.resetNetwork(1)
        
        expect(networksService.reset).toHaveBeenCalledWith(1)
        expect(networksService.list).toHaveBeenCalled() // Should refresh
        expect(store.resettingNetworkId).toBe(null)
      })

      it('should handle reset error', async () => {
        const store = useNetworksStore()
        const errorMessage = 'Failed to reset network'
        vi.mocked(networksService.reset).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.resetNetwork(1)).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
        expect(store.resettingNetworkId).toBe(null)
      })
    })
  })

  describe('utility methods', () => {
    it('should find network by ID', () => {
      const store = useNetworksStore()
      const mockNetworks = createMockNetworks(3)
      store.networks = mockNetworks
      
      const network = store.getNetworkById(2)
      expect(network?.ID).toBe(2)
      
      const nonExistent = store.getNetworkById(999)
      expect(nonExistent).toBeUndefined()
    })

    it('should check network loading states', () => {
      const store = useNetworksStore()
      
      store.syncingNetworkId = 1
      expect(store.isNetworkSyncing(1)).toBe(true)
      expect(store.isNetworkSyncing(2)).toBe(false)
      expect(store.isNetworkLoading(1)).toBe(true)
      
      store.syncingNetworkId = null
      store.resettingNetworkId = 2
      expect(store.isNetworkResetting(2)).toBe(true)
      expect(store.isNetworkLoading(2)).toBe(true)
      
      store.resettingNetworkId = null
      store.deletingNetworkId = 3
      expect(store.isNetworkDeleting(3)).toBe(true)
      expect(store.isNetworkLoading(3)).toBe(true)
    })

    it('should clear search term', () => {
      const store = useNetworksStore()
      store.setSearchTerm('test')
      
      store.clearSearch()
      expect(store.searchTerm).toBe('')
    })

    it('should clear error', () => {
      const store = useNetworksStore()
      store.error = 'Some error'
      
      store.clearError()
      expect(store.error).toBe(null)
    })
  })
})