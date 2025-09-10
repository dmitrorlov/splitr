import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'
import { describe, it, expect, vi } from 'vitest'

// Helper function to mount Button with common options
const mountButton = (props = {}, slots = {}) => {
  return mount(Button, {
    props,
    slots,
    global: {
      config: {
        warnHandler: () => {}, // Suppress Vue warnings in tests
      },
    },
  })
}

describe('Button.vue', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mountButton()
      
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.classes()).toContain('inline-flex')
      expect(wrapper.classes()).toContain('items-center')
    })

    it('should render slot content', () => {
      const wrapper = mountButton({}, { default: 'Click me' })
      
      expect(wrapper.text()).toBe('Click me')
    })

    it('should render as different HTML elements', () => {
      const wrapper = mountButton({ as: 'div' })
      
      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.attributes('type')).toBeUndefined()
    })

    it('should set button type attribute', () => {
      const wrapper = mountButton({ type: 'submit' })
      
      expect(wrapper.attributes('type')).toBe('submit')
    })

    it('should not set type attribute for non-button elements', () => {
      const wrapper = mountButton({ as: 'a', type: 'submit' })
      
      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('type')).toBeUndefined()
    })
  })

  describe('variants', () => {
    it('should apply primary variant classes by default', () => {
      const wrapper = mountButton()
      
      expect(wrapper.classes()).toContain('text-white')
      expect(wrapper.classes()).toContain('bg-blue-600')
      expect(wrapper.classes()).toContain('hover:bg-blue-700')
    })

    it('should apply secondary variant classes', () => {
      const wrapper = mountButton({ variant: 'secondary' })
      
      expect(wrapper.classes()).toContain('text-gray-700')
      expect(wrapper.classes()).toContain('bg-white')
      expect(wrapper.classes()).toContain('hover:bg-gray-50')
    })

    it('should apply danger variant classes', () => {
      const wrapper = mountButton({ variant: 'danger' })
      
      expect(wrapper.classes()).toContain('text-white')
      expect(wrapper.classes()).toContain('bg-red-600')
      expect(wrapper.classes()).toContain('hover:bg-red-700')
    })

    it('should apply ghost variant classes', () => {
      const wrapper = mountButton({ variant: 'ghost' })
      
      expect(wrapper.classes()).toContain('text-gray-400')
      expect(wrapper.classes()).toContain('hover:text-red-600')
      expect(wrapper.classes()).toContain('hover:bg-red-50')
    })

    it('should apply outline variant classes', () => {
      const wrapper = mountButton({ variant: 'outline' })
      
      expect(wrapper.classes()).toContain('text-blue-600')
      expect(wrapper.classes()).toContain('bg-transparent')
      expect(wrapper.classes()).toContain('hover:bg-blue-50')
    })
  })

  describe('sizes', () => {
    it('should apply medium size classes by default', () => {
      const wrapper = mountButton()
      
      expect(wrapper.classes()).toContain('px-4')
      expect(wrapper.classes()).toContain('py-2')
      expect(wrapper.classes()).toContain('text-sm')
    })

    it('should apply extra small size classes', () => {
      const wrapper = mountButton({ size: 'xs' })
      
      expect(wrapper.classes()).toContain('px-2')
      expect(wrapper.classes()).toContain('py-1')
      expect(wrapper.classes()).toContain('text-xs')
    })

    it('should apply small size classes', () => {
      const wrapper = mountButton({ size: 'sm' })
      
      expect(wrapper.classes()).toContain('px-3')
      expect(wrapper.classes()).toContain('py-1')
      expect(wrapper.classes()).toContain('text-xs')
    })

    it('should apply large size classes', () => {
      const wrapper = mountButton({ size: 'lg' })
      
      expect(wrapper.classes()).toContain('px-6')
      expect(wrapper.classes()).toContain('py-3')
      expect(wrapper.classes()).toContain('text-base')
    })

    it('should apply extra large size classes', () => {
      const wrapper = mountButton({ size: 'xl' })
      
      expect(wrapper.classes()).toContain('px-8')
      expect(wrapper.classes()).toContain('py-4')
      expect(wrapper.classes()).toContain('text-lg')
    })
  })

  describe('states', () => {
    it('should apply disabled state classes', () => {
      const wrapper = mountButton({ disabled: true })
      
      expect(wrapper.classes()).toContain('disabled:opacity-50')
      expect(wrapper.classes()).toContain('cursor-not-allowed')
      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should apply loading state classes', () => {
      const wrapper = mountButton({ loading: true })
      
      expect(wrapper.classes()).toContain('disabled:opacity-50')
      expect(wrapper.classes()).toContain('cursor-not-allowed')
      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should show loading spinner when loading', () => {
      const wrapper = mountButton({ loading: true })
      
      const spinner = wrapper.find('svg')
      expect(spinner.exists()).toBe(true)
      expect(spinner.classes()).toContain('animate-spin')
    })

    it('should not show loading spinner when not loading', () => {
      const wrapper = mountButton({ loading: false })
      
      const spinner = wrapper.find('svg')
      expect(spinner.exists()).toBe(false)
    })

    it('should apply full width classes', () => {
      const wrapper = mountButton({ fullWidth: true })
      
      expect(wrapper.classes()).toContain('w-full')
    })

    it('should not apply full width classes by default', () => {
      const wrapper = mountButton()
      
      expect(wrapper.classes()).not.toContain('w-full')
    })
  })

  describe('events', () => {
    it('should emit click event when clicked', async () => {
      const wrapper = mountButton()
      
      await wrapper.trigger('click')
      
      expect(wrapper.emitted().click).toBeTruthy()
      expect(wrapper.emitted().click).toHaveLength(1)
    })

    it('should pass event object in click emission', async () => {
      const wrapper = mountButton()
      
      await wrapper.trigger('click')
      
      const clickEvent = wrapper.emitted().click?.[0]?.[0]
      expect(clickEvent).toBeInstanceOf(Event)
    })

    it('should not emit click event when disabled', async () => {
      const wrapper = mountButton({ disabled: true })
      
      await wrapper.trigger('click')
      
      expect(wrapper.emitted().click).toBeFalsy()
    })

    it('should not emit click event when loading', async () => {
      const wrapper = mountButton({ loading: true })
      
      await wrapper.trigger('click')
      
      expect(wrapper.emitted().click).toBeFalsy()
    })

    it('should handle click events properly', async () => {
      const wrapper = mountButton()
      
      await wrapper.trigger('click')
      
      // Verify that click event was emitted (which means handleClick worked)
      expect(wrapper.emitted().click).toBeTruthy()
      expect(wrapper.emitted().click).toHaveLength(1)
    })
  })

  describe('accessibility', () => {
    it('should have proper focus ring classes', () => {
      const wrapper = mountButton()
      
      expect(wrapper.classes()).toContain('focus:outline-none')
      expect(wrapper.classes()).toContain('focus:ring-2')
      expect(wrapper.classes()).toContain('focus:ring-offset-2')
    })

    it('should have proper focus ring color for primary variant', () => {
      const wrapper = mountButton({ variant: 'primary' })
      
      expect(wrapper.classes()).toContain('focus:ring-blue-500')
    })

    it('should have proper focus ring color for danger variant', () => {
      const wrapper = mountButton({ variant: 'danger' })
      
      expect(wrapper.classes()).toContain('focus:ring-red-500')
    })

    it('should preserve native button accessibility when as="button"', () => {
      const wrapper = mountButton({ as: 'button' })
      
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('button')
    })

    it('should inherit attributes through v-bind="$attrs"', () => {
      const wrapper = mount(Button, {
        props: {},
        attrs: {
          'aria-label': 'Custom button',
          'data-testid': 'test-button',
        },
      })
      
      expect(wrapper.attributes('aria-label')).toBe('Custom button')
      expect(wrapper.attributes('data-testid')).toBe('test-button')
    })
  })

  describe('combinations', () => {
    it('should combine variant and size classes correctly', () => {
      const wrapper = mountButton({ variant: 'danger', size: 'lg' })
      
      // Variant classes
      expect(wrapper.classes()).toContain('bg-red-600')
      expect(wrapper.classes()).toContain('text-white')
      
      // Size classes
      expect(wrapper.classes()).toContain('px-6')
      expect(wrapper.classes()).toContain('py-3')
      expect(wrapper.classes()).toContain('text-base')
    })

    it('should handle multiple state modifiers', () => {
      const wrapper = mountButton({ 
        loading: true, 
        fullWidth: true, 
        variant: 'secondary',
        size: 'sm'
      })
      
      expect(wrapper.classes()).toContain('w-full')
      expect(wrapper.classes()).toContain('disabled:opacity-50')
      expect(wrapper.classes()).toContain('cursor-not-allowed')
      expect(wrapper.classes()).toContain('bg-white')
      expect(wrapper.classes()).toContain('px-3')
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should work with loading and disabled states together', () => {
      const wrapper = mountButton({ loading: true, disabled: true })
      
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('disabled:opacity-50')
      expect(wrapper.classes()).toContain('cursor-not-allowed')
      
      // Should not emit click when both are true
      wrapper.trigger('click')
      expect(wrapper.emitted().click).toBeFalsy()
    })
  })

  describe('edge cases', () => {
    it('should handle empty slot gracefully', () => {
      const wrapper = mountButton({}, { default: '' })
      
      expect(wrapper.text()).toBe('')
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle complex slot content', () => {
      const wrapper = mountButton({}, { 
        default: '<span class="test">Complex <strong>content</strong></span>' 
      })
      
      expect(wrapper.html()).toContain('<span class="test">Complex <strong>content</strong></span>')
    })

    it('should maintain classes when props change', async () => {
      const wrapper = mountButton({ variant: 'primary' })
      
      expect(wrapper.classes()).toContain('bg-blue-600')
      
      await wrapper.setProps({ variant: 'danger' })
      
      expect(wrapper.classes()).toContain('bg-red-600')
      expect(wrapper.classes()).not.toContain('bg-blue-600')
    })

    it('should handle invalid variant gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      const wrapper = mount(Button, {
        props: { variant: 'invalid' as any },
      })
      
      // Should still render and have base classes
      expect(wrapper.classes()).toContain('inline-flex')
      expect(wrapper.classes()).toContain('items-center')
    })
  })
})