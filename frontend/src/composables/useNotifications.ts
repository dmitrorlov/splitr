// useNotifications composable - provides easy access to notification system
import { useUIStore } from '@/stores/ui'
import type { Notification, NotificationType } from '@/types'

export interface UseNotificationsReturn {
  // Show notifications
  showSuccess: (title: string, message?: string, options?: Partial<Notification>) => string
  showError: (title: string, message?: string, options?: Partial<Notification>) => string
  showWarning: (title: string, message?: string, options?: Partial<Notification>) => string
  showInfo: (title: string, message?: string, options?: Partial<Notification>) => string

  // Manage notifications
  remove: (id: string) => void
  clear: () => void
  clearByType: (type: NotificationType) => void

  // Convenience methods for common scenarios
  showApiError: (error: Error | string, context?: string) => string
  showApiSuccess: (action: string, item?: string) => string
  showValidationError: (field: string, message: string) => string
}

export function useNotifications(): UseNotificationsReturn {
  const uiStore = useUIStore()

  const showSuccess = (title: string, message?: string, options?: Partial<Notification>) => {
    return uiStore.showSuccess(title, message, options)
  }

  const showError = (title: string, message?: string, options?: Partial<Notification>) => {
    return uiStore.showError(title, message, options)
  }

  const showWarning = (title: string, message?: string, options?: Partial<Notification>) => {
    return uiStore.showWarning(title, message, options)
  }

  const showInfo = (title: string, message?: string, options?: Partial<Notification>) => {
    return uiStore.showInfo(title, message, options)
  }

  const remove = (id: string) => {
    uiStore.removeNotification(id)
  }

  const clear = () => {
    uiStore.clearAllNotifications()
  }

  const clearByType = (type: NotificationType) => {
    uiStore.clearNotificationsByType(type)
  }

  // Convenience methods for common scenarios
  const showApiError = (error: Error | string, context?: string) => {
    const message = error instanceof Error ? error.message : error
    const title = context ? `${context} Failed` : 'Operation Failed'
    return showError(title, message, { duration: 5000 })
  }

  const showApiSuccess = (action: string, item?: string) => {
    return showSuccess(
      `${action} Successful`,
      `${item ? item : 'Item'} has been ${action.toLowerCase()} successfully.`
    )
  }

  const showValidationError = (field: string, message: string) => {
    return showError(`Validation Error`, `${field}: ${message}`, { duration: 4000 })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    remove,
    clear,
    clearByType,
    showApiError,
    showApiSuccess,
    showValidationError,
  }
}

// Specialized notifications for specific domains
export function useNetworkNotifications() {
  const notifications = useNotifications()

  const notifyNetworkCreated = (networkName: string) => {
    return notifications.showSuccess(
      'Network Created',
      `Network "${networkName}" has been created successfully.`
    )
  }

  const notifyNetworkDeleted = (networkName: string) => {
    return notifications.showSuccess(
      'Network Deleted',
      `Network "${networkName}" has been deleted.`
    )
  }

  const notifyNetworkSynced = (networkName: string) => {
    return notifications.showSuccess(
      'Network Synced',
      `Routing rules for "${networkName}" have been applied.`
    )
  }

  const notifyNetworkReset = (networkName: string) => {
    return notifications.showSuccess(
      'Network Reset',
      `Routing rules for "${networkName}" have been removed.`
    )
  }

  const notifyNetworkError = (action: string, networkName: string, error: Error | string) => {
    return notifications.showApiError(error, `${action} Network "${networkName}"`)
  }

  return {
    notifyNetworkCreated,
    notifyNetworkDeleted,
    notifyNetworkSynced,
    notifyNetworkReset,
    notifyNetworkError,
  }
}

export function useHostNotifications() {
  const notifications = useNotifications()

  const notifyHostCreated = (hostAddress: string) => {
    return notifications.showSuccess(
      'Host Added',
      `Host "${hostAddress}" has been added successfully.`
    )
  }

  const notifyHostDeleted = (hostAddress: string) => {
    return notifications.showSuccess('Host Deleted', `Host "${hostAddress}" has been deleted.`)
  }

  const notifyHostError = (action: string, hostAddress: string, error: Error | string) => {
    return notifications.showApiError(error, `${action} Host "${hostAddress}"`)
  }

  return {
    notifyHostCreated,
    notifyHostDeleted,
    notifyHostError,
  }
}
