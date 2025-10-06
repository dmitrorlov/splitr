// Hosts service - handles all host-related API calls
import { AddHost, DeleteHost, ListHosts } from '../../wailsjs/go/app/App'
import type { entity } from '../../wailsjs/go/models'

export const hostsService = {
  async list(): Promise<entity.Host[]> {
    return ListHosts('')
  },

  async add(address: string, description = ''): Promise<entity.Host> {
    return AddHost(address, description)
  },

  async delete(id: number): Promise<void> {
    return DeleteHost(id)
  },
}
