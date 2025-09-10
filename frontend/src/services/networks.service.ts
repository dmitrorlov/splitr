// Networks service - handles all network-related API calls
import {
  AddNetwork,
  DeleteNetwork,
  ListNetworks,
  ListVPNServices,
  ResetNetworkHostSetup,
  SyncNetworkHostSetup,
} from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'

export const networksService = {
  async list(search = ''): Promise<entity.NetworkWithStatus[]> {
    return ListNetworks(search)
  },

  async add(name: string): Promise<entity.Network> {
    return AddNetwork(name)
  },

  async delete(id: number): Promise<void> {
    return DeleteNetwork(id)
  },

  async sync(id: number): Promise<void> {
    return SyncNetworkHostSetup(id)
  },

  async reset(id: number): Promise<void> {
    return ResetNetworkHostSetup(id)
  },
}

// VPN service for listing available VPN connections
export const vpnService = {
  async listServices(): Promise<string[]> {
    return ListVPNServices() as unknown as Promise<string[]>
  },
}
