export interface BaseEntity {
  ID: number
  CreatedAt: string
}

export interface Host extends BaseEntity {
  Address: string
  Description?: string
}

export interface Network extends BaseEntity {
  Name: string
}

export interface NetworkWithStatus extends Network {
  IsActive: boolean
}

export interface NetworkHost extends BaseEntity {
  NetworkID: number
  Address: string
  Description?: string
}

export type VPNService = string

export interface ListFilter {
  search?: string
  limit?: number
  offset?: number
}

export interface NetworkFilter extends ListFilter {
  isActive?: boolean
}

export interface HostFilter extends ListFilter {
  networkId?: number
}

export interface NetworkHostFilter extends ListFilter {
  networkId?: number
}

export interface CreateHostRequest {
  address: string
  description?: string
}

export interface CreateNetworkRequest {
  name: string
}

export interface CreateNetworkHostRequest {
  networkId: number
  address: string
  description?: string
}

export interface UpdateHostRequest {
  id: number
  address?: string
  description?: string
}

export interface UpdateNetworkRequest {
  id: number
  name?: string
}

export interface UpdateNetworkHostRequest {
  id: number
  address?: string
  description?: string
}

export interface EntitiesApiResponse<T = unknown> {
  data: T
  error?: string
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page?: number
  pageSize?: number
}

export type EntitiesScreen = 'networks' | 'networkHosts' | 'hosts'
