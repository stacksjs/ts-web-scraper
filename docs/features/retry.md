# Retry Logic

Automatically retry failed requests with intelligent backoff strategies.

## Basic Retry Configuration

Enable automatic retries:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
  },
})

// Automatically retries up to 3 times on failure
const result = await scraper.scrape('https://example.com')
```

## Exponential Backoff

Use exponential backoff for retries:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 5,
    initialDelay: 1000,
    backoff: 'exponential', // 1s, 2s, 4s, 8s, 16s
  },
})
```

## Linear Backoff

Use linear backoff:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 2000,
    backoff: 'linear', // 2s, 4s, 6s
  },
})
```

## Fixed Delay

Use fixed delay between retries:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 5000,
    backoff: 'fixed', // 5s, 5s, 5s
  },
})
```

## Retry on Specific Errors

Retries are triggered on:

- Network errors (connection refused, timeout, etc.)
- 5xx server errors (500, 502, 503, 504)
- Rate limit errors (429)

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
})

const result = await scraper.scrape('https://unreliable-server.com')

if (!result.success) {
  console.log('Failed after 3 retries:', result.error)
}
```

## Monitoring Retries

Track retry attempts in metrics:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
  monitor: true,
})

await scraper.scrape('https://example.com')

const stats = scraper.getStats()
console.log(`Total retries: ${stats.totalRetries}`)
```

## Combine with Rate Limiting

Retries respect rate limits:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoff: 'exponential',
  },
  rateLimit: {
    requestsPerSecond: 1,
  },
})

// Retries will be rate limited
```

## Timeout Configuration

Set request timeout:

```typescript
const scraper = createScraper({
  timeout: 30000, // 30 second timeout
  retry: {
    maxRetries: 2,
    initialDelay: 2000,
  },
})

// Times out after 30s, then retries
const result = await scraper.scrape('https://slow-server.com')
```

## Error Handling

Handle final failure after retries:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
})

const result = await scraper.scrape('https://example.com')

if (!result.success) {
  console.error('All retries exhausted')
  console.error('Error:', result.error)
  console.error('Duration:', result.duration)

  // Implement fallback logic
  // Log to monitoring system
  // Alert on-call engineer
}
```

## Backoff Strategies Comparison

Choose the right strategy for your use case:

| Strategy | Delays (with 1s initial) | Best For |
|----------|-------------------------|----------|
| Fixed | 1s, 1s, 1s | Quick recovery expected |
| Linear | 1s, 2s, 3s | Gradual load reduction |
| Exponential | 1s, 2s, 4s, 8s | Server overload situations |

```typescript
// Quick retry for transient errors
const quickScraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 500,
    backoff: 'fixed',
  },
})

// Patient retry for overloaded servers
const patientScraper = createScraper({
  retry: {
    maxRetries: 5,
    initialDelay: 2000,
    backoff: 'exponential',
  },
})
```

## Batch Scraping with Retries

Retries apply to each URL in batch operations:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
})

const urls = [
  'https://example.com/1',
  'https://example.com/2',
  'https://example.com/3',
]

const results = await scraper.scrapeMany(urls)

// Check which URLs failed after retries
results.forEach((result, i) => {
  if (!result.success) {
    console.log(`URL ${urls[i]} failed:`, result.error)
  }
})
```

## Best Practices

1. Use exponential backoff for production systems
2. Set reasonable maxRetries (3-5 is common)
3. Configure timeout to prevent hanging requests
4. Monitor retry rates to detect systemic issues
5. Combine with rate limiting to be respectful
6. Log failures after all retries exhausted

```typescript
const scraper = createScraper({
  timeout: 30000,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoff: 'exponential',
  },
  rateLimit: {
    requestsPerSecond: 2,
  },
  monitor: true,
})
```

## Next Steps

- Configure [Rate Limiting](/features/rate-limiting)
- Enable [Monitoring](/features/monitoring)
- Learn about [Error Handling](/features/scraping#error-handling)
