// UI store - manages global UI state like notifications, modals, etc.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Notification, NotificationType } from '@/types'

export const useUIStore = defineStore('ui', () => {
  // State
  const notifications = ref<Notification[]>([])
  const globalLoading = ref(false)
  const globalLoadingMessage = ref('')

  // Modal state (for global modals)
  const confirmDialogOpen = ref(false)
  const confirmDialogProps = ref({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning' as 'warning' | 'danger' | 'info',
  })
  const confirmDialogResolver = ref<((value: boolean) => void) | null>(null)

  // Getters
  const hasNotifications = computed(() => notifications.value.length > 0)
  const notificationCount = computed(() => notifications.value.length)

  const persistentNotifications = computed(() => notifications.value.filter(n => n.persistent))

  const temporaryNotifications = computed(() => notifications.value.filter(n => !n.persistent))

  // Actions - Notifications
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? (notification.type === 'error' ? 5000 : 3000),
    }

    notifications.value.push(newNotification)

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const clearNotificationsByType = (type: NotificationType) => {
    notifications.value = notifications.value.filter(n => n.type !== type)
  }

  // Convenience methods for different notification types
  const showSuccess = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message: message || '',
      ...options,
    })
  }

  const showError = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message: message || '',
      ...options,
    })
  }

  const showWarning = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message: message || '',
      ...options,
    })
  }

  const showInfo = (title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message: message || '',
      ...options,
    })
  }

  // Actions - Global Loading
  const setGlobalLoading = (loading: boolean, message = '') => {
    globalLoading.value = loading
    globalLoadingMessage.value = message
  }

  const showGlobalLoading = (message = 'Loading...') => {
    setGlobalLoading(true, message)
  }

  const hideGlobalLoading = () => {
    setGlobalLoading(false, '')
  }

  // Actions - Confirm Dialog
  const showConfirmDialog = (props: Partial<typeof confirmDialogProps.value>): Promise<boolean> => {
    return new Promise(resolve => {
      confirmDialogProps.value = {
        ...confirmDialogProps.value,
        ...props,
      }
      confirmDialogResolver.value = resolve
      confirmDialogOpen.value = true
    })
  }

  const resolveConfirmDialog = (result: boolean) => {
    confirmDialogOpen.value = false
    confirmDialogResolver.value?.(result)
    confirmDialogResolver.value = null
  }

  const confirmDialog = () => resolveConfirmDialog(true)
  const cancelDialog = () => resolveConfirmDialog(false)

  // Utility methods
  const getNotificationById = (id: string): Notification | undefined => {
    return notifications.value.find(n => n.id === id)
  }

  const hasErrorNotifications = computed(() => notifications.value.some(n => n.type === 'error'))

  const hasSuccessNotifications = computed(() =>
    notifications.value.some(n => n.type === 'success')
  )

  return {
    // State
    notifications,
    globalLoading,
    globalLoadingMessage,
    confirmDialogOpen,
    confirmDialogProps,

    // Getters
    hasNotifications,
    notificationCount,
    persistentNotifications,
    temporaryNotifications,
    hasErrorNotifications,
    hasSuccessNotifications,

    // Notification Actions
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearNotificationsByType,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    getNotificationById,

    // Global Loading Actions
    setGlobalLoading,
    showGlobalLoading,
    hideGlobalLoading,

    // Confirm Dialog Actions
    showConfirmDialog,
    confirmDialog,
    cancelDialog,
  }
})
