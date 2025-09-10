// useSearch composable - provides reactive search functionality with debouncing

import { useDebounceFn } from '@vueuse/core'
import type { Ref } from 'vue'
import { computed, ref } from 'vue'

export interface UseSearchOptions {
  debounceMs?: number
  minSearchLength?: number
  caseSensitive?: boolean
}

export interface UseSearchReturn<T> {
  searchTerm: Ref<string>
  filteredItems: Ref<T[]>
  search: (term: string) => void
  clearSearch: () => void
  isSearching: Ref<boolean>
  resultCount: Ref<number>
}

export function useSearch<T>(
  items: Ref<T[]>,
  searchFields: (keyof T)[],
  options: UseSearchOptions = {}
): UseSearchReturn<T> {
  const { debounceMs = 300, minSearchLength = 1, caseSensitive = false } = options

  const searchTerm = ref('')
  const isSearching = ref(false)

  const filteredItems = computed(() => {
    const term = searchTerm.value.trim()

    if (!term || term.length < minSearchLength) {
      return items.value
    }

    const searchValue = caseSensitive ? term : term.toLowerCase()

    return items.value.filter(item =>
      searchFields.some(field => {
        const value = item[field]
        if (typeof value !== 'string') return false

        const fieldValue = caseSensitive ? value : value.toLowerCase()
        return fieldValue.includes(searchValue)
      })
    )
  })

  const resultCount = computed(() => filteredItems.value.length)

  const debouncedSearch = useDebounceFn((term: string) => {
    searchTerm.value = term
    isSearching.value = false
  }, debounceMs)

  const search = (term: string) => {
    if (debounceMs > 0) {
      isSearching.value = true
      debouncedSearch(term)
    } else {
      searchTerm.value = term
    }
  }

  const clearSearch = () => {
    searchTerm.value = ''
    isSearching.value = false
  }

  return {
    searchTerm,
    filteredItems,
    search,
    clearSearch,
    isSearching,
    resultCount,
  }
}

// Specialized search for multiple fields with different weights
export function useWeightedSearch<T>(
  items: Ref<T[]>,
  fieldWeights: Record<keyof T, number>, // field name -> weight (higher = more important)
  options: UseSearchOptions = {}
) {
  const searchTerm = ref('')
  const isSearching = ref(false)
  const { debounceMs = 300, minSearchLength = 1, caseSensitive = false } = options

  const filteredItems = computed(() => {
    const term = searchTerm.value.trim()

    if (!term || term.length < minSearchLength) {
      return items.value
    }

    const searchValue = caseSensitive ? term : term.toLowerCase()

    // Calculate relevance score for each item
    const scoredItems = items.value.map(item => {
      let score = 0

      Object.entries(fieldWeights).forEach(([field, weight]) => {
        const value = item[field as keyof T]
        if (typeof value === 'string') {
          const fieldValue = caseSensitive ? value : value.toLowerCase()
          if (fieldValue.includes(searchValue)) {
            // Boost score if it's an exact match or starts with the term
            const bonus =
              fieldValue === searchValue ? 2 : fieldValue.startsWith(searchValue) ? 1.5 : 1
            score += (weight as number) * bonus
          }
        }
      })

      return { item, score }
    })

    // Filter items with score > 0 and sort by score descending
    return scoredItems
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  })

  const resultCount = computed(() => filteredItems.value.length)

  const debouncedSearch = useDebounceFn((term: string) => {
    searchTerm.value = term
    isSearching.value = false
  }, debounceMs)

  const search = (term: string) => {
    if (debounceMs > 0) {
      isSearching.value = true
      debouncedSearch(term)
    } else {
      searchTerm.value = term
    }
  }

  const clearSearch = () => {
    searchTerm.value = ''
    isSearching.value = false
  }

  return {
    searchTerm,
    filteredItems,
    search,
    clearSearch,
    isSearching,
    resultCount,
  }
}
