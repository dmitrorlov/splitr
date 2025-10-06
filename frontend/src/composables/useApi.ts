// useApi composable - provides reactive API state management

import type { Ref } from 'vue'
import { ref } from 'vue'
import type { ApiCallOptions } from '@/types'

export interface UseApiReturn<T = unknown> {
  loading: Ref<boolean>
  error: Ref<string | null>
  data: Ref<unknown>
  execute: <R = T>(apiCall: () => Promise<R>, options?: ApiCallOptions<R>) => Promise<R | null>
  reset: () => void
}

export function useApi<T = unknown>(): UseApiReturn<T> {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null)

  const execute = async <R = T>(
    apiCall: () => Promise<R>,
    options: ApiCallOptions<R> = {}
  ): Promise<R | null> => {
    try {
      loading.value = true
      error.value = null

      const result = await apiCall()
      data.value = result as unknown as T

      options.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      error.value = errorMessage
      options.onError?.(err as Error)
      return null
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    loading.value = false
    error.value = null
    data.value = null
  }

  return {
    loading,
    error,
    data,
    execute,
    reset,
  }
}

// Specialized version for immediate execution
export function useAsyncData<T>(
  fn: () => Promise<T>,
  options: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const { immediate = true, ...apiOptions } = options
  const api = useApi<T>()

  if (immediate) {
    api.execute(fn, apiOptions)
  }

  const refresh = () => api.execute(fn, apiOptions)

  return {
    ...api,
    refresh,
  }
}
