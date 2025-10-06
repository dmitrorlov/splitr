import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfirmDialog, useNetworkConfirmations, useHostConfirmations } from '@/composables/useConfirmDialog'
import { useUIStore } from '@/stores/ui'

describe('useConfirmDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('useConfirmDialog composable', () => {
    it('should show confirm dialog with default props', async () => {
      const { show } = useConfirmDialog()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(true)
      
      const result = await show()
      
      expect(showConfirmDialogSpy).toHaveBeenCalledWith({})
      expect(result).toBe(true)
    })

    it('should show confirm dialog with custom props', async () => {
      const { show } = useConfirmDialog()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(false)
      
      const props = {
        title: 'Custom Title',
        message: 'Custom message',
        confirmText: 'Yes',
        cancelText: 'No',
        type: 'danger' as const,
      }
      
      const result = await show(props)
      
      expect(showConfirmDialogSpy).toHaveBeenCalledWith(props)
      expect(result).toBe(false)
    })

    it('should show delete confirmation with default message', async () => {
      const { showDeleteConfirmation } = useConfirmDialog()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(true)
      
      const result = await showDeleteConfirmation()
      
      expect(showConfirmDialogSpy).toHaveBeenCalledWith({
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
        confirmButtonVariant: 'danger',
      })
      expect(result).toBe(true)
    })

    it('should show delete confirmation with item name', async () => {
      const { showDeleteConfirmation } = useConfirmDialog()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(true)
      
      const result = await showDeleteConfirmation('Test Item')
      
      expect(showConfirmDialogSpy).toHaveBeenCalledWith({
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete \"Test Item\"? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
        confirmButtonVariant: 'danger',
      })
      expect(result).toBe(true)
    })
  })

  describe('useNetworkConfirmations composable', () => {
    it('should show network deletion confirmation', async () => {
      const { confirmNetworkDeletion } = useNetworkConfirmations()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(true)
      
      const result = await confirmNetworkDeletion('Home Network')
      
      expect(showConfirmDialogSpy).toHaveBeenCalledWith({
        title: 'Delete Network',
        message: 'Are you sure you want to delete the network \"Home Network\"? This will also delete all hosts associated with this network. This action cannot be undone.',
        confirmText: 'Delete Network',
        cancelText: 'Cancel',
        type: 'danger',
        confirmButtonVariant: 'danger',
      })
      expect(result).toBe(true)
    })

    it('should return false when user cancels network deletion', async () => {
      const { confirmNetworkDeletion } = useNetworkConfirmations()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(false)
      
      const result = await confirmNetworkDeletion('Home Network')
      
      expect(showConfirmDialogSpy).toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('useHostConfirmations composable', () => {
    it('should show host deletion confirmation', async () => {
      const { confirmHostDeletion } = useHostConfirmations()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(true)
      
      const result = await confirmHostDeletion('192.168.1.1')
      
      expect(showConfirmDialogSpy).toHaveBeenCalledWith({
        title: 'Delete Host',
        message: 'Are you sure you want to delete the host \"192.168.1.1\"? This action cannot be undone.',
        confirmText: 'Delete Host',
        cancelText: 'Cancel',
        type: 'danger',
        confirmButtonVariant: 'danger',
      })
      expect(result).toBe(true)
    })

    it('should return false when user cancels host deletion', async () => {
      const { confirmHostDeletion } = useHostConfirmations()
      const uiStore = useUIStore()
      const showConfirmDialogSpy = vi.spyOn(uiStore, 'showConfirmDialog').mockResolvedValue(false)
      
      const result = await confirmHostDeletion('192.168.1.1')
      
      expect(showConfirmDialogSpy).toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })
})