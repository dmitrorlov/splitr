import type { Host, Network, NetworkHost, NetworkWithStatus } from '@/types/entities'

export const createMockHost = (overrides: Partial<Host> = {}): Host => ({
  ID: 1,
  CreatedAt: new Date().toISOString(),
  Address: '192.168.1.1',
  Description: 'Test host',
  ...overrides,
})

export const createMockNetwork = (overrides: Partial<Network> = {}): Network => ({
  ID: 1,
  CreatedAt: new Date().toISOString(),
  Name: 'Test Network',
  ...overrides,
})

export const createMockNetworkWithStatus = (overrides: Partial<NetworkWithStatus> = {}): NetworkWithStatus => ({
  ID: 1,
  CreatedAt: new Date().toISOString(),
  Name: 'Test Network',
  IsActive: true,
  ...overrides,
})

export const createMockNetworkHost = (overrides: Partial<NetworkHost> = {}): NetworkHost => ({
  ID: 1,
  CreatedAt: new Date().toISOString(),
  NetworkID: 1,
  Address: '192.168.1.10',
  Description: 'Test network host',
  ...overrides,
})

export const createMockHosts = (count: number = 3): Host[] => {
  return Array.from({ length: count }, (_, index) => createMockHost({
    ID: index + 1,
    Address: `192.168.1.${index + 1}`,
    Description: `Host ${index + 1}`,
  }))
}

export const createMockNetworks = (count: number = 3): NetworkWithStatus[] => {
  return Array.from({ length: count }, (_, index) => createMockNetworkWithStatus({
    ID: index + 1,
    Name: `Network ${index + 1}`,
    IsActive: index % 2 === 0,
  }))
}

export const createMockNetworkHosts = (count: number = 3, networkId: number = 1): NetworkHost[] => {
  return Array.from({ length: count }, (_, index) => createMockNetworkHost({
    ID: index + 1,
    NetworkID: networkId,
    Address: `192.168.1.${index + 10}`,
    Description: `Network Host ${index + 1}`,
  }))
}