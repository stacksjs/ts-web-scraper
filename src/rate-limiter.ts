/**
 * Rate Limiter using Token Bucket Algorithm
 *
 * Allows smooth rate limiting with burst support.
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export interface RateLimiterOptions {
  /**
   * Maximum requests per second
   * @default undefined (no limit)
   */
  requestsPerSecond?: number

  /**
   * Maximum requests per minute
   * @default undefined (no limit)
   */
  requestsPerMinute?: number

  /**
   * Maximum requests per hour
   * @default undefined (no limit)
   */
  requestsPerHour?: number

  /**
   * Burst size - allow this many requests at once
   * @default requestsPerSecond or 10
   */
  burstSize?: number

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

export interface RateLimiterStats {
  totalRequests: number
  throttledRequests: number
  currentRate: number
  remainingCapacity: number
  nextRefillTime: number
}

/**
 * Token Bucket Rate Limiter
 *
 * Tokens are added at a constant rate and consumed by requests.
 * Allows bursts up to burstSize.
 */
export class RateLimiter {
  private tokens: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per millisecond
  private lastRefill: number
  private totalRequests = 0
  private throttledRequests = 0
  private readonly debug: boolean

  constructor(options: RateLimiterOptions = {}) {
    const {
      requestsPerSecond,
      requestsPerMinute,
      requestsPerHour,
      burstSize,
      debug = false,
    } = options

    // Calculate the most restrictive rate limit
    let tokensPerMs = Number.POSITIVE_INFINITY

    if (requestsPerSecond) {
      tokensPerMs = Math.min(tokensPerMs, requestsPerSecond / 1000)
    }

    if (requestsPerMinute) {
      tokensPerMs = Math.min(tokensPerMs, requestsPerMinute / 60000)
    }

    if (requestsPerHour) {
      tokensPerMs = Math.min(tokensPerMs, requestsPerHour / 3600000)
    }

    // If no rate limit specified, use no limiting
    if (tokensPerMs === Number.POSITIVE_INFINITY) {
      tokensPerMs = Number.POSITIVE_INFINITY
      this.maxTokens = Number.POSITIVE_INFINITY
    }
    else {
      this.maxTokens = burstSize || Math.max(Math.ceil(tokensPerMs * 1000), 10)
    }

    this.refillRate = tokensPerMs
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
    this.debug = debug

    if (this.debug) {
      console.log('[RateLimiter] Initialized:', {
        maxTokens: this.maxTokens,
        refillRate: this.refillRate,
        requestsPerSecond,
        requestsPerMinute,
        requestsPerHour,
      })
    }
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    if (this.refillRate === Number.POSITIVE_INFINITY) {
      return // No rate limiting
    }

    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = timePassed * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now

    if (this.debug && tokensToAdd > 0) {
      console.log('[RateLimiter] Refilled:', {
        tokensToAdd,
        currentTokens: this.tokens,
        timePassed,
      })
    }
  }

  /**
   * Wait until a token is available, then consume it
   */
  async throttle(): Promise<void> {
    this.totalRequests++

    // No rate limiting
    if (this.refillRate === Number.POSITIVE_INFINITY) {
      return
    }

    this.refill()

    // If we have tokens, consume one and return
    if (this.tokens >= 1) {
      this.tokens -= 1
      if (this.debug) {
        console.log('[RateLimiter] Token consumed:', {
          remainingTokens: this.tokens,
        })
      }
      return
    }

    // Need to wait for token
    this.throttledRequests++
    const tokensNeeded = 1 - this.tokens
    const waitTime = Math.ceil(tokensNeeded / this.refillRate)

    if (this.debug) {
      console.log('[RateLimiter] Throttling:', {
        waitTime,
        tokensNeeded,
        currentTokens: this.tokens,
      })
    }

    await new Promise(resolve => setTimeout(resolve, waitTime))

    // Refill after waiting and consume token
    this.refill()
    this.tokens -= 1
  }

  /**
   * Try to consume a token without waiting
   * @returns true if token was consumed, false if not available
   */
  tryConsume(): boolean {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens -= 1
      this.totalRequests++
      return true
    }

    return false
  }

  /**
   * Get current rate in requests per second
   */
  getCurrentRate(): number {
    if (this.refillRate === Number.POSITIVE_INFINITY) {
      return Number.POSITIVE_INFINITY
    }
    return this.refillRate * 1000
  }

  /**
   * Get remaining capacity (0-1)
   */
  getRemainingCapacity(): number {
    if (this.maxTokens === Number.POSITIVE_INFINITY) {
      return 1
    }
    this.refill()
    return this.tokens / this.maxTokens
  }

  /**
   * Get time until next token is available (in ms)
   */
  getNextRefillTime(): number {
    if (this.refillRate === Number.POSITIVE_INFINITY) {
      return 0
    }
    if (this.tokens >= 1) {
      return 0
    }
    const tokensNeeded = 1 - this.tokens
    return Math.ceil(tokensNeeded / this.refillRate)
  }

  /**
   * Get statistics
   */
  getStats(): RateLimiterStats {
    this.refill()
    return {
      totalRequests: this.totalRequests,
      throttledRequests: this.throttledRequests,
      currentRate: this.getCurrentRate(),
      remainingCapacity: this.getRemainingCapacity(),
      nextRefillTime: this.getNextRefillTime(),
    }
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
    this.totalRequests = 0
    this.throttledRequests = 0

    if (this.debug) {
      console.log('[RateLimiter] Reset')
    }
  }
}

/**
 * Create a global rate limiter instance
 */
let globalRateLimiter: RateLimiter | null = null

export function getGlobalRateLimiter(options?: RateLimiterOptions): RateLimiter {
  if (!globalRateLimiter || options) {
    globalRateLimiter = new RateLimiter(options)
  }
  return globalRateLimiter
}

export function resetGlobalRateLimiter(): void {
  globalRateLimiter = null
}
