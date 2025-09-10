export const UI_CONSTANTS = {
  NOTIFICATION_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },

  DEBOUNCE_DELAY: {
    SEARCH: 300,
    INPUT: 150,
  },
} as const

export const API_CONSTANTS = {
  REQUEST_TIMEOUT: 10000,
} as const

export const VALIDATION_CONSTANTS = {
  NETWORK_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9]([a-zA-Z0-9\s-]{0,48}[a-zA-Z0-9])?$/,
  },

  IP_ADDRESS: {
    PATTERN:
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  },

  HOSTNAME: {
    PATTERN:
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  },

  DESCRIPTION: {
    MAX_LENGTH: 200,
  },
} as const

export const SCREENS = {
  NETWORKS: 'networks',
  HOSTS: 'hosts',
  NETWORK_HOSTS: 'networkHosts',
} as const

export const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  GHOST: 'ghost',
  OUTLINE: 'outline',
} as const

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

export const STORAGE_KEYS = {
  THEME: 'splitr-theme',
  NAVIGATION_HISTORY: 'splitr-navigation-history',
  USER_PREFERENCES: 'splitr-user-preferences',
} as const
