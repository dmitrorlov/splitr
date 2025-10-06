import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '@/stores/ui'

describe('useUIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useUIStore()
      
      expect(store.notifications).toEqual([])
      expect(store.globalLoading).toBe(false)
      expect(store.globalLoadingMessage).toBe('')
      expect(store.confirmDialogOpen).toBe(false)
      expect(store.confirmDialogProps.title).toBe('')
      expect(store.confirmDialogProps.type).toBe('warning')
    })
  })

  describe('computed properties', () => {
    it('should calculate notification counts correctly', () => {
      const store = useUIStore()
      
      expect(store.hasNotifications).toBe(false)
      expect(store.notificationCount).toBe(0)
      
      store.addNotification({ type: 'info', title: 'Test', message: 'Test message' })
      expect(store.hasNotifications).toBe(true)
      expect(store.notificationCount).toBe(1)
    })

    it('should filter persistent and temporary notifications', () => {
      const store = useUIStore()
      
      store.addNotification({ type: 'info', title: 'Persistent', message: 'Message', persistent: true })
      store.addNotification({ type: 'info', title: 'Temporary', message: 'Message', persistent: false })
      
      expect(store.persistentNotifications).toHaveLength(1)
      expect(store.temporaryNotifications).toHaveLength(1)
      expect(store.persistentNotifications[0].title).toBe('Persistent')
      expect(store.temporaryNotifications[0].title).toBe('Temporary')
    })

    it('should detect error and success notifications', () => {
      const store = useUIStore()
      
      expect(store.hasErrorNotifications).toBe(false)
      expect(store.hasSuccessNotifications).toBe(false)
      
      store.addNotification({ type: 'error', title: 'Error', message: 'Error message' })
      expect(store.hasErrorNotifications).toBe(true)
      
      store.addNotification({ type: 'success', title: 'Success', message: 'Success message' })
      expect(store.hasSuccessNotifications).toBe(true)
    })
  })

  describe('notification actions', () => {
    it('should add notification with generated ID and timestamp', () => {
      const store = useUIStore()
      
      const id = store.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      })
      
      expect(id).toBeTruthy()
      expect(store.notifications).toHaveLength(1)
      
      const notification = store.notifications[0]
      expect(notification.id).toBe(id)
      expect(notification.type).toBe('info')
      expect(notification.title).toBe('Test')
      expect(notification.message).toBe('Test message')
      expect(notification.timestamp).toBeInstanceOf(Date)
    })

    it('should set default duration based on notification type', () => {
      const store = useUIStore()
      
      store.addNotification({ type: 'error', title: 'Error', message: 'Error message' })
      store.addNotification({ type: 'success', title: 'Success', message: 'Success message' })
      
      expect(store.notifications[0].duration).toBe(5000) // Error duration
      expect(store.notifications[1].duration).toBe(3000) // Success duration
    })

    it('should auto-remove non-persistent notifications', () => {
      const store = useUIStore()
      
      store.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        duration: 1000,
      })
      
      expect(store.notifications).toHaveLength(1)
      
      vi.advanceTimersByTime(1000)
      expect(store.notifications).toHaveLength(0)
    })

    it('should not auto-remove persistent notifications', () => {
      const store = useUIStore()
      
      store.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        persistent: true,
        duration: 1000,
      })
      
      expect(store.notifications).toHaveLength(1)
      
      vi.advanceTimersByTime(1000)
      expect(store.notifications).toHaveLength(1)
    })

    it('should remove notification by ID', () => {
      const store = useUIStore()
      
      const id1 = store.addNotification({ type: 'info', title: 'Test 1', message: 'Message 1' })
      const id2 = store.addNotification({ type: 'info', title: 'Test 2', message: 'Message 2' })
      
      expect(store.notifications).toHaveLength(2)
      
      store.removeNotification(id1)
      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].id).toBe(id2)
    })

    it('should clear all notifications', () => {
      const store = useUIStore()
      
      store.addNotification({ type: 'info', title: 'Test 1', message: 'Message 1' })
      store.addNotification({ type: 'error', title: 'Test 2', message: 'Message 2' })
      
      expect(store.notifications).toHaveLength(2)
      
      store.clearAllNotifications()
      expect(store.notifications).toHaveLength(0)
    })

    it('should clear notifications by type', () => {
      const store = useUIStore()
      
      store.addNotification({ type: 'info', title: 'Info', message: 'Info message' })
      store.addNotification({ type: 'error', title: 'Error', message: 'Error message' })
      store.addNotification({ type: 'success', title: 'Success', message: 'Success message' })
      
      expect(store.notifications).toHaveLength(3)
      
      store.clearNotificationsByType('error')
      expect(store.notifications).toHaveLength(2)
      expect(store.notifications.every(n => n.type !== 'error')).toBe(true)
    })

    it('should find notification by ID', () => {
      const store = useUIStore()
      
      const id = store.addNotification({ type: 'info', title: 'Test', message: 'Test message' })
      
      const notification = store.getNotificationById(id)
      expect(notification).toBeTruthy()
      expect(notification?.id).toBe(id)
      
      const nonExistent = store.getNotificationById('non-existent')
      expect(nonExistent).toBeUndefined()
    })

    describe('convenience methods', () => {
      it('should create success notification', () => {
        const store = useUIStore()
        
        const id = store.showSuccess('Success', 'Operation completed')
        const notification = store.getNotificationById(id)
        
        expect(notification?.type).toBe('success')
        expect(notification?.title).toBe('Success')
        expect(notification?.message).toBe('Operation completed')
      })

      it('should create error notification', () => {
        const store = useUIStore()
        
        const id = store.showError('Error', 'Something went wrong')
        const notification = store.getNotificationById(id)
        
        expect(notification?.type).toBe('error')
        expect(notification?.title).toBe('Error')
        expect(notification?.message).toBe('Something went wrong')
      })

      it('should create warning notification', () => {
        const store = useUIStore()
        
        const id = store.showWarning('Warning', 'Be careful')
        const notification = store.getNotificationById(id)
        
        expect(notification?.type).toBe('warning')
        expect(notification?.title).toBe('Warning')
        expect(notification?.message).toBe('Be careful')
      })

      it('should create info notification', () => {
        const store = useUIStore()
        
        const id = store.showInfo('Info', 'Just so you know')
        const notification = store.getNotificationById(id)
        
        expect(notification?.type).toBe('info')
        expect(notification?.title).toBe('Info')
        expect(notification?.message).toBe('Just so you know')
      })
    })
  })

  describe('global loading actions', () => {
    it('should set global loading state', () => {
      const store = useUIStore()
      
      store.setGlobalLoading(true, 'Processing...')
      expect(store.globalLoading).toBe(true)
      expect(store.globalLoadingMessage).toBe('Processing...')
      
      store.setGlobalLoading(false)
      expect(store.globalLoading).toBe(false)
      expect(store.globalLoadingMessage).toBe('')
    })

    it('should show global loading with default message', () => {
      const store = useUIStore()
      
      store.showGlobalLoading()
      expect(store.globalLoading).toBe(true)
      expect(store.globalLoadingMessage).toBe('Loading...')
    })

    it('should show global loading with custom message', () => {
      const store = useUIStore()
      
      store.showGlobalLoading('Saving changes...')
      expect(store.globalLoading).toBe(true)
      expect(store.globalLoadingMessage).toBe('Saving changes...')
    })

    it('should hide global loading', () => {
      const store = useUIStore()
      
      store.showGlobalLoading('Test')
      store.hideGlobalLoading()
      
      expect(store.globalLoading).toBe(false)
      expect(store.globalLoadingMessage).toBe('')
    })
  })

  describe('confirm dialog actions', () => {
    it('should show confirm dialog and return promise', async () => {
      const store = useUIStore()
      
      const promise = store.showConfirmDialog({
        title: 'Delete Item',
        message: 'Are you sure?',
        type: 'danger',
      })
      
      expect(store.confirmDialogOpen).toBe(true)
      expect(store.confirmDialogProps.title).toBe('Delete Item')
      expect(store.confirmDialogProps.message).toBe('Are you sure?')
      expect(store.confirmDialogProps.type).toBe('danger')
      
      // Confirm the dialog
      store.confirmDialog()
      
      const result = await promise
      expect(result).toBe(true)
      expect(store.confirmDialogOpen).toBe(false)
    })

    it('should handle dialog cancellation', async () => {
      const store = useUIStore()
      
      const promise = store.showConfirmDialog({
        title: 'Delete Item',
        message: 'Are you sure?',
      })
      
      // Cancel the dialog
      store.cancelDialog()
      
      const result = await promise
      expect(result).toBe(false)
      expect(store.confirmDialogOpen).toBe(false)
    })

    it('should merge dialog props with defaults', () => {
      const store = useUIStore()
      
      store.showConfirmDialog({
        title: 'Custom Title',
      })
      
      expect(store.confirmDialogProps.title).toBe('Custom Title')
      expect(store.confirmDialogProps.confirmText).toBe('Confirm') // Default value
      expect(store.confirmDialogProps.cancelText).toBe('Cancel') // Default value
      expect(store.confirmDialogProps.type).toBe('warning') // Default value
    })
  })
})