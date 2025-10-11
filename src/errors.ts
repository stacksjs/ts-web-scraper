/**
 * Enhanced Error Handling
 *
 * Provides detailed error types and context for better debugging
 */

export enum ErrorCode {
  // Network errors
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  DNS_ERROR = 'DNS_ERROR',

  // HTTP errors
  HTTP_ERROR = 'HTTP_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BLOCKED_ERROR = 'BLOCKED_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',

  // Parsing errors
  PARSE_ERROR = 'PARSE_ERROR',
  INVALID_HTML = 'INVALID_HTML',
  INVALID_JSON = 'INVALID_JSON',
  INVALID_XML = 'INVALID_XML',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCHEMA_ERROR = 'SCHEMA_ERROR',

  // Scraping errors
  NO_DATA_FOUND = 'NO_DATA_FOUND',
  SELECTOR_NOT_FOUND = 'SELECTOR_NOT_FOUND',
  JAVASCRIPT_ERROR = 'JAVASCRIPT_ERROR',

  // System errors
  CACHE_ERROR = 'CACHE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ScraperError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode?: number
  public readonly url?: string
  public readonly retryable: boolean
  public readonly context: Record<string, any>
  public readonly timestamp: Date

  constructor(
    message: string,
    code: ErrorCode,
    options: {
      statusCode?: number
      url?: string
      retryable?: boolean
      context?: Record<string, any>
      cause?: Error
    } = {},
  ) {
    super(message)
    this.name = 'ScraperError'
    this.code = code
    this.statusCode = options.statusCode
    this.url = options.url
    this.retryable = options.retryable ?? isRetryableError(code, options.statusCode)
    this.context = options.context || {}
    this.timestamp = new Date()

    // Maintain proper stack trace
    if (options.cause) {
      this.cause = options.cause
      if (options.cause.stack) {
        this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`
      }
    }

    Error.captureStackTrace(this, this.constructor)
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      url: this.url,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(code: ErrorCode, statusCode?: number): boolean {
  // Network errors are retryable
  if ([
    ErrorCode.TIMEOUT,
    ErrorCode.NETWORK_ERROR,
    ErrorCode.CONNECTION_REFUSED,
    ErrorCode.DNS_ERROR,
  ].includes(code)) {
    return true
  }

  // Some HTTP errors are retryable
  if (code === ErrorCode.HTTP_ERROR && statusCode) {
    // 408 Request Timeout
    // 429 Too Many Requests
    // 500 Internal Server Error
    // 502 Bad Gateway
    // 503 Service Unavailable
    // 504 Gateway Timeout
    return [408, 429, 500, 502, 503, 504].includes(statusCode)
  }

  // Rate limit errors should be retried (with backoff)
  if (code === ErrorCode.RATE_LIMIT_ERROR) {
    return true
  }

  // Parsing and validation errors are not retryable
  return false
}

/**
 * Convert a generic error to ScraperError
 */
export function toScraperError(error: unknown, url?: string): ScraperError {
  if (error instanceof ScraperError) {
    return error
  }

  if (error instanceof Error) {
    // Try to determine the error type
    const message = error.message.toLowerCase()

    if (message.includes('timeout') || message.includes('timed out')) {
      return new ScraperError('Request timeout', ErrorCode.TIMEOUT, {
        url,
        cause: error,
      })
    }

    if (message.includes('network') || message.includes('fetch failed')) {
      return new ScraperError('Network error', ErrorCode.NETWORK_ERROR, {
        url,
        cause: error,
      })
    }

    if (message.includes('dns') || message.includes('enotfound')) {
      return new ScraperError('DNS resolution failed', ErrorCode.DNS_ERROR, {
        url,
        cause: error,
      })
    }

    if (message.includes('refused') || message.includes('econnrefused')) {
      return new ScraperError('Connection refused', ErrorCode.CONNECTION_REFUSED, {
        url,
        cause: error,
      })
    }

    if (message.includes('json')) {
      return new ScraperError('Invalid JSON', ErrorCode.INVALID_JSON, {
        url,
        cause: error,
      })
    }

    if (message.includes('xml')) {
      return new ScraperError('Invalid XML', ErrorCode.INVALID_XML, {
        url,
        cause: error,
      })
    }

    // Generic error
    return new ScraperError(error.message, ErrorCode.UNKNOWN_ERROR, {
      url,
      cause: error,
    })
  }

  // Non-Error object
  return new ScraperError(
    String(error),
    ErrorCode.UNKNOWN_ERROR,
    { url },
  )
}

/**
 * Create HTTP error from response
 */
export function createHTTPError(statusCode: number, url: string, statusText?: string): ScraperError {
  const message = `HTTP ${statusCode}${statusText ? `: ${statusText}` : ''}`

  let code = ErrorCode.HTTP_ERROR
  if (statusCode === 429) {
    code = ErrorCode.RATE_LIMIT_ERROR
  }
  else if (statusCode === 403) {
    code = ErrorCode.BLOCKED_ERROR
  }
  else if (statusCode === 401 || statusCode === 407) {
    code = ErrorCode.AUTH_ERROR
  }

  return new ScraperError(message, code, {
    statusCode,
    url,
  })
}
