import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useSearch, useWeightedSearch } from '@/composables/useSearch'

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useDebounceFn: vi.fn((fn, delay) => {
    // For testing, we'll just return the function without debouncing
    return fn
  }),
}))

describe('useSearch', () => {
  interface TestItem {
    id: number
    name: string
    description: string
    category: string
  }

  const testItems: TestItem[] = [
    { id: 1, name: 'Apple', description: 'Red fruit', category: 'Fruit' },
    { id: 2, name: 'Banana', description: 'Yellow fruit', category: 'Fruit' },
    { id: 3, name: 'Carrot', description: 'Orange vegetable', category: 'Vegetable' },
    { id: 4, name: 'Broccoli', description: 'Green vegetable', category: 'Vegetable' },
    { id: 5, name: 'Apple Pie', description: 'Sweet dessert', category: 'Dessert' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSearch composable', () => {
    it('should have correct initial state', () => {
      const items = ref(testItems)
      const { searchTerm, filteredItems, isSearching, resultCount } = useSearch(
        items,
        ['name', 'description']
      )
      
      expect(searchTerm.value).toBe('')
      expect(filteredItems.value).toEqual(testItems)
      expect(isSearching.value).toBe(false)
      expect(resultCount.value).toBe(testItems.length)
    })

    it('should filter items by name', () => {
      const items = ref(testItems)
      const { search, filteredItems, resultCount } = useSearch(items, ['name'])
      
      search('Apple')
      
      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.map(item => item.name)).toEqual(['Apple', 'Apple Pie'])
      expect(resultCount.value).toBe(2)
    })

    it('should filter items by description', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['description'])
      
      search('fruit')
      
      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.map(item => item.name)).toEqual(['Apple', 'Banana'])
    })

    it('should filter items by multiple fields', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['name', 'description'])
      
      search('Green')
      
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].name).toBe('Broccoli')
    })

    it('should be case insensitive by default', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['name'])
      
      search('apple')
      
      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.map(item => item.name)).toEqual(['Apple', 'Apple Pie'])
    })

    it('should be case sensitive when configured', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['name'], { caseSensitive: true })
      
      search('apple')
      
      expect(filteredItems.value).toHaveLength(0)
      
      search('Apple')
      
      expect(filteredItems.value).toHaveLength(2)
    })

    it('should respect minimum search length', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['name'], { minSearchLength: 3 })
      
      search('A')
      expect(filteredItems.value).toEqual(testItems) // Should return all items
      
      search('Ap')
      expect(filteredItems.value).toEqual(testItems) // Should return all items
      
      search('App')
      expect(filteredItems.value).toHaveLength(2) // Should filter
    })

    it('should handle empty search term', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['name'])
      
      search('Apple')
      expect(filteredItems.value).toHaveLength(2)
      
      search('')
      expect(filteredItems.value).toEqual(testItems)
    })

    it('should handle whitespace-only search term', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useSearch(items, ['name'])
      
      search('   ')
      expect(filteredItems.value).toEqual(testItems)
    })

    it('should clear search', () => {
      const items = ref(testItems)
      const { search, clearSearch, searchTerm, filteredItems, isSearching } = useSearch(
        items,
        ['name']
      )
      
      search('Apple')
      expect(searchTerm.value).toBe('Apple')
      expect(filteredItems.value).toHaveLength(2)
      
      clearSearch()
      expect(searchTerm.value).toBe('')
      expect(filteredItems.value).toEqual(testItems)
      expect(isSearching.value).toBe(false)
    })

    it('should handle non-string field values', () => {
      const itemsWithNumbers = ref([
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
      ])
      
      const { search, filteredItems } = useSearch(itemsWithNumbers, ['name', 'value' as any])
      
      search('100')
      expect(filteredItems.value).toHaveLength(0) // Non-string fields should be ignored
      
      search('Item')
      expect(filteredItems.value).toHaveLength(2) // String fields should work
    })

    it('should update when items change', () => {
      const items = ref([testItems[0], testItems[1]])
      const { search, filteredItems } = useSearch(items, ['name'])
      
      search('Apple')
      expect(filteredItems.value).toHaveLength(1)
      
      items.value = testItems // Add more items
      expect(filteredItems.value).toHaveLength(2) // Should now find Apple Pie too
    })
  })

  describe('useWeightedSearch composable', () => {
    const fieldWeights = {
      name: 3,
      description: 2,
      category: 1,
    }

    it('should rank results by weight', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useWeightedSearch(items, fieldWeights)
      
      search('fruit')
      
      expect(filteredItems.value).toHaveLength(2) // Apple, Banana with 'fruit' in description
      // Items with 'fruit' in description should come before category matches
      const names = filteredItems.value.map(item => item.name)
      expect(names.slice(0, 2)).toEqual(['Apple', 'Banana'])
    })

    it('should boost exact matches', () => {
      const items = ref([
        { id: 1, name: 'Apple', description: 'Red Apple fruit', category: 'Fruit' },
        { id: 2, name: 'Green Apple', description: 'Green fruit', category: 'Fruit' },
      ])
      
      const { search, filteredItems } = useWeightedSearch(items, fieldWeights)
      
      search('Apple')
      
      expect(filteredItems.value).toHaveLength(2)
      // Exact match in name should rank higher
      expect(filteredItems.value[0].name).toBe('Apple')
    })

    it('should boost prefix matches', () => {
      const items = ref([
        { id: 1, name: 'Application', description: 'Software', category: 'Tech' },
        { id: 2, name: 'Orange', description: 'Apple-like fruit', category: 'Fruit' },
      ])
      
      const { search, filteredItems } = useWeightedSearch(items, fieldWeights)
      
      search('App')
      
      expect(filteredItems.value).toHaveLength(2)
      // Prefix match should rank higher than substring match
      expect(filteredItems.value[0].name).toBe('Application')
    })

    it('should handle empty results', () => {
      const items = ref(testItems)
      const { search, filteredItems, resultCount } = useWeightedSearch(items, fieldWeights)
      
      search('nonexistent')
      
      expect(filteredItems.value).toHaveLength(0)
      expect(resultCount.value).toBe(0)
    })

    it('should respect minimum search length', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useWeightedSearch(items, fieldWeights, {
        minSearchLength: 3,
      })
      
      search('A')
      expect(filteredItems.value).toEqual(testItems)
      
      search('App')
      expect(filteredItems.value.length).toBeLessThan(testItems.length)
    })

    it('should handle case sensitivity', () => {
      const items = ref(testItems)
      const { search, filteredItems } = useWeightedSearch(items, fieldWeights, {
        caseSensitive: true,
      })
      
      search('apple')
      expect(filteredItems.value).toHaveLength(0)
      
      search('Apple')
      expect(filteredItems.value).toHaveLength(2)
    })
  })
})