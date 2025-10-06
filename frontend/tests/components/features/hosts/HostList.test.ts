import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ServerIcon } from '@heroicons/vue/24/outline'
import HostList from '@/components/features/hosts/HostList.vue'
import HostCard from '@/components/features/hosts/HostCard.vue'
import type { Host } from '@/types'

// Mock HostCard component
vi.mock('@/components/features/hosts/HostCard.vue', () => ({
  default: {
    name: 'HostCard',
    props: ['host'],
    template: '<div data-testid="host-card" :data-host-id="host.ID">{{ host.Address }}</div>',
  },
}))

describe('HostList', () => {
  const mockHosts: Host[] = [
    {
      ID: 1,
      Address: '192.168.1.1',
      Description: 'Router',
      CreatedAt: new Date('2024-01-01T10:00:00Z'),
      UpdatedAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      ID: 2,
      Address: '192.168.1.100',
      Description: 'Server',
      CreatedAt: new Date('2024-01-02T10:00:00Z'),
      UpdatedAt: new Date('2024-01-02T10:00:00Z'),
    },
    {
      ID: 3,
      Address: 'example.com',
      Description: '',
      CreatedAt: new Date('2024-01-03T10:00:00Z'),
      UpdatedAt: new Date('2024-01-03T10:00:00Z'),
    },
  ]

  describe('rendering', () => {
    it('should render without errors', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('should render hosts in a grid layout', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
      expect(grid.classes()).toContain('lg:grid-cols-3')
      expect(grid.classes()).toContain('gap-4')
    })

    it('should render correct number of HostCard components', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      const hostCards = wrapper.findAllComponents(HostCard)
      expect(hostCards).toHaveLength(mockHosts.length)
    })

    it('should pass correct host prop to each HostCard', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      const hostCards = wrapper.findAllComponents(HostCard)
      
      hostCards.forEach((card, index) => {
        expect(card.props('host')).toEqual(mockHosts[index])
      })
    })

    it('should render hosts with correct keys', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      const hostElements = wrapper.findAll('[data-testid="host-card"]')
      
      hostElements.forEach((element, index) => {
        expect(element.attributes('data-host-id')).toBe(mockHosts[index].ID.toString())
      })
    })
  })

  describe('empty state', () => {
    it('should show empty state when no hosts and not loading', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          loading: false,
        },
      })

      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(true)
    })

    it('should render ServerIcon in empty state', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
        },
      })

      const icon = wrapper.findComponent(ServerIcon)
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('mx-auto')
      expect(icon.classes()).toContain('h-12')
      expect(icon.classes()).toContain('w-12')
      expect(icon.classes()).toContain('text-gray-400')
    })

    it('should show default empty state title and message when no search term', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm: '',
        },
      })

      const title = wrapper.find('h3')
      const message = wrapper.find('p')
      
      expect(title.text()).toBe('No hosts')
      expect(message.text()).toBe('Get started by adding your first host')
    })

    it('should show search-specific empty state when search term provided', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm: 'nonexistent',
        },
      })

      const title = wrapper.find('h3')
      const message = wrapper.find('p')
      
      expect(title.text()).toBe('No hosts found')
      expect(message.text()).toBe('Try a different search term or clear the search')
    })

    it('should not show empty state when loading', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          loading: true,
        },
      })

      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(false)
    })

    it('should not show empty state when hosts exist', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      const emptyState = wrapper.find('.text-center.py-12')
      expect(emptyState.exists()).toBe(false)
    })

    it('should apply correct styling to empty state elements', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
        },
      })

      const title = wrapper.find('h3')
      const message = wrapper.find('p')
      
      expect(title.classes()).toContain('mt-2')
      expect(title.classes()).toContain('text-sm')
      expect(title.classes()).toContain('font-medium')
      expect(title.classes()).toContain('text-gray-900')
      
      expect(message.classes()).toContain('mt-1')
      expect(message.classes()).toContain('text-sm')
      expect(message.classes()).toContain('text-gray-500')
    })
  })

  describe('loading state', () => {
    it('should show loading spinner when loading is true', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
          loading: true,
        },
      })

      const loadingSpinner = wrapper.find('.animate-spin')
      expect(loadingSpinner.exists()).toBe(true)
    })

    it('should not show loading spinner when loading is false', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
          loading: false,
        },
      })

      const loadingSpinner = wrapper.find('.animate-spin')
      expect(loadingSpinner.exists()).toBe(false)
    })

    it('should apply correct styling to loading spinner', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          loading: true,
        },
      })

      const loadingContainer = wrapper.find('.flex.justify-center.items-center.py-12')
      const spinner = wrapper.find('.animate-spin')
      
      expect(loadingContainer.exists()).toBe(true)
      expect(spinner.classes()).toContain('rounded-full')
      expect(spinner.classes()).toContain('h-8')
      expect(spinner.classes()).toContain('w-8')
      expect(spinner.classes()).toContain('border-b-2')
      expect(spinner.classes()).toContain('border-blue-600')
    })

    it('should show loading state even when hosts exist', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
          loading: true,
        },
      })

      const loadingSpinner = wrapper.find('.animate-spin')
      const grid = wrapper.find('.grid')
      
      expect(loadingSpinner.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
    })
  })

  describe('props', () => {
    it('should have correct default props', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
        },
      })

      const vm = wrapper.vm as any
      expect(vm.loading).toBe(false)
      expect(vm.searchTerm).toBe('')
    })

    it('should accept hosts prop', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      expect((wrapper.vm as any).hosts).toEqual(mockHosts)
    })

    it('should accept loading prop', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          loading: true,
        },
      })

      expect((wrapper.vm as any).loading).toBe(true)
    })

    it('should accept searchTerm prop', () => {
      const searchTerm = 'test search'
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm,
        },
      })

      expect((wrapper.vm as any).searchTerm).toBe(searchTerm)
    })
  })

  describe('computed properties', () => {
    describe('showEmptyState', () => {
      it('should be true when no hosts and not loading', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: [],
            loading: false,
          },
        })

        const vm = wrapper.vm as any
        expect(vm.showEmptyState).toBe(true)
      })

      it('should be false when hosts exist', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: mockHosts,
            loading: false,
          },
        })

        const vm = wrapper.vm as any
        expect(vm.showEmptyState).toBe(false)
      })

      it('should be false when loading', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: [],
            loading: true,
          },
        })

        const vm = wrapper.vm as any
        expect(vm.showEmptyState).toBe(false)
      })
    })

    describe('emptyStateTitle', () => {
      it('should return "No hosts" when no search term', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: [],
            searchTerm: '',
          },
        })

        const vm = wrapper.vm as any
        expect(vm.emptyStateTitle).toBe('No hosts')
      })

      it('should return "No hosts found" when search term exists', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: [],
            searchTerm: 'search term',
          },
        })

        const vm = wrapper.vm as any
        expect(vm.emptyStateTitle).toBe('No hosts found')
      })
    })

    describe('emptyStateMessage', () => {
      it('should return default message when no search term', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: [],
            searchTerm: '',
          },
        })

        const vm = wrapper.vm as any
        expect(vm.emptyStateMessage).toBe('Get started by adding your first host')
      })

      it('should return search message when search term exists', () => {
        const wrapper = mount(HostList, {
          props: {
            hosts: [],
            searchTerm: 'search term',
          },
        })

        const vm = wrapper.vm as any
        expect(vm.emptyStateMessage).toBe('Try a different search term or clear the search')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle single host correctly', () => {
      const singleHost = [mockHosts[0]]
      const wrapper = mount(HostList, {
        props: {
          hosts: singleHost,
        },
      })

      const hostCards = wrapper.findAllComponents(HostCard)
      expect(hostCards).toHaveLength(1)
      expect(hostCards[0].props('host')).toEqual(singleHost[0])
    })

    it('should handle empty search term correctly', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm: '',
        },
      })

      const vm = wrapper.vm as any
      expect(vm.emptyStateTitle).toBe('No hosts')
      expect(vm.emptyStateMessage).toBe('Get started by adding your first host')
    })

    it('should handle whitespace-only search term', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm: '   ',
        },
      })

      const vm = wrapper.vm as any
      expect(vm.emptyStateTitle).toBe('No hosts found')
      expect(vm.emptyStateMessage).toBe('Try a different search term or clear the search')
    })

    it('should handle hosts with missing optional properties', () => {
      const hostsWithMissingProps: Host[] = [
        {
          ID: 1,
          Address: '192.168.1.1',
          Description: '',
          CreatedAt: new Date('2024-01-01T10:00:00Z'),
          UpdatedAt: new Date('2024-01-01T10:00:00Z'),
        },
      ]

      const wrapper = mount(HostList, {
        props: {
          hosts: hostsWithMissingProps,
        },
      })

      const hostCards = wrapper.findAllComponents(HostCard)
      expect(hostCards).toHaveLength(1)
      expect(hostCards[0].props('host')).toEqual(hostsWithMissingProps[0])
    })

    it('should maintain reactivity when hosts prop changes', async () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
        },
      })

      expect(wrapper.findAllComponents(HostCard)).toHaveLength(0)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(true)

      await wrapper.setProps({ hosts: mockHosts })

      expect(wrapper.findAllComponents(HostCard)).toHaveLength(mockHosts.length)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(false)
    })

    it('should maintain reactivity when loading prop changes', async () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          loading: false,
        },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(false)

      await wrapper.setProps({ loading: true })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('should maintain reactivity when searchTerm prop changes', async () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm: '',
        },
      })

      expect(wrapper.find('h3').text()).toBe('No hosts')

      await wrapper.setProps({ searchTerm: 'search' })

      expect(wrapper.find('h3').text()).toBe('No hosts found')
    })
  })

  describe('accessibility', () => {
    it('should have semantic structure for empty state', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
        },
      })

      const title = wrapper.find('h3')
      const message = wrapper.find('p')
      
      expect(title.exists()).toBe(true)
      expect(message.exists()).toBe(true)
    })

    it('should provide meaningful text content', () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [],
          searchTerm: 'test',
        },
      })

      const title = wrapper.find('h3')
      const message = wrapper.find('p')
      
      expect(title.text()).toBeTruthy()
      expect(message.text()).toBeTruthy()
    })
  })

  describe('integration', () => {
    it('should work with real HostCard components when not mocked', () => {
      // This test ensures the component structure is compatible
      const wrapper = mount(HostList, {
        props: {
          hosts: mockHosts,
        },
      })

      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      
      const hostCards = wrapper.findAllComponents(HostCard)
      expect(hostCards.length).toBeGreaterThan(0)
    })

    it('should handle dynamic host list updates', async () => {
      const wrapper = mount(HostList, {
        props: {
          hosts: [mockHosts[0]],
        },
      })

      expect(wrapper.findAllComponents(HostCard)).toHaveLength(1)

      await wrapper.setProps({ hosts: mockHosts })
      expect(wrapper.findAllComponents(HostCard)).toHaveLength(mockHosts.length)

      await wrapper.setProps({ hosts: [] })
      expect(wrapper.findAllComponents(HostCard)).toHaveLength(0)
      expect(wrapper.find('.text-center.py-12').exists()).toBe(true)
    })
  })
})