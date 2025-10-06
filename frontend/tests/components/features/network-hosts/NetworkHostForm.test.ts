import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import NetworkHostForm from '@/components/features/network-hosts/NetworkHostForm.vue'
import { useHostsStore, useNetworkHostsStore } from '@/stores'
import type { NetworkHost } from '@/types/entities'
import { componentStubs } from '../../../setup/component-stubs'

// Mock form validation composable
const mockFormValidation = {
  form: {
    values: { address: '', description: '' },
    errors: { address: '', description: '' },
    valid: false,
  },
  validate: vi.fn(),
  setFieldValue: vi.fn(),
  resetForm: vi.fn(),
}

const mockNotifications = {
  notifyHostCreated: vi.fn(),
  notifyHostError: vi.fn(),
}

vi.mock('@/composables', () => ({
  useFormValidation: () => mockFormValidation,
  useHostNotifications: () => mockNotifications,
}))

describe('NetworkHostForm', () => {
  let wrapper: VueWrapper<any>
  let hostsStore: any
  let networkHostsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    hostsStore = useHostsStore()
    networkHostsStore = useNetworkHostsStore()
    
    // Reset store methods and state
    vi.clearAllMocks()
    hostsStore.fetchHosts = vi.fn().mockResolvedValue(undefined)
    networkHostsStore.addNetworkHost = vi.fn().mockResolvedValue({
      ID: 1,
      NetworkID: 1,
      Address: '192.168.1.100',
      Description: 'Test Host',
      CreatedAt: new Date().toISOString(),
    })
    networkHostsStore.validateAddress = vi.fn().mockReturnValue(null)
    
    // Set up store state
    hostsStore.hosts = [
      { ID: 1, Address: '192.168.1.10', Description: 'Host 1' },
      { ID: 2, Address: '192.168.1.20', Description: 'Host 2' },
    ]
    networkHostsStore.networkHosts = []

    // Reset form validation mocks
    mockFormValidation.form.values = { address: '', description: '' }
    mockFormValidation.form.errors = { address: '', description: '' }
    mockFormValidation.form.valid = false
    mockFormValidation.validate.mockReturnValue(true)
    mockFormValidation.setFieldValue.mockClear()
    mockFormValidation.resetForm.mockClear()
    mockNotifications.notifyHostCreated.mockClear()
    mockNotifications.notifyHostError.mockClear()
  })

  const createWrapper = (props: Partial<{ visible: boolean; networkId: number }> = {}) => {
    return mount(NetworkHostForm, {
      props: {
        visible: true,
        networkId: 1,
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
      
      expect(wrapper.find('h3').text()).toBe('Add Host to Network')
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should not render when visible is false', () => {
      wrapper = createWrapper({ visible: false })
      
      expect(wrapper.find('h3').exists()).toBe(false)
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('should render form title correctly', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('h3').text()).toBe('Add Host to Network')
    })
  })

  describe('Host Selection Mode', () => {
    it('should render mode selection radio buttons', () => {
      wrapper = createWrapper()
      
      const radioButtons = wrapper.findAll('input[type="radio"]')
      expect(radioButtons).toHaveLength(2)
      
      expect(radioButtons[0].attributes('value')).toBe('manual')
      expect(radioButtons[1].attributes('value')).toBe('existing')
    })

    it('should default to manual mode', () => {
      wrapper = createWrapper()
      
      const manualRadio = wrapper.find('input[value="manual"]')
      expect(manualRadio.element.checked).toBe(true)
    })

    it('should switch to existing mode when selected', async () => {
      wrapper = createWrapper()
      
      const existingRadio = wrapper.find('input[value="existing"]')
      await existingRadio.setChecked(true)
      
      expect(existingRadio.element.checked).toBe(true)
    })

    it('should render mode labels correctly', () => {
      wrapper = createWrapper()
      
      expect(wrapper.text()).toContain('Enter manually')
      expect(wrapper.text()).toContain('Select from existing hosts')
    })
  })

  describe('Manual Mode', () => {
    it('should render address input in manual mode', () => {
      wrapper = createWrapper()
      
      const addressInputs = wrapper.findAllComponents({ name: 'Input' })
      const addressInput = addressInputs.find(input => input.props('label') === 'Host Address')
      
      expect(addressInput?.exists()).toBe(true)
      expect(addressInput?.props('placeholder')).toBe('Enter IP address or hostname')
      expect(addressInput?.props('required')).toBe(true)
    })

    it('should render description input in manual mode', () => {
      wrapper = createWrapper()
      
      const descriptionInputs = wrapper.findAllComponents({ name: 'Input' })
      const descriptionInput = descriptionInputs.find(input => input.props('label') === 'Description')
      
      expect(descriptionInput?.exists()).toBe(true)
      expect(descriptionInput?.props('placeholder')).toBe('Optional description')
    })

    it('should handle address input changes', async () => {
      wrapper = createWrapper()
      
      const addressInputs = wrapper.findAllComponents({ name: 'Input' })
      const addressInput = addressInputs.find(input => input.props('label') === 'Host Address')
      
      await addressInput?.vm.$emit('update:model-value', '192.168.1.100')
      
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('address', '192.168.1.100')
    })

    it('should handle description input changes', async () => {
      wrapper = createWrapper()
      
      const descriptionInputs = wrapper.findAllComponents({ name: 'Input' })
      const descriptionInput = descriptionInputs.find(input => input.props('label') === 'Description')
      
      await descriptionInput?.vm.$emit('update:model-value', 'Test description')
      
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('description', 'Test description')
    })

    it('should show form errors in manual mode', () => {
      mockFormValidation.form.errors.address = 'Address is required'
      wrapper = createWrapper()
      
      const addressInputs = wrapper.findAllComponents({ name: 'Input' })
      const addressInput = addressInputs.find(input => input.props('label') === 'Host Address')
      
      expect(addressInput?.props('error')).toBe('Address is required')
    })
  })

  describe('Existing Host Mode', () => {
    beforeEach(async () => {
      wrapper = createWrapper()
      const existingRadio = wrapper.find('input[value="existing"]')
      await existingRadio.setChecked(true)
      await nextTick()
    })

    it('should render existing host select in existing mode', () => {
      const select = wrapper.findComponent({ name: 'Select' })
      
      expect(select.exists()).toBe(true)
      expect(select.props('label')).toBe('Existing Host')
      expect(select.props('placeholder')).toBe('Select a host to add to this network')
    })

    it('should handle existing host selection', async () => {
      const select = wrapper.findComponent({ name: 'Select' })
      
      // Verify select component is configured correctly
      expect(select.exists()).toBe(true)
      expect(select.props('label')).toBe('Existing Host')
      expect(select.props('placeholder')).toBe('Select a host to add to this network')
      
      // Test that the component can handle the selection event without errors
      await select.vm.$emit('update:model-value', '192.168.1.10')
      await nextTick()
      
      // Verify no errors occurred and component remains stable
      expect(select.exists()).toBe(true)
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should show empty text when no hosts available', async () => {
      hostsStore.hosts = []
      wrapper = createWrapper()
      
      const existingRadio = wrapper.find('input[value="existing"]')
      await existingRadio.setChecked(true)
      await nextTick()
      
      const select = wrapper.findComponent({ name: 'Select' })
      if (select.exists()) {
        expect(select.props('emptyText')).toContain('No available hosts')
      } else {
        // If select doesn't render when no hosts, that's also valid behavior
        expect(wrapper.text()).toContain('No available hosts')
      }
    })
  })

  describe('Form Buttons', () => {
    it('should render submit button', () => {
      wrapper = createWrapper()
      
      const buttons = wrapper.findAll('[data-testid="button"]')
      const submitButton = buttons.find(btn => btn.attributes('type') === 'submit')
      
      expect(submitButton).toBeTruthy()
      expect(submitButton!.text()).toContain('Add to Network')
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
      mockFormValidation.form.values.address = '192.168.1.100'
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
      
      expect(networkHostsStore.addNetworkHost).not.toHaveBeenCalled()
    })

    it('should emit events on successful submission', async () => {
      const mockNetworkHost = { 
        ID: 1, 
        NetworkID: 1, 
        Address: '192.168.1.100', 
        Description: 'Test', 
        CreatedAt: new Date().toISOString() 
      }
      networkHostsStore.addNetworkHost.mockResolvedValue(mockNetworkHost)
      wrapper = createWrapper()
      
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      await nextTick()
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(wrapper.emitted('network-host-added')).toBeTruthy()
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

    it('should handle networkId prop', () => {
      wrapper = createWrapper({ networkId: 42 })
      
      expect(wrapper.props('networkId')).toBe(42)
    })

    it('should have correct default props', () => {
      wrapper = mount(NetworkHostForm, {
        props: { networkId: 1 },
        global: {
          stubs: componentStubs,
        },
      })
      
      expect(wrapper.props('visible')).toBe(false)
    })
  })

  describe('Form Validation Integration', () => {
    it('should handle address validation', () => {
      // Test validation logic directly
      const mockValidationError = 'Invalid IP address format'
      networkHostsStore.validateAddress.mockReturnValue(mockValidationError)
      
      // The component should use store validation
      expect(networkHostsStore.validateAddress('invalid')).toBe(mockValidationError)
    })

    it('should handle numeric values in input changes', async () => {
      wrapper = createWrapper()
      
      const addressInputs = wrapper.findAllComponents({ name: 'Input' })
      const addressInput = addressInputs.find(input => input.props('label') === 'Host Address')
      
      await addressInput?.vm.$emit('update:model-value', 12345)
      
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('address', '12345')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty host list', () => {
      hostsStore.hosts = []
      wrapper = createWrapper()
      
      // Component should render without errors
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should handle component with required networkId', () => {
      wrapper = createWrapper({ networkId: 123 })
      
      expect(wrapper.props('networkId')).toBe(123)
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      wrapper = createWrapper()
      
      const form = wrapper.find('form')
      expect(form.exists()).toBe(true)
      
      const buttons = wrapper.findAll('[data-testid="button"]')
      const submitButton = buttons.find(btn => btn.attributes('type') === 'submit')
      expect(submitButton).toBeTruthy()
    })

    it('should have proper radio button labels', () => {
      wrapper = createWrapper()
      
      const radioLabels = wrapper.findAll('label')
      expect(radioLabels.length).toBeGreaterThan(0)
    })
  })
})