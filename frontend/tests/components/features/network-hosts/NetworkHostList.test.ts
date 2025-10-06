import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import NetworkHostList from '@/components/features/network-hosts/NetworkHostList.vue'
import NetworkHostCard from '@/components/features/network-hosts/NetworkHostCard.vue'
import { createMockNetworkHosts, createMockNetworkHost } from '../../../__mocks__/entities'
import type { NetworkHost } from '@/types/entities'
import { ComputerDesktopIcon } from '@heroicons/vue/24/outline'

describe('NetworkHostList', () => {
  let wrapper: VueWrapper<any>
  let mockNetworkHosts: NetworkHost[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockNetworkHosts = createMockNetworkHosts(3, 1)
  })

  const createWrapper = (props: Partial<{
    networkHosts: NetworkHost[]
    loading: boolean
    searchTerm: string
    networkName: string
  }> = {}) => {
    return mount(NetworkHostList, {
      props: {
        networkHosts: mockNetworkHosts,
        loading: false,
        searchTerm: '',
        networkName: '',
        ...props,
      },
      global: {
        components: {
          NetworkHostCard,
        },
        stubs: {
          NetworkHostCard: true,
          ComputerDesktopIcon: true,
        },
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render network hosts grid when network hosts are provided', () => {
      wrapper = createWrapper()
      
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
      expect(grid.classes()).toContain('lg:grid-cols-3')
    })

    it('should render NetworkHostCard components for each network host', () => {
      wrapper = createWrapper()
      
      const networkHostCards = wrapper.findAllComponents(NetworkHostCard)
      expect(networkHostCards).toHaveLength(3)
    })

    it('should pass correct props to NetworkHostCard components', () => {
      wrapper = createWrapper()
      
      const networkHostCards = wrapper.findAllComponents(NetworkHostCard)
      networkHostCards.forEach((card, index) => {
        expect(card.props('networkHost')).toEqual(mockNetworkHosts[index])
      })
    })

    it('should set unique keys for NetworkHostCard components', () => {
      wrapper = createWrapper()
      
      const networkHostCards = wrapper.findAllComponents(NetworkHostCard)
      networkHostCards.forEach((card, index) => {
        expect(card.element.getAttribute('data-v-')).toBeDefined()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no network hosts and not loading', () => {
      wrapper = createWrapper({ networkHosts: [], loading: false })
      
      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(true)
      expect(wrapper.findComponent(ComputerDesktopIcon).exists()).toBe(true)
    })

    it('should not show empty state when loading', () => {
      wrapper = createWrapper({ networkHosts: [], loading: true })
      
      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(false)
    })

    it('should not show empty state when network hosts exist', () => {
      wrapper = createWrapper()
      
      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(false)
    })

    it('should show default empty state message when no search term', () => {
      wrapper = createWrapper({ networkHosts: [], searchTerm: '' })
      
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to this network')
    })

    it('should show search empty state message when search term provided', () => {
      wrapper = createWrapper({ networkHosts: [], searchTerm: 'test search' })
      
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })

    it('should show network-specific empty state message when network name provided', () => {
      wrapper = createWrapper({ networkHosts: [], networkName: 'Production Network' })
      
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to Production Network')
    })

    it('should prioritize search message over network name when searching', () => {
      wrapper = createWrapper({ 
        networkHosts: [], 
        searchTerm: 'test', 
        networkName: 'Production Network' 
      })
      
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })

    it('should render ComputerDesktopIcon in empty state', () => {
      wrapper = createWrapper({ networkHosts: [] })
      
      const computerIcon = wrapper.findComponent(ComputerDesktopIcon)
      expect(computerIcon.exists()).toBe(true)
      expect(computerIcon.classes()).toContain('text-gray-400')
      expect(computerIcon.classes()).toContain('h-12')
      expect(computerIcon.classes()).toContain('w-12')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      wrapper = createWrapper({ loading: true })
      
      const loadingSpinner = wrapper.find('.animate-spin')
      expect(loadingSpinner.exists()).toBe(true)
      expect(loadingSpinner.classes()).toContain('animate-spin')
      expect(loadingSpinner.classes()).toContain('rounded-full')
      expect(loadingSpinner.classes()).toContain('border-blue-600')
    })

    it('should not show loading spinner when loading is false', () => {
      wrapper = createWrapper({ loading: false })
      
      const loadingSpinner = wrapper.find('.animate-spin')
      expect(loadingSpinner.exists()).toBe(false)
    })

    it('should show loading spinner even when network hosts exist', () => {
      wrapper = createWrapper({ loading: true, networkHosts: mockNetworkHosts })
      
      const loadingSpinner = wrapper.find('.animate-spin')
      const grid = wrapper.find('.grid')
      
      expect(loadingSpinner.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
    })

    it('should center loading spinner correctly', () => {
      wrapper = createWrapper({ loading: true })
      
      const loadingContainer = wrapper.find('.flex.justify-center.items-center.py-12')
      expect(loadingContainer.exists()).toBe(true)
    })
  })

  describe('Props', () => {
    it('should handle networkHosts prop changes', async () => {
      wrapper = createWrapper({ networkHosts: [] })
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(0)
      
      await wrapper.setProps({ networkHosts: mockNetworkHosts })
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(3)
      
      const singleNetworkHost = [mockNetworkHosts[0]]
      await wrapper.setProps({ networkHosts: singleNetworkHost })
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(1)
    })

    it('should handle loading prop changes', async () => {
      wrapper = createWrapper({ loading: false })
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
      
      await wrapper.setProps({ loading: true })
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      
      await wrapper.setProps({ loading: false })
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
    })

    it('should handle searchTerm prop changes', async () => {
      wrapper = createWrapper({ networkHosts: [], searchTerm: '' })
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      
      await wrapper.setProps({ searchTerm: 'test' })
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      
      await wrapper.setProps({ searchTerm: '' })
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
    })

    it('should handle networkName prop changes', async () => {
      wrapper = createWrapper({ networkHosts: [], networkName: '' })
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to this network')
      
      await wrapper.setProps({ networkName: 'Test Network' })
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to Test Network')
      
      await wrapper.setProps({ networkName: '' })
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to this network')
    })

    it('should have correct default props', () => {
      wrapper = mount(NetworkHostList, {
        props: { networkHosts: [] },
      })
      
      expect(wrapper.props('loading')).toBe(false)
      expect(wrapper.props('searchTerm')).toBe('')
    })
  })

  describe('Computed Properties', () => {
    it('should correctly compute showEmptyState', async () => {
      // Show empty state: no network hosts and not loading
      wrapper = createWrapper({ networkHosts: [], loading: false })
      expect(wrapper.find('.text-center.py-12').exists()).toBe(true)
      
      // Don't show empty state: network hosts exist
      await wrapper.setProps({ networkHosts: mockNetworkHosts })
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
      
      // Don't show empty state: loading
      await wrapper.setProps({ networkHosts: [], loading: true })
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
    })

    it('should correctly compute empty state titles and messages based on context', async () => {
      // Default state
      wrapper = createWrapper({ networkHosts: [], searchTerm: '', networkName: '' })
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to this network')
      
      // With network name
      await wrapper.setProps({ networkName: 'My Network' })
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to My Network')
      
      // Search state (overrides network name)
      await wrapper.setProps({ searchTerm: 'search term', networkName: 'My Network' })
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
      
      // Back to default
      await wrapper.setProps({ searchTerm: '', networkName: '' })
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
    })
  })

  describe('Layout and Styling', () => {
    it('should apply correct grid classes', () => {
      wrapper = createWrapper()
      
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toEqual([
        'grid',
        'grid-cols-1',
        'md:grid-cols-2', 
        'lg:grid-cols-3',
        'gap-4'
      ])
    })

    it('should apply correct empty state styling', () => {
      wrapper = createWrapper({ networkHosts: [] })
      
      const emptyState = wrapper.find('.text-center.py-12')
      const title = wrapper.find('h3')
      const message = wrapper.find('p')
      
      expect(emptyState.classes()).toContain('text-center')
      expect(emptyState.classes()).toContain('py-12')
      expect(title.classes()).toContain('text-gray-900')
      expect(message.classes()).toContain('text-gray-500')
    })

    it('should apply correct loading spinner styling', () => {
      wrapper = createWrapper({ loading: true })
      
      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toEqual([
        'animate-spin',
        'rounded-full',
        'h-8',
        'w-8',
        'border-b-2',
        'border-blue-600'
      ])
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty network hosts array', () => {
      wrapper = createWrapper({ networkHosts: [] })
      
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(0)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(true)
    })

    it('should handle single network host', () => {
      const singleNetworkHost = [mockNetworkHosts[0]]
      wrapper = createWrapper({ networkHosts: singleNetworkHost })
      
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(1)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
    })

    it('should handle large number of network hosts', () => {
      const largeNetworkHostList = createMockNetworkHosts(50, 1)
      wrapper = createWrapper({ networkHosts: largeNetworkHostList })
      
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(50)
      expect(wrapper.find('.grid').exists()).toBe(true)
    })

    it('should handle network hosts with special characters in addresses', () => {
      const specialNetworkHosts = [
        createMockNetworkHost({ Address: '192.168.1.1' }),
        createMockNetworkHost({ Address: 'host-name.example.com' }),
        createMockNetworkHost({ Address: '::1' }),
        createMockNetworkHost({ Address: '127.0.0.1:8080' }),
      ]
      wrapper = createWrapper({ networkHosts: specialNetworkHosts })
      
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(4)
    })

    it('should handle simultaneous loading and empty states correctly', () => {
      wrapper = createWrapper({ networkHosts: [], loading: true })
      
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false) // Empty state hidden when loading
    })

    it('should handle search term with special characters', async () => {
      wrapper = createWrapper({ networkHosts: [], searchTerm: '!@#$%^&*()' })
      
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })

    it('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000)
      wrapper = createWrapper({ networkHosts: [], searchTerm: longSearchTerm })
      
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })

    it('should handle very long network names', async () => {
      const longNetworkName = 'Very Long Network Name That Might Overflow The Container And Cause Layout Issues'
      wrapper = createWrapper({ networkHosts: [], networkName: longNetworkName })
      
      expect(wrapper.find('p').text()).toBe(`Get started by adding hosts to ${longNetworkName}`)
    })

    it('should handle network name with special characters', async () => {
      wrapper = createWrapper({ networkHosts: [], networkName: 'Network-1_test@domain.com' })
      
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to Network-1_test@domain.com')
    })
  })

  describe('Reactivity', () => {
    it('should reactively update when network hosts change', async () => {
      wrapper = createWrapper({ networkHosts: [] })
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(0)
      
      await wrapper.setProps({ networkHosts: [mockNetworkHosts[0]] })
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(1)
      
      await wrapper.setProps({ networkHosts: mockNetworkHosts })
      expect(wrapper.findAllComponents(NetworkHostCard)).toHaveLength(3)
    })

    it('should reactively update empty state based on search term and network name', async () => {
      wrapper = createWrapper({ networkHosts: [] })
      
      expect(wrapper.text()).toContain('Get started by adding hosts to this network')
      
      await wrapper.setProps({ networkName: 'Test Network' })
      expect(wrapper.text()).toContain('Get started by adding hosts to Test Network')
      
      await wrapper.setProps({ searchTerm: 'test' })
      expect(wrapper.text()).toContain('Try a different search term or clear the search')
    })

    it('should reactively show/hide loading state', async () => {
      wrapper = createWrapper({ loading: false })
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
      
      await wrapper.setProps({ loading: true })
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('Message Priority', () => {
    it('should prioritize search messages over network-specific messages', async () => {
      wrapper = createWrapper({ 
        networkHosts: [], 
        searchTerm: 'search', 
        networkName: 'Important Network' 
      })
      
      // Search message should take priority
      expect(wrapper.find('h3').text()).toBe('No hosts found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
      expect(wrapper.text()).not.toContain('Important Network')
    })

    it('should show network-specific message when not searching', async () => {
      wrapper = createWrapper({ 
        networkHosts: [], 
        searchTerm: '', 
        networkName: 'Important Network' 
      })
      
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to Important Network')
    })

    it('should fall back to generic message when no network name provided', async () => {
      wrapper = createWrapper({ 
        networkHosts: [], 
        searchTerm: '', 
        networkName: '' 
      })
      
      expect(wrapper.find('h3').text()).toBe('No hosts in this network')
      expect(wrapper.find('p').text()).toBe('Get started by adding hosts to this network')
    })
  })
})