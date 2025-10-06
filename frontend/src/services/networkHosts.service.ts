// Network hosts service - handles all network host-related API calls
import { AddNetworkHost, DeleteNetworkHost, ListNetworkHosts } from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'

export const networkHostsService = {
  async list(networkId: number, search = ''): Promise<entity.NetworkHost[]> {
    return ListNetworkHosts(networkId, search)
  },

  async add(networkId: number, address: string, description = ''): Promise<entity.NetworkHost> {
    return AddNetworkHost(networkId, address, description)
  },

  async delete(id: number): Promise<void> {
    return DeleteNetworkHost(id)
  },
}
