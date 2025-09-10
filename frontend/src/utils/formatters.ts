// Utility functions for formatting and general helpers

// Time formatting utilities - exact logic from NetworksScreen.vue
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  } catch (_error) {
    return 'unknown'
  }
}

// Format date to readable string
export const formatDate = (date: Date | string): string => {
  try {
    const d = new Date(date)
    return d.toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

// Format date and time
export const formatDateTime = (date: Date | string): string => {
  try {
    const d = new Date(date)
    return d.toLocaleString()
  } catch {
    return 'Invalid date'
  }
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

// Capitalize first letter
export const capitalize = (str: string): string => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Convert camelCase to readable text
export const camelToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim()
}

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Pluralize words
export const pluralize = (word: string, count: number): string => {
  if (count === 1) return word

  // Simple pluralization rules
  if (word.endsWith('y')) {
    return `${word.slice(0, -1)}ies`
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch')) {
    return `${word}es`
  }
  return `${word}s`
}
