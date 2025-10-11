# Monitoring

Track and analyze scraping performance with comprehensive metrics.

## Basic Monitoring

Enable performance monitoring:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  monitor: true,
})

// Perform scraping
await scraper.scrape('https://example.com')
await scraper.scrape('https://example.com/page2')

// Get statistics
const stats = scraper.getStats()
console.log(`Total requests: ${stats.totalRequests}`)
console.log(`Average duration: ${stats.averageDuration}ms`)
console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`)
console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`)
```

## Performance Report

Get a formatted performance report:

```typescript
const scraper = createScraper({
  monitor: true,
})

// Perform scraping
await scraper.scrapeMany([
  'https://example.com/1',
  'https://example.com/2',
  'https://example.com/3',
])

// Get formatted report
const report = scraper.getReport()
console.log(report)

// Outputs:
// Performance Report
// ==================
// Total Requests: 3
// Success Rate: 100.0%
// Average Duration: 234ms
// Cache Hit Rate: 0.0%
// ...
```

## Metrics Summary

Available metrics in summary:

```typescript
interface MetricsSummary {
  totalRequests: number // Total number of requests
  successfulRequests: number // Number of successful requests
  failedRequests: number // Number of failed requests
  totalRetries: number // Total retry attempts
  averageDuration: number // Average request duration (ms)
  minDuration: number // Fastest request (ms)
  maxDuration: number // Slowest request (ms)
  p50Duration: number // 50th percentile (median)
  p95Duration: number // 95th percentile
  p99Duration: number // 99th percentile
  successRate: number // Success rate (0-1)
  cacheHitRate: number // Cache hit rate (0-1)
  totalBytesDownloaded: number // Total bytes downloaded
  totalItemsExtracted: number // Total items extracted
}
```

## Percentile Analysis

Analyze request duration distribution:

```typescript
const scraper = createScraper({
  monitor: true,
})

// Perform many scrapes
for (let i = 0; i < 100; i++) {
  await scraper.scrape(`https://example.com/page${i}`)
}

const stats = scraper.getStats()

console.log(`P50 (median): ${stats.p50Duration}ms`)
console.log(`P95: ${stats.p95Duration}ms`)
console.log(`P99: ${stats.p99Duration}ms`)
console.log(`Max: ${stats.maxDuration}ms`)

// Identify slow requests
if (stats.p99Duration > 5000) {
  console.warn('99% of requests slower than 5s!')
}
```

## Performance Monitor

Use PerformanceMonitor directly:

```typescript
import { PerformanceMonitor } from 'ts-web-scraper'

const monitor = new PerformanceMonitor({
  maxMetrics: 1000, // Keep last 1000 metrics
  flushInterval: 60000, // Flush every minute
  onFlush: async (metrics) => {
    // Send metrics to external service
    await sendToDatadog(metrics)
    await sendToPrometheus(metrics)
  },
})

// Record metrics manually
monitor.recordScrape({
  url: 'https://example.com',
  totalDuration: 1234,
  fetchDuration: 800,
  parseDuration: 234,
  extractionDuration: 200,
  itemsExtracted: 10,
  bytesDownloaded: 50000,
  cached: false,
  retries: 0,
  timestamp: new Date(),
})

// Get summary
const summary = monitor.getSummary()
```

## Real-time Monitoring

Monitor scraping in real-time:

```typescript
const scraper = createScraper({
  monitor: true,
})

async function scrapeWithMonitoring(url: string) {
  const result = await scraper.scrape(url)

  const stats = scraper.getStats()

  console.log(`Scraped ${url}`)
  console.log(`  Duration: ${result.duration}ms`)
  console.log(`  Cached: ${result.cached}`)
  console.log(`  Running avg: ${stats.averageDuration}ms`)

  // Alert on slow requests
  if (result.duration > 5000) {
    console.warn(`Slow request detected: ${url} took ${result.duration}ms`)
  }

  return result
}
```

## Batch Monitoring

Monitor batch scraping operations:

```typescript
const scraper = createScraper({
  monitor: true,
  rateLimit: { requestsPerSecond: 2 },
})

const urls = Array.from({ length: 100 }, (_, i) =>
  `https://example.com/page${i}`)

console.log('Starting batch scrape...')
const startTime = Date.now()

const results = await scraper.scrapeMany(urls, {
  extract: doc => ({ title: doc.querySelector('h1')?.textContent }),
}, {
  concurrency: 5,
})

const duration = Date.now() - startTime
const stats = scraper.getStats()

console.log('\nBatch Complete')
console.log('==============')
console.log(`Total time: ${(duration / 1000).toFixed(2)}s`)
console.log(`Total requests: ${stats.totalRequests}`)
console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`)
console.log(`Average duration: ${stats.averageDuration}ms`)
console.log(`Throughput: ${(stats.totalRequests / (duration / 1000)).toFixed(2)} req/s`)
```

## Error Tracking

Track and analyze errors:

```typescript
const scraper = createScraper({
  monitor: true,
  retry: { maxRetries: 3 },
})

await scraper.scrapeMany(urls)

const stats = scraper.getStats()

console.log(`Failed requests: ${stats.failedRequests}`)
console.log(`Total retries: ${stats.totalRetries}`)
console.log(`Failure rate: ${((1 - stats.successRate) * 100).toFixed(1)}%`)

if (stats.failedRequests > 0) {
  console.warn('Some requests failed - check logs')
}
```

## Cache Performance

Monitor cache effectiveness:

```typescript
const scraper = createScraper({
  monitor: true,
  cache: {
    enabled: true,
    ttl: 60000,
    maxSize: 100,
  },
})

// First pass - all cache misses
await scraper.scrapeMany(urls)

// Second pass - should hit cache
await scraper.scrapeMany(urls)

const stats = scraper.getStats()

console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`)
console.log(`Avg duration (with cache): ${stats.averageDuration}ms`)

if (stats.cacheHitRate < 0.5) {
  console.warn('Low cache hit rate - consider increasing TTL')
}
```

## Bandwidth Monitoring

Track data transfer:

```typescript
const scraper = createScraper({
  monitor: true,
})

await scraper.scrapeMany(urls)

const stats = scraper.getStats()

const mbDownloaded = stats.totalBytesDownloaded / (1024 * 1024)
console.log(`Total downloaded: ${mbDownloaded.toFixed(2)} MB`)
console.log(`Avg per request: ${(stats.totalBytesDownloaded / stats.totalRequests / 1024).toFixed(2)} KB`)
```

## Extraction Metrics

Monitor extraction performance:

```typescript
const scraper = createScraper({
  monitor: true,
})

await scraper.scrapeMany(urls, {
  extract: doc => ({
    items: Array.from(doc.querySelectorAll('.item')).map(item => ({
      title: item.querySelector('.title')?.textContent,
    })),
  }),
})

const stats = scraper.getStats()

console.log(`Total items extracted: ${stats.totalItemsExtracted}`)
console.log(`Avg per page: ${(stats.totalItemsExtracted / stats.totalRequests).toFixed(1)}`)
```

## Custom Metrics Integration

Export metrics to external services:

```typescript
const monitor = new PerformanceMonitor({
  flushInterval: 60000, // Flush every minute
  onFlush: async (metrics) => {
    // Send to Datadog
    await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: { 'DD-API-KEY': process.env.DATADOG_API_KEY },
      body: JSON.stringify({
        series: metrics.map(m => ({
          metric: 'scraper.duration',
          points: [[m.timestamp.getTime() / 1000, m.totalDuration]],
          tags: [`url:${m.url}`, `cached:${m.cached}`],
        })),
      }),
    })

    // Send to Prometheus
    // Send to CloudWatch
    // etc.
  },
})
```

## Best Practices

1. Always enable monitoring in production
2. Set appropriate flushInterval for metrics export
3. Monitor P95/P99 percentiles for outliers
4. Track cache hit rate to optimize TTL
5. Alert on high failure rates
6. Monitor throughput for capacity planning
7. Track bandwidth for cost optimization

```typescript
const scraper = createScraper({
  monitor: true,
  rateLimit: { requestsPerSecond: 2 },
  cache: { enabled: true, ttl: 60000 },
  retry: { maxRetries: 3 },
})

// Periodic monitoring
setInterval(() => {
  const stats = scraper.getStats()

  // Alert on issues
  if (stats.p99Duration > 10000) {
    console.warn('P99 latency high:', stats.p99Duration)
  }

  if (stats.successRate < 0.95) {
    console.error('Success rate low:', stats.successRate)
  }

  if (stats.cacheHitRate < 0.3) {
    console.warn('Cache hit rate low:', stats.cacheHitRate)
  }

  // Log report
  console.log(scraper.getReport())
}, 300000) // Every 5 minutes
```

## Next Steps

- Configure [Rate Limiting](/features/rate-limiting)
- Enable [Caching](/features/caching)
- Learn about [Retry Logic](/features/retry)
