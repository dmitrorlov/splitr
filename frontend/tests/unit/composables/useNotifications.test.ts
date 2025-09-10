import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotifications, useNetworkNotifications, useHostNotifications } from '@/composables/useNotifications'
import { useUIStore } from '@/stores/ui'

describe('useNotifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('useNotifications composable', () => {
    it('should show success notification', () => {
      const { showSuccess } = useNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = showSuccess('Success Title', 'Success message')
      
      expect(showSuccessSpy).toHaveBeenCalledWith('Success Title', 'Success message', undefined)
      expect(id).toBe('id1')
    })

    it('should show error notification', () => {
      const { showError } = useNotifications()
      const uiStore = useUIStore()
      const showErrorSpy = vi.spyOn(uiStore, 'showError').mockReturnValue('id2')
      
      const id = showError('Error Title', 'Error message', { duration: 5000 })
      
      expect(showErrorSpy).toHaveBeenCalledWith('Error Title', 'Error message', { duration: 5000 })
      expect(id).toBe('id2')
    })

    it('should show warning notification', () => {
      const { showWarning } = useNotifications()
      const uiStore = useUIStore()
      const showWarningSpy = vi.spyOn(uiStore, 'showWarning').mockReturnValue('id3')
      
      const id = showWarning('Warning Title')
      
      expect(showWarningSpy).toHaveBeenCalledWith('Warning Title', undefined, undefined)
      expect(id).toBe('id3')
    })

    it('should show info notification', () => {
      const { showInfo } = useNotifications()
      const uiStore = useUIStore()
      const showInfoSpy = vi.spyOn(uiStore, 'showInfo').mockReturnValue('id4')
      
      const id = showInfo('Info Title', 'Info message')
      
      expect(showInfoSpy).toHaveBeenCalledWith('Info Title', 'Info message', undefined)
      expect(id).toBe('id4')
    })

    it('should remove notification', () => {
      const { remove } = useNotifications()
      const uiStore = useUIStore()
      const removeNotificationSpy = vi.spyOn(uiStore, 'removeNotification')
      
      remove('id1')
      
      expect(removeNotificationSpy).toHaveBeenCalledWith('id1')
    })

    it('should clear all notifications', () => {
      const { clear } = useNotifications()
      const uiStore = useUIStore()
      const clearAllSpy = vi.spyOn(uiStore, 'clearAllNotifications')
      
      clear()
      
      expect(clearAllSpy).toHaveBeenCalled()
    })

    it('should clear notifications by type', () => {
      const { clearByType } = useNotifications()
      const uiStore = useUIStore()
      const clearByTypeSpy = vi.spyOn(uiStore, 'clearNotificationsByType')
      
      clearByType('error')
      
      expect(clearByTypeSpy).toHaveBeenCalledWith('error')
    })

    describe('convenience methods', () => {
      it('should show API error with Error object', () => {
        const { showApiError } = useNotifications()
        const uiStore = useUIStore()
        const showErrorSpy = vi.spyOn(uiStore, 'showError').mockReturnValue('id1')
        
        const error = new Error('API failed')
        const id = showApiError(error, 'Save Operation')
        
        expect(showErrorSpy).toHaveBeenCalledWith(
          'Save Operation Failed',
          'API failed',
          { duration: 5000 }
        )
        expect(id).toBe('id1')
      })

      it('should show API error with string', () => {
        const { showApiError } = useNotifications()
        const uiStore = useUIStore()
        const showErrorSpy = vi.spyOn(uiStore, 'showError').mockReturnValue('id1')
        
        const id = showApiError('Connection failed')
        
        expect(showErrorSpy).toHaveBeenCalledWith(
          'Operation Failed',
          'Connection failed',
          { duration: 5000 }
        )
        expect(id).toBe('id1')
      })

      it('should show API success', () => {
        const { showApiSuccess } = useNotifications()
        const uiStore = useUIStore()
        const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
        
        const id = showApiSuccess('Created', 'Network')
        
        expect(showSuccessSpy).toHaveBeenCalledWith(
          'Created Successful',
          'Network has been created successfully.',
          undefined
        )
        expect(id).toBe('id1')
      })

      it('should show API success without item name', () => {
        const { showApiSuccess } = useNotifications()
        const uiStore = useUIStore()
        const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
        
        const id = showApiSuccess('Updated')
        
        expect(showSuccessSpy).toHaveBeenCalledWith(
          'Updated Successful',
          'Item has been updated successfully.',
          undefined
        )
        expect(id).toBe('id1')
      })

      it('should show validation error', () => {
        const { showValidationError } = useNotifications()
        const uiStore = useUIStore()
        const showErrorSpy = vi.spyOn(uiStore, 'showError').mockReturnValue('id1')
        
        const id = showValidationError('Email', 'Invalid format')
        
        expect(showErrorSpy).toHaveBeenCalledWith(
          'Validation Error',
          'Email: Invalid format',
          { duration: 4000 }
        )
        expect(id).toBe('id1')
      })
    })
  })

  describe('useNetworkNotifications composable', () => {
    it('should notify network created', () => {
      const { notifyNetworkCreated } = useNetworkNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = notifyNetworkCreated('Home Network')
      
      expect(showSuccessSpy).toHaveBeenCalledWith(
        'Network Created',
        'Network "Home Network" has been created successfully.',
        undefined
      )
      expect(id).toBe('id1')
    })

    it('should notify network deleted', () => {
      const { notifyNetworkDeleted } = useNetworkNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = notifyNetworkDeleted('Home Network')
      
      expect(showSuccessSpy).toHaveBeenCalledWith(
        'Network Deleted',
        'Network "Home Network" has been deleted.',
        undefined
      )
      expect(id).toBe('id1')
    })

    it('should notify network synced', () => {
      const { notifyNetworkSynced } = useNetworkNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = notifyNetworkSynced('Home Network')
      
      expect(showSuccessSpy).toHaveBeenCalledWith(
        'Network Synced',
        'Routing rules for "Home Network" have been applied.',
        undefined
      )
      expect(id).toBe('id1')
    })

    it('should notify network reset', () => {
      const { notifyNetworkReset } = useNetworkNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = notifyNetworkReset('Home Network')
      
      expect(showSuccessSpy).toHaveBeenCalledWith(
        'Network Reset',
        'Routing rules for "Home Network" have been removed.',
        undefined
      )
      expect(id).toBe('id1')
    })

    it('should notify network error', () => {
      const { notifyNetworkError } = useNetworkNotifications()
      const uiStore = useUIStore()
      const showErrorSpy = vi.spyOn(uiStore, 'showError').mockReturnValue('id1')
      
      const error = new Error('Connection failed')
      const id = notifyNetworkError('Delete', 'Home Network', error)
      
      expect(showErrorSpy).toHaveBeenCalledWith(
        'Delete Network "Home Network" Failed',
        'Connection failed',
        { duration: 5000 }
      )
      expect(id).toBe('id1')
    })
  })

  describe('useHostNotifications composable', () => {
    it('should notify host created', () => {
      const { notifyHostCreated } = useHostNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = notifyHostCreated('192.168.1.100')
      
      expect(showSuccessSpy).toHaveBeenCalledWith(
        'Host Added',
        'Host "192.168.1.100" has been added successfully.',
        undefined
      )
      expect(id).toBe('id1')
    })

    it('should notify host deleted', () => {
      const { notifyHostDeleted } = useHostNotifications()
      const uiStore = useUIStore()
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess').mockReturnValue('id1')
      
      const id = notifyHostDeleted('192.168.1.100')
      
      expect(showSuccessSpy).toHaveBeenCalledWith(
        'Host Deleted',
        'Host "192.168.1.100" has been deleted.',
        undefined
      )
      expect(id).toBe('id1')
    })

    it('should notify host error', () => {
      const { notifyHostError } = useHostNotifications()
      const uiStore = useUIStore()
      const showErrorSpy = vi.spyOn(uiStore, 'showError').mockReturnValue('id1')
      
      const error = new Error('Host not found')
      const id = notifyHostError('Delete', '192.168.1.100', error)
      
      expect(showErrorSpy).toHaveBeenCalledWith(
        'Delete Host "192.168.1.100" Failed',
        'Host not found',
        { duration: 5000 }
      )
      expect(id).toBe('id1')
    })
  })
})