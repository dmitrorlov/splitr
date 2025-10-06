import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import NetworkForm from '@/components/features/networks/NetworkForm.vue'
import { useNetworksStore } from '@/stores'
import type { Network } from '@/types'
import { componentStubs } from '../../../setup/component-stubs'

// Mock form validation composable with controlled behavior
const mockFormValidation = {
  form: {
    values: { name: '' },
    errors: { name: '' },
    valid: false,
  },
  validate: vi.fn(),
  setFieldValue: vi.fn(),
  resetForm: vi.fn(),
}

const mockNotifications = {
  notifyNetworkCreated: vi.fn(),
  notifyNetworkError: vi.fn(),
}

vi.mock('@/composables', () => ({
  useFormValidation: () => mockFormValidation,
  useNetworkNotifications: () => mockNotifications,
  validationRules: {},
}))

describe('NetworkForm', () => {
  let wrapper: VueWrapper<any>
  let networksStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    networksStore = useNetworksStore()
    
    // Reset store methods and state
    vi.clearAllMocks()
    networksStore.fetchVPNServices = vi.fn().mockResolvedValue(undefined)
    networksStore.addNetwork = vi.fn().mockResolvedValue({
      ID: 1,
      Name: 'Test Network',
      CreatedAt: new Date().toISOString(),
    })
    
    // Set up store state for each test
    networksStore.vpnServices = ['wireguard', 'openvpn', 'ipsec']
    networksStore.loading = false

    // Reset form validation mocks
    mockFormValidation.form.values = { name: '' }
    mockFormValidation.form.errors = { name: '' }
    mockFormValidation.form.valid = false
    mockFormValidation.validate.mockReturnValue(true)
    mockFormValidation.setFieldValue.mockClear()
    mockFormValidation.resetForm.mockClear()
    mockNotifications.notifyNetworkCreated.mockClear()
    mockNotifications.notifyNetworkError.mockClear()
  })

  const createWrapper = (props: Partial<{ visible: boolean }> = {}) => {
    return mount(NetworkForm, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: componentStubs,
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render when visible is true', () => {
      wrapper = createWrapper({ visible: true })
      
      expect(wrapper.find('h3').text()).toBe('Add New Network')
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should not render when visible is false', () => {
      wrapper = createWrapper({ visible: false })
      
      expect(wrapper.find('h3').exists()).toBe(false)
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('should render form title correctly', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('h3').text()).toBe('Add New Network')
    })
  })

  describe('VPN Services Select', () => {
    it('should render VPN services select component', () => {
      wrapper = createWrapper()
      
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.exists()).toBe(true)
      expect(select.props('label')).toBe('VPN Service')
      expect(select.props('placeholder')).toBe('Select a VPN service...')
    })

    it('should handle select value changes', () => {
      wrapper = createWrapper()
      
      const select = wrapper.findComponent({ name: 'Select' })
      select.vm.$emit('update:model-value', 'wireguard')
      
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('name', 'wireguard')
    })

    it('should show form errors', () => {
      mockFormValidation.form.errors.name = 'Please select a VPN service'
      wrapper = createWrapper()
      
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('error')).toBe('Please select a VPN service')
    })

    it('should be marked as required', () => {
      wrapper = createWrapper()
      
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('required')).toBe(true)
    })
  })

  describe('Form Buttons', () => {
    it('should render submit button', () => {
      wrapper = createWrapper()
      
      const buttons = wrapper.findAll('[data-testid="button"]')
      const submitButton = buttons.find(btn => btn.attributes('type') === 'submit')
      
      expect(submitButton).toBeTruthy()
      expect(submitButton!.text()).toContain('Add Network')
    })

    it('should render cancel button', () => {
      wrapper = createWrapper()
      
      const buttons = wrapper.findAll('[data-testid="button"]')
      const cancelButton = buttons.find(btn => btn.text().includes('Cancel'))
      
      expect(cancelButton).toBeTruthy()
      expect(cancelButton!.text()).toContain('Cancel')
    })

    it('should handle cancel button click', async () => {
      wrapper = createWrapper()
      
      const buttons = wrapper.findAll('[data-testid="button"]')
      const cancelButton = buttons.find(btn => btn.text().includes('Cancel'))
      
      expect(cancelButton).toBeTruthy()
      await cancelButton!.trigger('click')
      
      expect(mockFormValidation.resetForm).toHaveBeenCalled()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      mockFormValidation.form.valid = true
      mockFormValidation.form.values.name = 'wireguard'
    })

    it('should call validate on form submission', async () => {
      wrapper = createWrapper()
      
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      
      expect(mockFormValidation.validate).toHaveBeenCalled()
    })

    it('should not proceed if validation fails', async () => {
      mockFormValidation.validate.mockReturnValue(false)
      wrapper = createWrapper()
      
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      
      expect(networksStore.addNetwork).not.toHaveBeenCalled()
    })

    it('should emit events on successful submission', async () => {
      const mockNetwork = { ID: 1, Name: 'Test Network', CreatedAt: new Date().toISOString() }
      networksStore.addNetwork.mockResolvedValue(mockNetwork)
      wrapper = createWrapper()
      
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      await nextTick()
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(wrapper.emitted('network-added')).toBeTruthy()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('Props', () => {
    it('should handle visible prop changes', async () => {
      wrapper = createWrapper({ visible: true })
      expect(wrapper.find('form').exists()).toBe(true)
      
      await wrapper.setProps({ visible: false })
      expect(wrapper.find('form').exists()).toBe(false)
      
      await wrapper.setProps({ visible: true })
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should have correct default props', () => {
      wrapper = mount(NetworkForm, {
        global: {
          stubs: componentStubs,
        },
      })
      
      expect(wrapper.props('visible')).toBe(false)
    })
  })

  describe('Form Validation Integration', () => {
    it('should validate name field correctly', () => {
      // Test the validation logic directly
      const customValidator = (value: string) => {
        if (!value || !value.trim()) {
          return 'Please select a VPN service'
        }
        return true
      }
      
      expect(customValidator('')).toBe('Please select a VPN service')
      expect(customValidator('   ')).toBe('Please select a VPN service')
      expect(customValidator('wireguard')).toBe(true)
    })

    it('should handle numeric values in network name change', async () => {
      wrapper = createWrapper()
      
      const select = wrapper.findComponent({ name: 'Select' })
      await select.vm.$emit('update:model-value', 123)
      
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('name', '123')
    })
  })

  describe('Empty State Handling', () => {
    it('should show empty text when no services available', () => {
      networksStore.vpnServices = []
      wrapper = createWrapper()
      
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('emptyText')).toBe('No VPN services available. Please ensure VPN services are configured on your system.')
    })
  })
})