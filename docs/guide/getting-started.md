# Getting Started

ts-web-scraper is a powerful, type-safe web scraping library built for TypeScript and Bun with zero external dependencies.

## Installation

Install using your preferred package manager:

```bash
# Using bun (recommended)
bun add ts-web-scraper

# Using npm
npm install ts-web-scraper

# Using pnpm
pnpm add ts-web-scraper

# Using yarn
yarn add ts-web-scraper
```

## Quick Start

### Create a Scraper

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  rateLimit: { requestsPerSecond: 2 },
  cache: { enabled: true, ttl: 60000 },
  retry: { maxRetries: 3 },
})
```

### Scrape a Page

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('title')?.textContent,
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
    headings: Array.from(doc.querySelectorAll('h1, h2')).map(h => h.textContent),
  }),
})

console.log(result.data)
// { title: 'Example', description: '...', headings: ['...', '...'] }
```

## Scraper Configuration

### Full Options

```typescript
const scraper = createScraper({
  // Rate limiting
  rateLimit: {
    requestsPerSecond: 2,
    burstSize: 5,
  },

  // Caching
  cache: {
    enabled: true,
    ttl: 60000,      // 1 minute
    maxSize: 100,    // Max entries
  },

  // Retry logic
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
  },

  // Performance monitoring
  monitor: true,

  // Change tracking
  trackChanges: true,

  // Cookie management
  cookies: {
    enabled: true,
  },

  // Custom headers
  headers: {
    'User-Agent': 'MyBot/1.0',
  },
})
```

## Basic Scraping Methods

### Fetch HTML

```typescript
import { fetchHTML } from 'ts-web-scraper'

const { document, html } = await fetchHTML('https://example.com')

// Access DOM
const title = document.querySelector('title')?.textContent
```

### Parse HTML String

```typescript
import { parseHTML } from 'ts-web-scraper'

const html = '<html><body><h1>Hello</h1></body></html>'
const doc = parseHTML(html)

const heading = doc.querySelector('h1')?.textContent
```

### Extract Text

```typescript
import { extractText } from 'ts-web-scraper'

const text = extractText(document, '.content')
```

### Extract Links

```typescript
import { extractLinks } from 'ts-web-scraper'

const links = extractLinks(document, {
  absolute: true,
  internal: true,
})

// [{ href: 'https://...', text: '...', rel: '...' }, ...]
```

### Extract Metadata

```typescript
import { extractMeta } from 'ts-web-scraper'

const meta = extractMeta(document)

console.log(meta.title)
console.log(meta.description)
console.log(meta.keywords)
console.log(meta.author)
```

## Structured Data Extraction

### Extract JSON-LD

```typescript
import { extractStructuredData } from 'ts-web-scraper'

const data = extractStructuredData(document)

// Returns parsed JSON-LD, Microdata, RDFa
```

### Extract Open Graph

```typescript
import { extractOpenGraph } from 'ts-web-scraper'

const og = extractOpenGraph(document)

console.log(og.title)
console.log(og.description)
console.log(og.image)
console.log(og.url)
```

### Extract Twitter Cards

```typescript
import { extractTwitterCard } from 'ts-web-scraper'

const twitter = extractTwitterCard(document)

console.log(twitter.card)
console.log(twitter.site)
console.log(twitter.title)
```

## Error Handling

```typescript
import { createScraper, ScraperError, ErrorCode } from 'ts-web-scraper'

const scraper = createScraper()

try {
  const result = await scraper.scrape('https://example.com')

  if (result.success) {
    console.log(result.data)
  } else {
    console.error('Scrape failed:', result.error)
  }
} catch (error) {
  if (error instanceof ScraperError) {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        console.error('Network error:', error.message)
        break
      case ErrorCode.TIMEOUT:
        console.error('Request timed out')
        break
      case ErrorCode.RATE_LIMITED:
        console.error('Rate limited, try again later')
        break
    }
  }
}
```

## TypeScript Support

Full type inference for extracted data:

```typescript
interface ProductData {
  name: string
  price: number
  inStock: boolean
}

const result = await scraper.scrape<ProductData>('https://example.com/product', {
  extract: doc => ({
    name: doc.querySelector('.product-name')?.textContent || '',
    price: parseFloat(doc.querySelector('.price')?.textContent || '0'),
    inStock: doc.querySelector('.in-stock') !== null,
  }),
})

// result.data is typed as ProductData
```

## Performance Stats

```typescript
const scraper = createScraper({ monitor: true })

await scraper.scrape('https://example.com')
await scraper.scrape('https://example.com/page2')

const stats = scraper.getStats()
console.log(stats.totalRequests)
console.log(stats.averageDuration)
console.log(stats.cacheHitRate)

const report = scraper.getReport()
console.log(report) // Formatted performance report
```

## Next Steps

- Learn about [Static Page Scraping](/guide/static) for HTML content
- Explore [JavaScript-Rendered Pages](/guide/spa) for SPAs
- Master [CSS Selectors](/guide/selectors) for data extraction
