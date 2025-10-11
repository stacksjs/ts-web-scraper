# Caching

Speed up repeated requests with intelligent caching.

## Basic Caching

Enable caching with TTL:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 60000,  // Cache for 60 seconds (1 minute)
  },
})

// First request fetches from server
const result1 = await scraper.scrape('https://example.com')
console.log(result1.cached) // false

// Second request within 60s uses cache
const result2 = await scraper.scrape('https://example.com')
console.log(result2.cached) // true
```

## Cache Size Limits

Limit cache memory usage:

```typescript
const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 300000,      // 5 minutes
    maxSize: 100,     // Store max 100 responses
  },
})
```

## LRU Cache

The cache uses an LRU (Least Recently Used) eviction policy:

- When cache is full, least recently used entries are removed
- Frequently accessed pages stay in cache longer
- Automatic memory management

## Cache Keys

Caching is URL-based:

```typescript
// These are cached separately
await scraper.scrape('https://example.com/page1')
await scraper.scrape('https://example.com/page2')

// This uses cached response
await scraper.scrape('https://example.com/page1')
```

## Cache with Change Tracking

Combine caching with change detection:

```typescript
const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 60000,
  },
  trackChanges: true,
})

// First scrape
const result1 = await scraper.scrape('https://example.com')
console.log(result1.changed) // undefined (no previous data)

// Second scrape (from cache)
const result2 = await scraper.scrape('https://example.com')
console.log(result2.cached)  // true
console.log(result2.changed) // false (content same as cache)
```

## Manual Cache Control

Clear the cache manually:

```typescript
const scraper = createScraper({
  cache: { enabled: true, ttl: 60000 },
})

await scraper.scrape('https://example.com')

// Clear entire cache
await scraper.clearCache()

// Next request will fetch fresh data
await scraper.scrape('https://example.com')
```

## Conditional Caching

Cache selectively based on content:

```typescript
const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 60000,
  },
})

const result = await scraper.scrape('https://example.com')

if (!result.cached) {
  console.log('Fresh data fetched')
  // Process new data
} else {
  console.log('Using cached data')
  // Skip processing if needed
}
```

## Cache Performance

Monitor cache effectiveness:

```typescript
const scraper = createScraper({
  cache: { enabled: true, ttl: 60000 },
  monitor: true,
})

// Perform multiple scrapes
await scraper.scrape('https://example.com')
await scraper.scrape('https://example.com')
await scraper.scrape('https://example.com/page2')
await scraper.scrape('https://example.com')

// Check cache hit rate
const stats = scraper.getStats()
console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`)
```

## Cache with Rate Limiting

Caching reduces rate limit impact:

```typescript
const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 300000,  // 5 minutes
  },
  rateLimit: {
    requestsPerSecond: 1,
  },
})

// Only first request is rate limited
// Subsequent requests use cache
for (let i = 0; i < 10; i++) {
  await scraper.scrape('https://example.com')
}
```

## TTL Strategies

Choose TTL based on content freshness needs:

```typescript
// Static content - long TTL
const staticScraper = createScraper({
  cache: { enabled: true, ttl: 3600000 },  // 1 hour
})

// Dynamic content - short TTL
const dynamicScraper = createScraper({
  cache: { enabled: true, ttl: 30000 },  // 30 seconds
})

// Real-time content - no cache
const realtimeScraper = createScraper({
  cache: { enabled: false },
})
```

## Best Practices

1. Enable caching for frequently accessed pages
2. Set TTL based on content update frequency
3. Use larger maxSize for data-heavy scraping
4. Monitor cache hit rate to optimize TTL
5. Combine with rate limiting to reduce server load
6. Clear cache when you need fresh data

```typescript
const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 120000,      // 2 minutes
    maxSize: 200,     // 200 pages
  },
  rateLimit: {
    requestsPerSecond: 2,
  },
  monitor: true,  // Track cache effectiveness
})
```

## Next Steps

- Configure [Rate Limiting](/features/rate-limiting)
- Enable [Change Detection](/features/diff)
- Check [Monitoring](/features/monitoring)
