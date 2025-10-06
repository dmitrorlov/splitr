import {
  formatTimestamp,
  formatDate,
  formatDateTime,
  formatFileSize,
  truncateText,
  capitalize,
  camelToTitle,
  generateId,
  pluralize,
} from '@/utils/formatters'

describe('formatters', () => {
  describe('formatTimestamp', () => {
    beforeEach(() => {
      // Mock current time to 2024-01-01 12:00:00
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "just now" for timestamps less than 60 seconds ago', () => {
      const timestamp = new Date('2024-01-01T11:59:30Z').toISOString()
      expect(formatTimestamp(timestamp)).toBe('just now')
    })

    it('should return minutes ago for timestamps less than 1 hour ago', () => {
      const timestamp = new Date('2024-01-01T11:45:00Z').toISOString()
      expect(formatTimestamp(timestamp)).toBe('15m ago')
    })

    it('should return hours ago for timestamps less than 1 day ago', () => {
      const timestamp = new Date('2024-01-01T09:00:00Z').toISOString()
      expect(formatTimestamp(timestamp)).toBe('3h ago')
    })

    it('should return days ago for timestamps older than 1 day', () => {
      const timestamp = new Date('2023-12-30T12:00:00Z').toISOString()
      expect(formatTimestamp(timestamp)).toBe('2d ago')
    })

    it('should handle invalid timestamps', () => {
      expect(formatTimestamp('invalid-date')).toBe('unknown')
    })

    it('should handle edge cases', () => {
      const oneMinuteAgo = new Date('2024-01-01T11:59:00Z').toISOString()
      const oneHourAgo = new Date('2024-01-01T11:00:00Z').toISOString()
      const oneDayAgo = new Date('2023-12-31T12:00:00Z').toISOString()

      expect(formatTimestamp(oneMinuteAgo)).toBe('1m ago')
      expect(formatTimestamp(oneHourAgo)).toBe('1h ago')
      expect(formatTimestamp(oneDayAgo)).toBe('1d ago')
    })
  })

  describe('formatDate', () => {
    it('should format Date object to locale date string', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/1\/15\/2024|15\/1\/2024|2024\/1\/15/) // Different locales
    })

    it('should format date string to locale date string', () => {
      const dateString = '2024-01-15T10:30:00Z'
      const result = formatDate(dateString)
      expect(result).toMatch(/1\/15\/2024|15\/1\/2024|2024\/1\/15/)
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date')
      expect(formatDate('not-a-date')).toBe('Invalid date')
    })
  })

  describe('formatDateTime', () => {
    it('should format Date object to locale datetime string', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDateTime(date)
      expect(result).toContain('2024')
      expect(result).toMatch(/1\/15\/2024|15\/1\/2024|2024\/1\/15/)
    })

    it('should format date string to locale datetime string', () => {
      const dateString = '2024-01-15T10:30:00Z'
      const result = formatDateTime(dateString)
      expect(result).toContain('2024')
    })

    it('should handle invalid dates', () => {
      expect(formatDateTime('invalid-date')).toBe('Invalid date')
      expect(formatDateTime('not-a-date')).toBe('Invalid date')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(100)).toBe('100 Bytes')
      expect(formatFileSize(1023)).toBe('1023 Bytes')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1048575)).toBe('1024 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
      expect(formatFileSize(1073741823)).toBe('1024 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
      expect(formatFileSize(1610612736)).toBe('1.5 GB')
    })

    it('should handle large numbers correctly', () => {
      const largeNumber = 5 * 1024 * 1024 * 1024 // 5GB
      expect(formatFileSize(largeNumber)).toBe('5 GB')
    })
  })

  describe('truncateText', () => {
    it('should return original text if shorter than maxLength', () => {
      expect(truncateText('short', 10)).toBe('short')
    })

    it('should return original text if equal to maxLength', () => {
      expect(truncateText('exactly10!', 10)).toBe('exactly10!')
    })

    it('should truncate text and add ellipsis if longer than maxLength', () => {
      expect(truncateText('this is a very long text', 10)).toBe('this is a ...')
    })

    it('should handle empty string', () => {
      expect(truncateText('', 5)).toBe('')
    })

    it('should handle maxLength of 0', () => {
      expect(truncateText('text', 0)).toBe('...')
    })

    it('should handle maxLength of 1', () => {
      expect(truncateText('text', 1)).toBe('t...')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter of lowercase string', () => {
      expect(capitalize('hello')).toBe('Hello')
    })

    it('should keep first letter capitalized if already capitalized', () => {
      expect(capitalize('Hello')).toBe('Hello')
    })

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A')
      expect(capitalize('A')).toBe('A')
    })

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('')
    })

    it('should handle string with spaces', () => {
      expect(capitalize('hello world')).toBe('Hello world')
    })

    it('should handle special characters', () => {
      expect(capitalize('123abc')).toBe('123abc')
      expect(capitalize('!hello')).toBe('!hello')
    })
  })

  describe('camelToTitle', () => {
    it('should convert camelCase to Title Case', () => {
      expect(camelToTitle('camelCase')).toBe('Camel Case')
    })

    it('should handle single word', () => {
      expect(camelToTitle('word')).toBe('Word')
    })

    it('should handle multiple capital letters', () => {
      expect(camelToTitle('XMLHttpRequest')).toBe('X M L Http Request')
    })

    it('should handle consecutive capitals', () => {
      expect(camelToTitle('HTTPSConnection')).toBe('H T T P S Connection')
    })

    it('should handle empty string', () => {
      expect(camelToTitle('')).toBe('')
    })

    it('should handle already titled text', () => {
      expect(camelToTitle('Already Titled')).toBe('Already  Titled')
    })

    it('should handle numbers', () => {
      expect(camelToTitle('version2Update')).toBe('Version2 Update')
    })
  })

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should generate different ids on subsequent calls', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should generate ids of consistent length', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1.length).toBe(id2.length)
    })

    it('should generate ids with valid characters', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })

    it('should generate multiple unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100) // All should be unique
    })
  })

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize('cat', 1)).toBe('cat')
      expect(pluralize('dog', 1)).toBe('dog')
    })

    it('should pluralize regular words', () => {
      expect(pluralize('cat', 2)).toBe('cats')
      expect(pluralize('dog', 0)).toBe('dogs')
      expect(pluralize('item', 5)).toBe('items')
    })

    it('should handle words ending in "y"', () => {
      expect(pluralize('city', 2)).toBe('cities')
      expect(pluralize('country', 3)).toBe('countries')
      expect(pluralize('party', 5)).toBe('parties')
    })

    it('should handle words ending in "s"', () => {
      expect(pluralize('class', 2)).toBe('classes')
      expect(pluralize('bus', 3)).toBe('buses')
    })

    it('should handle words ending in "sh"', () => {
      expect(pluralize('dish', 2)).toBe('dishes')
      expect(pluralize('brush', 3)).toBe('brushes')
    })

    it('should handle words ending in "ch"', () => {
      expect(pluralize('church', 2)).toBe('churches')
      expect(pluralize('batch', 3)).toBe('batches')
    })

    it('should handle edge cases', () => {
      expect(pluralize('', 2)).toBe('s')
      expect(pluralize('a', 2)).toBe('as')
    })

    it('should handle negative counts as plural', () => {
      expect(pluralize('item', -1)).toBe('items')
      expect(pluralize('cat', -5)).toBe('cats')
    })
  })
})