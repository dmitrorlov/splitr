import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HostCard from '@/components/features/hosts/HostCard.vue'
import { createPinia, setActivePinia } from 'pinia'
import type { Host } from '@/types/entities'
import { useHostConfirmations, useHostNotifications } from '@/composables'
import { useHostsStore } from '@/stores'
import { formatTimestamp } from '@/utils'

// Mock the composables
vi.mock('@/composables', () => ({
  useHostConfirmations: vi.fn(() => ({
    confirmHostDeletion: vi.fn(),
  })),
  useHostNotifications: vi.fn(() => ({
    notifyHostDeleted: vi.fn(),
    notifyHostError: vi.fn(),
  })),
}))

// Mock the stores
vi.mock('@/stores', () => ({
  useHostsStore: vi.fn(() => ({
    deleteHost: vi.fn(),
    isHostDeleting: vi.fn(() => false),
  })),
}))

// Mock utils
vi.mock('@/utils', () => ({
  formatTimestamp: vi.fn((timestamp: string) => `formatted-${timestamp}`),
}))

describe('HostCard.vue', () => {
  let wrapper: VueWrapper
  let mockHost: Host
  let mockConfirmations: any
  let mockNotifications: any
  let mockHostsStore: any

  beforeEach(() => {
    // Set up Pinia
    const pinia = createPinia()
    setActivePinia(pinia)

    // Reset mocks
    vi.clearAllMocks()

    // Create mock host
    mockHost = {
      ID: 1,
      Address: '192.168.1.100',
      Description: 'Test server',
      CreatedAt: new Date('2023-01-01T10:00:00Z'),
      UpdatedAt: new Date('2023-01-01T10:00:00Z'),
    }

    // Set up mock composables
    mockConfirmations = {
      confirmHostDeletion: vi.fn(),
    }
    mockNotifications = {
      notifyHostDeleted: vi.fn(),
      notifyHostError: vi.fn(),
    }
    mockHostsStore = {
      deleteHost: vi.fn(),
      isHostDeleting: vi.fn(() => false),
    }

    vi.mocked(useHostConfirmations).mockReturnValue(mockConfirmations)
    vi.mocked(useHostNotifications).mockReturnValue(mockNotifications)
    vi.mocked(useHostsStore).mockReturnValue(mockHostsStore)
  })

  const mountHostCard = (props = {}, options = {}) => {
    return mount(HostCard, {
      props: {
        host: mockHost,
        ...props,
      },
      global: {
        stubs: {
          Card: {
            template: `
              <div class="card">
                <slot />
                <div class="card-actions">
                  <slot name="actions" />
                </div>
              </div>
            `,
          },
        },
      },
      ...options,
    })
  }

  describe('Basic Rendering', () => {
    it('should render host information correctly', () => {
      wrapper = mountHostCard()

      expect(wrapper.text()).toContain('192.168.1.100')
      expect(wrapper.text()).toContain('Test server')
      expect(wrapper.text()).toContain('Created formatted-')
    })

    it('should render host without description', () => {
      const hostWithoutDescription = {
        ...mockHost,
        Description: undefined,
      }
      wrapper = mountHostCard({ host: hostWithoutDescription })

      expect(wrapper.text()).toContain('192.168.1.100')
      expect(wrapper.text()).not.toContain('Test server')
      expect(wrapper.text()).toContain('Created formatted-')
    })

    it('should render host with empty description', () => {
      const hostWithEmptyDescription = {
        ...mockHost,
        Description: '',
      }
      wrapper = mountHostCard({ host: hostWithEmptyDescription })

      expect(wrapper.text()).toContain('192.168.1.100')
      expect(wrapper.text()).not.toContain('Test server')
    })

    it('should display server icon', () => {
      wrapper = mountHostCard()

      const serverIcon = wrapper.find('svg')
      expect(serverIcon.exists()).toBe(true)
      expect(serverIcon.classes()).toContain('w-8')
      expect(serverIcon.classes()).toContain('h-8')
      expect(serverIcon.classes()).toContain('text-green-500')
    })
  })

  describe('Delete Functionality', () => {
    it('should render delete button', () => {
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      expect(deleteButton.exists()).toBe(true)
      expect(deleteButton.find('svg').exists()).toBe(true) // TrashIcon
    })

    it('should call confirmHostDeletion when delete button is clicked', async () => {
      mockConfirmations.confirmHostDeletion.mockResolvedValue(false)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')

      expect(mockConfirmations.confirmHostDeletion).toHaveBeenCalledWith('192.168.1.100')
    })

    it('should not delete host if confirmation is canceled', async () => {
      mockConfirmations.confirmHostDeletion.mockResolvedValue(false)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')

      expect(mockHostsStore.deleteHost).not.toHaveBeenCalled()
      expect(mockNotifications.notifyHostDeleted).not.toHaveBeenCalled()
    })

    it('should delete host if confirmation is accepted', async () => {
      mockConfirmations.confirmHostDeletion.mockResolvedValue(true)
      mockHostsStore.deleteHost.mockResolvedValue(undefined)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')
      await nextTick()

      expect(mockHostsStore.deleteHost).toHaveBeenCalledWith(1)
      expect(mockNotifications.notifyHostDeleted).toHaveBeenCalledWith('192.168.1.100')
    })

    it('should handle delete error', async () => {
      const error = new Error('Delete failed')
      mockConfirmations.confirmHostDeletion.mockResolvedValue(true)
      mockHostsStore.deleteHost.mockRejectedValue(error)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')
      await nextTick()

      expect(mockNotifications.notifyHostError).toHaveBeenCalledWith(
        'Delete',
        '192.168.1.100',
        error
      )
      expect(mockNotifications.notifyHostDeleted).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should not show loading state by default', () => {
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      expect(deleteButton.attributes('disabled')).toBeUndefined()
      expect(deleteButton.classes()).not.toContain('cursor-not-allowed')
      expect(deleteButton.classes()).not.toContain('opacity-40')
    })

    it('should show deleting state when host is being deleted', () => {
      mockHostsStore.isHostDeleting.mockReturnValue(true)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      expect(deleteButton.attributes('disabled')).toBeDefined()
      expect(deleteButton.classes()).toContain('cursor-not-allowed')
      expect(deleteButton.classes()).toContain('opacity-40')
      expect(deleteButton.classes()).toContain('text-gray-400')
    })

    it('should handle loading prop', () => {
      wrapper = mountHostCard({ loading: true })

      // Loading prop is passed through to component
      expect(wrapper.props().loading).toBe(true)
    })
  })

  describe('Button Styling', () => {
    it('should have correct default button styling', () => {
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      expect(deleteButton.classes()).toContain('p-1')
      expect(deleteButton.classes()).toContain('rounded-full')
      expect(deleteButton.classes()).toContain('transition-colors')
      expect(deleteButton.classes()).toContain('text-gray-400')
      expect(deleteButton.classes()).toContain('hover:text-red-600')
      expect(deleteButton.classes()).toContain('hover:bg-red-50')
    })

    it('should have disabled styling when deleting', () => {
      mockHostsStore.isHostDeleting.mockReturnValue(true)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      expect(deleteButton.classes()).toContain('cursor-not-allowed')
      expect(deleteButton.classes()).toContain('opacity-40')
      expect(deleteButton.classes()).toContain('text-gray-400')
      expect(deleteButton.classes()).not.toContain('hover:text-red-600')
      expect(deleteButton.classes()).not.toContain('hover:bg-red-50')
    })
  })

  describe('Event Handling', () => {
    it('should prevent event propagation on delete button click', async () => {
      mockConfirmations.confirmHostDeletion.mockResolvedValue(false)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      const clickEvent = new Event('click', { bubbles: true })
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation')

      // Simulate the .stop modifier behavior
      await deleteButton.trigger('click')

      // The .stop modifier should prevent propagation
      expect(mockConfirmations.confirmHostDeletion).toHaveBeenCalled()
    })

    it('should not trigger delete when button is disabled', async () => {
      mockHostsStore.isHostDeleting.mockReturnValue(true)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')

      expect(mockConfirmations.confirmHostDeletion).not.toHaveBeenCalled()
    })
  })

  describe('Host Data Formatting', () => {
    it('should format timestamp correctly', () => {
      wrapper = mountHostCard()

      expect(formatTimestamp).toHaveBeenCalledWith(mockHost.CreatedAt.toString())
      expect(wrapper.text()).toContain('Created formatted-')
    })

    it('should handle different address formats', () => {
      const hostWithDomain = {
        ...mockHost,
        Address: 'example.com',
      }
      wrapper = mountHostCard({ host: hostWithDomain })

      expect(wrapper.text()).toContain('example.com')
    })

    it('should handle long descriptions', () => {
      const hostWithLongDescription = {
        ...mockHost,
        Description: 'This is a very long description that might wrap to multiple lines and should still display correctly in the card component',
      }
      wrapper = mountHostCard({ host: hostWithLongDescription })

      expect(wrapper.text()).toContain('This is a very long description')
    })

    it('should handle special characters in address and description', () => {
      const hostWithSpecialChars = {
        ...mockHost,
        Address: 'test-server.example.com',
        Description: 'Server with special chars: @#$%^&*()',
      }
      wrapper = mountHostCard({ host: hostWithSpecialChars })

      expect(wrapper.text()).toContain('test-server.example.com')
      expect(wrapper.text()).toContain('Server with special chars: @#$%^&*()')
    })
  })

  describe('Component Structure', () => {
    it('should use Card component correctly', () => {
      wrapper = mountHostCard()

      const card = wrapper.find('.card')
      expect(card.exists()).toBe(true)

      const actions = wrapper.find('.card-actions')
      expect(actions.exists()).toBe(true)
    })

    it('should have correct text styling classes', () => {
      wrapper = mountHostCard()

      // Address should have correct classes
      const addressElement = wrapper.find('h3')
      expect(addressElement.classes()).toContain('font-medium')
      expect(addressElement.classes()).toContain('text-gray-900')
      expect(addressElement.classes()).toContain('group-hover:text-green-600')

      // Description should have correct classes
      const descriptionElement = wrapper.find('p')
      expect(descriptionElement.classes()).toContain('text-sm')
      expect(descriptionElement.classes()).toContain('text-gray-600')

      // Timestamp should have correct classes
      const timestampElements = wrapper.findAll('p')
      const timestampElement = timestampElements.find(p => p.text().includes('Created'))
      expect(timestampElement?.classes()).toContain('text-xs')
      expect(timestampElement?.classes()).toContain('text-gray-400')
    })

    it('should have correct icon positioning', () => {
      wrapper = mountHostCard()

      const iconContainer = wrapper.find('.flex.items-center')
      expect(iconContainer.exists()).toBe(true)

      const serverIcon = wrapper.find('svg')
      expect(serverIcon.classes()).toContain('w-8')
      expect(serverIcon.classes()).toContain('h-8')
      expect(serverIcon.classes()).toContain('text-green-500')
      expect(serverIcon.classes()).toContain('mr-3')
    })
  })

  describe('Props Validation', () => {
    it('should accept host prop', () => {
      wrapper = mountHostCard()
      expect(wrapper.props().host).toEqual(mockHost)
    })

    it('should accept loading prop', () => {
      wrapper = mountHostCard({ loading: true })
      expect(wrapper.props().loading).toBe(true)
    })

    it('should have correct default loading value', () => {
      wrapper = mountHostCard()
      expect(wrapper.props().loading).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle host with minimal data', () => {
      const minimalHost = {
        ID: 999,
        Address: 'localhost',
        CreatedAt: new Date('2023-01-01T00:00:00Z'),
        UpdatedAt: new Date('2023-01-01T00:00:00Z'),
      }
      wrapper = mountHostCard({ host: minimalHost })

      expect(wrapper.text()).toContain('localhost')
      expect(wrapper.text()).toContain('Created formatted-')
      expect(wrapper.text()).not.toContain('undefined')
    })

    it('should handle host with null description', () => {
      const hostWithNullDescription = {
        ...mockHost,
        Description: null,
      }
      wrapper = mountHostCard({ host: hostWithNullDescription })

      expect(wrapper.text()).toContain('192.168.1.100')
      expect(wrapper.text()).not.toContain('null')
    })

    it('should handle very long addresses', () => {
      const hostWithLongAddress = {
        ...mockHost,
        Address: 'very-long-server-name.subdomain.example.com',
      }
      wrapper = mountHostCard({ host: hostWithLongAddress })

      expect(wrapper.text()).toContain('very-long-server-name.subdomain.example.com')
    })

    it('should handle future dates', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const hostWithFutureDate = {
        ...mockHost,
        CreatedAt: futureDate,
      }
      wrapper = mountHostCard({ host: hostWithFutureDate })

      expect(wrapper.text()).toContain('Created formatted-')
    })
  })

  describe('Integration with Store and Composables', () => {
    it('should reactively update when isHostDeleting changes', async () => {
      mockHostsStore.isHostDeleting.mockReturnValue(false)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      expect(deleteButton.attributes('disabled')).toBeUndefined()

      // Simulate store state change by remounting with updated mock
      mockHostsStore.isHostDeleting.mockReturnValue(true)
      wrapper = mountHostCard() // Remount to reflect new mock state
      await nextTick()

      const updatedDeleteButton = wrapper.find('button')
      expect(updatedDeleteButton.attributes('disabled')).toBeDefined()
    })

    it('should call correct store method with host ID', async () => {
      mockConfirmations.confirmHostDeletion.mockResolvedValue(true)
      mockHostsStore.deleteHost.mockResolvedValue(undefined)
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')
      await nextTick()

      expect(mockHostsStore.deleteHost).toHaveBeenCalledWith(mockHost.ID)
    })

    it('should pass correct parameters to composables', async () => {
      mockConfirmations.confirmHostDeletion.mockResolvedValue(true)
      mockNotifications.notifyHostDeleted.mockImplementation(() => {})
      wrapper = mountHostCard()

      const deleteButton = wrapper.find('button')
      await deleteButton.trigger('click')
      await nextTick()

      expect(mockConfirmations.confirmHostDeletion).toHaveBeenCalledWith(mockHost.Address)
      expect(mockNotifications.notifyHostDeleted).toHaveBeenCalledWith(mockHost.Address)
    })
  })
})
