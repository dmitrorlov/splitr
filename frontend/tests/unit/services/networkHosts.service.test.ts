import { describe, it, expect, beforeEach, vi } from 'vitest'
import { networkHostsService } from '@/services/networkHosts.service'
import { createMockNetworkHost, createMockNetworkHosts } from '../../__mocks__/entities'

// Mock the Wails API functions
vi.mock('../../../wailsjs/go/app/App', () => ({
  ListNetworkHosts: vi.fn(),
  AddNetworkHost: vi.fn(),
  DeleteNetworkHost: vi.fn(),
}))

import { ListNetworkHosts, AddNetworkHost, DeleteNetworkHost } from '../../../wailsjs/go/app/App'

describe('networkHostsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should list network hosts with network id and empty search', async () => {
      const mockNetworkHosts = createMockNetworkHosts(3, 1)
      vi.mocked(ListNetworkHosts).mockResolvedValue(mockNetworkHosts)
      
      const result = await networkHostsService.list(1)
      
      expect(ListNetworkHosts).toHaveBeenCalledWith(1, '')
      expect(result).toEqual(mockNetworkHosts)
    })

    it('should list network hosts with search term', async () => {
      const mockNetworkHosts = createMockNetworkHosts(2, 1)
      vi.mocked(ListNetworkHosts).mockResolvedValue(mockNetworkHosts)
      
      const result = await networkHostsService.list(1, 'database')
      
      expect(ListNetworkHosts).toHaveBeenCalledWith(1, 'database')
      expect(result).toEqual(mockNetworkHosts)
    })

    it('should handle list error', async () => {
      const error = new Error('Failed to list network hosts')
      vi.mocked(ListNetworkHosts).mockRejectedValue(error)
      
      await expect(networkHostsService.list(1)).rejects.toThrow('Failed to list network hosts')
      expect(ListNetworkHosts).toHaveBeenCalledWith(1, '')
    })

    it('should handle different network ids', async () => {
      const networkHosts1 = createMockNetworkHosts(2, 1)
      const networkHosts2 = createMockNetworkHosts(3, 2)
      
      vi.mocked(ListNetworkHosts)
        .mockResolvedValueOnce(networkHosts1)
        .mockResolvedValueOnce(networkHosts2)
      
      const result1 = await networkHostsService.list(1)
      const result2 = await networkHostsService.list(2)
      
      expect(ListNetworkHosts).toHaveBeenCalledWith(1, '')
      expect(ListNetworkHosts).toHaveBeenCalledWith(2, '')
      expect(result1).toHaveLength(2)
      expect(result2).toHaveLength(3)
    })
  })

  describe('add', () => {
    it('should add network host with all parameters', async () => {
      const mockNetworkHost = createMockNetworkHost({
        NetworkID: 1,
        Address: '192.168.1.100',
        Description: 'Database server'
      })
      vi.mocked(AddNetworkHost).mockResolvedValue(mockNetworkHost)
      
      const result = await networkHostsService.add(1, '192.168.1.100', 'Database server')
      
      expect(AddNetworkHost).toHaveBeenCalledWith(1, '192.168.1.100', 'Database server')
      expect(result).toEqual(mockNetworkHost)
    })

    it('should add network host with default empty description', async () => {
      const mockNetworkHost = createMockNetworkHost({
        NetworkID: 1,
        Address: '192.168.1.100',
        Description: ''
      })
      vi.mocked(AddNetworkHost).mockResolvedValue(mockNetworkHost)
      
      const result = await networkHostsService.add(1, '192.168.1.100')
      
      expect(AddNetworkHost).toHaveBeenCalledWith(1, '192.168.1.100', '')
      expect(result).toEqual(mockNetworkHost)
    })

    it('should handle add error', async () => {
      const error = new Error('Failed to add network host')
      vi.mocked(AddNetworkHost).mockRejectedValue(error)
      
      await expect(networkHostsService.add(1, '192.168.1.100', 'Test host')).rejects.toThrow('Failed to add network host')
      expect(AddNetworkHost).toHaveBeenCalledWith(1, '192.168.1.100', 'Test host')
    })

    it('should handle multiple network ids', async () => {
      const host1 = createMockNetworkHost({ NetworkID: 1, Address: '192.168.1.1' })
      const host2 = createMockNetworkHost({ NetworkID: 2, Address: '192.168.2.1' })
      
      vi.mocked(AddNetworkHost)
        .mockResolvedValueOnce(host1)
        .mockResolvedValueOnce(host2)
      
      const result1 = await networkHostsService.add(1, '192.168.1.1', 'Host 1')
      const result2 = await networkHostsService.add(2, '192.168.2.1', 'Host 2')
      
      expect(result1.NetworkID).toBe(1)
      expect(result2.NetworkID).toBe(2)
    })
  })

  describe('delete', () => {
    it('should delete network host by id', async () => {
      vi.mocked(DeleteNetworkHost).mockResolvedValue()
      
      await networkHostsService.delete(1)
      
      expect(DeleteNetworkHost).toHaveBeenCalledWith(1)
    })

    it('should handle delete error', async () => {
      const error = new Error('Failed to delete network host')
      vi.mocked(DeleteNetworkHost).mockRejectedValue(error)
      
      await expect(networkHostsService.delete(1)).rejects.toThrow('Failed to delete network host')
      expect(DeleteNetworkHost).toHaveBeenCalledWith(1)
    })

    it('should handle multiple deletes', async () => {
      vi.mocked(DeleteNetworkHost).mockResolvedValue()
      
      await Promise.all([
        networkHostsService.delete(1),
        networkHostsService.delete(2),
        networkHostsService.delete(3)
      ])
      
      expect(DeleteNetworkHost).toHaveBeenCalledTimes(3)
      expect(DeleteNetworkHost).toHaveBeenCalledWith(1)
      expect(DeleteNetworkHost).toHaveBeenCalledWith(2)
      expect(DeleteNetworkHost).toHaveBeenCalledWith(3)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete network host lifecycle', async () => {
      // Setup mocks
      const initialHosts = createMockNetworkHosts(2, 1)
      const newHost = createMockNetworkHost({ ID: 3, NetworkID: 1, Address: '192.168.1.103' })
      const updatedHosts = [...initialHosts, newHost]

      vi.mocked(ListNetworkHosts)
        .mockResolvedValueOnce(initialHosts)  // Initial list
        .mockResolvedValueOnce(updatedHosts)  // After add
        .mockResolvedValueOnce(initialHosts)  // After delete

      vi.mocked(AddNetworkHost).mockResolvedValue(newHost)
      vi.mocked(DeleteNetworkHost).mockResolvedValue()

      // Execute operations
      const initial = await networkHostsService.list(1)
      expect(initial).toHaveLength(2)

      const added = await networkHostsService.add(1, '192.168.1.103', 'New host')
      expect(added.Address).toBe('192.168.1.103')

      await networkHostsService.delete(added.ID)
      
      // Verify all calls
      expect(ListNetworkHosts).toHaveBeenCalledTimes(1)
      expect(AddNetworkHost).toHaveBeenCalledTimes(1)
      expect(DeleteNetworkHost).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple networks with hosts', async () => {
      // Reset all mocks to ensure clean state
      vi.resetAllMocks()
      
      const network1Hosts = [
        createMockNetworkHost({ ID: 1, NetworkID: 1, Address: '192.168.1.10' }),
        createMockNetworkHost({ ID: 2, NetworkID: 1, Address: '192.168.1.11' })
      ]
      const network2Hosts = [
        createMockNetworkHost({ ID: 3, NetworkID: 2, Address: '192.168.2.10' }),
        createMockNetworkHost({ ID: 4, NetworkID: 2, Address: '192.168.2.11' }),
        createMockNetworkHost({ ID: 5, NetworkID: 2, Address: '192.168.2.12' })
      ]
      
      // Set up individual mocks for each call
      vi.mocked(ListNetworkHosts).mockImplementation((networkId: number) => {
        if (networkId === 1) return Promise.resolve(network1Hosts)
        if (networkId === 2) return Promise.resolve(network2Hosts)
        return Promise.resolve([])
      })

      const hosts1 = await networkHostsService.list(1)
      const hosts2 = await networkHostsService.list(2)

      expect(hosts1).toHaveLength(2)
      expect(hosts2).toHaveLength(3)
      expect(hosts1.every(h => h.NetworkID === 1)).toBe(true)
      expect(hosts2.every(h => h.NetworkID === 2)).toBe(true)
    })

    it('should handle search functionality across operations', async () => {
      vi.clearAllMocks() // Clear any previous mock calls
      
      const allHosts = [
        createMockNetworkHost({ ID: 1, NetworkID: 1, Address: '192.168.1.10', Description: 'Database' }),
        createMockNetworkHost({ ID: 2, NetworkID: 1, Address: '192.168.1.11', Description: 'Web Server' }),
        createMockNetworkHost({ ID: 3, NetworkID: 1, Address: '192.168.1.12', Description: 'Cache' }),
        createMockNetworkHost({ ID: 4, NetworkID: 1, Address: '192.168.1.13', Description: 'Mail Server' }),
        createMockNetworkHost({ ID: 5, NetworkID: 1, Address: '192.168.1.14', Description: 'DNS Server' })
      ]
      const filteredHosts = [
        createMockNetworkHost({ ID: 1, NetworkID: 1, Address: '192.168.1.10', Description: 'Database' }),
        createMockNetworkHost({ ID: 6, NetworkID: 1, Address: '192.168.1.15', Description: 'Database Backup' })
      ]  // Simulate search result
      
      // Set up mocks for different search terms
      vi.mocked(ListNetworkHosts).mockImplementation((networkId: number, search: string) => {
        if (networkId === 1 && search === '') return Promise.resolve(allHosts)
        if (networkId === 1 && search === 'database') return Promise.resolve(filteredHosts)
        return Promise.resolve([])
      })

      const all = await networkHostsService.list(1)
      const filtered = await networkHostsService.list(1, 'database')

      expect(all).toHaveLength(5)
      expect(filtered).toHaveLength(2)
      expect(ListNetworkHosts).toHaveBeenCalledWith(1, '')
      expect(ListNetworkHosts).toHaveBeenCalledWith(1, 'database')
    })

    it('should handle error recovery scenarios', async () => {
      // First call fails, second succeeds
      const mockHost = createMockNetworkHost({ NetworkID: 1, Address: '192.168.1.1' })
      
      vi.mocked(AddNetworkHost)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockHost)

      // First attempt fails
      await expect(networkHostsService.add(1, '192.168.1.1')).rejects.toThrow('Network error')

      // Second attempt succeeds
      const result = await networkHostsService.add(1, '192.168.1.1')
      expect(result).toEqual(mockHost)
      
      expect(AddNetworkHost).toHaveBeenCalledTimes(2)
    })
  })
})