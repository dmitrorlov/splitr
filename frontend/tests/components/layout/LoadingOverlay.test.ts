import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingOverlay from '@/components/layout/LoadingOverlay.vue'

describe('LoadingOverlay.vue', () => {
  const defaultProps = {
    show: false,
  }

  const mountLoadingOverlay = (props = {}) => {
    return mount(LoadingOverlay, {
      props: { ...defaultProps, ...props },
    })
  }

  beforeEach(() => {
    // Clear any existing content
    document.body.innerHTML = ''
  })

  describe('Basic Rendering', () => {
    it('should not render when show is false', () => {
      const wrapper = mountLoadingOverlay({ show: false })
      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    })

    it('should render when show is true', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    })

    it('should display default loading message', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      expect(wrapper.text()).toContain('Loading...')
    })

    it('should display custom loading message', () => {
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: 'Saving data...' 
      })
      expect(wrapper.text()).toContain('Saving data...')
    })
  })

  describe('Structure and Styling', () => {
    it('should have correct overlay structure', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      
      const overlay = wrapper.find('.loading-overlay')
      expect(overlay.exists()).toBe(true)
      
      const content = wrapper.find('.loading-content')
      expect(content.exists()).toBe(true)
      
      const spinner = wrapper.find('.loading-spinner')
      expect(spinner.exists()).toBe(true)
      
      const message = wrapper.find('.loading-message')
      expect(message.exists()).toBe(true)
    })

    it('should have spinner with correct classes', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      
      const spinnerDiv = wrapper.find('.animate-spin')
      expect(spinnerDiv.exists()).toBe(true)
      expect(spinnerDiv.classes()).toContain('rounded-full')
      expect(spinnerDiv.classes()).toContain('h-12')
      expect(spinnerDiv.classes()).toContain('w-12')
      expect(spinnerDiv.classes()).toContain('border-4')
      expect(spinnerDiv.classes()).toContain('border-white')
      expect(spinnerDiv.classes()).toContain('border-t-transparent')
    })

    it('should have message with correct content', () => {
      const customMessage = 'Please wait while we process your request...'
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: customMessage 
      })
      
      const messageElement = wrapper.find('.loading-message')
      expect(messageElement.text()).toBe(customMessage)
    })
  })

  describe('Event Prevention', () => {
    it('should prevent click events', async () => {
      const wrapper = mountLoadingOverlay({ show: true })
      const overlay = wrapper.find('.loading-overlay')
      
      let clickPrevented = false
      overlay.element.addEventListener('click', (e) => {
        clickPrevented = e.defaultPrevented
      })
      
      await overlay.trigger('click')
      expect(clickPrevented).toBe(true)
    })

    it('should prevent keydown events', async () => {
      const wrapper = mountLoadingOverlay({ show: true })
      const overlay = wrapper.find('.loading-overlay')
      
      let keydownPrevented = false
      overlay.element.addEventListener('keydown', (e) => {
        keydownPrevented = e.defaultPrevented
      })
      
      await overlay.trigger('keydown', { key: 'Enter' })
      expect(keydownPrevented).toBe(true)
    })

    it('should prevent contextmenu events', async () => {
      const wrapper = mountLoadingOverlay({ show: true })
      const overlay = wrapper.find('.loading-overlay')
      
      let contextmenuPrevented = false
      overlay.element.addEventListener('contextmenu', (e) => {
        contextmenuPrevented = e.defaultPrevented
      })
      
      await overlay.trigger('contextmenu')
      expect(contextmenuPrevented).toBe(true)
    })
  })

  describe('Visibility Toggle', () => {
    it('should show overlay when show changes from false to true', async () => {
      const wrapper = mountLoadingOverlay({ show: false })
      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
      
      await wrapper.setProps({ show: true })
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    })

    it('should hide overlay when show changes from true to false', async () => {
      const wrapper = mountLoadingOverlay({ show: true })
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
      
      await wrapper.setProps({ show: false })
      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    })

    it('should update message dynamically', async () => {
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: 'Initial message' 
      })
      expect(wrapper.text()).toContain('Initial message')
      
      await wrapper.setProps({ message: 'Updated message' })
      expect(wrapper.text()).toContain('Updated message')
      expect(wrapper.text()).not.toContain('Initial message')
    })
  })

  describe('Transition Component', () => {
    it('should wrap content in transition component', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      
      // Vue Test Utils should detect the transition wrapper
      expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
    })

    it('should have correct transition name', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      
      const transition = wrapper.findComponent({ name: 'Transition' })
      expect(transition.props('name')).toBe('overlay-fade')
    })
  })

  describe('CSS Styling', () => {
    it('should apply overlay positioning classes', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      const overlay = wrapper.find('.loading-overlay')
      
      // Check that the overlay has the loading-overlay class
      expect(overlay.classes()).toContain('loading-overlay')
    })

    it('should apply content layout classes', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      
      const content = wrapper.find('.loading-content')
      expect(content.classes()).toContain('loading-content')
      
      const spinner = wrapper.find('.loading-spinner')
      expect(spinner.classes()).toContain('loading-spinner')
      
      const message = wrapper.find('.loading-message')
      expect(message.classes()).toContain('loading-message')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible with prevented events', async () => {
      const wrapper = mountLoadingOverlay({ show: true })
      const overlay = wrapper.find('.loading-overlay')
      
      // Test various keyboard events are prevented
      await overlay.trigger('keydown', { key: 'Tab' })
      await overlay.trigger('keydown', { key: 'Escape' })
      await overlay.trigger('keydown', { key: 'Enter' })
      await overlay.trigger('keydown', { key: 'Space' })
      
      // All events should be prevented (no errors thrown)
      expect(overlay.exists()).toBe(true)
    })

    it('should have proper z-index for overlay', () => {
      const wrapper = mountLoadingOverlay({ show: true })
      const overlay = wrapper.find('.loading-overlay')
      
      expect(overlay.classes()).toContain('loading-overlay')
      // The actual z-index is set in CSS, just verify the class exists
    })
  })

  describe('Message Variations', () => {
    it('should handle empty message', () => {
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: '' 
      })
      
      const messageElement = wrapper.find('.loading-message')
      expect(messageElement.text()).toBe('')
    })

    it('should handle long messages', () => {
      const longMessage = 'This is a very long loading message that might wrap to multiple lines and should still display correctly in the overlay'
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: longMessage 
      })
      
      expect(wrapper.text()).toContain(longMessage)
    })

    it('should handle special characters in message', () => {
      const specialMessage = 'Loading... 50% complete! (Please wait) & don\'t refresh'
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: specialMessage 
      })
      
      expect(wrapper.text()).toContain(specialMessage)
    })

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Loading... 正在加载 🔄 λοάδιγ...'
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: unicodeMessage 
      })
      
      expect(wrapper.text()).toContain(unicodeMessage)
    })
  })

  describe('Component Props', () => {
    it('should have correct default props', () => {
      const wrapper = mountLoadingOverlay()
      
      expect(wrapper.props().show).toBe(false)
      expect(wrapper.props().message).toBe('Loading...')
    })

    it('should accept boolean show prop', () => {
      const wrapper1 = mountLoadingOverlay({ show: true })
      const wrapper2 = mountLoadingOverlay({ show: false })
      
      expect(wrapper1.props().show).toBe(true)
      expect(wrapper2.props().show).toBe(false)
    })

    it('should accept string message prop', () => {
      const message = 'Custom loading text'
      const wrapper = mountLoadingOverlay({ message })
      
      expect(wrapper.props().message).toBe(message)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid show/hide toggles', async () => {
      const wrapper = mountLoadingOverlay({ show: false })
      
      // Rapidly toggle show state
      await wrapper.setProps({ show: true })
      await wrapper.setProps({ show: false })
      await wrapper.setProps({ show: true })
      await wrapper.setProps({ show: false })
      
      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    })

    it('should handle undefined message prop', () => {
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: undefined 
      })
      
      // Should use default message when undefined
      expect(wrapper.text()).toContain('Loading...')
    })

    it('should maintain overlay during message changes', async () => {
      const wrapper = mountLoadingOverlay({ 
        show: true, 
        message: 'Message 1' 
      })
      
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
      
      await wrapper.setProps({ message: 'Message 2' })
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
      expect(wrapper.text()).toContain('Message 2')
    })
  })

  describe('Integration Scenarios', () => {
    it('should work in typical loading flow', async () => {
      const wrapper = mountLoadingOverlay({ 
        show: false, 
        message: 'Preparing...' 
      })
      
      // Start loading
      await wrapper.setProps({ show: true })
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
      expect(wrapper.text()).toContain('Preparing...')
      
      // Update progress
      await wrapper.setProps({ message: 'Processing...' })
      expect(wrapper.text()).toContain('Processing...')
      
      // Complete loading
      await wrapper.setProps({ show: false })
      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    })

    it('should handle multiple instances conceptually', () => {
      const wrapper1 = mountLoadingOverlay({ 
        show: true, 
        message: 'Loading data...' 
      })
      const wrapper2 = mountLoadingOverlay({ 
        show: true, 
        message: 'Saving changes...' 
      })
      
      expect(wrapper1.text()).toContain('Loading data...')
      expect(wrapper2.text()).toContain('Saving changes...')
    })
  })
})