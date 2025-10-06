import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import NetworksScreen from '../../../src/components/NetworksScreen.vue'
import { createMockNetworks } from '../../__mocks__/entities'
import { componentStubs } from '../../setup/component-stubs'
import type { NetworkWithStatus } from '../../../src/types/entities'

// Mock the stores module
const mockNetworksStore = {
  fetchNetworks: vi.fn().mockResolvedValue(undefined),
  setSearchTerm: vi.fn(),
  clearSearch: vi.fn(),
  searchTerm: '',
  sortedNetworks: createMockNetworks(3),
  loading: false
}

vi.mock('../../../src/stores', () => ({
  useNetworksStore: () => mockNetworksStore
}))

// Mock child components
vi.mock('../../../src/components/features/networks/NetworkForm.vue', () => ({
  default: {
    name: 'NetworkForm',
    props: ['visible'],
    emits: ['network-added', 'cancel', 'update:visible'],
    template: `
      <div data-testid="network-form" v-if="visible">
        <button @click="$emit('network-added', {})" data-testid="add-network-btn">Add Network</button>
        <button @click="$emit('cancel')" data-testid="cancel-btn">Cancel</button>
      </div>
    `
  }
}))

vi.mock('../../../src/components/features/networks/NetworkList.vue', () => ({
  default: {
    name: 'NetworkList',
    props: ['networks', 'loading', 'searchTerm'],
    emits: ['network-select'],
    template: `
      <div data-testid="network-list">
        <div v-if="loading" data-testid="loading">Loading...</div>
        <div v-for="network in networks" :key="network.ID" data-testid="network-item" @click="$emit('network-select', network)">
          {{ network.Name }}
        </div>
        <div v-if="!loading && networks.length === 0" data-testid="empty-state">No networks</div>
      </div>
    `
  }
}))

vi.mock('../../../src/components/ui', () => ({
  SearchInput: {
    name: 'SearchInput',
    props: ['modelValue', 'resultCount', 'resultText', 'placeholder'],
    emits: ['update:model-value', 'clear'],
    template: `
      <div data-testid="search-input">
        <input 
          :value="modelValue" 
          :placeholder="placeholder"
          @input="$emit('update:model-value', $event.target.value)"
          data-testid="search-field"
        />
        <button @click="$emit('clear')" data-testid="clear-button">Clear</button>
        <span data-testid="result-count">{{ resultCount }} {{ resultText }}(s)</span>
      </div>
    `
  }
}))

// Mock Heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  PlusIcon: {
    name: 'PlusIcon',
    template: `<svg data-testid="plus-icon" class="w-4 h-4"></svg>`
  }
}))

describe('NetworksScreen', () => {
  let wrapper: VueWrapper
  const mockNetworks = createMockNetworks(3)
  const mockOnNetworkSelect = vi.fn()

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Set up mock store state
    mockNetworksStore.searchTerm = ''
    mockNetworksStore.sortedNetworks = mockNetworks
    mockNetworksStore.loading = false

    wrapper = mount(NetworksScreen, {
      props: {
        onNetworkSelect: mockOnNetworkSelect
      },
      global: {
        stubs: {
          ...componentStubs
        }
      }
    })
  })

  describe('Component Rendering', () => {
    it('should render main heading', () => {
      expect(wrapper.find('h1').text()).toBe('Networks')
    })

    it('should render subtitle', () => {
      expect(wrapper.text()).toContain('Manage your networks')
    })

    it('should render Add Network button', () => {
      const addButton = wrapper.find('button')
      expect(addButton.exists()).toBe(true)
      expect(addButton.text()).toContain('Add Network')
    })

    it('should display PlusIcon in Add Network button', () => {
      const plusIcon = wrapper.find('[data-testid="plus-icon"]')
      expect(plusIcon.exists()).toBe(true)
    })
  })

  describe('Props Handling', () => {
    it('should receive onNetworkSelect prop', () => {
      expect(wrapper.props('onNetworkSelect')).toBe(mockOnNetworkSelect)
    })

    it('should call onNetworkSelect when NetworkList emits network-select', async () => {
      const networkList = wrapper.findComponent({ name: 'NetworkList' })
      const testNetwork = mockNetworks[0]
      
      await networkList.vm.$emit('network-select', testNetwork)
      
      expect(mockOnNetworkSelect).toHaveBeenCalledWith(testNetwork)
    })
  })

  describe('Data Integration', () => {
    it('should display networks from store', () => {
      const networkItems = wrapper.findAll('[data-testid="network-item"]')
      expect(networkItems).toHaveLength(3)
      expect(networkItems[0].text()).toContain('Network 1')
      expect(networkItems[1].text()).toContain('Network 2')
      expect(networkItems[2].text()).toContain('Network 3')
    })

    it('should pass loading state to NetworkList', () => {
      mockNetworksStore.loading = true
      
      wrapper = mount(NetworksScreen, {
        props: {
          onNetworkSelect: mockOnNetworkSelect
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const loadingElement = wrapper.find('[data-testid="loading"]')
      expect(loadingElement.exists()).toBe(true)
      expect(loadingElement.text()).toBe('Loading...')
    })

    it('should pass search term to NetworkList', () => {
      mockNetworksStore.searchTerm = 'test search'
      
      wrapper = mount(NetworksScreen, {
        props: {
          onNetworkSelect: mockOnNetworkSelect
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const networkList = wrapper.findComponent({ name: 'NetworkList' })
      expect(networkList.props('searchTerm')).toBe('test search')
    })

    it('should show empty state when no networks', () => {
      mockNetworksStore.sortedNetworks = []
      mockNetworksStore.loading = false
      
      wrapper = mount(NetworksScreen, {
        props: {
          onNetworkSelect: mockOnNetworkSelect
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toBe('No networks')
    })
  })

  describe('Add Network Form', () => {
    it('should not show form initially', () => {
      const networkForm = wrapper.find('[data-testid="network-form"]')
      expect(networkForm.exists()).toBe(false)
    })

    it('should show form when Add Network button is clicked', async () => {
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      const networkForm = wrapper.find('[data-testid="network-form"]')
      expect(networkForm.exists()).toBe(true)
    })

    it('should hide form when network is added', async () => {
      // Open form
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Add network
      const addNetworkButton = wrapper.find('[data-testid="add-network-btn"]')
      await addNetworkButton.trigger('click')
      
      // Form should be hidden
      const networkForm = wrapper.find('[data-testid="network-form"]')
      expect(networkForm.exists()).toBe(false)
    })

    it('should emit success event when network is added', async () => {
      // Open form
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Add network - triggers the network-added event
      const addNetworkButton = wrapper.find('[data-testid="add-network-btn"]')
      await addNetworkButton.trigger('click')
      
      // Check success event was emitted
      const successEvents = wrapper.emitted('success')
      expect(successEvents).toBeTruthy()
      expect(successEvents![0]).toEqual(['Network added successfully'])
    })

    it('should hide form when cancelled', async () => {
      // Open form
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Cancel form
      const cancelButton = wrapper.find('[data-testid="cancel-btn"]')
      await cancelButton.trigger('click')
      
      // Form should be hidden
      const networkForm = wrapper.find('[data-testid="network-form"]')
      expect(networkForm.exists()).toBe(false)
    })

    it('should hide SearchInput when form is open', async () => {
      // Initially search input should be visible
      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
      
      // Open form
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Search input should be hidden
      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(false)
    })
  })

  describe('Search Functionality', () => {
    it('should display search input with correct props', () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.props('modelValue')).toBe('')
      expect(searchInput.props('resultCount')).toBe(3) // From mockNetworks length
      expect(searchInput.props('resultText')).toBe('network')
      expect(searchInput.props('placeholder')).toBe('Search networks by name...')
    })

    it('should call setSearchTerm when search input changes', async () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      await searchInput.vm.$emit('update:model-value', 'test search')
      
      expect(mockNetworksStore.setSearchTerm).toHaveBeenCalledWith('test search')
    })

    it('should call clearSearch when clear button is clicked', async () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      await searchInput.vm.$emit('clear')
      
      expect(mockNetworksStore.clearSearch).toHaveBeenCalled()
    })

    it('should update result count based on sorted networks', () => {
      mockNetworksStore.sortedNetworks = mockNetworks.slice(0, 2)
      
      wrapper = mount(NetworksScreen, {
        props: {
          onNetworkSelect: mockOnNetworkSelect
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.props('resultCount')).toBe(2)
    })
  })

  describe('Store Integration', () => {
    it('should fetch networks on mount', () => {
      expect(mockNetworksStore.fetchNetworks).toHaveBeenCalledOnce()
    })

    it('should use computed values from store', () => {
      mockNetworksStore.searchTerm = 'updated search'
      
      wrapper = mount(NetworksScreen, {
        props: {
          onNetworkSelect: mockOnNetworkSelect
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.props('modelValue')).toBe('updated search')
    })
  })

  describe('Component State', () => {
    it('should toggle form visibility correctly', async () => {
      // Initially form should not be visible
      expect(wrapper.find('[data-testid="network-form"]').exists()).toBe(false)
      
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Form should be visible after clicking Add Network
      expect(wrapper.find('[data-testid="network-form"]').exists()).toBe(true)
    })

    it('should have correct computed properties reflected in UI', () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.props('modelValue')).toBe('')
      expect(searchInput.props('resultCount')).toBe(3)
      
      const networkItems = wrapper.findAll('[data-testid="network-item"]')
      expect(networkItems).toHaveLength(3)
    })
  })

  describe('Event Emissions', () => {
    it('should emit success event with proper message', async () => {
      // Open form and add network
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      const addNetworkButton = wrapper.find('[data-testid="add-network-btn"]')
      await addNetworkButton.trigger('click')
      
      const successEvents = wrapper.emitted('success')
      expect(successEvents).toBeTruthy()
      expect(successEvents![0]).toEqual(['Network added successfully'])
    })

    it('should emit error event', () => {
      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeFalsy() // No errors by default
    })
  })

  describe('Network Selection', () => {
    it('should handle network selection from NetworkList', async () => {
      const testNetwork: NetworkWithStatus = {
        ID: 1,
        Name: 'Test Network',
        CreatedAt: new Date().toISOString(),
        IsActive: true
      }
      
      const networkList = wrapper.findComponent({ name: 'NetworkList' })
      await networkList.vm.$emit('network-select', testNetwork)
      
      expect(mockOnNetworkSelect).toHaveBeenCalledWith(testNetwork)
    })

    it('should pass network selection event to NetworkList', () => {
      const networkList = wrapper.findComponent({ name: 'NetworkList' })
      expect(networkList.exists()).toBe(true)
      
      // Check that NetworkList has the network-select event handler by verifying the prop is passed
      expect(networkList.props()).toHaveProperty('networks')
      expect(networkList.props()).toHaveProperty('loading')
      expect(networkList.props()).toHaveProperty('searchTerm')
    })
  })

  describe('Lifecycle Hooks', () => {
    it('should call fetchNetworks on mounted', () => {
      expect(mockNetworksStore.fetchNetworks).toHaveBeenCalled()
    })

    it('should handle cleanup on unmounted', () => {
      wrapper.unmount()
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })



  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toBe('Networks')
    })

    it('should have descriptive button text', () => {
      const addButton = wrapper.find('button')
      expect(addButton.text()).toContain('Add Network')
    })
  })

  describe('Responsive Behavior', () => {
    it('should have proper spacing classes', () => {
      const mainDiv = wrapper.find('.space-y-6')
      expect(mainDiv.exists()).toBe(true)
    })

    it('should have proper layout structure', () => {
      const headerDiv = wrapper.find('.flex.justify-between.items-center')
      expect(headerDiv.exists()).toBe(true)
    })
  })
})