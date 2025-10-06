import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

describe('ConfirmDialog.vue', () => {
  const defaultProps = {
    visible: true,
    message: 'Are you sure you want to proceed?',
  }

  const mountConfirmDialog = (props = {}) => {
    return mount(ConfirmDialog, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Teleport: false,
        },
      },
    })
  }

  beforeEach(() => {
    // Clear any existing modal content
    document.body.innerHTML = ''
  })

  describe('Basic Rendering', () => {
    it('should not render when visible is false', () => {
      mountConfirmDialog({ visible: false })
      expect(document.querySelector('[role="dialog"]')).toBe(null)
    })

    it('should render when visible is true', () => {
      mountConfirmDialog({ visible: true })
      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog).not.toBe(null)
      expect(dialog?.getAttribute('aria-modal')).toBe('true')
    })

    it('should display the message', () => {
      const message = 'Custom confirmation message'
      mountConfirmDialog({ message })
      expect(document.body.textContent).toContain(message)
    })

    it('should display the default title', () => {
      mountConfirmDialog()
      expect(document.body.textContent).toContain('Confirm Action')
    })

    it('should display custom title', () => {
      const title = 'Delete Item'
      mountConfirmDialog({ title })
      expect(document.body.textContent).toContain(title)
    })
  })

  describe('Button Text', () => {
    it('should display default button texts', () => {
      mountConfirmDialog()
      expect(document.body.textContent).toContain('Confirm')
      expect(document.body.textContent).toContain('Cancel')
    })

    it('should display custom button texts', () => {
      mountConfirmDialog({
        confirmText: 'Delete',
        cancelText: 'Keep',
      })
      expect(document.body.textContent).toContain('Delete')
      expect(document.body.textContent).toContain('Keep')
    })
  })

  describe('Dialog Types', () => {
    it('should apply warning styles by default', () => {
      mountConfirmDialog()
      const iconContainer = document.querySelector('.bg-yellow-100')
      const icon = document.querySelector('.text-yellow-600')
      const confirmButton = document.querySelector('.bg-yellow-600')
      
      expect(iconContainer).not.toBe(null)
      expect(icon).not.toBe(null)
      expect(confirmButton).not.toBe(null)
    })

    it('should apply danger styles when type is danger', () => {
      mountConfirmDialog({ type: 'danger' })
      const iconContainer = document.querySelector('.bg-red-100')
      const icon = document.querySelector('.text-red-600')
      const confirmButton = document.querySelector('.bg-red-600')
      
      expect(iconContainer).not.toBe(null)
      expect(icon).not.toBe(null)
      expect(confirmButton).not.toBe(null)
    })

    it('should apply info styles when type is info', () => {
      mountConfirmDialog({ type: 'info' })
      const iconContainer = document.querySelector('.bg-blue-100')
      const icon = document.querySelector('.text-blue-600')
      const confirmButton = document.querySelector('.bg-blue-600')
      
      expect(iconContainer).not.toBe(null)
      expect(icon).not.toBe(null)
      expect(confirmButton).not.toBe(null)
    })
  })

  describe('Event Emissions', () => {
    it('should emit confirm event when confirm button is clicked', async () => {
      const wrapper = mountConfirmDialog()
      const confirmButton = document.querySelector('.bg-yellow-600') as HTMLButtonElement
      
      expect(confirmButton).not.toBe(null)
      confirmButton.click()
      await nextTick()
      
      expect(wrapper.emitted().confirm).toBeTruthy()
      expect(wrapper.emitted().confirm).toHaveLength(1)
    })

    it('should emit cancel event when cancel button is clicked', async () => {
      const wrapper = mountConfirmDialog()
      const buttons = document.querySelectorAll('button')
      const cancelButton = Array.from(buttons).find(btn => 
        btn.textContent?.includes('Cancel')
      ) as HTMLButtonElement
      
      expect(cancelButton).not.toBe(null)
      cancelButton.click()
      await nextTick()
      
      expect(wrapper.emitted().cancel).toBeTruthy()
      expect(wrapper.emitted().cancel).toHaveLength(1)
    })

    it('should emit cancel event when backdrop is clicked', async () => {
      const wrapper = mountConfirmDialog()
      const backdrop = document.querySelector('.bg-black') as HTMLElement
      
      expect(backdrop).not.toBe(null)
      backdrop.click()
      await nextTick()
      
      expect(wrapper.emitted().cancel).toBeTruthy()
      expect(wrapper.emitted().cancel).toHaveLength(1)
    })
  })

  describe('Keyboard Handling', () => {
    it('should emit cancel when ESC key is pressed', async () => {
      const wrapper = mountConfirmDialog()
      const dialogContainer = document.querySelector('.fixed.inset-0.z-50') as HTMLElement
      
      expect(dialogContainer).not.toBe(null)
      
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      dialogContainer.dispatchEvent(escEvent)
      await nextTick()
      
      expect(wrapper.emitted().cancel).toBeTruthy()
      expect(wrapper.emitted().cancel).toHaveLength(1)
    })

    it('should emit confirm when Enter key is pressed', async () => {
      const wrapper = mountConfirmDialog()
      const dialogContainer = document.querySelector('.fixed.inset-0.z-50') as HTMLElement
      
      expect(dialogContainer).not.toBe(null)
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      dialogContainer.dispatchEvent(enterEvent)
      await nextTick()
      
      expect(wrapper.emitted().confirm).toBeTruthy()
      expect(wrapper.emitted().confirm).toHaveLength(1)
    })

    it('should not emit events for other keys', async () => {
      const wrapper = mountConfirmDialog()
      const dialogContainer = document.querySelector('.fixed.inset-0.z-50') as HTMLElement
      
      expect(dialogContainer).not.toBe(null)
      
      const spaceEvent = new KeyboardEvent('keydown', { key: 'Space', bubbles: true })
      dialogContainer.dispatchEvent(spaceEvent)
      await nextTick()
      
      expect(wrapper.emitted().confirm).toBeFalsy()
      expect(wrapper.emitted().cancel).toBeFalsy()
    })
  })

  describe('Focus Management', () => {
    it('should focus confirm button when dialog becomes visible', async () => {
      const focusSpy = vi.spyOn(HTMLButtonElement.prototype, 'focus')
      
      // Mount with visible false initially
      const wrapper = mountConfirmDialog({ visible: false })
      
      // Change to visible
      await wrapper.setProps({ visible: true })
      await nextTick()
      
      expect(focusSpy).toHaveBeenCalled()
      
      focusSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      mountConfirmDialog()
      const dialog = document.querySelector('[role="dialog"]')
      
      expect(dialog).not.toBe(null)
      expect(dialog?.getAttribute('role')).toBe('dialog')
      expect(dialog?.getAttribute('aria-modal')).toBe('true')
    })

    it('should have icon with proper accessibility', () => {
      mountConfirmDialog()
      const icon = document.querySelector('svg')
      
      expect(icon).not.toBe(null)
      expect(icon?.classList.contains('w-6')).toBe(true)
      expect(icon?.classList.contains('h-6')).toBe(true)
    })
  })

  describe('Component Structure', () => {
    it('should render with teleport to body', () => {
      mountConfirmDialog()
      // Since we're using Teleport to body, the dialog should be in document.body
      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog).not.toBe(null)
    })

    it('should have proper CSS classes for layout', () => {
      mountConfirmDialog()
      const backdrop = document.querySelector('.fixed.inset-0.bg-black')
      const dialog = document.querySelector('.relative.bg-white.rounded-lg')
      
      expect(backdrop).not.toBe(null)
      expect(dialog).not.toBe(null)
    })

    it('should structure content correctly', () => {
      mountConfirmDialog({
        title: 'Test Title',
        message: 'Test Message',
      })
      
      // Should have icon container
      const iconContainer = document.querySelector('.w-10.h-10.rounded-full')
      expect(iconContainer).not.toBe(null)
      
      // Should have title
      const title = document.querySelector('h3')
      expect(title?.textContent).toBe('Test Title')
      
      // Should have message
      const message = document.querySelector('p.text-sm.text-gray-600')
      expect(message?.textContent).toBe('Test Message')
      
      // Should have button container
      const buttonContainer = document.querySelector('.flex.justify-end.space-x-3')
      expect(buttonContainer).not.toBe(null)
    })
  })

  describe('Multiple Type Scenarios', () => {
    it('should handle warning type with custom texts', () => {
      mountConfirmDialog({
        type: 'warning',
        title: 'Warning Title',
        message: 'Warning message',
        confirmText: 'Proceed',
        cancelText: 'Abort',
      })
      
      expect(document.body.textContent).toContain('Warning Title')
      expect(document.body.textContent).toContain('Warning message')
      expect(document.body.textContent).toContain('Proceed')
      expect(document.body.textContent).toContain('Abort')
      
      const confirmButton = document.querySelector('.bg-yellow-600')
      expect(confirmButton).not.toBe(null)
    })

    it('should handle danger type with custom texts', () => {
      mountConfirmDialog({
        type: 'danger',
        title: 'Delete Item',
        message: 'This action cannot be undone',
        confirmText: 'Delete',
        cancelText: 'Keep',
      })
      
      expect(document.body.textContent).toContain('Delete Item')
      expect(document.body.textContent).toContain('This action cannot be undone')
      expect(document.body.textContent).toContain('Delete')
      expect(document.body.textContent).toContain('Keep')
      
      const confirmButton = document.querySelector('.bg-red-600')
      expect(confirmButton).not.toBe(null)
    })

    it('should handle info type with custom texts', () => {
      mountConfirmDialog({
        type: 'info',
        title: 'Information',
        message: 'Please confirm this action',
        confirmText: 'OK',
        cancelText: 'Cancel',
      })
      
      expect(document.body.textContent).toContain('Information')
      expect(document.body.textContent).toContain('Please confirm this action')
      expect(document.body.textContent).toContain('OK')
      expect(document.body.textContent).toContain('Cancel')
      
      const confirmButton = document.querySelector('.bg-blue-600')
      expect(confirmButton).not.toBe(null)
    })
  })
})