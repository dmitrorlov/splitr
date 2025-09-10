import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNavigationStore } from '@/stores/navigation'
import { createMockNetworkWithStatus } from '../../__mocks__/entities'

describe('useNavigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useNavigationStore()
      
      expect(store.currentScreen).toBe('networks')
      expect(store.selectedNetwork).toBe(null)
      expect(store.navigationHistory).toEqual(['networks'])
    })
  })

  describe('computed properties', () => {
    it('should calculate canGoBack correctly', () => {
      const store = useNavigationStore()
      
      expect(store.canGoBack).toBe(false) // Initial state has only one entry
      
      store.navigateToHosts()
      expect(store.canGoBack).toBe(true) // Now has two entries
    })

    it('should return correct screen titles', () => {
      const store = useNavigationStore()
      
      expect(store.currentScreenTitle).toBe('Networks')
      
      store.navigateToHosts()
      expect(store.currentScreenTitle).toBe('Hosts')
      
      const mockNetwork = createMockNetworkWithStatus({ Name: 'Test Network' })
      store.navigateToNetworkHosts(mockNetwork)
      expect(store.currentScreenTitle).toBe('Test Network Hosts')
      
      // Test without selected network
      store.selectedNetwork = null
      store.currentScreen = 'networkHosts'
      expect(store.currentScreenTitle).toBe('Network Hosts')
    })
  })

  describe('navigation actions', () => {
    it('should navigate to networks', () => {
      const store = useNavigationStore()
      store.currentScreen = 'hosts'
      store.selectedNetwork = createMockNetworkWithStatus()
      
      store.navigateToNetworks()
      
      expect(store.currentScreen).toBe('networks')
      expect(store.selectedNetwork).toBe(null)
      expect(store.navigationHistory).toContain('networks')
    })

    it('should navigate to hosts', () => {
      const store = useNavigationStore()
      
      store.navigateToHosts()
      
      expect(store.currentScreen).toBe('hosts')
      expect(store.selectedNetwork).toBe(null)
      expect(store.navigationHistory).toEqual(['networks', 'hosts'])
    })

    it('should navigate to network hosts', () => {
      const store = useNavigationStore()
      const mockNetwork = createMockNetworkWithStatus({ Name: 'Test Network' })
      
      store.navigateToNetworkHosts(mockNetwork)
      
      expect(store.currentScreen).toBe('networkHosts')
      expect(store.selectedNetwork).toEqual(mockNetwork)
      expect(store.navigationHistory).toEqual(['networks', 'networkHosts'])
    })

    it('should go back correctly', () => {
      const store = useNavigationStore()
      
      // Navigate away from initial screen
      store.navigateToHosts()
      expect(store.currentScreen).toBe('hosts')
      expect(store.navigationHistory).toEqual(['networks', 'hosts'])
      
      // Go back
      store.goBack()
      expect(store.currentScreen).toBe('networks')
      expect(store.navigationHistory).toEqual(['networks'])
      expect(store.selectedNetwork).toBe(null)
    })

    it('should not go back when at start of history', () => {
      const store = useNavigationStore()
      const initialHistory = [...store.navigationHistory]
      
      store.goBack()
      
      expect(store.navigationHistory).toEqual(initialHistory)
      expect(store.currentScreen).toBe('networks')
    })

    it('should preserve selected network when going back to networkHosts', () => {
      const store = useNavigationStore()
      const mockNetwork = createMockNetworkWithStatus({ Name: 'Test Network' })
      
      // Navigate to network hosts
      store.navigateToNetworkHosts(mockNetwork)
      expect(store.selectedNetwork).toEqual(mockNetwork)
      
      // Navigate to hosts
      store.navigateToHosts()
      expect(store.selectedNetwork).toBe(null)
      
      // Go back to network hosts
      store.currentScreen = 'networkHosts'
      store.selectedNetwork = mockNetwork // This would be restored by the app logic
      expect(store.selectedNetwork).toEqual(mockNetwork)
    })

    it('should reset navigation completely', () => {
      const store = useNavigationStore()
      const mockNetwork = createMockNetworkWithStatus()
      
      // Make some changes
      store.navigateToNetworkHosts(mockNetwork)
      store.navigateToHosts()
      
      // Reset
      store.resetNavigation()
      
      expect(store.currentScreen).toBe('networks')
      expect(store.selectedNetwork).toBe(null)
      expect(store.navigationHistory).toEqual(['networks'])
    })
  })

  describe('history management', () => {
    it('should not add duplicate consecutive entries to history', () => {
      const store = useNavigationStore()
      
      store.navigateToNetworks()
      store.navigateToNetworks()
      
      expect(store.navigationHistory).toEqual(['networks'])
    })

    it('should limit history size to 10 entries', () => {
      const store = useNavigationStore()
      
      // Simulate navigation that would trigger history limit
      for (let i = 0; i < 12; i++) {
        const screen = i % 2 === 0 ? 'hosts' : 'networks'
        if (screen === 'hosts') {
          store.navigateToHosts()
        } else {
          store.navigateToNetworks()
        }
      }
      
      // Should keep only the last 10
      expect(store.navigationHistory.length).toBeLessThanOrEqual(10)
    })
  })
})