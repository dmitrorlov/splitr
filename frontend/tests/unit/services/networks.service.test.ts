import { describe, it, expect, beforeEach, vi } from 'vitest'
import { networksService, vpnService } from '@/services/networks.service'
import { createMockNetwork, createMockNetworks } from '../../__mocks__/entities'

// Mock the Wails API functions
vi.mock('../../../wailsjs/go/app/App', () => ({
  ListNetworks: vi.fn(),
  AddNetwork: vi.fn(),
  DeleteNetwork: vi.fn(),
  SyncNetworkHostSetup: vi.fn(),
  ResetNetworkHostSetup: vi.fn(),
  ListVPNServices: vi.fn(),
}))

import {
  ListNetworks,
  AddNetwork,
  DeleteNetwork,
  SyncNetworkHostSetup,
  ResetNetworkHostSetup,
  ListVPNServices,
} from '../../../wailsjs/go/app/App'

describe('networksService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should list all networks with empty search', async () => {
      const mockNetworks = createMockNetworks(3)
      vi.mocked(ListNetworks).mockResolvedValue(mockNetworks)
      
      const result = await networksService.list()
      
      expect(ListNetworks).toHaveBeenCalledWith('')
      expect(result).toEqual(mockNetworks)
    })

    it('should list networks with search term', async () => {
      const mockNetworks = createMockNetworks(2)
      vi.mocked(ListNetworks).mockResolvedValue(mockNetworks)
      
      const result = await networksService.list('home')
      
      expect(ListNetworks).toHaveBeenCalledWith('home')
      expect(result).toEqual(mockNetworks)
    })

    it('should handle list error', async () => {
      const error = new Error('Failed to list networks')
      vi.mocked(ListNetworks).mockRejectedValue(error)
      
      await expect(networksService.list()).rejects.toThrow('Failed to list networks')
      expect(ListNetworks).toHaveBeenCalledWith('')
    })
  })

  describe('add', () => {
    it('should add network with name', async () => {
      const mockNetwork = createMockNetwork({ Name: 'Home Network' })
      vi.mocked(AddNetwork).mockResolvedValue(mockNetwork)
      
      const result = await networksService.add('Home Network')
      
      expect(AddNetwork).toHaveBeenCalledWith('Home Network')
      expect(result).toEqual(mockNetwork)
    })

    it('should handle add error', async () => {
      const error = new Error('Failed to add network')
      vi.mocked(AddNetwork).mockRejectedValue(error)
      
      await expect(networksService.add('Home Network')).rejects.toThrow('Failed to add network')
      expect(AddNetwork).toHaveBeenCalledWith('Home Network')
    })
  })

  describe('delete', () => {
    it('should delete network by id', async () => {
      vi.mocked(DeleteNetwork).mockResolvedValue()
      
      await networksService.delete(1)
      
      expect(DeleteNetwork).toHaveBeenCalledWith(1)
    })

    it('should handle delete error', async () => {
      const error = new Error('Failed to delete network')
      vi.mocked(DeleteNetwork).mockRejectedValue(error)
      
      await expect(networksService.delete(1)).rejects.toThrow('Failed to delete network')
      expect(DeleteNetwork).toHaveBeenCalledWith(1)
    })
  })

  describe('sync', () => {
    it('should sync network by id', async () => {
      vi.mocked(SyncNetworkHostSetup).mockResolvedValue()
      
      await networksService.sync(1)
      
      expect(SyncNetworkHostSetup).toHaveBeenCalledWith(1)
    })

    it('should handle sync error', async () => {
      const error = new Error('Failed to sync network')
      vi.mocked(SyncNetworkHostSetup).mockRejectedValue(error)
      
      await expect(networksService.sync(1)).rejects.toThrow('Failed to sync network')
      expect(SyncNetworkHostSetup).toHaveBeenCalledWith(1)
    })
  })

  describe('reset', () => {
    it('should reset network by id', async () => {
      vi.mocked(ResetNetworkHostSetup).mockResolvedValue()
      
      await networksService.reset(1)
      
      expect(ResetNetworkHostSetup).toHaveBeenCalledWith(1)
    })

    it('should handle reset error', async () => {
      const error = new Error('Failed to reset network')
      vi.mocked(ResetNetworkHostSetup).mockRejectedValue(error)
      
      await expect(networksService.reset(1)).rejects.toThrow('Failed to reset network')
      expect(ResetNetworkHostSetup).toHaveBeenCalledWith(1)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete network lifecycle', async () => {
      // Setup mocks
      const mockNetworks = createMockNetworks(1)
      const newNetwork = createMockNetwork({ ID: 2, Name: 'Test Network' })
      const updatedNetworks = [...mockNetworks, newNetwork]

      vi.mocked(ListNetworks)
        .mockResolvedValueOnce(mockNetworks)  // Initial list
        .mockResolvedValueOnce(updatedNetworks)  // After add

      vi.mocked(AddNetwork).mockResolvedValue(newNetwork)
      vi.mocked(SyncNetworkHostSetup).mockResolvedValue()
      vi.mocked(ResetNetworkHostSetup).mockResolvedValue()
      vi.mocked(DeleteNetwork).mockResolvedValue()

      // Execute operations
      const initialNetworks = await networksService.list()
      expect(initialNetworks).toHaveLength(1)

      const addedNetwork = await networksService.add('Test Network')
      expect(addedNetwork.Name).toBe('Test Network')

      await networksService.sync(addedNetwork.ID)
      await networksService.reset(addedNetwork.ID)
      await networksService.delete(addedNetwork.ID)
      
      // Verify all calls were made
      expect(ListNetworks).toHaveBeenCalledTimes(1)
      expect(AddNetwork).toHaveBeenCalledTimes(1)
      expect(SyncNetworkHostSetup).toHaveBeenCalledTimes(1)
      expect(ResetNetworkHostSetup).toHaveBeenCalledTimes(1)
      expect(DeleteNetwork).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple sync operations', async () => {
      vi.mocked(SyncNetworkHostSetup).mockResolvedValue()

      // Execute concurrent syncs
      await Promise.all([
        networksService.sync(1),
        networksService.sync(2),
        networksService.sync(3)
      ])

      expect(SyncNetworkHostSetup).toHaveBeenCalledTimes(3)
      expect(SyncNetworkHostSetup).toHaveBeenCalledWith(1)
      expect(SyncNetworkHostSetup).toHaveBeenCalledWith(2)
      expect(SyncNetworkHostSetup).toHaveBeenCalledWith(3)
    })
  })
})

describe('vpnService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listServices', () => {
    it('should list VPN services', async () => {
      const mockServices = ['WireGuard', 'OpenVPN', 'IKEv2']
      vi.mocked(ListVPNServices).mockResolvedValue(mockServices)
      
      const result = await vpnService.listServices()
      
      expect(ListVPNServices).toHaveBeenCalled()
      expect(result).toEqual(mockServices)
    })

    it('should handle list services error', async () => {
      const error = new Error('Failed to list VPN services')
      vi.mocked(ListVPNServices).mockRejectedValue(error)
      
      await expect(vpnService.listServices()).rejects.toThrow('Failed to list VPN services')
      expect(ListVPNServices).toHaveBeenCalled()
    })

    it('should handle empty services list', async () => {
      vi.mocked(ListVPNServices).mockResolvedValue([])
      
      const result = await vpnService.listServices()
      
      expect(result).toEqual([])
    })

    it('should handle malformed response', async () => {
      // Test type casting with non-array response
      vi.mocked(ListVPNServices).mockResolvedValue('not-an-array' as any)
      
      const result = await vpnService.listServices()
      
      expect(result).toBe('not-an-array')
    })
  })
})