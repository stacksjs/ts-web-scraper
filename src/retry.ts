/**
 * Retry Logic with Exponential Backoff
 *
 * Provides reliable request retrying with configurable backoff strategies
 */

import type { ScraperError } from './errors'
import { toScraperError } from './errors'

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number

  /**
   * Maximum delay in milliseconds
   * @default 30000
   */
  maxDelay?: number

  /**
   * Backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number

  /**
   * Add random jitter to prevent thundering herd
   * @default true
   */
  jitter?: boolean

  /**
   * HTTP status codes to retry on
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryOn?: number[]

  /**
   * Custom function to determine if error is retryable
   */
  shouldRetry?: (error: ScraperError, attempt: number) => boolean

  /**
   * Callback called before each retry
   */
  onRetry?: (error: ScraperError, attempt: number, delay: number) => void

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

export interface RetryStats {
  attempts: number
  totalDelay: number
  lastError?: ScraperError
  success: boolean
}

const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryOn = DEFAULT_RETRY_STATUS_CODES,
    shouldRetry,
    onRetry,
    debug = false,
  } = options

  let lastError: ScraperError | null = null
  let _totalDelay = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (debug && attempt > 0) {
        // Debug: Attempt ${attempt}/${maxRetries}
      }

      const result = await fn()
      return result
    }
    catch (error) {
      lastError = toScraperError(error)

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries
      if (isLastAttempt) {
        throw lastError
      }

      // Use custom shouldRetry if provided
      if (shouldRetry && !shouldRetry(lastError, attempt + 1)) {
        if (debug) {
          // Debug: Custom shouldRetry returned false, not retrying
        }
        throw lastError
      }

      // Check if error is retryable
      if (!shouldRetry) {
        // If there's a status code, check retryOn list first
        if (lastError.statusCode) {
          if (!retryOn.includes(lastError.statusCode)) {
            if (debug) {
              // Debug: Status code ${lastError.statusCode} is not in retryOn list
            }
            throw lastError
          }
          // Status code is in retryOn list, continue to retry
        }
        else {
          // No status code, check if it's a retryable error type
          if (!lastError.retryable) {
            if (debug) {
              // Debug: Error ${lastError.code} is not retryable
            }
            throw lastError
          }
        }
      }

      // Calculate delay with exponential backoff
      let delay = initialDelay * (backoffMultiplier ** attempt)
      delay = Math.min(delay, maxDelay)

      // Add jitter to prevent thundering herd
      if (jitter) {
        // Random between 50% and 100% of delay
        delay = delay * (0.5 + Math.random() * 0.5)
      }

      _totalDelay += delay

      if (debug) {
        // Debug: Waiting ${Math.round(delay)}ms before attempt ${attempt + 2}
      }

      // Call onRetry callback
      if (onRetry) {
        onRetry(lastError, attempt + 1, delay)
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Max retries exceeded')
}

/**
 * Create a retry wrapper for a function
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {},
): T {
  return ((...args: any[]) => {
    return withRetry(() => fn(...args), options)
  }) as T
}

/**
 * Calculate the delay for a given attempt
 */
export function calculateDelay(
  attempt: number,
  options: Pick<RetryOptions, 'initialDelay' | 'maxDelay' | 'backoffMultiplier' | 'jitter'> = {},
): number {
  const {
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
  } = options

  let delay = initialDelay * (backoffMultiplier ** attempt)
  delay = Math.min(delay, maxDelay)

  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5)
  }

  return delay
}

/**
 * Retry budget - limit total retry time
 */
export class RetryBudget {
  private startTime: number
  private totalRetries = 0
  private successfulRetries = 0

  constructor(
    private readonly maxDuration: number = 60000, // 1 minute
    private readonly maxRetries: number = 10,
  ) {
    this.startTime = Date.now()
  }

  /**
   * Check if we can retry
   */
  canRetry(): boolean {
    const elapsed = Date.now() - this.startTime
    return elapsed < this.maxDuration && this.totalRetries < this.maxRetries
  }

  /**
   * Record a retry attempt
   */
  recordRetry(success: boolean): void {
    this.totalRetries++
    if (success) {
      this.successfulRetries++
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalRetries: number
    successfulRetries: number
    failedRetries: number
    elapsed: number
    remaining: number
    canRetry: boolean
  } {
    return {
      totalRetries: this.totalRetries,
      successfulRetries: this.successfulRetries,
      failedRetries: this.totalRetries - this.successfulRetries,
      elapsed: Date.now() - this.startTime,
      remaining: this.maxDuration - (Date.now() - this.startTime),
      canRetry: this.canRetry(),
    }
  }

  /**
   * Reset the budget
   */
  reset(): void {
    this.startTime = Date.now()
    this.totalRetries = 0
    this.successfulRetries = 0
  }
}
