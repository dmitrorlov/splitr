import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HostsScreen from '../../../src/components/HostsScreen.vue'
import { createMockHosts } from '../../__mocks__/entities'
import { componentStubs } from '../../setup/component-stubs'

// Mock the stores module
const mockHostsStore = {
  fetchHosts: vi.fn().mockResolvedValue(undefined),
  setSearchTerm: vi.fn(),
  clearSearch: vi.fn(),
  searchTerm: '',
  sortedHosts: createMockHosts(3),
  loading: false
}

vi.mock('../../../src/stores', () => ({
  useHostsStore: () => mockHostsStore
}))

// Mock child components
vi.mock('../../../src/components/features/hosts/HostForm.vue', () => ({
  default: {
    name: 'HostForm',
    props: ['visible'],
    emits: ['host-added', 'cancel', 'update:visible'],
    template: `
      <div data-testid="host-form" v-if="visible">
        <button @click="$emit('host-added', {})" data-testid="add-host-btn">Add Host</button>
        <button @click="$emit('cancel')" data-testid="cancel-btn">Cancel</button>
      </div>
    `
  }
}))

vi.mock('../../../src/components/features/hosts/HostList.vue', () => ({
  default: {
    name: 'HostList',
    props: ['hosts', 'loading', 'searchTerm'],
    template: `
      <div data-testid="host-list">
        <div v-if="loading" data-testid="loading">Loading...</div>
        <div v-for="host in hosts" :key="host.ID" data-testid="host-item">
          {{ host.Address }}
        </div>
        <div v-if="!loading && hosts.length === 0" data-testid="empty-state">No hosts</div>
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

describe('HostsScreen', () => {
  let wrapper: VueWrapper
  const mockHosts = createMockHosts(3)

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Set up mock store state
    mockHostsStore.searchTerm = ''
    mockHostsStore.sortedHosts = mockHosts
    mockHostsStore.loading = false

    wrapper = mount(HostsScreen, {
      global: {
        stubs: {
          ...componentStubs
        }
      }
    })
  })

  describe('Component Rendering', () => {
    it('should render main heading', () => {
      expect(wrapper.find('h1').text()).toBe('Hosts')
    })

    it('should render subtitle', () => {
      expect(wrapper.text()).toContain('Manage your hosts')
    })

    it('should render Add Host button', () => {
      const addButton = wrapper.find('button')
      expect(addButton.exists()).toBe(true)
      expect(addButton.text()).toContain('Add Host')
    })

    it('should display PlusIcon in Add Host button', () => {
      const plusIcon = wrapper.find('[data-testid="plus-icon"]')
      expect(plusIcon.exists()).toBe(true)
    })
  })

  describe('Data Integration', () => {
    it('should display hosts from store', async () => {
      const hostItems = wrapper.findAll('[data-testid="host-item"]')
      expect(hostItems).toHaveLength(3)
      expect(hostItems[0].text()).toContain('192.168.1.1')
      expect(hostItems[1].text()).toContain('192.168.1.2')
      expect(hostItems[2].text()).toContain('192.168.1.3')
    })

    it('should pass loading state to HostList', async () => {
      mockHostsStore.loading = true
      
      wrapper = mount(HostsScreen, {
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

    it('should pass search term to HostList', async () => {
      mockHostsStore.searchTerm = 'test search'
      
      wrapper = mount(HostsScreen, {
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const hostList = wrapper.findComponent({ name: 'HostList' })
      expect(hostList.props('searchTerm')).toBe('test search')
    })

    it('should show empty state when no hosts', async () => {
      mockHostsStore.sortedHosts = []
      mockHostsStore.loading = false
      
      wrapper = mount(HostsScreen, {
        global: {
          stubs: {
            ...componentStubs
          }
        }
      })
      
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toBe('No hosts')
    })
  })

  describe('Add Host Form', () => {
    it('should not show form initially', () => {
      const hostForm = wrapper.find('[data-testid="host-form"]')
      expect(hostForm.exists()).toBe(false)
    })

    it('should show form when Add Host button is clicked', async () => {
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      const hostForm = wrapper.find('[data-testid="host-form"]')
      expect(hostForm.exists()).toBe(true)
    })

    it('should hide form when host is added', async () => {
      // Open form
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Add host
      const addHostButton = wrapper.find('[data-testid="add-host-btn"]')
      await addHostButton.trigger('click')
      
      // Form should be hidden
      const hostForm = wrapper.find('[data-testid="host-form"]')
      expect(hostForm.exists()).toBe(false)
    })

    it('should hide form when cancelled', async () => {
      // Open form
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Cancel form
      const cancelButton = wrapper.find('[data-testid="cancel-btn"]')
      await cancelButton.trigger('click')
      
      // Form should be hidden
      const hostForm = wrapper.find('[data-testid="host-form"]')
      expect(hostForm.exists()).toBe(false)
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
      expect(searchInput.props('resultCount')).toBe(3) // From mockHosts length
      expect(searchInput.props('resultText')).toBe('host')
      expect(searchInput.props('placeholder')).toBe('Search hosts by address or description...')
    })

    it('should call setSearchTerm when search input changes', async () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      await searchInput.vm.$emit('update:model-value', 'test search')
      
      expect(mockHostsStore.setSearchTerm).toHaveBeenCalledWith('test search')
    })

    it('should call clearSearch when clear button is clicked', async () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      await searchInput.vm.$emit('clear')
      
      expect(mockHostsStore.clearSearch).toHaveBeenCalled()
    })

    it('should update result count based on sorted hosts', async () => {
      mockHostsStore.sortedHosts = mockHosts.slice(0, 2)
      
      wrapper = mount(HostsScreen, {
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
    it('should fetch hosts on mount', () => {
      expect(mockHostsStore.fetchHosts).toHaveBeenCalledOnce()
    })

    it('should use computed values from store', async () => {
      mockHostsStore.searchTerm = 'updated search'
      
      wrapper = mount(HostsScreen, {
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
      expect(wrapper.find('[data-testid="host-form"]').exists()).toBe(false)
      
      const addButton = wrapper.find('button')
      await addButton.trigger('click')
      
      // Form should be visible after clicking Add Host
      expect(wrapper.find('[data-testid="host-form"]').exists()).toBe(true)
    })

    it('should have correct computed properties reflected in UI', () => {
      const searchInput = wrapper.findComponent({ name: 'SearchInput' })
      expect(searchInput.props('modelValue')).toBe('')
      expect(searchInput.props('resultCount')).toBe(3)
      
      const hostItems = wrapper.findAll('[data-testid="host-item"]')
      expect(hostItems).toHaveLength(3)
    })
  })

  describe('Event Emissions', () => {
    it('should emit error event', () => {
      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeFalsy() // No errors by default
    })

    it('should emit success event', () => {
      const successEvents = wrapper.emitted('success')
      expect(successEvents).toBeFalsy() // No success events by default
    })
  })

  describe('Lifecycle Hooks', () => {
    it('should call fetchHosts on mounted', () => {
      // Already tested in store integration
      expect(mockHostsStore.fetchHosts).toHaveBeenCalled()
    })

    it('should handle cleanup on unmounted', () => {
      // Component should unmount cleanly
      wrapper.unmount()
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })



  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toBe('Hosts')
    })

    it('should have descriptive button text', () => {
      const addButton = wrapper.find('button')
      expect(addButton.text()).toContain('Add Host')
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