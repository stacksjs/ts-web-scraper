# Quick Start

Get up and running with ts-web-scraper in minutes.

## Installation

```bash
bun add ts-web-scraper
```

## Your First Scraper

```typescript
import { createScraper } from 'ts-web-scraper'

// Create a scraper
const scraper = createScraper()

// Scrape a website
const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('title')?.textContent,
    heading: doc.querySelector('h1')?.textContent,
  }),
})

console.log(result.data)
// { title: 'Example Domain', heading: 'Example Domain' }
```

## Adding Rate Limiting

Respect server resources with built-in rate limiting:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 2, // Max 2 requests per second
    burstSize: 5, // Allow burst of 5 requests
  },
})
```

## Enable Caching

Speed up repeated requests with caching:

```typescript
const scraper = createScraper({
  cache: {
    enabled: true,
    ttl: 60000, // Cache for 60 seconds
    maxSize: 100, // Store up to 100 responses
  },
})
```

## Extract Structured Data

Use pipelines for complex data extraction:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.product-name',
    price: '.product-price',
    image: 'img',
  }))
  .map('clean', product => ({
    ...product,
    price: Number.parseFloat(product.price.replace(/[^0-9.]/g, '')),
  }))
  .filter('valid', products => products.every(p => p.price > 0))

const doc = parseHTML(html)
const result = await extractProducts.execute(doc)
console.log(result.data) // Cleaned product array
```

## Scrape Multiple URLs

Scrape many URLs efficiently:

```typescript
const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
]

const results = await scraper.scrapeMany(urls, {
  extract: doc => ({
    title: doc.querySelector('h1')?.textContent,
  }),
}, {
  concurrency: 3, // Scrape 3 at a time
})

results.forEach((result) => {
  if (result.success) {
    console.log(result.data)
  }
})
```

## Export Data

Export scraped data to various formats:

```typescript
import { saveExport } from 'ts-web-scraper'

// Scrape data
const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    // ... your extraction logic
  }),
})

// Export to different formats
await saveExport(result.data, 'output.json')
await saveExport(result.data, 'output.csv')
await saveExport(result.data, 'output.xml')
```

## Track Changes

Monitor content changes over time:

```typescript
const scraper = createScraper({
  trackChanges: true,
  cache: { enabled: true },
})

// First scrape
const result1 = await scraper.scrape('https://example.com/price', {
  extract: doc => ({
    price: doc.querySelector('.price')?.textContent,
  }),
})
console.log(result1.changed) // undefined (no previous data)

// Second scrape
const result2 = await scraper.scrape('https://example.com/price', {
  extract: doc => ({
    price: doc.querySelector('.price')?.textContent,
  }),
})
console.log(result2.changed) // false or true
```

## Monitor Performance

Track scraping performance:

```typescript
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
console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`)

// Get formatted report
const report = scraper.getReport()
console.log(report)
```

## Next Steps

- Learn about [Features](/features/scraping)
- Explore [Advanced Topics](/advanced/pagination)
- Check the [API Reference](/api/)
