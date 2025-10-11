import { describe, expect, it } from 'bun:test'
import { ErrorCode, ScraperError } from '../src/errors'
import { calculateDelay, retryable, RetryBudget, withRetry } from '../src/retry'

describe('Retry Logic', () => {
  it('should succeed on first attempt', async () => {
    let attempts = 0

    const result = await withRetry(async () => {
      attempts++
      return 'success'
    })

    expect(result).toBe('success')
    expect(attempts).toBe(1)
  })

  it('should retry on retryable error', async () => {
    let attempts = 0

    const result = await withRetry(
      async () => {
        attempts++
        if (attempts < 3) {
          throw new ScraperError('Temporary error', ErrorCode.NETWORK_ERROR)
        }
        return 'success'
      },
      {
        maxRetries: 3,
        initialDelay: 10,
      },
    )

    expect(result).toBe('success')
    expect(attempts).toBe(3)
  })

  it('should not retry on non-retryable error', async () => {
    let attempts = 0

    try {
      await withRetry(
        async () => {
          attempts++
          throw new ScraperError('Parse error', ErrorCode.PARSE_ERROR)
        },
        {
          maxRetries: 3,
          initialDelay: 10,
        },
      )
      expect(true).toBe(false) // Should not reach here
    }
    catch (error) {
      expect(attempts).toBe(1) // Should fail immediately
      expect(error).toBeInstanceOf(ScraperError)
      expect((error as ScraperError).code).toBe(ErrorCode.PARSE_ERROR)
    }
  })

  it('should respect maxRetries', async () => {
    let attempts = 0

    try {
      await withRetry(
        async () => {
          attempts++
          throw new ScraperError('Always fails', ErrorCode.NETWORK_ERROR)
        },
        {
          maxRetries: 2,
          initialDelay: 10,
        },
      )
    }
    catch (error) {
      expect(attempts).toBe(3) // Initial + 2 retries
    }
  })

  it('should use exponential backoff', async () => {
    const delays: number[] = []
    let attempts = 0

    try {
      await withRetry(
        async () => {
          attempts++
          if (attempts > 1) {
            delays.push(Date.now())
          }
          throw new ScraperError('Temp error', ErrorCode.NETWORK_ERROR)
        },
        {
          maxRetries: 3,
          initialDelay: 100,
          backoffMultiplier: 2,
          jitter: false, // Disable jitter for predictable testing
        },
      )
    }
    catch (error) {
      // Check delays are increasing (exponentially)
      expect(delays.length).toBe(3)

      if (delays.length >= 2) {
        const delay1 = delays[1] - delays[0]
        expect(delay1).toBeGreaterThanOrEqual(180) // ~200ms (100 * 2^1)
      }
    }
  })

  it('should use custom shouldRetry function', async () => {
    let attempts = 0

    try {
      await withRetry(
        async () => {
          attempts++
          throw new ScraperError('Custom error', ErrorCode.NETWORK_ERROR)
        },
        {
          maxRetries: 5,
          initialDelay: 10,
          shouldRetry: (error, attempt) => attempt < 2, // Only retry once
        },
      )
    }
    catch (error) {
      expect(attempts).toBe(2) // Initial + 1 retry
    }
  })

  it('should call onRetry callback', async () => {
    const retries: number[] = []
    let attempts = 0

    await withRetry(
      async () => {
        attempts++
        if (attempts < 3) {
          throw new ScraperError('Temp', ErrorCode.NETWORK_ERROR)
        }
        return 'success'
      },
      {
        maxRetries: 3,
        initialDelay: 10,
        onRetry: (error, attempt, delay) => {
          retries.push(attempt)
        },
      },
    )

    expect(retries).toEqual([1, 2]) // Called before retry 1 and 2
  })

  it('should respect maxDelay', async () => {
    const delay = calculateDelay(10, {
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 5000,
      jitter: false,
    })

    // 1000 * 2^10 = 1,024,000 but capped at 5000
    expect(delay).toBe(5000)
  })

  it('should add jitter to delays', () => {
    const delays = new Set<number>()

    for (let i = 0; i < 10; i++) {
      const delay = calculateDelay(1, {
        initialDelay: 1000,
        backoffMultiplier: 2,
        jitter: true,
      })
      delays.add(delay)
    }

    // With jitter, delays should vary
    expect(delays.size).toBeGreaterThan(5)

    // All delays should be between 50% and 100% of base
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(1000) // 50% of 2000
      expect(delay).toBeLessThanOrEqual(2000) // 100% of 2000
    }
  })

  it('should handle retryOn status codes', async () => {
    let attempts = 0

    try {
      await withRetry(
        async () => {
          attempts++
          throw new ScraperError('Bad Request', ErrorCode.HTTP_ERROR, {
            statusCode: 400,
          })
        },
        {
          maxRetries: 3,
          initialDelay: 10,
          retryOn: [400, 500], // Include 400
        },
      )
    }
    catch (error) {
      expect(attempts).toBeGreaterThan(1) // Should retry
    }
  })

  it('should not retry status codes not in retryOn', async () => {
    let attempts = 0

    try {
      await withRetry(
        async () => {
          attempts++
          throw new ScraperError('Not Found', ErrorCode.HTTP_ERROR, {
            statusCode: 404,
          })
        },
        {
          maxRetries: 3,
          initialDelay: 10,
          retryOn: [500, 502, 503], // Does not include 404
        },
      )
    }
    catch (error) {
      expect(attempts).toBe(1) // Should not retry
    }
  })
})

describe('retryable wrapper', () => {
  it('should create retryable function', async () => {
    let attempts = 0

    const fetchData = retryable(
      async (id: number) => {
        attempts++
        if (attempts < 2) {
          throw new ScraperError('Temp', ErrorCode.NETWORK_ERROR)
        }
        return `data-${id}`
      },
      {
        maxRetries: 3,
        initialDelay: 10,
      },
    )

    const result = await fetchData(123)
    expect(result).toBe('data-123')
    expect(attempts).toBe(2)
  })
})

describe('RetryBudget', () => {
  it('should track retry attempts', () => {
    const budget = new RetryBudget(10000, 5)

    expect(budget.canRetry()).toBe(true)

    budget.recordRetry(false)
    budget.recordRetry(true)

    const stats = budget.getStats()
    expect(stats.totalRetries).toBe(2)
    expect(stats.successfulRetries).toBe(1)
    expect(stats.failedRetries).toBe(1)
  })

  it('should enforce max retries', () => {
    const budget = new RetryBudget(10000, 3)

    budget.recordRetry(false)
    budget.recordRetry(false)
    budget.recordRetry(false)

    expect(budget.canRetry()).toBe(false)
  })

  it('should enforce max duration', async () => {
    const budget = new RetryBudget(100, 100) // 100ms max

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(budget.canRetry()).toBe(false)
  }, 5000)

  it('should reset correctly', () => {
    const budget = new RetryBudget(10000, 5)

    budget.recordRetry(true)
    budget.recordRetry(false)

    budget.reset()

    const stats = budget.getStats()
    expect(stats.totalRetries).toBe(0)
    expect(stats.successfulRetries).toBe(0)
  })
})
