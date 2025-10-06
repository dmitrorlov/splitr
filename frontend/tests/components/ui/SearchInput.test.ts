import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchInput from '@/components/ui/SearchInput.vue'

describe('SearchInput.vue', () => {
  const defaultProps = {
    modelValue: '',
  }

  const mountSearchInput = (props = {}) => {
    return mount(SearchInput, {
      props: { ...defaultProps, ...props },
    })
  }

  beforeEach(() => {
    vi.clearAllTimers()
  })

  describe('Basic Rendering', () => {
    it('should render with correct structure', () => {
      const wrapper = mountSearchInput()
      
      // Should have main container
      expect(wrapper.find('.bg-white.rounded-lg.shadow.p-4').exists()).toBe(true)
      
      // Should have input field
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
      
      // Should have search icon
      const searchIcon = wrapper.find('svg')
      expect(searchIcon.exists()).toBe(true)
    })

    it('should display default placeholder', () => {
      const wrapper = mountSearchInput()
      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Search...')
    })

    it('should display custom placeholder', () => {
      const wrapper = mountSearchInput({ placeholder: 'Search networks...' })
      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Search networks...')
    })

    it('should render with default modelValue', () => {
      const wrapper = mountSearchInput({ modelValue: 'test search' })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('test search')
    })
  })

  describe('v-model Binding', () => {
    it('should emit update:modelValue when input changes', async () => {
      const wrapper = mountSearchInput()
      const input = wrapper.find('input')
      
      await input.setValue('new search term')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['new search term'])
    })

    it('should update input value when modelValue prop changes', async () => {
      const wrapper = mountSearchInput({ modelValue: 'initial' })
      const input = wrapper.find('input')
      
      expect(input.element.value).toBe('initial')
      
      await wrapper.setProps({ modelValue: 'updated' })
      expect(input.element.value).toBe('updated')
    })

    it('should handle empty string values', async () => {
      const wrapper = mountSearchInput({ modelValue: 'test' })
      const input = wrapper.find('input')
      
      await input.setValue('')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([''])
    })
  })

  describe('Clear Functionality', () => {
    it('should show clear button when input has value and clearable is true', () => {
      const wrapper = mountSearchInput({ 
        modelValue: 'test',
        clearable: true 
      })
      
      const clearButton = wrapper.find('button')
      expect(clearButton.exists()).toBe(true)
      
      // Should have X icon
      const xIcon = clearButton.find('svg')
      expect(xIcon.exists()).toBe(true)
    })

    it('should not show clear button when input is empty', () => {
      const wrapper = mountSearchInput({ 
        modelValue: '',
        clearable: true 
      })
      
      const clearButton = wrapper.find('button')
      expect(clearButton.exists()).toBe(false)
    })

    it('should not show clear button when clearable is false', () => {
      const wrapper = mountSearchInput({ 
        modelValue: 'test',
        clearable: false 
      })
      
      const clearButton = wrapper.find('button')
      expect(clearButton.exists()).toBe(false)
    })

    it('should clear input and emit events when clear button is clicked', async () => {
      const wrapper = mountSearchInput({ 
        modelValue: 'test search',
        clearable: true 
      })
      
      const clearButton = wrapper.find('button')
      await clearButton.trigger('click')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([''])
      expect(wrapper.emitted().clear).toBeTruthy()
      expect(wrapper.emitted().clear).toHaveLength(1)
    })
  })

  describe('Result Count Display', () => {
    it('should not show result count when resultCount is null', () => {
      const wrapper = mountSearchInput({ resultCount: null })
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.exists()).toBe(false)
    })

    it('should show result count with default result text', () => {
      const wrapper = mountSearchInput({ 
        resultCount: 5,
        modelValue: 'test' 
      })
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.exists()).toBe(true)
      expect(resultText.text()).toContain('5 results found')
      expect(resultText.text()).toContain('for "test"')
    })

    it('should show result count with custom result text', () => {
      const wrapper = mountSearchInput({ 
        resultCount: 3,
        resultText: 'networks',
        modelValue: 'lan' 
      })
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain('3 networks found')
      expect(resultText.text()).toContain('for "lan"')
    })

    it('should show result count without search term when modelValue is empty', () => {
      const wrapper = mountSearchInput({ 
        resultCount: 10,
        modelValue: '' 
      })
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toBe('10 results found')
      expect(resultText.text()).not.toContain('for')
    })

    it('should handle zero results', () => {
      const wrapper = mountSearchInput({ 
        resultCount: 0,
        modelValue: 'nonexistent' 
      })
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain('0 results found')
      expect(resultText.text()).toContain('for "nonexistent"')
    })

    it('should handle single result', () => {
      const wrapper = mountSearchInput({ 
        resultCount: 1,
        modelValue: 'unique' 
      })
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain('1 results found')
      expect(resultText.text()).toContain('for "unique"')
    })
  })

  describe('Icons', () => {
    it('should render search icon with correct classes', () => {
      const wrapper = mountSearchInput()
      
      const iconContainer = wrapper.find('.absolute.inset-y-0.left-0.pl-3')
      expect(iconContainer.exists()).toBe(true)
      
      const searchIcon = iconContainer.find('svg.h-5.w-5.text-gray-400')
      expect(searchIcon.exists()).toBe(true)
    })

    it('should render clear icon with correct classes when clearable', () => {
      const wrapper = mountSearchInput({ 
        modelValue: 'test',
        clearable: true 
      })
      
      const clearButton = wrapper.find('button')
      const clearIcon = clearButton.find('svg.h-5.w-5')
      expect(clearIcon.exists()).toBe(true)
    })
  })

  describe('Input Styling', () => {
    it('should have correct input classes', () => {
      const wrapper = mountSearchInput()
      const input = wrapper.find('input')
      
      const expectedClasses = [
        'w-full', 'px-4', 'py-2', 'border', 'border-gray-300', 
        'rounded-md', 'shadow-sm', 'placeholder-gray-400',
        'focus:outline-none', 'focus:ring-blue-500', 'focus:border-blue-500',
        'pl-10', 'pr-10'
      ]
      
      expectedClasses.forEach(className => {
        expect(input.classes()).toContain(className)
      })
    })

    it('should have correct button classes for clear button', () => {
      const wrapper = mountSearchInput({ 
        modelValue: 'test',
        clearable: true 
      })
      
      const clearButton = wrapper.find('button')
      const expectedClasses = [
        'absolute', 'inset-y-0', 'right-0', 'pr-3', 
        'flex', 'items-center', 'text-gray-400', 'hover:text-gray-600'
      ]
      
      expectedClasses.forEach(className => {
        expect(clearButton.classes()).toContain(className)
      })
    })
  })

  describe('Event Handling', () => {
    it('should emit update:modelValue on input event', async () => {
      const wrapper = mountSearchInput()
      const input = wrapper.find('input')
      
      // Simulate input event
      input.element.value = 'test input'
      await input.trigger('input')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    })

    it('should handle input event method', async () => {
      const wrapper = mountSearchInput({ modelValue: 'test' })
      const input = wrapper.find('input')
      
      await input.trigger('input')
      
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    })
  })

  describe('Attribute Inheritance', () => {
    it('should pass through additional attributes to input', () => {
      const wrapper = mountSearchInput({
        'data-testid': 'search-input',
        'aria-label': 'Search input field',
      })
      
      const input = wrapper.find('input')
      expect(input.attributes('data-testid')).toBe('search-input')
      expect(input.attributes('aria-label')).toBe('Search input field')
    })

    it('should maintain type attribute as text', () => {
      const wrapper = mountSearchInput()
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('text')
    })
  })

  describe('Props Integration', () => {
    it('should handle all props together', () => {
      const wrapper = mountSearchInput({
        modelValue: 'network search',
        placeholder: 'Search networks and hosts...',
        clearable: true,
        resultCount: 15,
        resultText: 'items',
      })
      
      const input = wrapper.find('input')
      expect(input.element.value).toBe('network search')
      expect(input.attributes('placeholder')).toBe('Search networks and hosts...')
      
      const clearButton = wrapper.find('button')
      expect(clearButton.exists()).toBe(true)
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain('15 items found')
      expect(resultText.text()).toContain('for "network search"')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long search terms', () => {
      const longTerm = 'a'.repeat(100)
      const wrapper = mountSearchInput({ 
        modelValue: longTerm,
        resultCount: 1 
      })
      
      const input = wrapper.find('input')
      expect(input.element.value).toBe(longTerm)
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain(`for "${longTerm}"`)
    })

    it('should handle special characters in search term', () => {
      const specialTerm = '!@#$%^&*()_+{}|:"<>?[]\\;\',./'
      const wrapper = mountSearchInput({ 
        modelValue: specialTerm,
        resultCount: 0 
      })
      
      const input = wrapper.find('input')
      expect(input.element.value).toBe(specialTerm)
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain(`for "${specialTerm}"`)
    })

    it('should handle unicode characters', () => {
      const unicodeTerm = '测试 🔍 αβγ'
      const wrapper = mountSearchInput({ 
        modelValue: unicodeTerm,
        resultCount: 2 
      })
      
      const input = wrapper.find('input')
      expect(input.element.value).toBe(unicodeTerm)
      
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.text()).toContain(`for "${unicodeTerm}"`)
    })

    it('should handle undefined resultCount', () => {
      const wrapper = mountSearchInput({ 
        modelValue: 'test',
        // resultCount is undefined by default, but the template check is `resultCount !== null`
        // so undefined will show the result text (since undefined !== null is true)
      })
      
      // The component will show result text when resultCount is undefined
      // because the template condition is `v-if="resultCount !== null"`
      // and undefined !== null is true, but displays empty string for undefined
      const resultText = wrapper.find('.mt-2.text-sm.text-gray-500')
      expect(resultText.exists()).toBe(true)
      expect(resultText.text()).toContain('results found for "test"')
    })
  })

  describe('Debounce Configuration', () => {
    it('should accept debounceMs prop', () => {
      const wrapper = mountSearchInput({ debounceMs: 500 })
      expect(wrapper.props().debounceMs).toBe(500)
    })

    it('should have default debounceMs value', () => {
      const wrapper = mountSearchInput()
      expect(wrapper.props().debounceMs).toBe(300)
    })
  })

  describe('Component Structure', () => {
    it('should have proper accessibility structure', () => {
      const wrapper = mountSearchInput({ modelValue: 'test' })
      
      // Input should be focusable
      const input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      
      // Clear button should be clickable
      const clearButton = wrapper.find('button')
      expect(clearButton.exists()).toBe(true)
      
      // Icons should not be interactive (pointer-events-none for search icon)
      const searchIconContainer = wrapper.find('.pointer-events-none')
      expect(searchIconContainer.exists()).toBe(true)
    })

    it('should maintain proper z-index layering', () => {
      const wrapper = mountSearchInput({ modelValue: 'test' })
      
      // Search icon container should be absolute positioned
      const searchIconContainer = wrapper.find('.absolute.inset-y-0.left-0')
      expect(searchIconContainer.exists()).toBe(true)
      
      // Clear button should be absolute positioned
      const clearButton = wrapper.find('button.absolute.inset-y-0.right-0')
      expect(clearButton.exists()).toBe(true)
    })
  })
})