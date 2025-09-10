import type { Host, Network, NetworkHost, NetworkWithStatus } from '@/types/entities'
import { createMockHost, createMockNetwork, createMockNetworkHost, createMockNetworkWithStatus } from './entities'

export const mockApiResponses = {
  hosts: {
    list: (): Host[] => [
      createMockHost({ ID: 1, Address: '192.168.1.1', Description: 'Gateway' }),
      createMockHost({ ID: 2, Address: '192.168.1.10', Description: 'Server' }),
      createMockHost({ ID: 3, Address: '192.168.1.20', Description: 'Workstation' }),
    ],
    create: (address: string, description?: string): Host => 
      createMockHost({ ID: 4, Address: address, Description: description }),
  },

  networks: {
    list: (): NetworkWithStatus[] => [
      createMockNetworkWithStatus({ ID: 1, Name: 'Home Network', IsActive: true }),
      createMockNetworkWithStatus({ ID: 2, Name: 'Office Network', IsActive: false }),
      createMockNetworkWithStatus({ ID: 3, Name: 'Test Network', IsActive: true }),
    ],
    create: (name: string): Network => 
      createMockNetwork({ ID: 4, Name: name }),
  },

  networkHosts: {
    list: (networkId: number): NetworkHost[] => [
      createMockNetworkHost({ ID: 1, NetworkID: networkId, Address: '192.168.1.50', Description: 'Database' }),
      createMockNetworkHost({ ID: 2, NetworkID: networkId, Address: '192.168.1.51', Description: 'Web Server' }),
      createMockNetworkHost({ ID: 3, NetworkID: networkId, Address: '192.168.1.52', Description: 'Cache Server' }),
    ],
    create: (networkId: number, address: string, description?: string): NetworkHost => 
      createMockNetworkHost({ ID: 4, NetworkID: networkId, Address: address, Description: description }),
  },

  vpnServices: (): string[] => [
    'WireGuard',
    'OpenVPN',
    'IKEv2',
  ],

  export: (): string => JSON.stringify({
    networkHosts: mockApiResponses.networkHosts.list(1),
    exportedAt: new Date().toISOString(),
  }),

  import: (): void => {
    // Mock import success
  },
}