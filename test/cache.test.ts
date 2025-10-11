import { describe, expect, it } from 'bun:test'
import { generateCacheKey, ScraperCache } from '../src/cache'

describe('ScraperCache', () => {
  it('should store and retrieve data', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('test-key', { value: 'test-data' })

    const cached = await cache.get('test-key')
    expect(cached).not.toBeNull()
    expect(cached?.data).toEqual({ value: 'test-data' })
  })

  it('should respect TTL', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 100, // 100ms
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('expiring-key', 'data')

    // Should exist immediately
    expect(await cache.get('expiring-key')).not.toBeNull()

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be expired
    expect(await cache.get('expiring-key')).toBeNull()
  })

  it('should use custom TTL', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 1000, // Default 1s
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('custom-ttl', 'data', 100) // Override with 100ms

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(await cache.get('custom-ttl')).toBeNull()
  })

  it('should track cache hits and misses', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    // Misses
    await cache.get('key1')
    await cache.get('key2')

    // Hits
    await cache.set('key1', 'data1')
    await cache.get('key1')
    await cache.get('key1')

    const stats = cache.getStats()
    expect(stats.misses).toBe(2)
    expect(stats.hits).toBe(2)
    expect(stats.hitRate).toBe(0.5)
  })

  it('should evict LRU when at maxSize', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 3, // Small size for testing
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1')
    await cache.set('key2', 'data2')
    await cache.set('key3', 'data3')

    // Access key1 to make it recently used
    await cache.get('key1')

    // Add key4, should evict key2 (least recently used)
    await cache.set('key4', 'data4')

    const stats = cache.getStats()
    expect(stats.evictions).toBe(1)

    // key2 should be evicted
    expect(await cache.get('key2')).toBeNull()

    // key1 should still exist (recently used)
    expect(await cache.get('key1')).not.toBeNull()

    // key3 and key4 should exist
    expect(await cache.get('key3')).not.toBeNull()
    expect(await cache.get('key4')).not.toBeNull()
  })

  it('should update existing keys', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'original')
    await cache.set('key1', 'updated')

    const cached = await cache.get('key1')
    expect(cached?.data).toBe('updated')

    // Should not increase size
    expect(cache.getStats().size).toBe(1)
  })

  it('should delete keys', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1')
    expect(await cache.get('key1')).not.toBeNull()

    cache.delete('key1')
    expect(await cache.get('key1')).toBeNull()
  })

  it('should clear all data', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1')
    await cache.set('key2', 'data2')

    await cache.clear()

    expect(cache.getStats().size).toBe(0)
    expect(await cache.get('key1')).toBeNull()
    expect(await cache.get('key2')).toBeNull()
  })

  it('should check if key exists', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 100,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1')

    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(false)

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(cache.has('key1')).toBe(false)
  })

  it('should list all keys', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1')
    await cache.set('key2', 'data2')

    const keys = cache.keys()
    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
    expect(keys.length).toBe(2)
  })

  it('should respect disabled cache', async () => {
    const cache = new ScraperCache({
      enabled: false, // Disabled
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1')
    expect(await cache.get('key1')).toBeNull()
  })

  it('should store metadata', async () => {
    const cache = new ScraperCache({
      enabled: true,
      ttl: 10000,
      maxSize: 100,
      storage: 'memory',
      cacheDir: '.cache/test',
      keyGenerator: url => url,
      debug: false,
    })

    await cache.set('key1', 'data1', undefined, {
      etag: '"abc123"',
      lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
      url: 'https://example.com',
      headers: { 'content-type': 'text/html' },
    })

    const cached = await cache.get('key1')
    expect(cached?.etag).toBe('"abc123"')
    expect(cached?.lastModified).toBe('Wed, 21 Oct 2015 07:28:00 GMT')
    expect(cached?.url).toBe('https://example.com')
    expect(cached?.headers).toEqual({ 'content-type': 'text/html' })
  })
})

describe('generateCacheKey', () => {
  it('should generate key from URL', () => {
    const key = generateCacheKey('https://example.com')
    expect(key).toBe('https://example.com')
  })

  it('should generate key with options', () => {
    const key1 = generateCacheKey('https://example.com', { param: 'value' })
    const key2 = generateCacheKey('https://example.com', { param: 'value' })
    expect(key1).toBe(key2)
  })

  it('should generate consistent keys regardless of option order', () => {
    const key1 = generateCacheKey('https://example.com', { a: '1', b: '2' })
    const key2 = generateCacheKey('https://example.com', { b: '2', a: '1' })
    expect(key1).toBe(key2)
  })

  it('should generate different keys for different options', () => {
    const key1 = generateCacheKey('https://example.com', { param: 'value1' })
    const key2 = generateCacheKey('https://example.com', { param: 'value2' })
    expect(key1).not.toBe(key2)
  })
})
