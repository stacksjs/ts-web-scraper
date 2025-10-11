# Web Scraping

Core web scraping functionality with powerful extraction capabilities.

## Basic Scraping

The simplest way to scrape a website:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper()

const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('title')?.textContent,
    paragraphs: Array.from(doc.querySelectorAll('p')).map(p => p.textContent),
  }),
})

if (result.success) {
  console.log(result.data)
}
```

## Selector Extraction

Extract elements using CSS selectors:

```typescript
const result = await scraper.scrape('https://example.com', {
  selector: 'h1', // Extract all h1 elements
})

console.log(result.data) // Array of h1 text content
```

## Custom Extraction

Full control over data extraction:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => {
    const products = doc.querySelectorAll('.product')

    return products.map(product => ({
      name: product.querySelector('.name')?.textContent?.trim(),
      price: product.querySelector('.price')?.textContent?.trim(),
      image: product.querySelector('img')?.getAttribute('src'),
      inStock: product.querySelector('.in-stock') !== null,
    }))
  },
})
```

## Scrape Results

Every scrape returns a detailed result object:

```typescript
interface ScrapeResult<T> {
  success: boolean // Whether scrape succeeded
  url: string // The scraped URL
  data?: T // Extracted data
  html?: string // Raw HTML content
  document?: Document // Parsed DOM
  cached: boolean // From cache?
  duration: number // Time taken (ms)
  changed?: boolean // Content changed? (if tracking enabled)
  pagination?: object // Pagination info (if detected)
  error?: string // Error message if failed
}
```

## Error Handling

Scraping errors are handled gracefully:

```typescript
const result = await scraper.scrape('https://invalid-url.com')

if (!result.success) {
  console.error('Scraping failed:', result.error)
  console.log('Duration:', result.duration)
  // Continue execution - no exceptions thrown
}
```

## Configuration

Configure scraper behavior:

```typescript
const scraper = createScraper({
  timeout: 30000, // Request timeout (ms)
  userAgent: 'MyBot/1.0', // Custom user agent
  followRedirects: true, // Follow redirects
  rateLimit: { // Rate limiting
    requestsPerSecond: 2,
  },
  cache: { // Caching
    enabled: true,
    ttl: 60000,
  },
  retry: { // Automatic retries
    maxRetries: 3,
    initialDelay: 1000,
  },
})
```

## Next Steps

- Learn about [Data Extraction](/features/extraction)
- Configure [Rate Limiting](/features/rate-limiting)
- Enable [Caching](/features/caching)
