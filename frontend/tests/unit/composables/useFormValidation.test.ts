import { describe, it, expect, beforeEach } from 'vitest'
import { useFormValidation, validationRules } from '@/composables/useFormValidation'
import type { FormField } from '@/types'

describe('useFormValidation', () => {
  describe('basic functionality', () => {
    const fields: Record<string, FormField> = {
      name: {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
        validation: {
          required: true,
          minLength: 2,
          maxLength: 50,
        },
      },
      email: {
        label: 'Email',
        name: 'email',
        type: 'email',
        required: false,
        validation: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
    }

    it('should initialize with correct state', () => {
      const initialValues = { name: 'John', email: '' }
      const { form, isFormValid } = useFormValidation(fields, initialValues)
      
      expect(form.values).toEqual(initialValues)
      expect(form.errors).toEqual({})
      expect(form.touched).toEqual({})
      expect(form.submitting).toBe(false)
      expect(isFormValid.value).toBe(true) // Valid because name is provided and email is not required
    })

    it('should validate required fields', () => {
      const { form, validate, isFormValid } = useFormValidation(fields)
      
      const isValid = validate('name')
      
      expect(isValid).toBe(false)
      expect(form.errors.name).toBe('Name is required')
      expect(isFormValid.value).toBe(false)
    })

    it('should validate field length', () => {
      const { form, validate } = useFormValidation(fields)
      
      form.values.name = 'A' // Too short
      const isValid = validate('name')
      
      expect(isValid).toBe(false)
      expect(form.errors.name).toBe('Name must be at least 2 characters')
    })

    it('should validate field max length', () => {
      const { form, validate } = useFormValidation(fields)
      
      form.values.name = 'A'.repeat(51) // Too long
      const isValid = validate('name')
      
      expect(isValid).toBe(false)
      expect(form.errors.name).toBe('Name must not exceed 50 characters')
    })

    it('should validate email pattern', () => {
      const { form, validate } = useFormValidation(fields)
      
      form.values.email = 'invalid-email'
      const isValid = validate('email')
      
      expect(isValid).toBe(false)
      expect(form.errors.email).toBe('Email format is invalid')
    })

    it('should pass validation with valid values', () => {
      const { form, validate } = useFormValidation(fields)
      
      form.values.name = 'John Doe'
      form.values.email = 'john@example.com'
      
      const isValid = validate()
      
      expect(isValid).toBe(true)
      expect(Object.keys(form.errors)).toHaveLength(0)
    })

    it('should set field values and clear errors', () => {
      const { form, setFieldValue } = useFormValidation(fields)
      
      // Set an error first
      form.errors.name = 'Some error'
      
      setFieldValue('name', 'John')
      
      expect(form.values.name).toBe('John')
      expect(form.errors.name).toBeUndefined()
    })

    it('should set and clear field errors', () => {
      const { form, setFieldError, clearFieldError } = useFormValidation(fields)
      
      setFieldError('name', 'Custom error')
      expect(form.errors.name).toBe('Custom error')
      
      clearFieldError('name')
      expect(form.errors.name).toBeUndefined()
    })

    it('should clear all errors', () => {
      const { form, clearAllErrors } = useFormValidation(fields)
      
      form.errors = { name: 'Error 1', email: 'Error 2' }
      
      clearAllErrors()
      
      expect(form.errors).toEqual({})
    })

    it('should mark fields as touched', () => {
      const { form, markFieldTouched } = useFormValidation(fields)
      
      markFieldTouched('name')
      
      expect(form.touched.name).toBe(true)
    })

    it('should reset form', () => {
      const initialValues = { name: 'Initial', email: 'initial@example.com' }
      const { form, resetForm } = useFormValidation(fields, initialValues)
      
      // Make changes
      form.values.name = 'Changed'
      form.errors.name = 'Some error'
      form.touched.name = true
      form.submitting = true
      
      resetForm()
      
      expect(form.values).toEqual(initialValues)
      expect(form.errors).toEqual({})
      expect(form.touched).toEqual({})
      expect(form.submitting).toBe(false)
    })

    it('should check field validity', () => {
      const { form, isFieldValid, setFieldError } = useFormValidation(fields)
      
      expect(isFieldValid('name')).toBe(true)
      
      setFieldError('name', 'Error')
      expect(isFieldValid('name')).toBe(false)
    })
  })

  describe('custom validation', () => {
    const fields: Record<string, FormField> = {
      password: {
        label: 'Password',
        name: 'password',
        type: 'password',
        validation: {
          custom: (value: unknown) => {
            const str = value as string
            if (!str) return 'Password is required'
            if (str.length < 8) return 'Password must be at least 8 characters'
            if (!/[A-Z]/.test(str)) return 'Password must contain uppercase letter'
            return true
          },
        },
      },
    }

    it('should use custom validation function', () => {
      const { form, validate } = useFormValidation(fields)
      
      form.values.password = 'weak'
      let isValid = validate('password')
      expect(isValid).toBe(false)
      expect(form.errors.password).toBe('Password must be at least 8 characters')
      
      form.values.password = 'weakpassword'
      isValid = validate('password')
      expect(isValid).toBe(false)
      expect(form.errors.password).toBe('Password must contain uppercase letter')
      
      form.values.password = 'StrongPassword'
      isValid = validate('password')
      expect(isValid).toBe(true)
      expect(form.errors.password).toBeUndefined()
    })
  })

  describe('validation rules', () => {
    it('should validate required rule', () => {
      const rule = validationRules.required('Custom required message')
      
      expect(rule.custom('')).toBe('Custom required message')
      expect(rule.custom(null)).toBe('Custom required message')
      expect(rule.custom(undefined)).toBe('Custom required message')
      expect(rule.custom('value')).toBe(true)
    })

    it('should validate email rule', () => {
      const rule = validationRules.email('Custom email message')
      
      expect(rule.custom('invalid')).toBe('Custom email message')
      expect(rule.custom('test@example.com')).toBe(true)
      expect(rule.custom('')).toBe(true) // Empty is valid (not required)
    })

    it('should validate min length rule', () => {
      const rule = validationRules.minLength(5, 'Custom min length message')
      
      expect(rule.custom('abc')).toBe('Custom min length message')
      expect(rule.custom('abcde')).toBe(true)
      expect(rule.custom('abcdef')).toBe(true)
    })

    it('should validate max length rule', () => {
      const rule = validationRules.maxLength(5, 'Custom max length message')
      
      expect(rule.custom('abcdef')).toBe('Custom max length message')
      expect(rule.custom('abcde')).toBe(true)
      expect(rule.custom('abc')).toBe(true)
    })

    it('should validate IP address rule', () => {
      const rule = validationRules.ipAddress('Custom IP message')
      
      expect(rule.custom('192.168.1.1')).toBe(true)
      expect(rule.custom('256.256.256.256')).toBe('Custom IP message')
      expect(rule.custom('invalid')).toBe('Custom IP message')
      expect(rule.custom('')).toBe(true) // Empty is valid
    })

    it('should validate hostname rule', () => {
      const rule = validationRules.hostname('Custom hostname message')
      
      expect(rule.custom('localhost')).toBe(true)
      expect(rule.custom('example.com')).toBe(true)
      expect(rule.custom('sub.example.com')).toBe(true)
      expect(rule.custom('invalid..hostname')).toBe('Custom hostname message')
      expect(rule.custom('')).toBe(true) // Empty is valid
    })

    it('should validate network name rule', () => {
      const rule = validationRules.networkName('Custom network message')
      
      expect(rule.custom('Home Network')).toBe(true)
      expect(rule.custom('Network-1')).toBe(true)
      expect(rule.custom('Network123')).toBe(true)
      expect(rule.custom('Invalid@Network')).toBe('Custom network message')
      expect(rule.custom('')).toBe(true) // Empty is valid
    })
  })

  describe('form validity computation', () => {
    it('should be invalid when required fields are missing', () => {
      const fields: Record<string, FormField> = {
        required: {
          label: 'Required',
          name: 'required',
          type: 'text',
          required: true,
        },
        optional: {
          label: 'Optional',
          name: 'optional',
          type: 'text',
          required: false,
        },
      }
      
      const { isFormValid } = useFormValidation(fields)
      
      expect(isFormValid.value).toBe(false)
    })

    it('should be invalid when there are validation errors', () => {
      const fields: Record<string, FormField> = {
        field: {
          label: 'Field',
          name: 'field',
          type: 'text',
          validation: {
            minLength: 5,
          },
        },
      }
      
      const { form, isFormValid, validate } = useFormValidation(fields, { field: 'abc' })
      
      validate('field') // This should create an error
      
      expect(isFormValid.value).toBe(false)
    })

    it('should be valid when all required fields have values and no errors', () => {
      const fields: Record<string, FormField> = {
        required: {
          label: 'Required',
          name: 'required',
          type: 'text',
          required: true,
        },
      }
      
      const { isFormValid } = useFormValidation(fields, { required: 'value' })
      
      expect(isFormValid.value).toBe(true)
    })
  })
})