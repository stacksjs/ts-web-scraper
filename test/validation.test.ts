import { describe, expect, it } from 'bun:test'
import {
  assert,
  createValidator,
  sanitize,
  validate,
  ValidationErrorCode,
} from '../src/validation'
import type { Schema } from '../src/validation'

describe('validate', () => {
  it('should validate string type', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    const result = validate({ name: 'John' }, schema)
    expect(result.valid).toBe(true)
    expect(result.data?.name).toBe('John')
  })

  it('should fail on invalid string type', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    const result = validate({ name: 123 }, schema)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_TYPE)
  })

  it('should validate number type', () => {
    const schema: Schema = {
      age: { type: 'number', required: true },
    }

    const result = validate({ age: 25 }, schema)
    expect(result.valid).toBe(true)
    expect(result.data?.age).toBe(25)
  })

  it('should fail on NaN', () => {
    const schema: Schema = {
      age: { type: 'number' },
    }

    const result = validate({ age: NaN }, schema)
    expect(result.valid).toBe(false)
  })

  it('should validate boolean type', () => {
    const schema: Schema = {
      active: { type: 'boolean' },
    }

    const result = validate({ active: true }, schema)
    expect(result.valid).toBe(true)
    expect(result.data?.active).toBe(true)
  })

  it('should validate object type', () => {
    const schema: Schema = {
      user: { type: 'object' },
    }

    const result = validate({ user: { name: 'John' } }, schema)
    expect(result.valid).toBe(true)
  })

  it('should fail on array when expecting object', () => {
    const schema: Schema = {
      user: { type: 'object' },
    }

    const result = validate({ user: [] }, schema)
    expect(result.valid).toBe(false)
  })

  it('should validate array type', () => {
    const schema: Schema = {
      tags: { type: 'array' },
    }

    const result = validate({ tags: ['a', 'b', 'c'] }, schema)
    expect(result.valid).toBe(true)
  })

  it('should validate date type', () => {
    const schema: Schema = {
      createdAt: { type: 'date' },
    }

    const result = validate({ createdAt: new Date() }, schema)
    expect(result.valid).toBe(true)
  })

  it('should validate date string', () => {
    const schema: Schema = {
      createdAt: { type: 'date' },
    }

    const result = validate({ createdAt: '2024-01-01' }, schema)
    expect(result.valid).toBe(true)
  })

  it('should validate email type', () => {
    const schema: Schema = {
      email: { type: 'email' },
    }

    const result = validate({ email: 'user@example.com' }, schema)
    expect(result.valid).toBe(true)
  })

  it('should fail on invalid email', () => {
    const schema: Schema = {
      email: { type: 'email' },
    }

    const result = validate({ email: 'not-an-email' }, schema)
    expect(result.valid).toBe(false)
  })

  it('should validate URL type', () => {
    const schema: Schema = {
      website: { type: 'url' },
    }

    const result = validate({ website: 'https://example.com' }, schema)
    expect(result.valid).toBe(true)
  })

  it('should fail on invalid URL', () => {
    const schema: Schema = {
      website: { type: 'url' },
    }

    const result = validate({ website: 'not a url' }, schema)
    expect(result.valid).toBe(false)
  })

  it('should validate required fields', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    const result = validate({}, schema)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe(ValidationErrorCode.REQUIRED_FIELD)
  })

  it('should use default values', () => {
    const schema: Schema = {
      status: { type: 'string', default: 'active' },
    }

    const result = validate({}, schema)
    expect(result.valid).toBe(true)
    expect(result.data?.status).toBe('active')
  })

  it('should validate min/max for numbers', () => {
    const schema: Schema = {
      age: { type: 'number', min: 18, max: 100 },
    }

    expect(validate({ age: 25 }, schema).valid).toBe(true)
    expect(validate({ age: 10 }, schema).valid).toBe(false)
    expect(validate({ age: 150 }, schema).valid).toBe(false)
  })

  it('should validate minLength/maxLength for strings', () => {
    const schema: Schema = {
      password: { type: 'string', minLength: 8, maxLength: 32 },
    }

    expect(validate({ password: 'password123' }, schema).valid).toBe(true)
    expect(validate({ password: 'short' }, schema).valid).toBe(false)
    expect(validate({ password: 'a'.repeat(40) }, schema).valid).toBe(false)
  })

  it('should validate minLength/maxLength for arrays', () => {
    const schema: Schema = {
      tags: { type: 'array', minLength: 1, maxLength: 5 },
    }

    expect(validate({ tags: ['a', 'b'] }, schema).valid).toBe(true)
    expect(validate({ tags: [] }, schema).valid).toBe(false)
    expect(validate({ tags: ['a', 'b', 'c', 'd', 'e', 'f'] }, schema).valid).toBe(false)
  })

  it('should validate pattern matching', () => {
    const schema: Schema = {
      username: { type: 'string', pattern: /^[a-zA-Z0-9_]+$/ },
    }

    expect(validate({ username: 'john_doe123' }, schema).valid).toBe(true)
    expect(validate({ username: 'john@doe' }, schema).valid).toBe(false)
  })

  it('should validate enum values', () => {
    const schema: Schema = {
      status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
    }

    expect(validate({ status: 'active' }, schema).valid).toBe(true)
    expect(validate({ status: 'unknown' }, schema).valid).toBe(false)
  })

  it('should validate nested objects', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        schema: {
          name: { type: 'string', required: true },
          email: { type: 'email', required: true },
        },
      },
    }

    const result = validate({
      user: {
        name: 'John',
        email: 'john@example.com',
      },
    }, schema)

    expect(result.valid).toBe(true)
  })

  it('should fail on invalid nested objects', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        schema: {
          name: { type: 'string', required: true },
          email: { type: 'email', required: true },
        },
      },
    }

    const result = validate({
      user: {
        name: 'John',
        email: 'not-an-email',
      },
    }, schema)

    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toContain('user.email')
  })

  it('should validate array items', () => {
    const schema: Schema = {
      numbers: {
        type: 'array',
        items: { type: 'number', min: 0, max: 100 },
      },
    }

    expect(validate({ numbers: [1, 2, 3] }, schema).valid).toBe(true)
    expect(validate({ numbers: [1, 2, -5] }, schema).valid).toBe(false)
  })

  it('should use transform function', () => {
    const schema: Schema = {
      age: {
        type: 'number',
        transform: (value: any) => Number.parseInt(value, 10),
      },
    }

    const result = validate({ age: '25' }, schema)
    expect(result.valid).toBe(true)
    expect(result.data?.age).toBe(25)
  })

  it('should use custom validation', () => {
    const schema: Schema = {
      username: {
        type: 'string',
        validate: (value: string) => value.length >= 3 || 'Username must be at least 3 characters',
      },
    }

    expect(validate({ username: 'john' }, schema).valid).toBe(true)
    expect(validate({ username: 'ab' }, schema).valid).toBe(false)
  })

  it('should allow any type', () => {
    const schema: Schema = {
      data: { type: 'any' },
    }

    expect(validate({ data: 'string' }, schema).valid).toBe(true)
    expect(validate({ data: 123 }, schema).valid).toBe(true)
    expect(validate({ data: { nested: true } }, schema).valid).toBe(true)
  })

  it('should handle empty strings as missing for required fields', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    const result = validate({ name: '' }, schema)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe(ValidationErrorCode.REQUIRED_FIELD)
  })

  it('should handle null values for required fields', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    const result = validate({ name: null }, schema)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe(ValidationErrorCode.REQUIRED_FIELD)
  })
})

describe('sanitize', () => {
  it('should trim strings by default', () => {
    const data = { name: '  John  ' }
    const result = sanitize(data)
    expect(result.name).toBe('John')
  })

  it('should remove empty strings when removeEmpty is true', () => {
    const data = { items: ['a', '', 'b', '', 'c'] }
    const result = sanitize(data, { removeEmpty: true })
    expect(result.items).toEqual(['a', 'b', 'c'])
  })

  it('should remove null values when removeNull is true', () => {
    const data = { items: ['a', null, 'b', null, 'c'] }
    const result = sanitize(data, { removeNull: true })
    expect(result.items).toEqual(['a', 'b', 'c'])
  })

  it('should lowercase strings when lowercase is true', () => {
    const data = { name: 'JOHN' }
    const result = sanitize(data, { lowercase: true })
    expect(result.name).toBe('john')
  })

  it('should uppercase strings when uppercase is true', () => {
    const data = { name: 'john' }
    const result = sanitize(data, { uppercase: true })
    expect(result.name).toBe('JOHN')
  })

  it('should sanitize nested objects', () => {
    const data = {
      user: {
        name: '  John  ',
        email: '  JOHN@EXAMPLE.COM  ',
      },
    }

    const result = sanitize(data, { trim: true, lowercase: true })
    expect(result.user.name).toBe('john')
    expect(result.user.email).toBe('john@example.com')
  })

  it('should sanitize arrays of objects', () => {
    const data = {
      users: [
        { name: '  John  ' },
        { name: '  Jane  ' },
      ],
    }

    const result = sanitize(data)
    expect(result.users[0].name).toBe('John')
    expect(result.users[1].name).toBe('Jane')
  })

  it('should not trim when trim is false', () => {
    const data = { name: '  John  ' }
    const result = sanitize(data, { trim: false })
    expect(result.name).toBe('  John  ')
  })

  it('should handle non-string values', () => {
    const data = {
      age: 25,
      active: true,
      items: [1, 2, 3],
    }

    const result = sanitize(data)
    expect(result).toEqual(data)
  })
})

describe('createValidator', () => {
  it('should create a reusable validator function', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0 },
    }

    const validateUser = createValidator(schema)

    expect(validateUser({ name: 'John', age: 25 }).valid).toBe(true)
    expect(validateUser({ name: 'Jane', age: -5 }).valid).toBe(false)
    expect(validateUser({ age: 25 }).valid).toBe(false)
  })
})

describe('assert', () => {
  it('should return validated data on success', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    const result = assert({ name: 'John' }, schema)
    expect(result.name).toBe('John')
  })

  it('should throw on validation failure', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
    }

    expect(() => assert({}, schema)).toThrow('Validation failed')
  })

  it('should include error messages in exception', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
      age: { type: 'number', min: 18 },
    }

    try {
      assert({ age: 10 }, schema)
      expect(true).toBe(false) // Should not reach here
    }
    catch (error: any) {
      expect(error.message).toContain('name')
      expect(error.message).toContain('age')
    }
  })
})

describe('complex validations', () => {
  it('should handle deeply nested structures', () => {
    const schema: Schema = {
      company: {
        type: 'object',
        schema: {
          name: { type: 'string', required: true },
          employees: {
            type: 'array',
            items: {
              type: 'object',
              schema: {
                name: { type: 'string', required: true },
                email: { type: 'email', required: true },
              },
            },
          },
        },
      },
    }

    const data = {
      company: {
        name: 'Acme Corp',
        employees: [
          { name: 'John', email: 'john@acme.com' },
          { name: 'Jane', email: 'jane@acme.com' },
        ],
      },
    }

    const result = validate(data, schema)
    expect(result.valid).toBe(true)
  })

  it('should collect multiple errors', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
      email: { type: 'email', required: true },
      age: { type: 'number', min: 18, max: 100 },
      password: { type: 'string', minLength: 8 },
    }

    const result = validate({
      email: 'invalid-email',
      age: 150,
      password: 'short',
    }, schema)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBe(4)
  })
})
