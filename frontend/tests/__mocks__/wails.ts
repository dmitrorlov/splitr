import { vi } from 'vitest'
import type { WailsApi } from '@/types/api'

// Mock Wails API
export const mockWailsApi: WailsApi = {
  AddHost: vi.fn(),
  AddNetwork: vi.fn(),
  AddNetworkHost: vi.fn(),
  DeleteHost: vi.fn(),
  DeleteNetwork: vi.fn(),
  DeleteNetworkHost: vi.fn(),
  ExportNetworkHosts: vi.fn(),
  ImportNetworkHosts: vi.fn(),
  ListHosts: vi.fn(),
  ListNetworkHosts: vi.fn(),
  ListNetworks: vi.fn(),
  ListVPNServices: vi.fn(),
  SaveFileWithDialog: vi.fn(),
  SyncNetworkHostSetup: vi.fn(),
  ResetNetworkHostSetup: vi.fn(),
}

// Mock wailsjs runtime
export const mockWailsRuntime = {
  LogPrint: vi.fn(),
  LogTrace: vi.fn(),
  LogDebug: vi.fn(),
  LogInfo: vi.fn(),
  LogWarning: vi.fn(),
  LogError: vi.fn(),
  LogFatal: vi.fn(),
  EventsEmit: vi.fn(),
  EventsOn: vi.fn(),
  EventsOff: vi.fn(),
}

vi.mock('../../wailsjs/go/app/App', () => mockWailsApi)
vi.mock('../../wailsjs/runtime/runtime', () => mockWailsRuntime)