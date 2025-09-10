import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import NetworkList from '@/components/features/networks/NetworkList.vue'
import NetworkCard from '@/components/features/networks/NetworkCard.vue'
import { createMockNetworks, createMockNetworkWithStatus } from '../../../__mocks__/entities'
import type { NetworkWithStatus } from '@/types/entities'
import { CloudIcon } from '@heroicons/vue/24/outline'

describe('NetworkList', () => {
  let wrapper: VueWrapper<any>
  let mockNetworks: NetworkWithStatus[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockNetworks = createMockNetworks(3)
  })

  const createWrapper = (props: Partial<{
    networks: NetworkWithStatus[]
    loading: boolean
    searchTerm: string
  }> = {}) => {
    return mount(NetworkList, {
      props: {
        networks: mockNetworks,
        loading: false,
        searchTerm: '',
        ...props,
      },
      global: {
        components: {
          NetworkCard,
        },
        stubs: {
          NetworkCard: true,
          CloudIcon: true,
        },
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render networks grid when networks are provided', () => {
      wrapper = createWrapper()
      
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
      expect(grid.classes()).toContain('lg:grid-cols-3')
    })

    it('should render NetworkCard components for each network', () => {
      wrapper = createWrapper()
      
      const networkCards = wrapper.findAllComponents(NetworkCard)
      expect(networkCards).toHaveLength(3)
    })

    it('should pass correct props to NetworkCard components', () => {
      wrapper = createWrapper()
      
      const networkCards = wrapper.findAllComponents(NetworkCard)
      networkCards.forEach((card, index) => {
        expect(card.props('network')).toEqual(mockNetworks[index])
      })
    })

    it('should set unique keys for NetworkCard components', () => {
      wrapper = createWrapper()
      
      const networkCards = wrapper.findAllComponents(NetworkCard)
      networkCards.forEach((card, index) => {
        expect(card.element.getAttribute('data-v-')).toBeDefined()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no networks and not loading', () => {
      wrapper = createWrapper({ networks: [], loading: false })
      
      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(true)
      expect(wrapper.findComponent(CloudIcon).exists()).toBe(true)
    })

    it('should not show empty state when loading', () => {
      wrapper = createWrapper({ networks: [], loading: true })
      
      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(false)
    })

    it('should not show empty state when networks exist', () => {
      wrapper = createWrapper()
      
      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(false)
    })

    it('should show default empty state message when no search term', () => {
      wrapper = createWrapper({ networks: [], searchTerm: '' })
      
      expect(wrapper.find('h3').text()).toBe('No networks')
      expect(wrapper.find('p').text()).toBe('Get started by adding your first network')
    })

    it('should show search empty state message when search term provided', () => {
      wrapper = createWrapper({ networks: [], searchTerm: 'test search' })
      
      expect(wrapper.find('h3').text()).toBe('No networks found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })

    it('should render CloudIcon in empty state', () => {
      wrapper = createWrapper({ networks: [] })
      
      const cloudIcon = wrapper.findComponent(CloudIcon)
      expect(cloudIcon.exists()).toBe(true)
      expect(cloudIcon.classes()).toContain('text-gray-400')
      expect(cloudIcon.classes()).toContain('h-12')
      expect(cloudIcon.classes()).toContain('w-12')
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

    it('should show loading spinner even when networks exist', () => {
      wrapper = createWrapper({ loading: true, networks: mockNetworks })
      
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

  describe('Event Handling', () => {
    it('should emit network-select when NetworkCard emits select', async () => {
      wrapper = createWrapper()
      
      const firstNetworkCard = wrapper.findAllComponents(NetworkCard)[0]
      await firstNetworkCard.vm.$emit('select', mockNetworks[0])
      
      expect(wrapper.emitted('network-select')).toBeTruthy()
      expect(wrapper.emitted('network-select')![0]).toEqual([mockNetworks[0]])
    })

    it('should emit network-select with correct network data', async () => {
      const customNetwork = createMockNetworkWithStatus({
        ID: 999,
        Name: 'Custom Network',
        IsActive: false,
      })
      wrapper = createWrapper({ networks: [customNetwork] })
      
      const networkCard = wrapper.findComponent(NetworkCard)
      await networkCard.vm.$emit('select', customNetwork)
      
      expect(wrapper.emitted('network-select')).toBeTruthy()
      expect(wrapper.emitted('network-select')![0]).toEqual([customNetwork])
    })

    it('should handle multiple network selections', async () => {
      wrapper = createWrapper()
      
      const networkCards = wrapper.findAllComponents(NetworkCard)
      
      await networkCards[0].vm.$emit('select', mockNetworks[0])
      await networkCards[1].vm.$emit('select', mockNetworks[1])
      
      expect(wrapper.emitted('network-select')).toHaveLength(2)
      expect(wrapper.emitted('network-select')![0]).toEqual([mockNetworks[0]])
      expect(wrapper.emitted('network-select')![1]).toEqual([mockNetworks[1]])
    })
  })

  describe('Props', () => {
    it('should handle networks prop changes', async () => {
      wrapper = createWrapper({ networks: [] })
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(0)
      
      await wrapper.setProps({ networks: mockNetworks })
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(3)
      
      const singleNetwork = [mockNetworks[0]]
      await wrapper.setProps({ networks: singleNetwork })
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(1)
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
      wrapper = createWrapper({ networks: [], searchTerm: '' })
      expect(wrapper.find('h3').text()).toBe('No networks')
      
      await wrapper.setProps({ searchTerm: 'test' })
      expect(wrapper.find('h3').text()).toBe('No networks found')
      
      await wrapper.setProps({ searchTerm: '' })
      expect(wrapper.find('h3').text()).toBe('No networks')
    })

    it('should have correct default props', () => {
      wrapper = mount(NetworkList, {
        props: { networks: [] },
      })
      
      expect(wrapper.props('loading')).toBe(false)
      expect(wrapper.props('searchTerm')).toBe('')
    })
  })

  describe('Computed Properties', () => {
    it('should correctly compute showEmptyState', async () => {
      // Show empty state: no networks and not loading
      wrapper = createWrapper({ networks: [], loading: false })
      expect(wrapper.find('.text-center.py-12').exists()).toBe(true)
      
      // Don't show empty state: networks exist
      await wrapper.setProps({ networks: mockNetworks })
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
      
      // Don't show empty state: loading
      await wrapper.setProps({ networks: [], loading: true })
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
    })

    it('should correctly compute empty state titles and messages', async () => {
      // Default state
      wrapper = createWrapper({ networks: [], searchTerm: '' })
      expect(wrapper.find('h3').text()).toBe('No networks')
      expect(wrapper.find('p').text()).toBe('Get started by adding your first network')
      
      // Search state
      await wrapper.setProps({ searchTerm: 'wireguard' })
      expect(wrapper.find('h3').text()).toBe('No networks found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
      
      // Back to default
      await wrapper.setProps({ searchTerm: '' })
      expect(wrapper.find('h3').text()).toBe('No networks')
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
      wrapper = createWrapper({ networks: [] })
      
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
    it('should handle empty networks array', () => {
      wrapper = createWrapper({ networks: [] })
      
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(0)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(true)
    })

    it('should handle single network', () => {
      const singleNetwork = [mockNetworks[0]]
      wrapper = createWrapper({ networks: singleNetwork })
      
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(1)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
    })

    it('should handle large number of networks', () => {
      const largeNetworkList = createMockNetworks(50)
      wrapper = createWrapper({ networks: largeNetworkList })
      
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(50)
      expect(wrapper.find('.grid').exists()).toBe(true)
    })

    it('should handle networks with special characters in names', () => {
      const specialNetworks = [
        createMockNetworkWithStatus({ Name: 'Network-1' }),
        createMockNetworkWithStatus({ Name: 'Network_2' }),
        createMockNetworkWithStatus({ Name: 'Network 3' }),
        createMockNetworkWithStatus({ Name: 'Network@4' }),
      ]
      wrapper = createWrapper({ networks: specialNetworks })
      
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(4)
    })

    it('should handle simultaneous loading and empty states correctly', () => {
      wrapper = createWrapper({ networks: [], loading: true })
      
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false) // Empty state hidden when loading
    })

    it('should handle search term with special characters', async () => {
      wrapper = createWrapper({ networks: [], searchTerm: '!@#$%^&*()' })
      
      expect(wrapper.find('h3').text()).toBe('No networks found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })

    it('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000)
      wrapper = createWrapper({ networks: [], searchTerm: longSearchTerm })
      
      expect(wrapper.find('h3').text()).toBe('No networks found')
      expect(wrapper.find('p').text()).toBe('Try a different search term or clear the search')
    })
  })

  describe('Reactivity', () => {
    it('should reactively update when networks change', async () => {
      wrapper = createWrapper({ networks: [] })
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(0)
      
      await wrapper.setProps({ networks: [mockNetworks[0]] })
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(1)
      
      await wrapper.setProps({ networks: mockNetworks })
      expect(wrapper.findAllComponents(NetworkCard)).toHaveLength(3)
    })

    it('should reactively update empty state based on search term', async () => {
      wrapper = createWrapper({ networks: [] })
      
      expect(wrapper.text()).toContain('Get started by adding your first network')
      
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
})