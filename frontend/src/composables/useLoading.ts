// useLoading composable - provides loading state management

import type { Ref } from 'vue'
import { computed, readonly, ref } from 'vue'

export interface UseLoadingReturn {
  loading: Ref<boolean>
  setLoading: (loading: boolean) => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
  isLoading: Readonly<Ref<boolean>>
}

export function useLoading(initialState = false): UseLoadingReturn {
  const loading = ref(initialState)

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      loading.value = true
      const result = await fn()
      return result
    } finally {
      loading.value = false
    }
  }

  const isLoading = computed(() => loading.value)

  return {
    loading,
    setLoading,
    withLoading,
    isLoading,
  }
}

// Multiple loading states for different operations
export function useMultiLoading() {
  const loadingStates = ref<Record<string, boolean>>({})

  const setLoading = (key: string, loading: boolean) => {
    if (loading) {
      loadingStates.value[key] = true
    } else {
      delete loadingStates.value[key]
    }
  }

  const isLoading = (key: string): boolean => {
    return !!loadingStates.value[key]
  }

  const isAnyLoading = computed(() => {
    return Object.keys(loadingStates.value).length > 0
  })

  const withLoading = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    try {
      setLoading(key, true)
      const result = await fn()
      return result
    } finally {
      setLoading(key, false)
    }
  }

  const clearAll = () => {
    loadingStates.value = {}
  }

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    clearAll,
    loadingStates: readonly(loadingStates),
  }
}
