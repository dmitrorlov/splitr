import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hostsService } from '@/services/hosts.service'
import { createMockHost, createMockHosts } from '../../__mocks__/entities'

// Mock the Wails API functions
vi.mock('../../../wailsjs/go/app/App', () => ({
  ListHosts: vi.fn(),
  AddHost: vi.fn(),
  DeleteHost: vi.fn(),
}))

import { ListHosts, AddHost, DeleteHost } from '../../../wailsjs/go/app/App'

describe('hostsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should list all hosts', async () => {
      const mockHosts = createMockHosts(3)
      vi.mocked(ListHosts).mockResolvedValue(mockHosts)
      
      const result = await hostsService.list()
      
      expect(ListHosts).toHaveBeenCalledWith('')
      expect(result).toEqual(mockHosts)
    })

    it('should handle list error', async () => {
      const error = new Error('Failed to list hosts')
      vi.mocked(ListHosts).mockRejectedValue(error)
      
      await expect(hostsService.list()).rejects.toThrow('Failed to list hosts')
      expect(ListHosts).toHaveBeenCalledWith('')
    })
  })

  describe('add', () => {
    it('should add host with address and description', async () => {
      const mockHost = createMockHost({ Address: '192.168.1.100', Description: 'Test host' })
      vi.mocked(AddHost).mockResolvedValue(mockHost)
      
      const result = await hostsService.add('192.168.1.100', 'Test host')
      
      expect(AddHost).toHaveBeenCalledWith('192.168.1.100', 'Test host')
      expect(result).toEqual(mockHost)
    })

    it('should add host with address only (default empty description)', async () => {
      const mockHost = createMockHost({ Address: '192.168.1.100', Description: '' })
      vi.mocked(AddHost).mockResolvedValue(mockHost)
      
      const result = await hostsService.add('192.168.1.100')
      
      expect(AddHost).toHaveBeenCalledWith('192.168.1.100', '')
      expect(result).toEqual(mockHost)
    })

    it('should handle add error', async () => {
      const error = new Error('Failed to add host')
      vi.mocked(AddHost).mockRejectedValue(error)
      
      await expect(hostsService.add('192.168.1.100', 'Test host')).rejects.toThrow('Failed to add host')
      expect(AddHost).toHaveBeenCalledWith('192.168.1.100', 'Test host')
    })
  })

  describe('delete', () => {
    it('should delete host by id', async () => {
      vi.mocked(DeleteHost).mockResolvedValue()
      
      await hostsService.delete(1)
      
      expect(DeleteHost).toHaveBeenCalledWith(1)
    })

    it('should handle delete error', async () => {
      const error = new Error('Failed to delete host')
      vi.mocked(DeleteHost).mockRejectedValue(error)
      
      await expect(hostsService.delete(1)).rejects.toThrow('Failed to delete host')
      expect(DeleteHost).toHaveBeenCalledWith(1)
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      // Setup mocks
      const mockHosts = createMockHosts(2)
      const newHost = createMockHost({ ID: 3, Address: '192.168.1.102' })
      const updatedHosts = [...mockHosts, newHost]

      vi.mocked(ListHosts)
        .mockResolvedValueOnce(mockHosts)  // Initial list
        .mockResolvedValueOnce(updatedHosts)  // After add

      vi.mocked(AddHost).mockResolvedValue(newHost)
      vi.mocked(DeleteHost).mockResolvedValue()

      // Execute operations
      const initialHosts = await hostsService.list()
      expect(initialHosts).toHaveLength(2)

      const addedHost = await hostsService.add('192.168.1.102', 'New host')
      expect(addedHost.Address).toBe('192.168.1.102')

      await hostsService.delete(1)
      
      // Verify all calls were made
      expect(ListHosts).toHaveBeenCalledTimes(1)
      expect(AddHost).toHaveBeenCalledTimes(1)
      expect(DeleteHost).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent operations', async () => {
      const host1 = createMockHost({ ID: 1, Address: '192.168.1.1' })
      const host2 = createMockHost({ ID: 2, Address: '192.168.1.2' })
      
      vi.mocked(AddHost)
        .mockResolvedValueOnce(host1)
        .mockResolvedValueOnce(host2)

      // Execute concurrent adds
      const [result1, result2] = await Promise.all([
        hostsService.add('192.168.1.1', 'Host 1'),
        hostsService.add('192.168.1.2', 'Host 2')
      ])

      expect(result1.Address).toBe('192.168.1.1')
      expect(result2.Address).toBe('192.168.1.2')
      expect(AddHost).toHaveBeenCalledTimes(2)
    })
  })
})