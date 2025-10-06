import { mount } from '@vue/test-utils'
import Input from '@/components/ui/Input.vue'
import { describe, it, expect } from 'vitest'

// Helper function to mount Input with common options
const mountInput = (props = {}, attrs = {}) => {
  return mount(Input, {
    props,
    attrs,
    global: {
      config: {
        warnHandler: () => {}, // Suppress Vue warnings in tests
      },
    },
  })
}

describe('Input.vue', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.attributes('type')).toBe('text')
      expect(input.classes()).toContain('block')
      expect(input.classes()).toContain('w-full')
    })

    it('should render with custom type', () => {
      const wrapper = mountInput({ type: 'email' })
      
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('email')
    })

    it('should render with placeholder', () => {
      const wrapper = mountInput({ placeholder: 'Enter text...' })
      
      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Enter text...')
    })

    it('should render without label by default', () => {
      const wrapper = mountInput()
      
      const label = wrapper.find('label')
      expect(label.exists()).toBe(false)
    })

    it('should render with label', () => {
      const wrapper = mountInput({ label: 'Username' })
      
      const label = wrapper.find('label')
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe('Username')
      expect(label.classes()).toContain('text-sm')
      expect(label.classes()).toContain('font-medium')
    })

    it('should render required asterisk with label', () => {
      const wrapper = mountInput({ label: 'Username', required: true })
      
      const label = wrapper.find('label')
      const asterisk = label.find('span')
      expect(asterisk.exists()).toBe(true)
      expect(asterisk.text()).toBe('*')
      expect(asterisk.classes()).toContain('text-red-500')
    })

    it('should render description', () => {
      const wrapper = mountInput({ description: 'Please enter your username' })
      
      const description = wrapper.find('p')
      expect(description.exists()).toBe(true)
      expect(description.text()).toBe('Please enter your username')
      expect(description.classes()).toContain('text-sm')
      expect(description.classes()).toContain('text-gray-600')
    })

    it('should render error message', () => {
      const wrapper = mountInput({ error: 'This field is required' })
      
      const error = wrapper.find('p.text-red-600')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('This field is required')
      expect(error.classes()).toContain('text-sm')
    })
  })

  describe('input types', () => {
    const inputTypes = ['text', 'email', 'password', 'number', 'search', 'url', 'tel']
    
    inputTypes.forEach(type => {
      it(`should render with ${type} type`, () => {
        const wrapper = mountInput({ type: type as any })
        
        const input = wrapper.find('input')
        expect(input.attributes('type')).toBe(type)
      })
    })
  })

  describe('sizes', () => {
    it('should apply medium size classes by default', () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('px-3')
      expect(input.classes()).toContain('py-2')
      expect(input.classes()).toContain('text-base')
    })

    it('should apply small size classes', () => {
      const wrapper = mountInput({ size: 'sm' })
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('px-2')
      expect(input.classes()).toContain('py-1')
      expect(input.classes()).toContain('text-sm')
    })

    it('should apply large size classes', () => {
      const wrapper = mountInput({ size: 'lg' })
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('px-4')
      expect(input.classes()).toContain('py-3')
      expect(input.classes()).toContain('text-lg')
    })
  })

  describe('states', () => {
    it('should apply normal state classes by default', () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('border-gray-300')
      expect(input.classes()).toContain('focus:ring-blue-500')
      expect(input.classes()).toContain('focus:border-blue-500')
      expect(input.classes()).toContain('text-gray-900')
      expect(input.classes()).toContain('bg-white')
    })

    it('should apply error state classes', () => {
      const wrapper = mountInput({ error: 'Invalid input' })
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('border-red-300')
      expect(input.classes()).toContain('focus:ring-red-500')
      expect(input.classes()).toContain('focus:border-red-500')
    })

    it('should apply disabled state classes', () => {
      const wrapper = mountInput({ disabled: true })
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('bg-gray-50')
      expect(input.classes()).toContain('text-gray-500')
      expect(input.classes()).toContain('cursor-not-allowed')
      expect(input.attributes('disabled')).toBeDefined()
    })

    it('should apply readonly attribute', () => {
      const wrapper = mountInput({ readonly: true })
      
      const input = wrapper.find('input')
      expect(input.attributes('readonly')).toBeDefined()
    })

    it('should apply required attribute', () => {
      const wrapper = mountInput({ required: true })
      
      const input = wrapper.find('input')
      expect(input.attributes('required')).toBeDefined()
    })
  })

  describe('v-model functionality', () => {
    it('should bind value with v-model', async () => {
      const wrapper = mountInput({ modelValue: 'initial value' })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('initial value')
    })

    it('should update modelValue when input changes', async () => {
      const wrapper = mountInput({ modelValue: '' })
      
      const input = wrapper.find('input')
      await input.setValue('new value')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['new value'])
    })

    it('should handle number values', async () => {
      const wrapper = mountInput({ modelValue: 42, type: 'number' })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('42')
      
      await input.setValue('123')
      // The component emits the actual value type based on input changes
      // For number inputs, Vue Test Utils setValue triggers type conversion
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([123])
    })

    it('should update when modelValue prop changes', async () => {
      const wrapper = mountInput({ modelValue: 'initial' })
      
      await wrapper.setProps({ modelValue: 'updated' })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('updated')
    })
  })

  describe('events', () => {
    it('should emit input event', async () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      await input.trigger('input')
      
      expect(wrapper.emitted().input).toBeTruthy()
      expect(wrapper.emitted().input).toHaveLength(1)
    })

    it('should emit focus event', async () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      await input.trigger('focus')
      
      expect(wrapper.emitted().focus).toBeTruthy()
      expect(wrapper.emitted().focus).toHaveLength(1)
      expect(wrapper.emitted().focus[0][0]).toBeInstanceOf(Event)
    })

    it('should emit blur event', async () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      await input.trigger('blur')
      
      expect(wrapper.emitted().blur).toBeTruthy()
      expect(wrapper.emitted().blur).toHaveLength(1)
      expect(wrapper.emitted().blur[0][0]).toBeInstanceOf(Event)
    })

    it('should emit both input and update:modelValue on input', async () => {
      const wrapper = mountInput({ modelValue: '' })
      
      const input = wrapper.find('input')
      await input.setValue('test')
      
      expect(wrapper.emitted().input).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('should have proper focus styles', () => {
      const wrapper = mountInput()
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('focus:outline-none')
      expect(input.classes()).toContain('focus:ring-blue-500')
      expect(input.classes()).toContain('focus:border-blue-500')
    })

    it('should associate label with input', () => {
      const wrapper = mountInput({ label: 'Username' })
      
      const label = wrapper.find('label')
      const input = wrapper.find('input')
      
      expect(label.attributes('for')).toBeDefined()
      expect(label.attributes('for')).toMatch(/^input-/)
    })

    it('should inherit attributes through v-bind="$attrs"', () => {
      const wrapper = mount(Input, {
        props: {},
        attrs: {
          'aria-label': 'Custom input',
          'data-testid': 'test-input',
          autocomplete: 'username',
        },
      })
      
      const input = wrapper.find('input')
      expect(input.attributes('aria-label')).toBe('Custom input')
      expect(input.attributes('data-testid')).toBe('test-input')
      expect(input.attributes('autocomplete')).toBe('username')
    })
  })

  describe('layout and styling', () => {
    it('should apply proper spacing with label', () => {
      const wrapper = mountInput({ label: 'Username' })
      
      const inputWrapper = wrapper.find('div').findAll('div')[0]
      expect(inputWrapper.classes()).toContain('mt-1')
    })

    it('should apply proper spacing with description', () => {
      const wrapper = mountInput({ description: 'Help text' })
      
      const inputWrapper = wrapper.find('div').findAll('div')[0]
      expect(inputWrapper.classes()).toContain('mt-1')
    })

    it('should apply proper spacing with both label and description', () => {
      const wrapper = mountInput({ 
        label: 'Username', 
        description: 'Enter your username' 
      })
      
      const description = wrapper.find('p.text-gray-600')
      expect(description.classes()).toContain('mt-1')
      
      const inputWrapper = wrapper.find('div').findAll('div')[0]
      expect(inputWrapper.classes()).toContain('mt-1')
    })

    it('should not apply spacing without label or description', () => {
      const wrapper = mountInput()
      
      const inputWrapper = wrapper.find('div').findAll('div')[0]
      expect(inputWrapper.classes()).not.toContain('mt-1')
    })

    it('should style error message properly', () => {
      const wrapper = mountInput({ error: 'Error message' })
      
      const error = wrapper.find('p.text-red-600')
      expect(error.classes()).toContain('mt-1')
      expect(error.classes()).toContain('text-sm')
    })
  })

  describe('combinations', () => {
    it('should handle all props together', () => {
      const wrapper = mountInput({
        modelValue: 'test value',
        type: 'email',
        label: 'Email Address',
        description: 'Please enter your email',
        placeholder: 'user@example.com',
        required: true,
        size: 'lg',
        error: 'Invalid email format'
      })
      
      // Check label with required asterisk
      const label = wrapper.find('label')
      expect(label.text()).toContain('Email Address')
      expect(label.find('span').text()).toBe('*')
      
      // Check description
      const description = wrapper.find('p.text-gray-600')
      expect(description.text()).toBe('Please enter your email')
      
      // Check input
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('email')
      expect(input.attributes('placeholder')).toBe('user@example.com')
      expect(input.attributes('required')).toBeDefined()
      expect((input.element as HTMLInputElement).value).toBe('test value')
      
      // Check size classes
      expect(input.classes()).toContain('px-4')
      expect(input.classes()).toContain('py-3')
      expect(input.classes()).toContain('text-lg')
      
      // Check error state
      expect(input.classes()).toContain('border-red-300')
      const error = wrapper.find('p.text-red-600')
      expect(error.text()).toBe('Invalid email format')
    })

    it('should handle disabled state with error', () => {
      const wrapper = mountInput({ 
        disabled: true, 
        error: 'This field has an error' 
      })
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('bg-gray-50')
      expect(input.classes()).toContain('border-red-300')
      expect(input.attributes('disabled')).toBeDefined()
      
      const error = wrapper.find('p.text-red-600')
      expect(error.exists()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const wrapper = mountInput({ modelValue: '' })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('')
    })

    it('should handle undefined modelValue', () => {
      const wrapper = mountInput({ modelValue: undefined })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('')
    })

    it('should handle zero as number value', () => {
      const wrapper = mountInput({ modelValue: 0, type: 'number' })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('0')
    })

    it('should maintain focus styles in error state', () => {
      const wrapper = mountInput({ error: 'Error message' })
      
      const input = wrapper.find('input')
      expect(input.classes()).toContain('focus:ring-red-500')
      expect(input.classes()).toContain('focus:border-red-500')
      expect(input.classes()).toContain('focus:outline-none')
    })

    it('should handle rapid value changes', async () => {
      const wrapper = mountInput({ modelValue: '' })
      
      const input = wrapper.find('input')
      
      await input.setValue('a')
      await input.setValue('ab')
      await input.setValue('abc')
      
      // Check that we have the expected emissions (both v-model and handleInput emit)
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      // Get the last emission to verify final value
      const emissions = wrapper.emitted()['update:modelValue']
      expect(emissions[emissions.length - 1]).toEqual(['abc'])
    })

    it('should work with readonly and value changes', async () => {
      const wrapper = mountInput({ modelValue: 'readonly value', readonly: true })
      
      await wrapper.setProps({ modelValue: 'new value' })
      
      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('new value')
      expect(input.attributes('readonly')).toBeDefined()
    })
  })
})