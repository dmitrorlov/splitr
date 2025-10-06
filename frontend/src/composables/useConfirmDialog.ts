// useConfirmDialog composable - provides programmatic confirm dialog functionality
import { useUIStore } from '@/stores/ui'
import type { ConfirmDialogProps } from '@/types'

export interface UseConfirmDialogReturn {
  show: (props?: Partial<ConfirmDialogProps>) => Promise<boolean>
  showDeleteConfirmation: (itemName?: string) => Promise<boolean>
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const uiStore = useUIStore()

  const show = async (props: Partial<ConfirmDialogProps> = {}): Promise<boolean> => {
    return await uiStore.showConfirmDialog(props)
  }

  const showDeleteConfirmation = async (itemName?: string): Promise<boolean> => {
    const name = itemName ? ` "${itemName}"` : ''
    return await show({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete${name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      confirmButtonVariant: 'danger',
    })
  }

  return {
    show,
    showDeleteConfirmation,
  }
}

// Specialized confirmation dialogs for common actions
export function useNetworkConfirmations() {
  const confirmDialog = useConfirmDialog()

  const confirmNetworkDeletion = (networkName: string) => {
    return confirmDialog.show({
      title: 'Delete Network',
      message: `Are you sure you want to delete the network "${networkName}"? This will also delete all hosts associated with this network. This action cannot be undone.`,
      confirmText: 'Delete Network',
      cancelText: 'Cancel',
      type: 'danger',
      confirmButtonVariant: 'danger',
    })
  }

  return {
    confirmNetworkDeletion,
  }
}

export function useHostConfirmations() {
  const confirmDialog = useConfirmDialog()

  const confirmHostDeletion = (hostAddress: string) => {
    return confirmDialog.show({
      title: 'Delete Host',
      message: `Are you sure you want to delete the host "${hostAddress}"? This action cannot be undone.`,
      confirmText: 'Delete Host',
      cancelText: 'Cancel',
      type: 'danger',
      confirmButtonVariant: 'danger',
    })
  }

  return {
    confirmHostDeletion,
  }
}
