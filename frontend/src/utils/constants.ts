// Application constants

// UI Constants
export const UI_CONSTANTS = {
  // Animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Notification durations
  NOTIFICATION_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },

  // Debounce delays
  DEBOUNCE_DELAY: {
    SEARCH: 300,
    INPUT: 150,
    RESIZE: 100,
  },

  // Pagination
  DEFAULT_PAGE_SIZE: 20,

  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOOLTIP: 1100,
    NOTIFICATION: 1200,
  },
} as const

// API Constants
export const API_CONSTANTS = {
  // Retry attempts
  MAX_RETRY_ATTEMPTS: 3,

  // Timeout durations
  REQUEST_TIMEOUT: 10000, // 10 seconds

  // Cache durations
  CACHE_DURATION: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 2 * 60 * 60 * 1000, // 2 hours
  },
} as const

// Validation Constants
export const VALIDATION_CONSTANTS = {
  // Network name validation
  NETWORK_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9]([a-zA-Z0-9\s-]{0,48}[a-zA-Z0-9])?$/,
  },

  // IP address validation
  IP_ADDRESS: {
    PATTERN:
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  },

  // Hostname validation
  HOSTNAME: {
    PATTERN:
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  },

  // Description validation
  DESCRIPTION: {
    MAX_LENGTH: 200,
  },
} as const

// Screen Names
export const SCREENS = {
  NETWORKS: 'networks',
  HOSTS: 'hosts',
  NETWORK_HOSTS: 'networkHosts',
} as const

// Button Variants
export const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  GHOST: 'ghost',
  OUTLINE: 'outline',
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'splitr-theme',
  NAVIGATION_HISTORY: 'splitr-navigation-history',
  USER_PREFERENCES: 'splitr-user-preferences',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_NOT_FOUND: 'Network not found',
  HOST_NOT_FOUND: 'Host not found',
  INVALID_IP_ADDRESS: 'Please enter a valid IP address',
  INVALID_HOSTNAME: 'Please enter a valid hostname',
  NETWORK_NAME_REQUIRED: 'Network name is required',
  HOST_ADDRESS_REQUIRED: 'Host address is required',
  DUPLICATE_NETWORK_NAME: 'A network with this name already exists',
  DUPLICATE_HOST_ADDRESS: 'A host with this address already exists',
  API_UNAVAILABLE: 'Application runtime not available',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  NETWORK_CREATED: 'Network created successfully',
  NETWORK_DELETED: 'Network deleted successfully',
  NETWORK_SYNCED: 'Network synced successfully',
  NETWORK_RESET: 'Network reset successfully',
  HOST_CREATED: 'Host added successfully',
  HOST_DELETED: 'Host deleted successfully',
} as const
