// Base API service with error handling and common functionality
import type { ApiCallOptions } from '@/types/api'

export class ApiServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiServiceError'
  }
}

export const api = {
  // Error wrapper for all API calls
  async call<T>(fn: () => Promise<T>, options: ApiCallOptions<T> = {}): Promise<T> {
    try {
      const result = await fn()
      options.onSuccess?.(result)
      return result
    } catch (error) {
      const apiError = new ApiServiceError(
        error instanceof Error ? error.message : 'API call failed'
      )
      options.onError?.(apiError)
      throw apiError
    }
  },

  // Helper to check if Wails API is available
  checkWailsApi(): boolean {
    return !!window.go?.app?.App
  },

  // Get Wails API or throw error
  getWailsApi() {
    const wailsApi = window.go?.app?.App
    if (!wailsApi) {
      throw new ApiServiceError('Wails API not available')
    }
    return wailsApi
  },
}
