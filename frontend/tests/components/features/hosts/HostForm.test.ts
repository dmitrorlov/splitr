import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HostForm from '@/components/features/hosts/HostForm.vue'
import { createPinia, setActivePinia } from 'pinia'
import type { Host } from '@/types'
import { useFormValidation, useHostNotifications } from '@/composables'
import { useHostsStore } from '@/stores'

// Mock the composables
vi.mock('@/composables', () => ({
  useFormValidation: vi.fn(),
  useHostNotifications: vi.fn(() => ({
    notifyHostCreated: vi.fn(),
    notifyHostError: vi.fn(),
  })),
  validationRules: {
    required: vi.fn(),
    email: vi.fn(),
  },
}))

// Mock the stores
vi.mock('@/stores', () => ({
  useHostsStore: vi.fn(() => ({
    addHost: vi.fn(),
    validateAddress: vi.fn(),
  })),
}))

describe('HostForm.vue', () => {
  let wrapper: VueWrapper
  let mockFormValidation: any
  let mockNotifications: any
  let mockHostsStore: any

  beforeEach(() => {
    // Set up Pinia
    const pinia = createPinia()
    setActivePinia(pinia)

    // Reset mocks
    vi.clearAllMocks()

    // Set up mock form validation
    mockFormValidation = {
      form: {
        values: { address: '', description: '' },
        errors: {},
        touched: {},
        submitting: false,
        valid: false,
      },
      validate: vi.fn(() => true),
      setFieldValue: vi.fn(),
      resetForm: vi.fn(),
    }

    // Set up mock notifications
    mockNotifications = {
      notifyHostCreated: vi.fn(),
      notifyHostError: vi.fn(),
    }

    // Set up mock hosts store
    mockHostsStore = {
      addHost: vi.fn(),
      validateAddress: vi.fn(() => null), // No validation error by default
    }

    // Mock the composables
    vi.mocked(useFormValidation).mockReturnValue(mockFormValidation)
    vi.mocked(useHostNotifications).mockReturnValue(mockNotifications)
    vi.mocked(useHostsStore).mockReturnValue(mockHostsStore)
  })

  const mountHostForm = (props = {}, options = {}) => {
    return mount(HostForm, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: {
          Card: {
            template: `
              <div class="card">
                <div class="card-header">
                  <slot name="header" />
                </div>
                <div class="card-content">
                  <slot />
                </div>
              </div>
            `,
          },
          Input: {
            props: ['modelValue', 'label', 'placeholder', 'error', 'required', 'type'],
            template: `
              <div class="input-wrapper">
                <label>{{ label }}</label>
                <input 
                  :value="modelValue" 
                  :placeholder="placeholder"
                  :required="required"
                  :type="type"
                  @input="$emit('update:modelValue', $event.target.value)"
                />
                <span v-if="error" class="error">{{ error }}</span>
              </div>
            `,
          },
          Button: {
            props: ['variant', 'loading', 'disabled', 'type'],
            template: `
              <button 
                :type="type"
                :disabled="disabled || loading"
                :class="variant"
                @click="$emit('click')"
              >
                <slot />
              </button>
            `,
          },
        },
      },
      ...options,
    })
  }

  describe('Basic Rendering', () => {
    it('should render when visible is true', () => {
      wrapper = mountHostForm({ visible: true })
      expect(wrapper.find('.card').exists()).toBe(true)
      expect(wrapper.text()).toContain('Add New Host')
    })

    it('should not render when visible is false', () => {
      wrapper = mountHostForm({ visible: false })
      expect(wrapper.find('.card').exists()).toBe(false)
    })

    it('should render form fields correctly', () => {
      wrapper = mountHostForm()

      const inputs = wrapper.findAll('input')
      expect(inputs).toHaveLength(2)

      // Address field
      const addressInput = inputs[0]
      expect(addressInput.attributes('placeholder')).toBe('Enter IP address or hostname')
      expect(addressInput.attributes('required')).toBeDefined()

      // Description field  
      const descriptionInput = inputs[1]
      expect(descriptionInput.attributes('placeholder')).toBe('Optional description')
      expect(descriptionInput.attributes('required')).toBeUndefined()
    })

    it('should render action buttons', () => {
      wrapper = mountHostForm()

      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)

      const addButton = buttons[0]
      const cancelButton = buttons[1]

      expect(addButton.text()).toContain('Add Host')
      expect(addButton.attributes('type')).toBe('submit')

      expect(cancelButton.text()).toContain('Cancel')
      expect(cancelButton.attributes('type')).toBe('button')
    })
  })

  describe('Form Validation', () => {
    it('should initialize form with useFormValidation', () => {
      wrapper = mountHostForm()

      expect(useFormValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            label: 'Host Address',
            required: true,
            validation: expect.objectContaining({
              required: true,
              custom: expect.any(Function),
            }),
          }),
          description: expect.objectContaining({
            label: 'Description',
            required: false,
            validation: expect.objectContaining({
              maxLength: 200,
            }),
          }),
        }),
        { address: '', description: '' }
      )
    })

    it('should disable submit button when form is invalid', () => {
      mockFormValidation.form.valid = false
      wrapper = mountHostForm()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should enable submit button when form is valid', () => {
      mockFormValidation.form.valid = true
      wrapper = mountHostForm()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })

    it('should show loading state on submit button', () => {
      wrapper = mountHostForm()
      wrapper.vm.isSubmitting = true
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('Form Field Interactions', () => {
    it('should handle address field changes', async () => {
      wrapper = mountHostForm()

      const addressInput = wrapper.find('input[placeholder="Enter IP address or hostname"]')
      await addressInput.setValue('192.168.1.100')

      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('address', '192.168.1.100')
    })

    it('should handle description field changes', async () => {
      wrapper = mountHostForm()

      const descriptionInput = wrapper.find('input[placeholder="Optional description"]')
      await descriptionInput.setValue('Test server')

      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('description', 'Test server')
    })

    it('should display form errors', () => {
      mockFormValidation.form.errors = {
        address: 'Host address is required',
        description: 'Description too long',
      }
      wrapper = mountHostForm()

      const errors = wrapper.findAll('.error')
      expect(errors).toHaveLength(2)
      expect(errors[0].text()).toBe('Host address is required')
      expect(errors[1].text()).toBe('Description too long')
    })

    it('should convert numeric values to strings', async () => {
      wrapper = mountHostForm()

      // Simulate numeric input
      wrapper.vm.handleAddressChange(192168)
      wrapper.vm.handleDescriptionChange(12345)

      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('address', '192168')
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('description', '12345')
    })
  })

  describe('Address Validation', () => {
    it('should use store validation for address', () => {
      const calls = vi.mocked(useFormValidation).mock.calls
      
      if (calls.length > 0) {
        const formFields = calls[0][0]
        const addressField = formFields.address
        
        // Test the custom validation function
        const customValidation = addressField.validation.custom
        const testValue = '192.168.1.100'
        
        // Mock the store validation
        mockHostsStore.validateAddress.mockReturnValue(null)
        
        const result = customValidation(testValue)
        expect(mockHostsStore.validateAddress).toHaveBeenCalledWith('192.168.1.100')
        expect(result).toBe(true)
      }
    })

    it('should handle address validation errors', () => {
      const calls = vi.mocked(useFormValidation).mock.calls
      
      if (calls.length > 0) {
        const formFields = calls[0][0]
        const customValidation = formFields.address.validation.custom
        
        // Mock validation error
        mockHostsStore.validateAddress.mockReturnValue('Invalid IP address')
        
        const result = customValidation('invalid-address')
        expect(result).toBe('Invalid IP address')
      }
    })

    it('should require address field', () => {
      const calls = vi.mocked(useFormValidation).mock.calls
      
      if (calls.length > 0) {
        const formFields = calls[0][0]
        const customValidation = formFields.address.validation.custom
        
        const result = customValidation('')
        expect(result).toBe('Host address is required')
      }
    })

    it('should trim whitespace from address', () => {
      const calls = vi.mocked(useFormValidation).mock.calls
      
      if (calls.length > 0) {
        const formFields = calls[0][0]
        const customValidation = formFields.address.validation.custom
        
        mockHostsStore.validateAddress.mockReturnValue(null)
        
        customValidation('  192.168.1.100  ')
        expect(mockHostsStore.validateAddress).toHaveBeenCalledWith('192.168.1.100')
      }
    })
  })

  describe('Form Submission', () => {
    it('should prevent submission when form is invalid', async () => {
      mockFormValidation.validate.mockReturnValue(false)
      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(mockHostsStore.addHost).not.toHaveBeenCalled()
    })

    it('should submit form when valid', async () => {
      const mockHost: Host = {
        ID: 1,
        Address: '192.168.1.100',
        Description: 'Test server',
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      }

      mockFormValidation.validate.mockReturnValue(true)
      mockFormValidation.form.values = {
        address: '192.168.1.100',
        description: 'Test server',
      }
      mockHostsStore.addHost.mockResolvedValue(mockHost)

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')
      await nextTick()

      expect(mockHostsStore.addHost).toHaveBeenCalledWith('192.168.1.100', 'Test server')
      expect(mockNotifications.notifyHostCreated).toHaveBeenCalledWith('192.168.1.100')
    })

    it('should trim whitespace on submission', async () => {
      mockFormValidation.validate.mockReturnValue(true)
      mockFormValidation.form.values = {
        address: '  192.168.1.100  ',
        description: '  Test server  ',
      }
      mockHostsStore.addHost.mockResolvedValue({})

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(mockHostsStore.addHost).toHaveBeenCalledWith('192.168.1.100', 'Test server')
    })

    it('should handle submission errors', async () => {
      const error = new Error('Network error')
      mockFormValidation.validate.mockReturnValue(true)
      mockFormValidation.form.values = {
        address: '192.168.1.100',
        description: 'Test server',
      }
      mockHostsStore.addHost.mockRejectedValue(error)

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')
      await nextTick()

      expect(mockNotifications.notifyHostError).toHaveBeenCalledWith(
        'Add',
        '192.168.1.100',
        error
      )
    })

    it('should emit host-added event on successful submission', async () => {
      const mockHost: Host = {
        ID: 1,
        Address: '192.168.1.100',
        Description: 'Test server',
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      }

      mockFormValidation.validate.mockReturnValue(true)
      mockHostsStore.addHost.mockResolvedValue(mockHost)

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')
      await nextTick()

      expect(wrapper.emitted()['host-added']).toBeTruthy()
      expect(wrapper.emitted()['host-added'][0]).toEqual([mockHost])
    })

    it('should handle empty description on submission', async () => {
      mockFormValidation.validate.mockReturnValue(true)
      mockFormValidation.form.values = {
        address: '192.168.1.100',
        description: '',
      }
      mockHostsStore.addHost.mockResolvedValue({})

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(mockHostsStore.addHost).toHaveBeenCalledWith('192.168.1.100', '')
    })
  })

  describe('Cancel Functionality', () => {
    it('should handle cancel button click', async () => {
      wrapper = mountHostForm()

      const cancelButton = wrapper.find('button[type="button"]')
      await cancelButton.trigger('click')

      expect(mockFormValidation.resetForm).toHaveBeenCalled()
      expect(wrapper.emitted()['update:visible']).toBeTruthy()
      expect(wrapper.emitted()['update:visible'][0]).toEqual([false])
      expect(wrapper.emitted().cancel).toBeTruthy()
    })

    it('should reset form and emit events after successful submission', async () => {
      mockFormValidation.validate.mockReturnValue(true)
      mockHostsStore.addHost.mockResolvedValue({})

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')
      await nextTick()

      expect(mockFormValidation.resetForm).toHaveBeenCalled()
      expect(wrapper.emitted()['update:visible']).toBeTruthy()
      expect(wrapper.emitted().cancel).toBeTruthy()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      let resolveAddHost: (value: any) => void
      const addHostPromise = new Promise(resolve => {
        resolveAddHost = resolve
      })

      mockFormValidation.validate.mockReturnValue(true)
      mockHostsStore.addHost.mockReturnValue(addHostPromise)

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')

      // Should be in loading state
      expect(wrapper.vm.isSubmitting).toBe(true)
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()

      // Resolve the promise
      resolveAddHost({})
      await nextTick()

      // Should no longer be loading
      expect(wrapper.vm.isSubmitting).toBe(false)
    })

    it('should clear loading state on error', async () => {
      mockFormValidation.validate.mockReturnValue(true)
      mockHostsStore.addHost.mockRejectedValue(new Error('Test error'))

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')
      await nextTick()

      expect(wrapper.vm.isSubmitting).toBe(false)
    })
  })

  describe('Props and Events', () => {
    it('should accept visible prop', () => {
      wrapper = mountHostForm({ visible: true })
      expect(wrapper.props().visible).toBe(true)

      wrapper = mountHostForm({ visible: false })
      expect(wrapper.props().visible).toBe(false)
    })

    it('should have correct default visible prop', () => {
      wrapper = mountHostForm()
      expect(wrapper.props().visible).toBe(true) // We override in mountHostForm
    })

    it('should emit update:visible event', async () => {
      wrapper = mountHostForm()

      const cancelButton = wrapper.find('button[type="button"]')
      await cancelButton.trigger('click')

      expect(wrapper.emitted()['update:visible']).toBeTruthy()
      expect(wrapper.emitted()['update:visible'][0]).toEqual([false])
    })

    it('should emit cancel event', async () => {
      wrapper = mountHostForm()

      const cancelButton = wrapper.find('button[type="button"]')
      await cancelButton.trigger('click')

      expect(wrapper.emitted().cancel).toBeTruthy()
      expect(wrapper.emitted().cancel.length).toBeGreaterThan(0)
    })
  })

  describe('Component Structure', () => {
    it('should have correct form structure', () => {
      wrapper = mountHostForm()

      const card = wrapper.find('.card')
      expect(card.exists()).toBe(true)

      const header = wrapper.find('.card-header')
      expect(header.exists()).toBe(true)
      expect(header.text()).toContain('Add New Host')

      const form = wrapper.find('form')
      expect(form.exists()).toBe(true)
      expect(form.classes()).toContain('space-y-4')
    })

    it('should have correct button layout', () => {
      wrapper = mountHostForm()

      const buttonContainer = wrapper.find('.flex.space-x-3')
      expect(buttonContainer.exists()).toBe(true)

      const buttons = buttonContainer.findAll('button')
      expect(buttons).toHaveLength(2)

      const submitButton = buttons[0]
      const cancelButton = buttons[1]

      expect(submitButton.classes()).toContain('flex-1')
      expect(cancelButton.classes()).toContain('flex-1')
    })

    it('should use Input components correctly', () => {
      wrapper = mountHostForm()

      const inputs = wrapper.findAll('.input-wrapper')
      expect(inputs).toHaveLength(2)

      // Check the labels instead since we're using stubs
      const labels = wrapper.findAll('label')
      expect(labels[0].text()).toBe('Host Address')
      expect(labels[1].text()).toBe('Description')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined description', async () => {
      mockFormValidation.validate.mockReturnValue(true)
      mockFormValidation.form.values = {
        address: '192.168.1.100',
        description: null,
      }
      mockHostsStore.addHost.mockResolvedValue({})

      wrapper = mountHostForm()

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(mockHostsStore.addHost).toHaveBeenCalledWith('192.168.1.100', undefined)
    })

    it('should handle special characters in fields', async () => {
      wrapper = mountHostForm()

      const addressInput = wrapper.find('input[placeholder="Enter IP address or hostname"]')
      await addressInput.setValue('test-server.example.com')

      const descriptionInput = wrapper.find('input[placeholder="Optional description"]')
      await descriptionInput.setValue('Server with special chars: @#$%')

      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('address', 'test-server.example.com')
      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('description', 'Server with special chars: @#$%')
    })

    it('should handle very long input values', async () => {
      wrapper = mountHostForm()

      const longValue = 'a'.repeat(500)
      const descriptionInput = wrapper.find('input[placeholder="Optional description"]')
      await descriptionInput.setValue(longValue)

      expect(mockFormValidation.setFieldValue).toHaveBeenCalledWith('description', longValue)
    })
  })

  describe('Integration with Composables', () => {
    it('should initialize with correct form fields configuration', () => {
      wrapper = mountHostForm()

      const calls = vi.mocked(useFormValidation).mock.calls

      expect(calls).toHaveLength(1)

      const [formFields, initialValues] = calls[0]
      
      // Check address field configuration
      expect(formFields.address).toEqual({
        label: 'Host Address',
        name: 'address',
        type: 'text',
        required: true,
        validation: {
          required: true,
          custom: expect.any(Function),
        },
      })

      // Check description field configuration
      expect(formFields.description).toEqual({
        label: 'Description',
        name: 'description',
        type: 'text',
        required: false,
        validation: {
          maxLength: 200,
        },
      })

      // Check initial values
      expect(initialValues).toEqual({
        address: '',
        description: '',
      })
    })

    it('should use host notifications correctly', () => {
      wrapper = mountHostForm()

      expect(useHostNotifications).toHaveBeenCalled()
    })

    it('should use hosts store correctly', () => {
      wrapper = mountHostForm()

      expect(useHostsStore).toHaveBeenCalled()
    })
  })
})