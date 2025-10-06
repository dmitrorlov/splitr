import { afterEach, beforeEach, vi } from "vitest";
import { config } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

// Mock Wails API functions before any imports
vi.mock("../../wailsjs/go/app/App", () => ({
  AddHost: vi.fn().mockResolvedValue({
    ID: 1,
    Address: "192.168.1.1",
    Description: "Test Host",
    CreatedAt: new Date().toISOString(),
  }),
  AddNetwork: vi.fn().mockResolvedValue({
    ID: 1,
    Name: "test-network",
    CreatedAt: new Date().toISOString(),
  }),
  AddNetworkHost: vi.fn().mockResolvedValue({
    ID: 1,
    NetworkID: 1,
    Address: "192.168.1.1",
    Description: "Test",
    CreatedAt: new Date().toISOString(),
  }),
  DeleteHost: vi.fn().mockResolvedValue(undefined),
  DeleteNetwork: vi.fn().mockResolvedValue(undefined),
  DeleteNetworkHost: vi.fn().mockResolvedValue(undefined),
  ExportNetworkHosts: vi.fn().mockResolvedValue("exported-data"),
  ImportNetworkHosts: vi.fn().mockResolvedValue(undefined),
  ListHosts: vi.fn().mockResolvedValue([]),
  ListNetworkHosts: vi.fn().mockResolvedValue([]),
  ListNetworks: vi.fn().mockResolvedValue([]),
  ListVPNServices: vi.fn().mockResolvedValue(["wireguard", "openvpn", "ipsec"]),
  SaveFileWithDialog: vi.fn().mockResolvedValue("/path/to/file"),
  SyncNetworkHostSetup: vi.fn().mockResolvedValue(undefined),
  ResetNetworkHostSetup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../wailsjs/runtime/runtime", () => ({
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
}));

// Note: frontendLogger is not globally mocked to allow standalone tests to work

// Set up global test configuration
config.global.plugins = [createPinia()];

beforeEach(() => {
  // Create a fresh Pinia instance for each test
  setActivePinia(createPinia());
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
});

// Global test utilities
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
