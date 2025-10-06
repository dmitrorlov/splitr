import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNetworkHostsStore } from '@/stores/networkHosts'
import { networkHostsService } from '@/services'
import { createMockNetworkHost, createMockNetworkHosts } from '../../__mocks__/entities'

// Mock the services
vi.mock('@/services', () => ({
  networkHostsService: {
    list: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useNetworkHostsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useNetworkHostsStore()
      
      expect(store.networkHosts).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.searchTerm).toBe('')
      expect(store.currentNetworkId).toBe(null)
      expect(store.deletingHostId).toBe(null)
    })
  })

  describe('computed properties', () => {
    it('should filter network hosts based on search term', () => {
      const store = useNetworkHostsStore()
      const mockHosts = [
        createMockNetworkHost({ ID: 1, Address: '192.168.1.10', Description: 'Database' }),
        createMockNetworkHost({ ID: 2, Address: '192.168.1.11', Description: 'Web Server' }),
        createMockNetworkHost({ ID: 3, Address: '192.168.1.12', Description: 'Cache' }),
      ]
      store.networkHosts = mockHosts
      
      store.setSearchTerm('Database')
      expect(store.filteredNetworkHosts).toHaveLength(1)
      expect(store.filteredNetworkHosts[0].Description).toBe('Database')
    })

    it('should filter by address', () => {
      const store = useNetworkHostsStore()
      const mockHosts = createMockNetworkHosts(3)
      store.networkHosts = mockHosts
      
      store.setSearchTerm('192.168.1.10')
      expect(store.filteredNetworkHosts).toHaveLength(1)
      expect(store.filteredNetworkHosts[0].Address).toBe('192.168.1.10')
    })

    it('should sort network hosts by creation date (newest first)', () => {
      const store = useNetworkHostsStore()
      const oldDate = '2024-01-01T00:00:00Z'
      const newDate = '2024-01-02T00:00:00Z'
      
      const mockHosts = [
        createMockNetworkHost({ ID: 1, CreatedAt: oldDate }),
        createMockNetworkHost({ ID: 2, CreatedAt: newDate }),
      ]
      store.networkHosts = mockHosts
      
      expect(store.sortedNetworkHosts[0].ID).toBe(2) // newer one first
      expect(store.sortedNetworkHosts[1].ID).toBe(1)
    })

    it('should return correct total network hosts count', () => {
      const store = useNetworkHostsStore()
      store.networkHosts = createMockNetworkHosts(5)
      
      expect(store.totalNetworkHosts).toBe(5)
    })

    it('should create network hosts map by address', () => {
      const store = useNetworkHostsStore()
      const mockHosts = createMockNetworkHosts(2)
      store.networkHosts = mockHosts
      
      const hostsByAddress = store.networkHostsByAddress
      expect(hostsByAddress.size).toBe(2)
      expect(hostsByAddress.get('192.168.1.10')).toBeDefined()
      expect(hostsByAddress.get('192.168.1.11')).toBeDefined()
    })

    it('should return network host stats', () => {
      const store = useNetworkHostsStore()
      store.currentNetworkId = 1
      store.networkHosts = createMockNetworkHosts(3)
      store.setSearchTerm('192.168.1.10')
      
      const stats = store.getNetworkHostStats
      expect(stats).toEqual({
        networkId: 1,
        totalHosts: 3,
        filteredCount: 1,
      })
    })

    it('should return null stats when no network selected', () => {
      const store = useNetworkHostsStore()
      
      expect(store.getNetworkHostStats).toBe(null)
    })
  })

  describe('actions', () => {
    describe('fetchNetworkHosts', () => {
      it('should fetch network hosts successfully', async () => {
        const store = useNetworkHostsStore()
        const mockHosts = createMockNetworkHosts(3, 1)
        vi.mocked(networkHostsService.list).mockResolvedValue(mockHosts)
        
        await store.fetchNetworkHosts(1)
        
        expect(networkHostsService.list).toHaveBeenCalledWith(1, '')
        expect(store.networkHosts).toEqual(mockHosts)
        expect(store.currentNetworkId).toBe(1)
        expect(store.loading).toBe(false)
        expect(store.error).toBe(null)
      })

      it('should fetch with search term', async () => {
        const store = useNetworkHostsStore()
        store.setSearchTerm('test')
        vi.mocked(networkHostsService.list).mockResolvedValue([])
        
        await store.fetchNetworkHosts(1)
        
        expect(networkHostsService.list).toHaveBeenCalledWith(1, 'test')
      })

      it('should handle fetch error', async () => {
        const store = useNetworkHostsStore()
        const errorMessage = 'Failed to fetch'
        vi.mocked(networkHostsService.list).mockRejectedValue(new Error(errorMessage))
        
        await store.fetchNetworkHosts(1)
        
        expect(store.error).toBe(errorMessage)
        expect(store.loading).toBe(false)
        expect(store.networkHosts).toEqual([])
      })

      it('should set loading state during fetch', async () => {
        const store = useNetworkHostsStore()
        let loadingDuringFetch = false
        
        vi.mocked(networkHostsService.list).mockImplementation(() => {
          loadingDuringFetch = store.loading
          return Promise.resolve([])
        })
        
        await store.fetchNetworkHosts(1)
        
        expect(loadingDuringFetch).toBe(true)
        expect(store.loading).toBe(false)
      })
    })

    describe('addNetworkHost', () => {
      it('should add network host successfully when viewing same network', async () => {
        const store = useNetworkHostsStore()
        store.currentNetworkId = 1
        const newHost = createMockNetworkHost({ ID: 4, NetworkID: 1, Address: '192.168.1.14' })
        vi.mocked(networkHostsService.add).mockResolvedValue(newHost)
        
        const result = await store.addNetworkHost(1, '192.168.1.14', 'New host')
        
        expect(networkHostsService.add).toHaveBeenCalledWith(1, '192.168.1.14', 'New host')
        expect(store.networkHosts).toHaveLength(1)
        expect(store.networkHosts[0]).toEqual(newHost)
        expect(result).toEqual(newHost)
      })

      it('should not add to local state when viewing different network', async () => {
        const store = useNetworkHostsStore()
        store.currentNetworkId = 2
        const newHost = createMockNetworkHost({ ID: 4, NetworkID: 1, Address: '192.168.1.14' })
        vi.mocked(networkHostsService.add).mockResolvedValue(newHost)
        
        const result = await store.addNetworkHost(1, '192.168.1.14', 'New host')
        
        expect(networkHostsService.add).toHaveBeenCalledWith(1, '192.168.1.14', 'New host')
        expect(store.networkHosts).not.toContain(newHost)
        expect(result).toEqual(newHost)
      })

      it('should handle add error', async () => {
        const store = useNetworkHostsStore()
        const errorMessage = 'Failed to add network host'
        vi.mocked(networkHostsService.add).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.addNetworkHost(1, '192.168.1.14')).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
      })
    })

    describe('deleteNetworkHost', () => {
      it('should delete network host successfully', async () => {
        const store = useNetworkHostsStore()
        const mockHosts = createMockNetworkHosts(3)
        store.networkHosts = mockHosts
        vi.mocked(networkHostsService.delete).mockResolvedValue()
        
        await store.deleteNetworkHost(1)
        
        expect(networkHostsService.delete).toHaveBeenCalledWith(1)
        expect(store.networkHosts).toHaveLength(2)
        expect(store.networkHosts.find(h => h.ID === 1)).toBeUndefined()
        expect(store.deletingHostId).toBe(null)
      })

      it('should handle delete error', async () => {
        const store = useNetworkHostsStore()
        const mockHosts = createMockNetworkHosts(3)
        store.networkHosts = mockHosts
        const errorMessage = 'Failed to delete network host'
        vi.mocked(networkHostsService.delete).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.deleteNetworkHost(1)).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
        expect(store.deletingHostId).toBe(null)
        expect(store.networkHosts).toHaveLength(3) // Should not remove on error
      })

      it('should set deleting state during delete', async () => {
        const store = useNetworkHostsStore()
        const mockHosts = createMockNetworkHosts(3)
        store.networkHosts = mockHosts
        let deletingDuringCall = null
        
        vi.mocked(networkHostsService.delete).mockImplementation(() => {
          deletingDuringCall = store.deletingHostId
          return Promise.resolve()
        })
        
        await store.deleteNetworkHost(1)
        
        expect(deletingDuringCall).toBe(1)
        expect(store.deletingHostId).toBe(null)
      })
    })

    describe('clearNetworkHosts', () => {
      it('should clear all network hosts data', () => {
        const store = useNetworkHostsStore()
        store.networkHosts = createMockNetworkHosts(3)
        store.currentNetworkId = 1
        store.setSearchTerm('test')
        
        store.clearNetworkHosts()
        
        expect(store.networkHosts).toEqual([])
        expect(store.currentNetworkId).toBe(null)
        expect(store.searchTerm).toBe('')
      })
    })
  })

  describe('utility methods', () => {
    it('should find network host by ID', () => {
      const store = useNetworkHostsStore()
      const mockHosts = createMockNetworkHosts(3)
      store.networkHosts = mockHosts
      
      const host = store.getNetworkHostById(2)
      expect(host?.ID).toBe(2)
      
      const nonExistent = store.getNetworkHostById(999)
      expect(nonExistent).toBeUndefined()
    })

    it('should find network host by address', () => {
      const store = useNetworkHostsStore()
      const mockHosts = createMockNetworkHosts(3)
      store.networkHosts = mockHosts
      
      const host = store.getNetworkHostByAddress('192.168.1.11')
      expect(host?.Address).toBe('192.168.1.11')
      
      const nonExistent = store.getNetworkHostByAddress('192.168.1.999')
      expect(nonExistent).toBeUndefined()
    })

    it('should check if network host is deleting', () => {
      const store = useNetworkHostsStore()
      store.deletingHostId = 1
      
      expect(store.isNetworkHostDeleting(1)).toBe(true)
      expect(store.isNetworkHostDeleting(2)).toBe(false)
    })

    it('should clear search term', () => {
      const store = useNetworkHostsStore()
      store.setSearchTerm('test')
      
      store.clearSearch()
      expect(store.searchTerm).toBe('')
    })

    it('should clear error', () => {
      const store = useNetworkHostsStore()
      store.error = 'Some error'
      
      store.clearError()
      expect(store.error).toBe(null)
    })
  })

  describe('validation', () => {
    it('should detect existing addresses', () => {
      const store = useNetworkHostsStore()
      const mockHosts = createMockNetworkHosts(3)
      store.networkHosts = mockHosts
      
      expect(store.isAddressExists('192.168.1.10')).toBe(true)
      expect(store.isAddressExists('192.168.1.999')).toBe(false)
    })

    it('should exclude host ID when checking address existence', () => {
      const store = useNetworkHostsStore()
      const mockHosts = createMockNetworkHosts(3)
      store.networkHosts = mockHosts
      
      expect(store.isAddressExists('192.168.1.10', 1)).toBe(false) // Exclude same host
      expect(store.isAddressExists('192.168.1.10', 2)).toBe(true)  // Different host
    })

    describe('validateAddress', () => {
      it('should validate required address', () => {
        const store = useNetworkHostsStore()
        
        expect(store.validateAddress('')).toBe('Address is required')
        expect(store.validateAddress('   ')).toBe('Address is required')
      })

      it('should validate IP address format', () => {
        const store = useNetworkHostsStore()
        
        expect(store.validateAddress('192.168.1.1')).toBe(null)
        expect(store.validateAddress('invalid@address')).toBe('Please enter a valid IP address or hostname')
        expect(store.validateAddress('')).toBe('Address is required')
      })

      it('should validate hostname format', () => {
        const store = useNetworkHostsStore()
        
        expect(store.validateAddress('localhost')).toBe(null)
        expect(store.validateAddress('example.com')).toBe(null)
        expect(store.validateAddress('sub.example.com')).toBe(null)
        expect(store.validateAddress('invalid..hostname')).toBe('Please enter a valid IP address or hostname')
      })

      it('should detect duplicate addresses in network', () => {
        const store = useNetworkHostsStore()
        const mockHosts = createMockNetworkHosts(3)
        store.networkHosts = mockHosts
        
        expect(store.validateAddress('192.168.1.10')).toBe('This address already exists in this network')
        expect(store.validateAddress('192.168.1.999')).toBe(null)
      })
    })
  })
})