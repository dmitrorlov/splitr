import { mount } from '@vue/test-utils'
import Modal from '@/components/ui/Modal.vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// Mock HTMLElement.focus for testing
Object.defineProperty(HTMLElement.prototype, 'focus', {
  value: vi.fn(),
  writable: true,
})

describe('Modal.vue', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const mountModal = (props = {}, slots = {}) => {
    return mount(Modal, {
      props: { modelValue: false, ...props },
      slots,
      attachTo: document.body,
    })
  }

  describe('basic functionality', () => {
    it('should not render when modelValue is false', () => {
      mountModal({ modelValue: false })
      expect(document.querySelector('[role="dialog"]')).toBe(null)
    })

    it('should render when modelValue is true', () => {
      mountModal({ modelValue: true })
      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog).not.toBe(null)
      expect(dialog?.getAttribute('aria-modal')).toBe('true')
    })

    it('should render title', () => {
      mountModal({ modelValue: true, title: 'Test Modal' })
      expect(document.body.textContent).toContain('Test Modal')
    })

    it('should render slot content', () => {
      mountModal({ modelValue: true }, { default: 'Modal content' })
      expect(document.body.textContent).toContain('Modal content')
    })
  })

  describe('sizes', () => {
    it('should apply size classes', () => {
      mountModal({ modelValue: true, size: 'lg' })
      const modal = document.querySelector('[role="dialog"]')
      expect(modal?.classList.contains('max-w-lg')).toBe(true)
    })
  })

  describe('close functionality', () => {
    it('should show close button with title', () => {
      mountModal({ modelValue: true, title: 'Test' })
      expect(document.querySelector('button svg')).not.toBe(null)
    })

    it('should show close button with header slot', () => {
      mountModal({ modelValue: true }, { header: 'Header' })
      expect(document.querySelector('button svg')).not.toBe(null)
    })

    it('should hide close button when closable is false', () => {
      mountModal({ modelValue: true, title: 'Test', closable: false })
      expect(document.querySelector('button svg')).toBe(null)
    })

    it('should emit events when close button clicked', async () => {
      const wrapper = mountModal({ modelValue: true, title: 'Test' })
      document.querySelector('button')?.click()
      await nextTick()
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    })
  })

  describe('backdrop', () => {
    it('should close on backdrop click', async () => {
      const wrapper = mountModal({ modelValue: true })
      document.querySelector('.bg-black')?.dispatchEvent(new Event('click'))
      await nextTick()
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    })

    it('should not close when persistent', async () => {
      const wrapper = mountModal({ modelValue: true, persistent: true })
      document.querySelector('.bg-black')?.dispatchEvent(new Event('click'))
      await nextTick()
      expect(wrapper.emitted()['update:modelValue']).toBeFalsy()
    })
  })

  describe('keyboard', () => {
    it('should close on ESC key', async () => {
      const wrapper = mountModal({ modelValue: true })
      const container = document.querySelector('.fixed.inset-0.z-50')
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    })

    it('should not close on ESC when persistent', async () => {
      const wrapper = mountModal({ modelValue: true, persistent: true })
      const container = document.querySelector('.fixed.inset-0.z-50')
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(wrapper.emitted()['update:modelValue']).toBeFalsy()
    })
  })

  describe('events', () => {
    it('should emit opened/closed events', async () => {
      const wrapper = mountModal({ modelValue: false })
      await wrapper.setProps({ modelValue: true })
      await nextTick()
      expect(wrapper.emitted().opened).toBeTruthy()
      
      await wrapper.setProps({ modelValue: false })
      expect(wrapper.emitted().closed).toBeTruthy()
    })
  })

  describe('exposed methods', () => {
    it('should expose show/hide methods', () => {
      const wrapper = mountModal()
      expect(typeof wrapper.vm.show).toBe('function')
      expect(typeof wrapper.vm.hide).toBe('function')
    })

    it('should emit events when methods called', async () => {
      const wrapper = mountModal({ modelValue: false })
      await wrapper.vm.show()
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted().opened).toBeTruthy()
      
      wrapper.vm.hide()
      expect(wrapper.emitted().close).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      mountModal({ modelValue: true })
      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog?.getAttribute('aria-modal')).toBe('true')
      expect(dialog?.getAttribute('tabindex')).toBe('-1')
    })

    it('should focus modal when opened', async () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
      const wrapper = mountModal({ modelValue: false })
      await wrapper.setProps({ modelValue: true })
      await nextTick()
      expect(focusSpy).toHaveBeenCalled()
    })
  })
})