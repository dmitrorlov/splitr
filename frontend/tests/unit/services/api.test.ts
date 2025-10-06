import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiServiceError } from '@/services/api'

// Mock window.go object
const mockWailsApi = {
  app: {
    App: {
      ListHosts: vi.fn(),
      AddHost: vi.fn(),
      DeleteHost: vi.fn(),
    },
  },
}

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.go
    Object.defineProperty(window, 'go', {
      value: mockWailsApi,
      writable: true,
      configurable: true,
    })
  })

  describe('ApiServiceError', () => {
    it('should create error with message', () => {
      const error = new ApiServiceError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('ApiServiceError')
      expect(error.code).toBeUndefined()
      expect(error.status).toBeUndefined()
    })

    it('should create error with code and status', () => {
      const error = new ApiServiceError('Test error', 'ERR_001', 400)
      
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('ApiServiceError')
      expect(error.code).toBe('ERR_001')
      expect(error.status).toBe(400)
    })
  })

  describe('api.call', () => {
    it('should execute function successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const onSuccess = vi.fn()
      
      const result = await api.call(mockFn, { onSuccess })
      
      expect(mockFn).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalledWith('success')
      expect(result).toBe('success')
    })

    it('should handle function error', async () => {
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)
      const onError = vi.fn()
      
      await expect(api.call(mockFn, { onError })).rejects.toThrow(ApiServiceError)
      await expect(api.call(mockFn, { onError })).rejects.toThrow('Test error')
      
      expect(mockFn).toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(ApiServiceError))
    })

    it('should handle non-Error exceptions', async () => {
      const mockFn = vi.fn().mockRejectedValue('string error')
      
      await expect(api.call(mockFn)).rejects.toThrow(ApiServiceError)
      await expect(api.call(mockFn)).rejects.toThrow('API call failed')
    })

    it('should work without options', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      
      const result = await api.call(mockFn)
      
      expect(result).toBe('success')
    })
  })

  describe('api.checkWailsApi', () => {
    it('should return true when Wails API is available', () => {
      expect(api.checkWailsApi()).toBe(true)
    })

    it('should return false when Wails API is not available', () => {
      Object.defineProperty(window, 'go', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      
      expect(api.checkWailsApi()).toBe(false)
    })

    it('should return false when window.go.app is not available', () => {
      Object.defineProperty(window, 'go', {
        value: { app: undefined },
        writable: true,
        configurable: true,
      })
      
      expect(api.checkWailsApi()).toBe(false)
    })

    it('should return false when window.go.app.App is not available', () => {
      Object.defineProperty(window, 'go', {
        value: { app: { App: undefined } },
        writable: true,
        configurable: true,
      })
      
      expect(api.checkWailsApi()).toBe(false)
    })
  })

  describe('api.getWailsApi', () => {
    it('should return Wails API when available', () => {
      const wailsApi = api.getWailsApi()
      
      expect(wailsApi).toBe(mockWailsApi.app.App)
    })

    it('should throw error when Wails API is not available', () => {
      Object.defineProperty(window, 'go', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      
      expect(() => api.getWailsApi()).toThrow(ApiServiceError)
      expect(() => api.getWailsApi()).toThrow('Wails API not available')
    })

    it('should throw error when window.go.app.App is not available', () => {
      Object.defineProperty(window, 'go', {
        value: { app: { App: undefined } },
        writable: true,
        configurable: true,
      })
      
      expect(() => api.getWailsApi()).toThrow(ApiServiceError)
      expect(() => api.getWailsApi()).toThrow('Wails API not available')
    })
  })
})