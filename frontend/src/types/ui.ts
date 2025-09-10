// UI-specific types and interfaces

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  persistent?: boolean
  timestamp?: Date
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export interface ConfirmDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  confirmButtonVariant?: ButtonVariant
}

export interface SearchInputProps {
  modelValue: string
  placeholder?: string
  clearable?: boolean
  resultCount?: number | null
  resultText?: string
  debounceMs?: number
}

export interface CardProps {
  hoverable?: boolean
  clickable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export interface ModalProps {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  persistent?: boolean
}

// Form field types
export interface FormField {
  label: string
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  validation?: FormFieldValidation
}

export interface FormFieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => string | true
}

export interface FormState {
  values: Record<string, unknown>
  errors: Record<string, string>
  touched: Record<string, boolean>
  submitting: boolean
  valid: boolean
}

// Table/List types
export interface TableColumn<T = unknown> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, item: T) => string
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  selectable?: boolean
  selectedItems?: T[]
}

// Navigation types
export type Screen = 'networks' | 'networkHosts' | 'hosts'

export interface NavigationItem {
  label: string
  screen: Screen
  icon?: string
  badge?: number | string
  active?: boolean
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  warning: string
  danger: string
  info: string
  gray: Record<number, string>
}

// Animation types
export type TransitionName = 'fade' | 'slide' | 'scale' | 'bounce'

export interface AnimationOptions {
  name: TransitionName
  duration?: number
  delay?: number
  easing?: string
}
