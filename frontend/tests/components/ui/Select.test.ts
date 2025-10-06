import { mount } from '@vue/test-utils'
import Select from '@/components/ui/Select.vue'
import { describe, it, expect } from 'vitest'

// Helper function to mount Select with common options
const mountSelect = (props = {}) => {
  const defaultProps = {
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3', disabled: true },
    ],
    ...props,
  }
  
  return mount(Select, {
    props: defaultProps,
    global: {
      config: {
        warnHandler: () => {}, // Suppress Vue warnings in tests
      },
    },
  })
}

describe('Select.vue', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mountSelect()
      
      const select = wrapper.find('select')
      expect(select.exists()).toBe(true)
      expect(select.classes()).toContain('block')
      expect(select.classes()).toContain('w-full')
    })

    it('should render options correctly', () => {
      const wrapper = mountSelect()
      
      const options = wrapper.findAll('option')
      // Should have placeholder + 3 options = 4 total
      expect(options).toHaveLength(4)
      
      // Check placeholder
      expect(options[0].text()).toBe('Select an option...')
      expect(options[0].attributes('value')).toBe('')
      expect(options[0].attributes('disabled')).toBeDefined()
      
      // Check regular options
      expect(options[1].text()).toBe('Option 1')
      expect(options[1].attributes('value')).toBe('1')
      
      expect(options[2].text()).toBe('Option 2')
      expect(options[2].attributes('value')).toBe('2')
      
      // Check disabled option
      expect(options[3].text()).toBe('Option 3')
      expect(options[3].attributes('value')).toBe('3')
      expect(options[3].attributes('disabled')).toBeDefined()
    })

    it('should render custom placeholder', () => {
      const wrapper = mountSelect({ placeholder: 'Choose one...' })
      
      const placeholderOption = wrapper.find('option[value=""]')
      expect(placeholderOption.text()).toBe('Choose one...')
    })

    it('should render without label by default', () => {
      const wrapper = mountSelect()
      
      const label = wrapper.find('label')
      expect(label.exists()).toBe(false)
    })

    it('should render with label', () => {
      const wrapper = mountSelect({ label: 'Select Category' })
      
      const label = wrapper.find('label')
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe('Select Category')
      expect(label.classes()).toContain('text-sm')
      expect(label.classes()).toContain('font-medium')
    })

    it('should render required asterisk with label', () => {
      const wrapper = mountSelect({ label: 'Category', required: true })
      
      const label = wrapper.find('label')
      const asterisk = label.find('span')
      expect(asterisk.exists()).toBe(true)
      expect(asterisk.text()).toBe('*')
      expect(asterisk.classes()).toContain('text-red-500')
    })

    it('should render description', () => {
      const wrapper = mountSelect({ description: 'Please select a category' })
      
      const description = wrapper.find('p.text-gray-600')
      expect(description.exists()).toBe(true)
      expect(description.text()).toBe('Please select a category')
      expect(description.classes()).toContain('text-sm')
    })

    it('should render error message', () => {
      const wrapper = mountSelect({ error: 'This field is required' })
      
      const error = wrapper.find('p.text-red-600')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('This field is required')
      expect(error.classes()).toContain('text-sm')
    })
  })

  describe('loading state', () => {
    it('should show loading text in placeholder when loading', () => {
      const wrapper = mountSelect({ loading: true, loadingText: 'Loading options...' })
      
      const placeholderOption = wrapper.find('option[value=""]')
      expect(placeholderOption.text()).toBe('Loading options...')
    })

    it('should display loading message', () => {
      const wrapper = mountSelect({ loading: true, loadingText: 'Loading options...' })
      
      const loadingMessage = wrapper.find('p.text-blue-600')
      expect(loadingMessage.exists()).toBe(true)
      expect(loadingMessage.text()).toBe('Loading options...')
    })

    it('should disable select when loading', () => {
      const wrapper = mountSelect({ loading: true })
      
      const select = wrapper.find('select')
      expect(select.attributes('disabled')).toBeDefined()
    })

    it('should use default loading text', () => {
      const wrapper = mountSelect({ loading: true })
      
      const placeholderOption = wrapper.find('option[value=""]')
      expect(placeholderOption.text()).toBe('Loading...')
    })
  })

  describe('empty state', () => {
    it('should show empty message when no options provided', () => {
      const wrapper = mountSelect({ options: [] })
      
      const emptyMessage = wrapper.find('p.text-orange-600')
      expect(emptyMessage.exists()).toBe(true)
      expect(emptyMessage.text()).toBe('No options available')
    })

    it('should use custom empty text', () => {
      const wrapper = mountSelect({ options: [], emptyText: 'No items found' })
      
      const emptyMessage = wrapper.find('p.text-orange-600')
      expect(emptyMessage.text()).toBe('No items found')
    })

    it('should not show empty message when loading', () => {
      const wrapper = mountSelect({ options: [], loading: true })
      
      const emptyMessage = wrapper.find('p.text-orange-600')
      expect(emptyMessage.exists()).toBe(false)
      
      const loadingMessage = wrapper.find('p.text-blue-600')
      expect(loadingMessage.exists()).toBe(true)
    })
  })

  describe('states', () => {
    it('should apply normal state classes by default', () => {
      const wrapper = mountSelect()
      
      const select = wrapper.find('select')
      expect(select.classes()).toContain('border-gray-300')
      expect(select.classes()).toContain('focus:ring-blue-500')
      expect(select.classes()).toContain('focus:border-blue-500')
      expect(select.classes()).toContain('text-gray-900')
      expect(select.classes()).toContain('bg-white')
    })

    it('should apply error state classes', () => {
      const wrapper = mountSelect({ error: 'Invalid selection' })
      
      const select = wrapper.find('select')
      expect(select.classes()).toContain('border-red-300')
      expect(select.classes()).toContain('focus:ring-red-500')
      expect(select.classes()).toContain('focus:border-red-500')
    })

    it('should apply disabled state classes', () => {
      const wrapper = mountSelect({ disabled: true })
      
      const select = wrapper.find('select')
      expect(select.classes()).toContain('bg-gray-50')
      expect(select.classes()).toContain('text-gray-500')
      expect(select.classes()).toContain('cursor-not-allowed')
      expect(select.attributes('disabled')).toBeDefined()
    })

    it('should apply required attribute', () => {
      const wrapper = mountSelect({ required: true })
      
      const select = wrapper.find('select')
      expect(select.attributes('required')).toBeDefined()
    })
  })

  describe('v-model functionality', () => {
    it('should bind value with v-model', () => {
      const wrapper = mountSelect({ modelValue: '2' })
      
      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('2')
    })

    it('should update modelValue when selection changes', async () => {
      const wrapper = mountSelect({ modelValue: '' })
      
      const select = wrapper.find('select')
      await select.setValue('1')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['1'])
    })

    it('should emit change event with option data', async () => {
      const wrapper = mountSelect({ modelValue: '' })
      
      const select = wrapper.find('select')
      await select.setValue('2')
      
      expect(wrapper.emitted().change).toBeTruthy()
      expect(wrapper.emitted().change[0]).toEqual(['2', { value: '2', label: 'Option 2' }])
    })

    it('should handle number values', async () => {
      const options = [
        { value: 1, label: 'First' },
        { value: 2, label: 'Second' },
      ]
      const wrapper = mountSelect({ options, modelValue: 1 })
      
      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('1')
      
      await select.setValue('2')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([2])
    })

    it('should emit null option when value not found', async () => {
      const wrapper = mountSelect({ modelValue: '' })
      
      // Simulate the computed setter being called with a nonexistent value
      // This tests the component logic directly rather than through DOM
      const vm = wrapper.vm as any
      vm.selectValue = 'nonexistent'
      
      expect(wrapper.emitted().change[0]).toEqual(['nonexistent', null])
    })

    it('should update when modelValue prop changes', async () => {
      const wrapper = mountSelect({ modelValue: '1' })
      
      await wrapper.setProps({ modelValue: '2' })
      
      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('2')
    })
  })

  describe('option handling', () => {
    it('should handle options with different value types', () => {
      const options = [
        { value: 'string', label: 'String Option' },
        { value: 123, label: 'Number Option' },
        { value: 0, label: 'Zero Option' },
      ]
      const wrapper = mountSelect({ options })
      
      const optionElements = wrapper.findAll('option:not([value=""])')
      expect(optionElements[0].attributes('value')).toBe('string')
      expect(optionElements[1].attributes('value')).toBe('123')
      expect(optionElements[2].attributes('value')).toBe('0')
    })

    it('should handle disabled options correctly', () => {
      const wrapper = mountSelect()
      
      const disabledOption = wrapper.find('option[value="3"]')
      expect(disabledOption.attributes('disabled')).toBeDefined()
    })

    it('should handle empty options array', () => {
      const wrapper = mountSelect({ options: [] })
      
      const options = wrapper.findAll('option')
      // Only placeholder option should exist
      expect(options).toHaveLength(1)
      expect(options[0].attributes('value')).toBe('')
    })

    it('should render options dynamically', async () => {
      const wrapper = mountSelect()
      
      const newOptions = [
        { value: 'a', label: 'New Option A' },
        { value: 'b', label: 'New Option B' },
      ]
      
      await wrapper.setProps({ options: newOptions })
      
      const options = wrapper.findAll('option:not([value=""])')
      expect(options).toHaveLength(2)
      expect(options[0].text()).toBe('New Option A')
      expect(options[1].text()).toBe('New Option B')
    })
  })

  describe('accessibility', () => {
    it('should have proper focus styles', () => {
      const wrapper = mountSelect()
      
      const select = wrapper.find('select')
      expect(select.classes()).toContain('focus:outline-none')
      expect(select.classes()).toContain('focus:ring-blue-500')
      expect(select.classes()).toContain('focus:border-blue-500')
    })

    it('should inherit attributes through v-bind="$attrs"', () => {
      const wrapper = mount(Select, {
        props: { 
          options: [{ value: '1', label: 'Option 1' }]
        },
        attrs: {
          'aria-label': 'Custom select',
          'data-testid': 'test-select',
          name: 'category',
        },
      })
      
      const select = wrapper.find('select')
      expect(select.attributes('aria-label')).toBe('Custom select')
      expect(select.attributes('data-testid')).toBe('test-select')
      expect(select.attributes('name')).toBe('category')
    })

    it('should have accessible option elements', () => {
      const wrapper = mountSelect()
      
      const options = wrapper.findAll('option')
      options.forEach(option => {
        expect(option.attributes('value')).toBeDefined()
        expect(option.text()).toBeTruthy()
      })
    })
  })

  describe('combinations', () => {
    it('should handle all props together', () => {
      const wrapper = mountSelect({
        modelValue: '2',
        label: 'Select Category',
        description: 'Choose your preferred category',
        placeholder: 'Pick one...',
        required: true,
        error: 'Invalid selection',
        loadingText: 'Fetching...',
        emptyText: 'Nothing here'
      })
      
      // Check label with required asterisk
      const label = wrapper.find('label')
      expect(label.text()).toContain('Select Category')
      expect(label.find('span').text()).toBe('*')
      
      // Check description
      const description = wrapper.find('p.text-gray-600')
      expect(description.text()).toBe('Choose your preferred category')
      
      // Check select with value
      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('2')
      expect(select.attributes('required')).toBeDefined()
      
      // Check error state
      expect(select.classes()).toContain('border-red-300')
      const error = wrapper.find('p.text-red-600')
      expect(error.text()).toBe('Invalid selection')
      
      // Check placeholder (not loading, so should use regular placeholder)
      const placeholderOption = wrapper.find('option[value=""]')
      expect(placeholderOption.text()).toBe('Pick one...')
    })

    it('should handle disabled state with error', () => {
      const wrapper = mountSelect({ 
        disabled: true, 
        error: 'This field has an error' 
      })
      
      const select = wrapper.find('select')
      expect(select.classes()).toContain('bg-gray-50')
      expect(select.classes()).toContain('border-red-300')
      expect(select.attributes('disabled')).toBeDefined()
      
      const error = wrapper.find('p.text-red-600')
      expect(error.exists()).toBe(true)
    })

    it('should prioritize loading over empty state', () => {
      const wrapper = mountSelect({ 
        options: [], 
        loading: true, 
        loadingText: 'Loading...',
        emptyText: 'No data'
      })
      
      const loadingMessage = wrapper.find('p.text-blue-600')
      expect(loadingMessage.exists()).toBe(true)
      expect(loadingMessage.text()).toBe('Loading...')
      
      const emptyMessage = wrapper.find('p.text-orange-600')
      expect(emptyMessage.exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined modelValue', () => {
      const wrapper = mountSelect({ modelValue: undefined })
      
      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('')
    })

    it('should handle options with empty string values', () => {
      const options = [
        { value: '', label: 'Empty Value' },
        { value: '1', label: 'Regular Value' },
      ]
      const wrapper = mountSelect({ options })
      
      const regularOptions = wrapper.findAll('option:not([disabled])')
      expect(regularOptions).toHaveLength(2) // Not counting placeholder since it's disabled
      expect(regularOptions[0].attributes('value')).toBe('')
      expect(regularOptions[0].text()).toBe('Empty Value')
    })

    it('should handle options with special characters', () => {
      const options = [
        { value: 'special&chars', label: 'Special & Characters <test>' },
        { value: 'unicode', label: 'Unicode: 🚀 ñáéíóú' },
      ]
      const wrapper = mountSelect({ options })
      
      const regularOptions = wrapper.findAll('option:not([value=""])')
      expect(regularOptions[0].text()).toBe('Special & Characters <test>')
      expect(regularOptions[1].text()).toBe('Unicode: 🚀 ñáéíóú')
    })

    it('should handle rapid selection changes', async () => {
      const wrapper = mountSelect({ modelValue: '' })
      
      const select = wrapper.find('select')
      
      await select.setValue('1')
      await select.setValue('2')
      await select.setValue('1')
      
      expect(wrapper.emitted()['update:modelValue']).toHaveLength(3)
      expect(wrapper.emitted()['update:modelValue'][2]).toEqual(['1'])
      
      expect(wrapper.emitted().change).toHaveLength(3)
      expect(wrapper.emitted().change[2]).toEqual(['1', { value: '1', label: 'Option 1' }])
    })

    it('should maintain selection state when options change', async () => {
      const wrapper = mountSelect({ modelValue: '2' })
      
      // Change options but keep the selected one
      const newOptions = [
        { value: '2', label: 'Option 2 Modified' },
        { value: '4', label: 'Option 4' },
      ]
      
      await wrapper.setProps({ options: newOptions })
      
      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('2')
    })
  })
})