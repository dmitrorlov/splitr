// useFormValidation composable - provides form validation functionality

import type { Ref } from 'vue'
import { computed, reactive } from 'vue'
import type { FormField, FormState } from '@/types'

export interface UseFormValidationReturn {
  form: FormState
  validate: (field?: string) => boolean
  validateField: (field: string, value: unknown) => string | null
  setFieldValue: (field: string, value: unknown) => void
  setFieldError: (field: string, error: string) => void
  clearFieldError: (field: string) => void
  clearAllErrors: () => void
  markFieldTouched: (field: string) => void
  resetForm: () => void
  isFieldValid: (field: string) => boolean
  isFormValid: Readonly<Ref<boolean>>
}

export function useFormValidation(
  fields: Record<string, FormField>,
  initialValues: Record<string, unknown> = {}
): UseFormValidationReturn {
  const form = reactive<FormState>({
    values: { ...initialValues },
    errors: {},
    touched: {},
    submitting: false,
    valid: false,
  })

  const isFormValid = computed(() => {
    const hasErrors = Object.keys(form.errors).length > 0
    const allRequiredFieldsHaveValues = Object.entries(fields)
      .filter(([, field]) => field.required)
      .every(([name]) => {
        const value = form.values[name]
        return value !== undefined && value !== null && value !== ''
      })

    return !hasErrors && allRequiredFieldsHaveValues
  })

  // Update form.valid when isFormValid changes
  const updateFormValidity = () => {
    form.valid = isFormValid.value
  }

  const validateField = (fieldName: string, value: unknown): string | null => {
    const field = fields[fieldName]
    if (!field) return null

    const validation = field.validation
    if (!validation) return null

    // Required validation
    if (validation.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`
    }

    // Skip other validations if field is empty and not required
    if (!validation.required && (value === undefined || value === null || value === '')) {
      return null
    }

    // String length validations
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        return `${field.label} must be at least ${validation.minLength} characters`
      }

      if (validation.maxLength && value.length > validation.maxLength) {
        return `${field.label} must not exceed ${validation.maxLength} characters`
      }

      // Pattern validation
      if (validation.pattern && !validation.pattern.test(value)) {
        return `${field.label} format is invalid`
      }
    }

    // Custom validation
    if (validation.custom) {
      const result = validation.custom(value)
      if (typeof result === 'string') {
        return result
      }
    }

    return null
  }

  const validate = (fieldName?: string): boolean => {
    if (fieldName) {
      // Validate single field
      const error = validateField(fieldName, form.values[fieldName])
      if (error) {
        form.errors[fieldName] = error
      } else {
        delete form.errors[fieldName]
      }
      updateFormValidity()
      return !error
    } else {
      // Validate all fields
      const errors: Record<string, string> = {}

      Object.keys(fields).forEach(name => {
        const error = validateField(name, form.values[name])
        if (error) {
          errors[name] = error
        }
      })

      form.errors = errors
      updateFormValidity()
      return Object.keys(errors).length === 0
    }
  }

  const setFieldValue = (field: string, value: unknown) => {
    form.values[field] = value

    // Clear error when value changes
    if (form.errors[field]) {
      delete form.errors[field]
    }

    updateFormValidity()
  }

  const setFieldError = (field: string, error: string) => {
    form.errors[field] = error
    updateFormValidity()
  }

  const clearFieldError = (field: string) => {
    delete form.errors[field]
    updateFormValidity()
  }

  const clearAllErrors = () => {
    form.errors = {}
    updateFormValidity()
  }

  const markFieldTouched = (field: string) => {
    form.touched[field] = true
  }

  const resetForm = () => {
    form.values = { ...initialValues }
    form.errors = {}
    form.touched = {}
    form.submitting = false
    updateFormValidity()
  }

  const isFieldValid = (field: string): boolean => {
    return !form.errors[field]
  }

  // Initial validation
  updateFormValidity()

  return {
    form,
    validate,
    validateField,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    markFieldTouched,
    resetForm,
    isFieldValid,
    isFormValid,
  }
}

// Predefined validation rules
export const validationRules = {
  required: (message?: string) => ({
    required: true,
    custom: (value: unknown) => {
      if (value === undefined || value === null || value === '') {
        return message || 'This field is required'
      }
      return true
    },
  }),

  email: (message?: string) => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return message || 'Please enter a valid email address'
      }
      return true
    },
  }),

  minLength: (length: number, message?: string) => ({
    minLength: length,
    custom: (value: string) => {
      if (value && value.length < length) {
        return message || `Must be at least ${length} characters`
      }
      return true
    },
  }),

  maxLength: (length: number, message?: string) => ({
    maxLength: length,
    custom: (value: string) => {
      if (value && value.length > length) {
        return message || `Must not exceed ${length} characters`
      }
      return true
    },
  }),

  ipAddress: (message?: string) => ({
    custom: (value: string) => {
      if (
        value &&
        !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          value
        )
      ) {
        return message || 'Please enter a valid IP address'
      }
      return true
    },
  }),

  hostname: (message?: string) => ({
    custom: (value: string) => {
      if (
        value &&
        !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
          value
        )
      ) {
        return message || 'Please enter a valid hostname'
      }
      return true
    },
  }),

  networkName: (message?: string) => ({
    custom: (value: string) => {
      if (value && !/^[a-zA-Z0-9]([a-zA-Z0-9\s-]{0,61}[a-zA-Z0-9])?$/.test(value)) {
        return message || 'Network name can only contain letters, numbers, spaces, and hyphens'
      }
      return true
    },
  }),
}
