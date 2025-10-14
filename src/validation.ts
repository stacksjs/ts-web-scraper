/**
 * Data Validation
 *
 * Lightweight schema validation for scraped data
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export enum ValidationErrorCode {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  INVALID_LENGTH = 'INVALID_LENGTH',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  CUSTOM_VALIDATION = 'CUSTOM_VALIDATION',
}

export interface ValidationError {
  field: string
  code: ValidationErrorCode
  message: string
  value?: any
}

export interface ValidationResult<T = any> {
  valid: boolean
  data?: T
  errors: ValidationError[]
}

export type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
  | 'email'
  | 'url'
  | 'any'

export interface FieldSchema {
  type: SchemaType
  required?: boolean
  default?: any
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  enum?: any[]
  transform?: (value: any) => any
  validate?: (value: any) => boolean | string
  schema?: Schema // For nested objects
  items?: FieldSchema // For arrays
}

export type Schema = Record<string, FieldSchema>

/**
 * Validate data against a schema
 */
export function validate<T = any>(data: any, schema: Schema): ValidationResult<T> {
  const errors: ValidationError[] = []
  const validated: any = {}

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = data?.[field]

    // Handle required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        code: ValidationErrorCode.REQUIRED_FIELD,
        message: `Field '${field}' is required`,
        value,
      })
      continue
    }

    // Handle optional fields with defaults
    if (value === undefined || value === null) {
      if (fieldSchema.default !== undefined) {
        validated[field] = fieldSchema.default
      }
      continue
    }

    // Transform value if transformer provided
    let processedValue = value
    if (fieldSchema.transform) {
      try {
        processedValue = fieldSchema.transform(value)
      }
      catch (error) {
        errors.push({
          field,
          code: ValidationErrorCode.CUSTOM_VALIDATION,
          message: `Failed to transform field '${field}': ${error}`,
          value,
        })
        continue
      }
    }

    // Type validation
    const typeError = validateType(field, processedValue, fieldSchema)
    if (typeError) {
      errors.push(typeError)
      continue
    }

    // Additional validations
    const additionalErrors = performAdditionalValidations(field, processedValue, fieldSchema)
    errors.push(...additionalErrors)

    if (additionalErrors.length === 0) {
      validated[field] = processedValue
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? validated as T : undefined,
    errors,
  }
}

/**
 * Validate type
 */
function validateType(field: string, value: any, schema: FieldSchema): ValidationError | null {
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field,
          code: ValidationErrorCode.INVALID_TYPE,
          message: `Field '${field}' must be a string`,
          value,
        }
      }
      break

    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return {
          field,
          code: ValidationErrorCode.INVALID_TYPE,
          message: `Field '${field}' must be a number`,
          value,
        }
      }
      break

    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          field,
          code: ValidationErrorCode.INVALID_TYPE,
          message: `Field '${field}' must be a boolean`,
          value,
        }
      }
      break

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {
          field,
          code: ValidationErrorCode.INVALID_TYPE,
          message: `Field '${field}' must be an object`,
          value,
        }
      }
      break

    case 'array':
      if (!Array.isArray(value)) {
        return {
          field,
          code: ValidationErrorCode.INVALID_TYPE,
          message: `Field '${field}' must be an array`,
          value,
        }
      }
      break

    case 'date':
      if (!(value instanceof Date) && !isValidDateString(value)) {
        return {
          field,
          code: ValidationErrorCode.INVALID_TYPE,
          message: `Field '${field}' must be a valid date`,
          value,
        }
      }
      break

    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return {
          field,
          code: ValidationErrorCode.INVALID_FORMAT,
          message: `Field '${field}' must be a valid email`,
          value,
        }
      }
      break

    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return {
          field,
          code: ValidationErrorCode.INVALID_FORMAT,
          message: `Field '${field}' must be a valid URL`,
          value,
        }
      }
      break

    case 'any':
      // No type validation for 'any'
      break
  }

  return null
}

/**
 * Perform additional validations
 */
function performAdditionalValidations(
  field: string,
  value: any,
  schema: FieldSchema,
): ValidationError[] {
  const errors: ValidationError[] = []

  // Min/max for numbers
  if (schema.type === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        field,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: `Field '${field}' must be at least ${schema.min}`,
        value,
      })
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        field,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: `Field '${field}' must be at most ${schema.max}`,
        value,
      })
    }
  }

  // MinLength/maxLength for strings and arrays
  if (schema.type === 'string' || schema.type === 'array') {
    const length = schema.type === 'string' ? value.length : value.length

    if (schema.minLength !== undefined && length < schema.minLength) {
      errors.push({
        field,
        code: ValidationErrorCode.INVALID_LENGTH,
        message: `Field '${field}' must have at least ${schema.minLength} ${schema.type === 'string' ? 'characters' : 'items'}`,
        value,
      })
    }

    if (schema.maxLength !== undefined && length > schema.maxLength) {
      errors.push({
        field,
        code: ValidationErrorCode.INVALID_LENGTH,
        message: `Field '${field}' must have at most ${schema.maxLength} ${schema.type === 'string' ? 'characters' : 'items'}`,
        value,
      })
    }
  }

  // Pattern matching for strings
  if (schema.type === 'string' && schema.pattern) {
    if (!schema.pattern.test(value)) {
      errors.push({
        field,
        code: ValidationErrorCode.PATTERN_MISMATCH,
        message: `Field '${field}' does not match required pattern`,
        value,
      })
    }
  }

  // Enum validation
  if (schema.enum && schema.enum.length > 0) {
    if (!schema.enum.includes(value)) {
      errors.push({
        field,
        code: ValidationErrorCode.INVALID_FORMAT,
        message: `Field '${field}' must be one of: ${schema.enum.join(', ')}`,
        value,
      })
    }
  }

  // Nested object validation
  if (schema.type === 'object' && schema.schema) {
    const nestedResult = validate(value, schema.schema)
    if (!nestedResult.valid) {
      for (const error of nestedResult.errors) {
        errors.push({
          ...error,
          field: `${field}.${error.field}`,
        })
      }
    }
  }

  // Array items validation
  if (schema.type === 'array' && schema.items) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      const itemErrors = performAdditionalValidations(`${field}[${i}]`, item, schema.items)
      errors.push(...itemErrors)

      const typeError = validateType(`${field}[${i}]`, item, schema.items)
      if (typeError) {
        errors.push(typeError)
      }
    }
  }

  // Custom validation
  if (schema.validate) {
    const result = schema.validate(value)
    if (result !== true) {
      errors.push({
        field,
        code: ValidationErrorCode.CUSTOM_VALIDATION,
        message: typeof result === 'string' ? result : `Field '${field}' failed custom validation`,
        value,
      })
    }
  }

  return errors
}

/**
 * Check if a string is a valid email
 */
function isValidEmail(email: string): boolean {
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    const _parsed = new URL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * Check if a value can be parsed as a date
 */
function isValidDateString(value: any): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false
  }

  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

/**
 * Sanitize and clean scraped data
 */
export function sanitize<T = any>(data: any, options: {
  trim?: boolean
  removeEmpty?: boolean
  removeNull?: boolean
  lowercase?: boolean
  uppercase?: boolean
} = {}): T {
  const {
    trim = true,
    removeEmpty = false,
    removeNull = false,
    lowercase = false,
    uppercase = false,
  } = options

  if (Array.isArray(data)) {
    return data
      .map(item => sanitize(item, options))
      .filter((item) => {
        if (removeEmpty && item === '') {
          return false
        }
        if (removeNull && item === null) {
          return false
        }
        return true
      }) as T
  }

  if (typeof data === 'object' && data !== null) {
    const result: any = {}

    for (const [key, value] of Object.entries(data)) {
      const sanitized = sanitize(value, options)

      if (removeEmpty && sanitized === '') {
        continue
      }
      if (removeNull && sanitized === null) {
        continue
      }

      result[key] = sanitized
    }

    return result
  }

  if (typeof data === 'string') {
    let result = data

    if (trim) {
      result = result.trim()
    }

    if (lowercase) {
      result = result.toLowerCase()
    }

    if (uppercase) {
      result = result.toUpperCase()
    }

    return result as T
  }

  return data
}

/**
 * Create a validator function for a schema
 */
export function createValidator<T = any>(schema: Schema) {
  return (data: any): ValidationResult<T> => {
    return validate<T>(data, schema)
  }
}

/**
 * Assert that data matches a schema (throws on validation failure)
 */
export function assert<T = any>(data: any, schema: Schema): T {
  const result = validate<T>(data, schema)

  if (!result.valid) {
    const messages = result.errors.map(e => e.message).join('; ')
    throw new Error(`Validation failed: ${messages}`)
  }

  return result.data!
}
