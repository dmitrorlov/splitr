import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHostsStore } from '@/stores/hosts'
import { hostsService } from '@/services'
import { createMockHost, createMockHosts } from '../../__mocks__/entities'

// Mock the services
vi.mock('@/services', () => ({
  hostsService: {
    list: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useHostsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useHostsStore()
      
      expect(store.hosts).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.searchTerm).toBe('')
      expect(store.deletingHostId).toBe(null)
    })
  })

  describe('computed properties', () => {
    it('should filter hosts based on search term', () => {
      const store = useHostsStore()
      const mockHosts = createMockHosts(3)
      store.hosts = mockHosts
      
      store.setSearchTerm('192.168.1.1')
      expect(store.filteredHosts).toHaveLength(1)
      expect(store.filteredHosts[0].Address).toBe('192.168.1.1')
    })

    it('should filter hosts by description', () => {
      const store = useHostsStore()
      const mockHosts = [
        createMockHost({ ID: 1, Address: '192.168.1.1', Description: 'Gateway' }),
        createMockHost({ ID: 2, Address: '192.168.1.2', Description: 'Server' }),
      ]
      store.hosts = mockHosts
      
      store.setSearchTerm('Gateway')
      expect(store.filteredHosts).toHaveLength(1)
      expect(store.filteredHosts[0].Description).toBe('Gateway')
    })

    it('should sort hosts by creation date (newest first)', () => {
      const store = useHostsStore()
      const oldDate = '2024-01-01T00:00:00Z'
      const newDate = '2024-01-02T00:00:00Z'
      
      const mockHosts = [
        createMockHost({ ID: 1, CreatedAt: oldDate }),
        createMockHost({ ID: 2, CreatedAt: newDate }),
      ]
      store.hosts = mockHosts
      
      expect(store.sortedHosts[0].ID).toBe(2) // newer one first
      expect(store.sortedHosts[1].ID).toBe(1)
    })

    it('should return correct total hosts count', () => {
      const store = useHostsStore()
      store.hosts = createMockHosts(5)
      
      expect(store.totalHosts).toBe(5)
    })

    it('should create hosts map by address', () => {
      const store = useHostsStore()
      const mockHosts = createMockHosts(2)
      store.hosts = mockHosts
      
      const hostsByAddress = store.hostsByAddress
      expect(hostsByAddress.size).toBe(2)
      expect(hostsByAddress.get('192.168.1.1')).toBeDefined()
      expect(hostsByAddress.get('192.168.1.2')).toBeDefined()
    })
  })

  describe('actions', () => {
    describe('fetchHosts', () => {
      it('should fetch hosts successfully', async () => {
        const store = useHostsStore()
        const mockHosts = createMockHosts(3)
        vi.mocked(hostsService.list).mockResolvedValue(mockHosts)
        
        await store.fetchHosts()
        
        expect(hostsService.list).toHaveBeenCalled()
        expect(store.hosts).toEqual(mockHosts)
        expect(store.loading).toBe(false)
        expect(store.error).toBe(null)
      })

      it('should handle fetch error', async () => {
        const store = useHostsStore()
        const errorMessage = 'Failed to fetch'
        vi.mocked(hostsService.list).mockRejectedValue(new Error(errorMessage))
        
        await store.fetchHosts()
        
        expect(store.error).toBe(errorMessage)
        expect(store.loading).toBe(false)
        expect(store.hosts).toEqual([])
      })

      it('should set loading state during fetch', async () => {
        const store = useHostsStore()
        let loadingDuringFetch = false
        
        vi.mocked(hostsService.list).mockImplementation(() => {
          loadingDuringFetch = store.loading
          return Promise.resolve([])
        })
        
        await store.fetchHosts()
        
        expect(loadingDuringFetch).toBe(true)
        expect(store.loading).toBe(false)
      })
    })

    describe('addHost', () => {
      it('should add host successfully', async () => {
        const store = useHostsStore()
        const newHost = createMockHost({ ID: 4, Address: '192.168.1.4' })
        vi.mocked(hostsService.add).mockResolvedValue(newHost)
        
        const result = await store.addHost('192.168.1.4', 'New host')
        
        expect(hostsService.add).toHaveBeenCalledWith('192.168.1.4', 'New host')
        expect(store.hosts).toHaveLength(1)
        expect(store.hosts[0]).toEqual(newHost)
        expect(result).toEqual(newHost)
      })

      it('should handle add error', async () => {
        const store = useHostsStore()
        const errorMessage = 'Failed to add host'
        vi.mocked(hostsService.add).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.addHost('192.168.1.4')).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
      })
    })

    describe('deleteHost', () => {
      it('should delete host successfully', async () => {
        const store = useHostsStore()
        const mockHosts = createMockHosts(3)
        store.hosts = mockHosts
        vi.mocked(hostsService.delete).mockResolvedValue()
        
        await store.deleteHost(1)
        
        expect(hostsService.delete).toHaveBeenCalledWith(1)
        expect(store.hosts).toHaveLength(2)
        expect(store.hosts.find(h => h.ID === 1)).toBeUndefined()
        expect(store.deletingHostId).toBe(null)
      })

      it('should handle delete error', async () => {
        const store = useHostsStore()
        const mockHosts = createMockHosts(3)
        store.hosts = mockHosts
        const errorMessage = 'Failed to delete host'
        vi.mocked(hostsService.delete).mockRejectedValue(new Error(errorMessage))
        
        await expect(store.deleteHost(1)).rejects.toThrow(errorMessage)
        expect(store.error).toBe(errorMessage)
        expect(store.deletingHostId).toBe(null)
        expect(store.hosts).toHaveLength(3) // Should not remove on error
      })

      it('should set deleting state during delete', async () => {
        const store = useHostsStore()
        const mockHosts = createMockHosts(3)
        store.hosts = mockHosts
        let deletingDuringCall = null
        
        vi.mocked(hostsService.delete).mockImplementation(() => {
          deletingDuringCall = store.deletingHostId
          return Promise.resolve()
        })
        
        await store.deleteHost(1)
        
        expect(deletingDuringCall).toBe(1)
        expect(store.deletingHostId).toBe(null)
      })
    })
  })

  describe('utility methods', () => {
    it('should find host by ID', () => {
      const store = useHostsStore()
      const mockHosts = createMockHosts(3)
      store.hosts = mockHosts
      
      const host = store.getHostById(2)
      expect(host?.ID).toBe(2)
      
      const nonExistent = store.getHostById(999)
      expect(nonExistent).toBeUndefined()
    })

    it('should find host by address', () => {
      const store = useHostsStore()
      const mockHosts = createMockHosts(3)
      store.hosts = mockHosts
      
      const host = store.getHostByAddress('192.168.1.2')
      expect(host?.Address).toBe('192.168.1.2')
      
      const nonExistent = store.getHostByAddress('192.168.1.999')
      expect(nonExistent).toBeUndefined()
    })

    it('should check if host is deleting', () => {
      const store = useHostsStore()
      store.deletingHostId = 1
      
      expect(store.isHostDeleting(1)).toBe(true)
      expect(store.isHostDeleting(2)).toBe(false)
    })

    it('should clear search term', () => {
      const store = useHostsStore()
      store.setSearchTerm('test')
      
      store.clearSearch()
      expect(store.searchTerm).toBe('')
    })

    it('should clear error', () => {
      const store = useHostsStore()
      store.error = 'Some error'
      
      store.clearError()
      expect(store.error).toBe(null)
    })
  })

  describe('validation', () => {
    it('should detect existing addresses', () => {
      const store = useHostsStore()
      const mockHosts = createMockHosts(3)
      store.hosts = mockHosts
      
      expect(store.isAddressExists('192.168.1.1')).toBe(true)
      expect(store.isAddressExists('192.168.1.999')).toBe(false)
    })

    it('should exclude host ID when checking address existence', () => {
      const store = useHostsStore()
      const mockHosts = createMockHosts(3)
      store.hosts = mockHosts
      
      expect(store.isAddressExists('192.168.1.1', 1)).toBe(false) // Exclude same host
      expect(store.isAddressExists('192.168.1.1', 2)).toBe(true)  // Different host
    })

    describe('validateAddress', () => {
      it('should validate required address', () => {
        const store = useHostsStore()
        
        expect(store.validateAddress('')).toBe('Address is required')
        expect(store.validateAddress('   ')).toBe('Address is required')
      })

      it('should validate IP address format', () => {
        const store = useHostsStore()
        
        expect(store.validateAddress('192.168.1.1')).toBe(null)
        expect(store.validateAddress('invalid@address')).toBe('Please enter a valid IP address or hostname')
        expect(store.validateAddress('')).toBe('Address is required')
      })

      it('should validate hostname format', () => {
        const store = useHostsStore()
        
        expect(store.validateAddress('localhost')).toBe(null)
        expect(store.validateAddress('example.com')).toBe(null)
        expect(store.validateAddress('sub.example.com')).toBe(null)
        expect(store.validateAddress('invalid..hostname')).toBe('Please enter a valid IP address or hostname')
      })

      it('should detect duplicate addresses', () => {
        const store = useHostsStore()
        const mockHosts = createMockHosts(3)
        store.hosts = mockHosts
        
        expect(store.validateAddress('192.168.1.1')).toBe('This address already exists')
        expect(store.validateAddress('192.168.1.999')).toBe(null)
      })
    })
  })
})