import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import NetworkHostsScreen from '../../../src/components/NetworkHostsScreen.vue'
import { createMockNetworks, createMockNetworkHosts, createMockHosts } from '../../__mocks__/entities'
import { componentStubs } from '../../setup/component-stubs'
import type { NetworkWithStatus } from '../../../src/types/entities'

// Mock the stores module
const mockNetworkHostsStore = {
  fetchNetworkHosts: vi.fn().mockResolvedValue(undefined),
  clearNetworkHosts: vi.fn(),
  setSearchTerm: vi.fn(),
  clearSearch: vi.fn(),
  searchTerm: '',
  sortedNetworkHosts: createMockNetworkHosts(3),
  loading: false
}

const mockHostsStore = {
  fetchHosts: vi.fn().mockResolvedValue(undefined),
  hosts: createMockHosts(3),
  loading: false
}

vi.mock('../../../src/stores', () => ({
  useNetworkHostsStore: () => mockNetworkHostsStore,
  useHostsStore: () => mockHostsStore
}))

// Mock child components
vi.mock('../../../src/components/features/network-hosts', () => ({
  NetworkHostForm: {
    name: 'NetworkHostForm',
    props: ['visible', 'networkId'],
    emits: ['network-host-added', 'cancel', 'update:visible'],
    template: `
      <div data-testid="network-host-form" v-if="visible">
        <button @click="$emit('network-host-added', {})" data-testid="add-network-host-btn">Add Network Host</button>
        <button @click="$emit('cancel')" data-testid="cancel-btn">Cancel</button>
      </div>
    `
  },
  NetworkHostList: {
    name: 'NetworkHostList',
    props: ['networkHosts', 'loading', 'searchTerm', 'networkName'],
    template: `
      <div data-testid="network-host-list">
        <div v-if="loading" data-testid="loading">Loading...</div>
        <div v-for="networkHost in networkHosts" :key="networkHost.ID" data-testid="network-host-item">
          {{ networkHost.Address }}
        </div>
        <div v-if="!loading && networkHosts.length === 0" data-testid="empty-state">No network hosts</div>
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

// Mock NetworkHostsImportExport component
vi.mock('../../../src/components/NetworkHostsImportExport.vue', () => ({
  default: {
    name: 'NetworkHostsImportExport',
    props: ['network'],
    emits: ['error', 'success', 'loading-start', 'loading-end', 'hosts-updated'],
    template: `
      <div data-testid="network-hosts-import-export">
        <button @click="$emit('hosts-updated')" data-testid="trigger-hosts-updated">Update Hosts</button>
        <button @click="$emit('error', 'Test error')" data-testid="trigger-error">Trigger Error</button>
        <button @click="$emit('success', 'Test success')" data-testid="trigger-success">Trigger Success</button>
        <button @click="$emit('loading-start', 'Test loading')" data-testid="trigger-loading-start">Start Loading</button>
        <button @click="$emit('loading-end')" data-testid="trigger-loading-end">End Loading</button>
      </div>
    `
  }
}))

// Mock Heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  ArrowLeftIcon: {
    name: 'ArrowLeftIcon',
    template: `<svg data-testid="arrow-left-icon" class="w-5 h-5"></svg>`
  },
  ComputerDesktopIcon: {
    name: 'ComputerDesktopIcon',
    template: `<svg data-testid="computer-desktop-icon" class="h-12 w-12"></svg>`
  },
  PlusIcon: {
    name: 'PlusIcon',
    template: `<svg data-testid="plus-icon" class="w-4 h-4"></svg>`
  }
}))

describe('NetworkHostsScreen', () => {
  let wrapper: VueWrapper
  const mockNetwork: NetworkWithStatus = {
    ID: 1,
    Name: 'Test Network',
    CreatedAt: new Date().toISOString(),
    IsActive: true
  }
  const mockOnGoBack = vi.fn()
  const mockNetworkHosts = createMockNetworkHosts(3, 1)

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Set up mock store state
    mockNetworkHostsStore.searchTerm = ''
    mockNetworkHostsStore.sortedNetworkHosts = mockNetworkHosts
    mockNetworkHostsStore.loading = false
    mockHostsStore.loading = false

    wrapper = mount(NetworkHostsScreen, {
      props: {
        network: mockNetwork,
        onGoBack: mockOnGoBack
      },
      global: {
        stubs: {
          ...componentStubs
        }
      }
    })
  })

  describe('Component Rendering', () => {
    it('should render network name in heading', () => {
      expect(wrapper.find('h1').text()).toContain('Network Hosts: Test Network')
    })

    it('should render subtitle', () => {
      expect(wrapper.text()).toContain('Manage hosts for this network')
    })

    it('should render back button with ArrowLeftIcon', () => {
      const arrowIcon = wrapper.find('[data-testid="arrow-left-icon"]')
      expect(arrowIcon.exists()).toBe(true)
    })

    it('should render Add Host button', () => {
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      expect(addHostButton?.exists()).toBe(true)
      expect(addHostButton?.text()).toContain('Add Host')
    })

    it('should display PlusIcon in Add Host button', () => {
      const plusIcon = wrapper.find('[data-testid="plus-icon"]')
      expect(plusIcon.exists()).toBe(true)
    })
  })

  describe('Props Handling', () => {
    it('should receive network prop', () => {
      expect(wrapper.props('network')).toEqual(mockNetwork)
    })

    it('should receive onGoBack prop', () => {
      expect(wrapper.props('onGoBack')).toBe(mockOnGoBack)
    })

    it('should call onGoBack when back button is clicked', async () => {
      const backButton = wrapper.find('button')
      await backButton.trigger('click')
      
      expect(mockOnGoBack).toHaveBeenCalledOnce()
    })
  })

  describe('Data Integration', () => {
    it('should display network hosts from store', () => {
      const networkHostItems = wrapper.findAll('[data-testid="network-host-item"]')
      expect(networkHostItems).toHaveLength(3)
      expect(networkHostItems[0].text()).toContain('192.168.1.10')
      expect(networkHostItems[1].text()).toContain('192.168.1.11')
      expect(networkHostItems[2].text()).toContain('192.168.1.12')
    })

    it('should pass loading state to NetworkHostList', () => {
      mockNetworkHostsStore.loading = true
      
      wrapper = mount(NetworkHostsScreen, {
        props: {
          network: mockNetwork,
          onGoBack: mockOnGoBack
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

    it('should pass search term to NetworkHostList', () => {
      mockNetworkHostsStore.searchTerm = 'test search'
      
      wrapper = mount(NetworkHostsScreen, {
        props: {
          network: mockNetwork,
          onGoBack: mockOnGoBack
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const networkHostList = wrapper.findComponent({ name: 'NetworkHostList' })
      expect(networkHostList.props('searchTerm')).toBe('test search')
    })

    it('should pass network name to NetworkHostList', () => {
      const networkHostList = wrapper.findComponent({ name: 'NetworkHostList' })
      expect(networkHostList.props('networkName')).toBe('Test Network')
    })

    it('should show empty state when no network hosts', () => {
      mockNetworkHostsStore.sortedNetworkHosts = []
      mockNetworkHostsStore.loading = false
      
      wrapper = mount(NetworkHostsScreen, {
        props: {
          network: mockNetwork,
          onGoBack: mockOnGoBack
        },
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toBe('No network hosts')
    })
  })

  describe('Add Network Host Form', () => {
    it('should not show form initially', () => {
      const networkHostForm = wrapper.find('[data-testid="network-host-form"]')
      expect(networkHostForm.exists()).toBe(false)
    })

    it('should show form when Add Host button is clicked', async () => {
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      await addHostButton?.trigger('click')
      
      const networkHostForm = wrapper.find('[data-testid="network-host-form"]')
      expect(networkHostForm.exists()).toBe(true)
    })

    it('should pass network ID to form', async () => {
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      await addHostButton?.trigger('click')
      
      const networkHostForm = wrapper.findComponent({ name: 'NetworkHostForm' })
      expect(networkHostForm.props('networkId')).toBe(1)
    })

    it('should hide form when network host is added', async () => {
      // Open form
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      await addHostButton?.trigger('click')
      
      // Add network host
      const addNetworkHostButton = wrapper.find('[data-testid="add-network-host-btn"]')
      await addNetworkHostButton.trigger('click')
      
      // Form should be hidden
      const networkHostForm = wrapper.find('[data-testid="network-host-form"]')
      expect(networkHostForm.exists()).toBe(false)
    })

    it('should hide form when cancelled', async () => {
      // Open form
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      await addHostButton?.trigger('click')
      
      // Cancel form
      const cancelButton = wrapper.find('[data-testid="cancel-btn"]')
      await cancelButton.trigger('click')
      
      // Form should be hidden
      const networkHostForm = wrapper.find('[data-testid="network-host-form"]')
      expect(networkHostForm.exists()).toBe(false)
    })

    it('should hide SearchInput when form is open', async () => {
      // Initially search input should be visible
      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
      
      // Open form
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      await addHostButton?.trigger('click')
      
      // Search input should be hidden
      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(false)
    })
  })

  describe('Search Functionality', () => {
    it('should display search input with correct props', () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.props('modelValue')).toBe('')
      expect(searchInput.props('resultCount')).toBe(3)
      expect(searchInput.props('resultText')).toBe('host')
      expect(searchInput.props('placeholder')).toBe('Search hosts by address or description...')
    })

    it('should call setSearchTerm when search input changes', async () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      await searchInput.vm.$emit('update:model-value', 'test search')
      
      expect(mockNetworkHostsStore.setSearchTerm).toHaveBeenCalledWith('test search')
    })

    it('should call clearSearch when clear button is clicked', async () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      await searchInput.vm.$emit('clear')
      
      expect(mockNetworkHostsStore.clearSearch).toHaveBeenCalled()
    })

    it('should update result count based on sorted network hosts', () => {
      mockNetworkHostsStore.sortedNetworkHosts = mockNetworkHosts.slice(0, 2)
      
      wrapper = mount(NetworkHostsScreen, {
        props: {
          network: mockNetwork,
          onGoBack: mockOnGoBack
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

  describe('Import/Export Integration', () => {
    it('should render NetworkHostsImportExport component', () => {
      const importExport = wrapper.findComponent({ name: 'NetworkHostsImportExport' })
      expect(importExport.exists()).toBe(true)
      expect(importExport.props('network')).toEqual(mockNetwork)
    })

    it('should handle hosts-updated event from import/export', async () => {
      const hostsUpdatedButton = wrapper.find('[data-testid="trigger-hosts-updated"]')
      await hostsUpdatedButton.trigger('click')
      
      expect(mockNetworkHostsStore.fetchNetworkHosts).toHaveBeenCalledWith(mockNetwork.ID)
    })

    it('should emit error event from import/export', async () => {
      const errorButton = wrapper.find('[data-testid="trigger-error"]')
      await errorButton.trigger('click')
      
      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeTruthy()
      expect(errorEvents![0]).toEqual(['Test error'])
    })

    it('should emit success event from import/export', async () => {
      const successButton = wrapper.find('[data-testid="trigger-success"]')
      await successButton.trigger('click')
      
      const successEvents = wrapper.emitted('success')
      expect(successEvents).toBeTruthy()
      expect(successEvents![0]).toEqual(['Test success'])
    })

    it('should emit loading-start event from import/export', async () => {
      const loadingStartButton = wrapper.find('[data-testid="trigger-loading-start"]')
      await loadingStartButton.trigger('click')
      
      const loadingStartEvents = wrapper.emitted('loadingStart')
      expect(loadingStartEvents).toBeTruthy()
      // The last event should be from the import/export component
      const lastEventIndex = loadingStartEvents!.length - 1
      expect(loadingStartEvents![lastEventIndex]).toEqual(['Test loading'])
    })

    it('should emit loading-end event from import/export', async () => {
      const loadingEndButton = wrapper.find('[data-testid="trigger-loading-end"]')
      await loadingEndButton.trigger('click')
      
      const loadingEndEvents = wrapper.emitted('loadingEnd')
      expect(loadingEndEvents).toBeTruthy()
      expect(loadingEndEvents![0]).toEqual([])
    })
  })

  describe('Store Integration', () => {
    it('should fetch hosts and network hosts on mount', () => {
      expect(mockHostsStore.fetchHosts).toHaveBeenCalledOnce()
      expect(mockNetworkHostsStore.fetchNetworkHosts).toHaveBeenCalledWith(mockNetwork.ID)
    })

    it('should emit loading events during mount', () => {
      const loadingStartEvents = wrapper.emitted('loadingStart')
      const loadingEndEvents = wrapper.emitted('loadingEnd')
      
      expect(loadingStartEvents).toBeTruthy()
      expect(loadingStartEvents![0]).toEqual(['Loading network hosts...'])
      expect(loadingEndEvents).toBeTruthy()
    })

    it('should clear network hosts on unmount', () => {
      wrapper.unmount()
      expect(mockNetworkHostsStore.clearNetworkHosts).toHaveBeenCalledOnce()
    })

    it('should use computed values from store', () => {
      mockNetworkHostsStore.searchTerm = 'updated search'
      
      wrapper = mount(NetworkHostsScreen, {
        props: {
          network: mockNetwork,
          onGoBack: mockOnGoBack
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
      expect(wrapper.find('[data-testid="network-host-form"]').exists()).toBe(false)
      
      const addButtons = wrapper.findAll('button')
      const addHostButton = addButtons.find(btn => btn.text().includes('Add Host'))
      await addHostButton?.trigger('click')
      
      // Form should be visible after clicking Add Host
      expect(wrapper.find('[data-testid="network-host-form"]').exists()).toBe(true)
    })

    it('should have correct computed properties reflected in UI', () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.props('modelValue')).toBe('')
      expect(searchInput.props('resultCount')).toBe(3)
      
      const networkHostItems = wrapper.findAll('[data-testid="network-host-item"]')
      expect(networkHostItems).toHaveLength(3)
    })
  })

  describe('Event Emissions', () => {
    it('should emit all required events', () => {
      // Events are tested in import/export integration and store integration sections
      expect(wrapper.emitted()).toHaveProperty('loadingStart')
      expect(wrapper.emitted()).toHaveProperty('loadingEnd')
    })
  })

  describe('Navigation', () => {
    it('should have proper back button functionality', async () => {
      const backButton = wrapper.find('button')
      await backButton.trigger('click')
      
      expect(mockOnGoBack).toHaveBeenCalledOnce()
    })

    it('should display current network information', () => {
      expect(wrapper.text()).toContain('Test Network')
    })
  })

  describe('Lifecycle Hooks', () => {
    it('should call required functions on mounted', () => {
      expect(mockHostsStore.fetchHosts).toHaveBeenCalled()
      expect(mockNetworkHostsStore.fetchNetworkHosts).toHaveBeenCalledWith(mockNetwork.ID)
    })

    it('should handle cleanup on unmounted', () => {
      wrapper.unmount()
      expect(mockNetworkHostsStore.clearNetworkHosts).toHaveBeenCalled()
    })
  })



  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('Network Hosts:')
    })

    it('should have descriptive button texts', () => {
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => btn.text().includes('Add Host'))
      expect(addButton?.text()).toContain('Add Host')
    })

    it('should have proper icon usage', () => {
      const arrowIcon = wrapper.find('[data-testid="arrow-left-icon"]')
      const plusIcon = wrapper.find('[data-testid="plus-icon"]')
      
      expect(arrowIcon.exists()).toBe(true)
      expect(plusIcon.exists()).toBe(true)
    })
  })

  describe('Responsive Behavior', () => {
    it('should have proper spacing classes', () => {
      const mainDiv = wrapper.find('.space-y-6')
      expect(mainDiv.exists()).toBe(true)
    })

    it('should have proper layout structure', () => {
      const headerDiv = wrapper.find('.flex.items-center.justify-between')
      expect(headerDiv.exists()).toBe(true)
    })
  })
})