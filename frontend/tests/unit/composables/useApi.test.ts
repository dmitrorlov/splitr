import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApi, useAsyncData } from '@/composables/useApi'

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useApi composable', () => {
    it('should have correct initial state', () => {
      const api = useApi()
      
      expect(api.loading.value).toBe(false)
      expect(api.error.value).toBe(null)
      expect(api.data.value).toBe(null)
    })

    it('should handle successful API call', async () => {
      const api = useApi<string>()
      const mockResponse = 'success'
      const mockApiCall = vi.fn().mockResolvedValue(mockResponse)
      const onSuccess = vi.fn()
      
      const result = await api.execute(mockApiCall, { onSuccess })
      
      expect(mockApiCall).toHaveBeenCalled()
      expect(api.loading.value).toBe(false)
      expect(api.error.value).toBe(null)
      expect(api.data.value).toBe(mockResponse)
      expect(result).toBe(mockResponse)
      expect(onSuccess).toHaveBeenCalledWith(mockResponse)
    })

    it('should handle API call error', async () => {
      const api = useApi()
      const errorMessage = 'API Error'
      const mockApiCall = vi.fn().mockRejectedValue(new Error(errorMessage))
      const onError = vi.fn()
      
      const result = await api.execute(mockApiCall, { onError })
      
      expect(mockApiCall).toHaveBeenCalled()
      expect(api.loading.value).toBe(false)
      expect(api.error.value).toBe(errorMessage)
      expect(api.data.value).toBe(null)
      expect(result).toBe(null)
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle non-Error exceptions', async () => {
      const api = useApi()
      const mockApiCall = vi.fn().mockRejectedValue('String error')
      
      const result = await api.execute(mockApiCall)
      
      expect(api.error.value).toBe('An error occurred')
      expect(result).toBe(null)
    })

    it('should set loading state during API call', async () => {
      const api = useApi()
      let loadingDuringCall = false
      
      const mockApiCall = vi.fn().mockImplementation(() => {
        loadingDuringCall = api.loading.value
        return Promise.resolve('success')
      })
      
      await api.execute(mockApiCall)
      
      expect(loadingDuringCall).toBe(true)
      expect(api.loading.value).toBe(false)
    })

    it('should clear error before new API call', async () => {
      const api = useApi()
      
      // First call fails
      const failingCall = vi.fn().mockRejectedValue(new Error('Error 1'))
      await api.execute(failingCall)
      expect(api.error.value).toBe('Error 1')
      
      // Second call succeeds
      const successCall = vi.fn().mockResolvedValue('success')
      await api.execute(successCall)
      expect(api.error.value).toBe(null)
    })

    it('should reset all state', () => {
      const api = useApi()
      
      // Set some state
      api.loading.value = true
      api.error.value = 'Some error'
      api.data.value = 'Some data'
      
      api.reset()
      
      expect(api.loading.value).toBe(false)
      expect(api.error.value).toBe(null)
      expect(api.data.value).toBe(null)
    })
  })

  describe('useAsyncData composable', () => {
    it('should execute immediately by default', async () => {
      const mockApiCall = vi.fn().mockResolvedValue('data')
      
      const asyncData = useAsyncData(mockApiCall)
      
      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockApiCall).toHaveBeenCalled()
      expect(asyncData.data.value).toBe('data')
    })

    it('should not execute immediately when immediate is false', () => {
      const mockApiCall = vi.fn().mockResolvedValue('data')
      
      const asyncData = useAsyncData(mockApiCall, { immediate: false })
      
      expect(mockApiCall).not.toHaveBeenCalled()
      expect(asyncData.data.value).toBe(null)
    })

    it('should provide refresh function', async () => {
      const mockApiCall = vi.fn().mockResolvedValue('data')
      
      const asyncData = useAsyncData(mockApiCall, { immediate: false })
      
      await asyncData.refresh()
      
      expect(mockApiCall).toHaveBeenCalled()
      expect(asyncData.data.value).toBe('data')
    })

    it('should handle success callback', async () => {
      const mockApiCall = vi.fn().mockResolvedValue('data')
      const onSuccess = vi.fn()
      
      useAsyncData(mockApiCall, { onSuccess })
      
      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(onSuccess).toHaveBeenCalledWith('data')
    })

    it('should handle error callback', async () => {
      const error = new Error('Test error')
      const mockApiCall = vi.fn().mockRejectedValue(error)
      const onError = vi.fn()
      
      useAsyncData(mockApiCall, { onError })
      
      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(onError).toHaveBeenCalledWith(error)
    })
  })
})