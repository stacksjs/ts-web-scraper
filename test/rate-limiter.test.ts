import { describe, expect, it } from 'bun:test'
import { RateLimiter } from '../src/rate-limiter'

describe('RateLimiter', () => {
  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 10,
    })

    // Should not throttle the first request
    const start = Date.now()
    await limiter.throttle()
    const duration = Date.now() - start

    expect(duration).toBeLessThan(10) // Should be nearly instant
  })

  it('should throttle requests exceeding rate limit', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 2, // 2 requests per second
      burstSize: 2, // Allow 2 at once
    })

    // First 2 should be instant
    await limiter.throttle()
    await limiter.throttle()

    // Third should wait
    const start = Date.now()
    await limiter.throttle()
    const duration = Date.now() - start

    expect(duration).toBeGreaterThan(400) // Should wait ~500ms
    expect(duration).toBeLessThan(700) // But not too long
  })

  it('should support burst requests', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 1,
      burstSize: 5,
    })

    // Should allow 5 requests immediately
    const start = Date.now()
    for (let i = 0; i < 5; i++) {
      await limiter.throttle()
    }
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100) // All 5 should be fast
  })

  it('should track statistics correctly', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 10,
      burstSize: 5,
    })

    await limiter.throttle()
    await limiter.throttle()

    const stats = limiter.getStats()

    expect(stats.totalRequests).toBe(2)
    expect(stats.currentRate).toBe(10)
    expect(stats.remainingCapacity).toBeGreaterThan(0)
    expect(stats.remainingCapacity).toBeLessThanOrEqual(1)
  })

  it('should work with requestsPerMinute', async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 60, // 1 per second
      burstSize: 2,
    })

    // First 2 should be instant
    await limiter.throttle()
    await limiter.throttle()

    // Third should wait
    const start = Date.now()
    await limiter.throttle()
    const duration = Date.now() - start

    expect(duration).toBeGreaterThan(900) // Should wait ~1000ms
  })

  it('should work with requestsPerHour', async () => {
    const limiter = new RateLimiter({
      requestsPerHour: 3600, // 1 per second
      burstSize: 2,
    })

    await limiter.throttle()
    await limiter.throttle()

    const start = Date.now()
    await limiter.throttle()
    const duration = Date.now() - start

    expect(duration).toBeGreaterThan(900) // Should wait ~1000ms
    expect(duration).toBeLessThan(1200)
  }, 5000)

  it('should use most restrictive rate limit', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 10, // Most restrictive
      requestsPerMinute: 1000,
      requestsPerHour: 100000,
      burstSize: 2,
    })

    const rate = limiter.getCurrentRate()
    expect(rate).toBe(10) // Should use requestsPerSecond
  })

  it('should tryConsume without waiting', () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 5,
      burstSize: 2,
    })

    // Should consume 2 tokens
    expect(limiter.tryConsume()).toBe(true)
    expect(limiter.tryConsume()).toBe(true)

    // Should fail (no tokens left)
    expect(limiter.tryConsume()).toBe(false)
  })

  it('should reset correctly', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 2,
      burstSize: 1,
    })

    await limiter.throttle()
    await limiter.throttle() // This will wait

    let stats = limiter.getStats()
    expect(stats.totalRequests).toBe(2)

    limiter.reset()

    stats = limiter.getStats()
    expect(stats.totalRequests).toBe(0)
    expect(stats.remainingCapacity).toBe(1)
  })

  it('should handle no rate limit', async () => {
    const limiter = new RateLimiter({})

    // Should allow unlimited requests instantly
    const start = Date.now()
    for (let i = 0; i < 100; i++) {
      await limiter.throttle()
    }
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100)
    expect(limiter.getCurrentRate()).toBe(Number.POSITIVE_INFINITY)
  })

  it('should calculate next refill time', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 1,
      burstSize: 1,
    })

    await limiter.throttle()

    const nextRefill = limiter.getNextRefillTime()
    expect(nextRefill).toBeGreaterThan(0)
    expect(nextRefill).toBeLessThanOrEqual(1000)
  })

  it('should refill tokens over time', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 10,
      burstSize: 2,
    })

    // Consume all tokens
    await limiter.throttle()
    await limiter.throttle()

    expect(limiter.getRemainingCapacity()).toBeLessThan(0.1)

    // Wait for refill
    await new Promise(resolve => setTimeout(resolve, 200))

    // Should have refilled some tokens
    expect(limiter.getRemainingCapacity()).toBeGreaterThan(0.5)
  })
})
