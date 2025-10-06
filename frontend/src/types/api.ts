// API-related types and error handling

import type { Host, Network, NetworkHost, NetworkWithStatus, VPNService } from './entities'

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiCallOptions<T = unknown> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  loadingMessage?: string
  silent?: boolean // Don't show notifications for this call
}

// Wails API function types based on the current implementation
export interface WailsApi {
  AddHost: (address: string, description: string) => Promise<Host>
  AddNetwork: (name: string) => Promise<Network>
  AddNetworkHost: (networkId: number, address: string, description: string) => Promise<NetworkHost>
  DeleteHost: (id: number) => Promise<void>
  DeleteNetwork: (id: number) => Promise<void>
  DeleteNetworkHost: (id: number) => Promise<void>
  ExportNetworkHosts: (networkId: number) => Promise<string>
  ImportNetworkHosts: (networkId: number, jsonData: string) => Promise<void>
  ListHosts: (search: string) => Promise<Host[]>
  ListNetworkHosts: (networkId: number, search: string) => Promise<NetworkHost[]>
  ListNetworks: (search: string) => Promise<NetworkWithStatus[]>
  ListVPNServices: () => Promise<VPNService[]>
  SaveFileWithDialog: (defaultName: string, content: string) => Promise<string>
  SyncNetworkHostSetup: (networkId: number) => Promise<void>
  ResetNetworkHostSetup: (networkId: number) => Promise<void>
}

// Service interfaces for type safety
export interface NetworkService {
  list(search?: string): Promise<NetworkWithStatus[]>
  add(name: string): Promise<Network>
  delete(id: number): Promise<void>
  sync(id: number): Promise<void>
  reset(id: number): Promise<void>
}

export interface HostService {
  list(): Promise<Host[]>
  add(address: string, description?: string): Promise<Host>
  delete(id: number): Promise<void>
}

export interface NetworkHostService {
  list(networkId: number, search?: string): Promise<NetworkHost[]>
  add(networkId: number, address: string, description?: string): Promise<NetworkHost>
  delete(id: number): Promise<void>
}

export interface VpnService {
  listServices(): Promise<VPNService[]>
}

// Request/Response types for better type safety
export interface AddNetworkRequest {
  name: string
}

export interface AddHostRequest {
  address: string
  description?: string
}

export interface AddNetworkHostRequest {
  networkId: number
  address: string
  description?: string
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

// API state types
export interface ApiState<T = unknown> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch?: Date
}

// Pagination types (for future use)
export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
