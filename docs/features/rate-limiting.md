# Rate Limiting

Respect server resources with intelligent rate limiting.

## Basic Rate Limiting

Limit requests per second:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 2, // Max 2 requests per second
  },
})

// Requests will be automatically throttled
await scraper.scrape('https://example.com/page1')
await scraper.scrape('https://example.com/page2')
await scraper.scrape('https://example.com/page3')
```

## Burst Requests

Allow bursts of requests:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 2,
    burstSize: 5, // Allow burst of 5 requests
  },
})

// First 5 requests execute immediately
// Then rate limited to 2 per second
```

## Per-Domain Rate Limiting

Rate limit per domain:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 2,
    perDomain: true, // Separate rate limit per domain
  },
})

// These requests are rate limited independently
await scraper.scrape('https://example.com/page1')
await scraper.scrape('https://another-site.com/page1')
```

## Token Bucket Algorithm

The rate limiter uses a token bucket algorithm:

- Tokens are added to the bucket at a constant rate
- Each request consumes one token
- If no tokens available, request waits
- Burst size determines bucket capacity

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 10, // 10 tokens per second
    burstSize: 20, // Bucket holds max 20 tokens
  },
})
```

## Dynamic Rate Limiting

Adjust rate limits based on responses:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 5,
  },
})

// Rate limiting is automatic, but you can detect rate limit errors
const result = await scraper.scrape('https://example.com')

if (!result.success && result.error?.includes('429')) {
  // Server is rate limiting us, slow down
  console.log('Rate limited by server')
}
```

## Rate Limiting with Retries

Combine with automatic retries:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 2,
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoff: 'exponential',
  },
})

// If rate limited, will automatically retry with backoff
```

## Multiple URL Scraping

Rate limiting automatically applies to batch scraping:

```typescript
const urls = [
  'https://example.com/1',
  'https://example.com/2',
  'https://example.com/3',
  'https://example.com/4',
  'https://example.com/5',
]

const results = await scraper.scrapeMany(urls, {
  extract: doc => ({ title: doc.querySelector('title')?.textContent }),
}, {
  concurrency: 3, // Max 3 concurrent, but still rate limited
})
```

## Best Practices

1. Start with conservative rates (1-2 requests per second)
2. Use burst size for initial data loading
3. Enable per-domain limiting for multi-site scraping
4. Monitor server responses for 429 status codes
5. Combine with caching to reduce request frequency
6. Respect robots.txt crawl-delay directives

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 1,
    burstSize: 3,
    perDomain: true,
  },
  respectRobotsTxt: true, // Automatically respect crawl-delay
  cache: {
    enabled: true,
    ttl: 60000, // Cache for 1 minute
  },
})
```

## Monitoring Rate Limits

Track rate limiting in performance metrics:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 2,
  },
  monitor: true,
})

await scraper.scrapeMany(urls)

const stats = scraper.getStats()
console.log(`Average duration: ${stats.averageDuration}ms`)
console.log(`Total requests: ${stats.totalRequests}`)
```

## Next Steps

- Configure [Caching](/features/caching)
- Enable [Retry Logic](/features/retry)
- Check [Monitoring](/features/monitoring)
