export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return 'unknown'

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

export const formatDate = (date: Date | string): string => {
  try {
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

export const formatDateTime = (date: Date | string): string => {
  try {
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleString()
  } catch {
    return 'Invalid date'
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

export const capitalize = (str: string): string => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const camelToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim()
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

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
