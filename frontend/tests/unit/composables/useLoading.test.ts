import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLoading, useMultiLoading } from '@/composables/useLoading'

describe('useLoading', () => {
  describe('useLoading composable', () => {
    it('should have correct initial state', () => {
      const { loading, isLoading } = useLoading()
      
      expect(loading.value).toBe(false)
      expect(isLoading.value).toBe(false)
    })

    it('should initialize with custom initial state', () => {
      const { loading, isLoading } = useLoading(true)
      
      expect(loading.value).toBe(true)
      expect(isLoading.value).toBe(true)
    })

    it('should set loading state', () => {
      const { loading, setLoading, isLoading } = useLoading()
      
      setLoading(true)
      expect(loading.value).toBe(true)
      expect(isLoading.value).toBe(true)
      
      setLoading(false)
      expect(loading.value).toBe(false)
      expect(isLoading.value).toBe(false)
    })

    it('should handle withLoading for successful operations', async () => {
      const { loading, withLoading } = useLoading()
      const mockFn = vi.fn().mockResolvedValue('success')
      let loadingDuringExecution = false
      
      const result = await withLoading(async () => {
        loadingDuringExecution = loading.value
        return await mockFn()
      })
      
      expect(loadingDuringExecution).toBe(true)
      expect(loading.value).toBe(false)
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalled()
    })

    it('should handle withLoading for failed operations', async () => {
      const { loading, withLoading } = useLoading()
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)
      
      await expect(withLoading(mockFn)).rejects.toThrow('Test error')
      expect(loading.value).toBe(false)
      expect(mockFn).toHaveBeenCalled()
    })

    it('should ensure loading is false even if function throws', async () => {
      const { loading, withLoading } = useLoading()
      
      try {
        await withLoading(() => {
          throw new Error('Test error')
        })
      } catch {
        // Ignore error
      }
      
      expect(loading.value).toBe(false)
    })
  })

  describe('useMultiLoading composable', () => {
    it('should have correct initial state', () => {
      const { isLoading, isAnyLoading, loadingStates } = useMultiLoading()
      
      expect(isLoading('test')).toBe(false)
      expect(isAnyLoading.value).toBe(false)
      expect(loadingStates.value).toEqual({})
    })

    it('should set and check loading states', () => {
      const { setLoading, isLoading, isAnyLoading } = useMultiLoading()
      
      setLoading('operation1', true)
      expect(isLoading('operation1')).toBe(true)
      expect(isLoading('operation2')).toBe(false)
      expect(isAnyLoading.value).toBe(true)
      
      setLoading('operation2', true)
      expect(isLoading('operation2')).toBe(true)
      expect(isAnyLoading.value).toBe(true)
      
      setLoading('operation1', false)
      expect(isLoading('operation1')).toBe(false)
      expect(isLoading('operation2')).toBe(true)
      expect(isAnyLoading.value).toBe(true)
      
      setLoading('operation2', false)
      expect(isLoading('operation2')).toBe(false)
      expect(isAnyLoading.value).toBe(false)
    })

    it('should handle withLoading for specific keys', async () => {
      const { isLoading, withLoading } = useMultiLoading()
      const mockFn = vi.fn().mockResolvedValue('success')
      let loadingDuringExecution = false
      
      const result = await withLoading('test-key', async () => {
        loadingDuringExecution = isLoading('test-key')
        return await mockFn()
      })
      
      expect(loadingDuringExecution).toBe(true)
      expect(isLoading('test-key')).toBe(false)
      expect(result).toBe('success')
    })

    it('should handle withLoading errors and clear loading state', async () => {
      const { isLoading, withLoading } = useMultiLoading()
      const error = new Error('Test error')
      
      await expect(withLoading('test-key', () => Promise.reject(error))).rejects.toThrow('Test error')
      expect(isLoading('test-key')).toBe(false)
    })

    it('should clear all loading states', () => {
      const { setLoading, isLoading, isAnyLoading, clearAll } = useMultiLoading()
      
      setLoading('operation1', true)
      setLoading('operation2', true)
      expect(isAnyLoading.value).toBe(true)
      
      clearAll()
      expect(isLoading('operation1')).toBe(false)
      expect(isLoading('operation2')).toBe(false)
      expect(isAnyLoading.value).toBe(false)
    })

    it('should handle multiple concurrent operations', async () => {
      const { isLoading, withLoading, isAnyLoading } = useMultiLoading()
      
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      
      const promise1 = withLoading('op1', () => delay(50).then(() => 'result1'))
      const promise2 = withLoading('op2', () => delay(30).then(() => 'result2'))
      
      // Both should be loading
      expect(isLoading('op1')).toBe(true)
      expect(isLoading('op2')).toBe(true)
      expect(isAnyLoading.value).toBe(true)
      
      const results = await Promise.all([promise1, promise2])
      
      expect(results).toEqual(['result1', 'result2'])
      expect(isLoading('op1')).toBe(false)
      expect(isLoading('op2')).toBe(false)
      expect(isAnyLoading.value).toBe(false)
    })

    it('should track loading states in loadingStates ref', () => {
      const { setLoading, loadingStates } = useMultiLoading()
      
      setLoading('test1', true)
      setLoading('test2', true)
      
      expect(loadingStates.value).toEqual({
        test1: true,
        test2: true,
      })
      
      setLoading('test1', false)
      
      expect(loadingStates.value).toEqual({
        test2: true,
      })
    })
  })
})