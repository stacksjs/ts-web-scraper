# API Reference

Complete API documentation for ts-web-scraper.

## Core

### `createScraper(options?)`

Creates a new scraper instance with optional configuration.

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  rateLimit?: RateLimiterOptions
  retry?: RetryOptions
  cache?: CacheOptions
  respectRobotsTxt?: boolean
  cookies?: CookieJarOptions
  monitor?: boolean
  trackChanges?: boolean
  maxSnapshots?: number
  timeout?: number
  userAgent?: string
})
```

### `Scraper`

Main scraper class with comprehensive scraping capabilities.

#### Methods

##### `scrape<T>(url, options?)`

Scrape a single URL and extract data.

```typescript
const result = await scraper.scrape('https://example.com', {
  extract?: (doc: Document) => T | Promise<T>
  selector?: string
  validate?: Schema
  detectPagination?: boolean
  detectGraphQL?: boolean
})
```

Returns `ScrapeResult<T>`:
- `success: boolean` - Whether the scrape succeeded
- `url: string` - The scraped URL
- `data?: T` - Extracted data
- `html?: string` - Raw HTML content
- `document?: Document` - Parsed DOM document
- `cached: boolean` - Whether result was from cache
- `duration: number` - Request duration in ms
- `changed?: boolean` - Content change status (if tracking enabled)
- `pagination?: PaginationInfo` - Pagination details (if detected)
- `graphql?: GraphQLDetectionResult` - GraphQL info (if detected)
- `error?: string | Error` - Error message if failed

##### `scrapeMany<T>(urls, options?, config?)`

Scrape multiple URLs concurrently.

```typescript
const results = await scraper.scrapeMany(
  ['https://example.com/1', 'https://example.com/2'],
  { extract: (doc) => ({ ... }) },
  { concurrency: 5 }
)
```

##### `scrapeAll<T>(url, options?, config?)`

Auto-paginate and scrape all pages.

```typescript
for await (const page of scraper.scrapeAll('https://example.com', {
  extract: (doc) => ({ ... })
}, {
  maxPages: 10,
  delay: 1000
})) {
  console.log(page.data, page.pageNumber)
}
```

##### `getStats()`

Get performance statistics.

```typescript
const stats = scraper.getStats()
// Returns MetricsSummary with totalRequests, averageDuration, etc.
```

##### `getReport()`

Get formatted performance report.

```typescript
const report = scraper.getReport()
console.log(report) // Formatted markdown report
```

##### `clearCache()`

Clear the request cache.

```typescript
await scraper.clearCache()
```

##### `getCookies(url)`

Get cookies for a URL.

```typescript
const cookies = scraper.getCookies('https://example.com')
```

##### `clearSession()`

Clear session cookies.

```typescript
scraper.clearSession()
```

## Data Extraction

### `pipeline<TIn, TOut>(options?)`

Create a data extraction and transformation pipeline.

```typescript
import { pipeline, extractors } from 'ts-web-scraper'

const extract = pipeline()
  .step(extractors.structured('.item', {
    name: '.name',
    price: '.price'
  }))
  .map('parse', (item) => ({
    ...item,
    price: parseFloat(item.price)
  }))
  .filter('valid', (items) => items.every(i => i.price > 0))
  .sort('by-price', (a, b) => a.price - b.price)

const result = await extract.execute(document)
```

### `extractors`

Pre-built extractors for common patterns.

#### `extractors.text(selector)`

Extract text content from elements.

```typescript
const extractor = extractors.text('p')
const texts = extractor.execute(doc) // string[]
```

#### `extractors.attr(selector, attribute)`

Extract attribute values.

```typescript
const extractor = extractors.attr('a', 'href')
const links = extractor.execute(doc) // string[]
```

#### `extractors.links(selector?)`

Extract all links.

```typescript
const extractor = extractors.links()
const hrefs = extractor.execute(doc) // string[]
```

#### `extractors.images(selector?)`

Extract image information.

```typescript
const extractor = extractors.images()
const images = extractor.execute(doc)
// { src: string, alt: string }[]
```

#### `extractors.structured(selector, schema)`

Extract structured data.

```typescript
const extractor = extractors.structured('.product', {
  name: '.name',
  price: '.price',
  rating: '.rating'
})
const products = extractor.execute(doc)
```

#### `extractors.jsonLd()`

Extract JSON-LD structured data.

```typescript
const extractor = extractors.jsonLd()
const data = extractor.execute(doc) // any[]
```

## Export

### `exportData(data, options)`

Export data to various formats.

```typescript
import { exportData } from 'ts-web-scraper'

const result = exportData(data, {
  format: 'json' | 'csv' | 'xml' | 'yaml' | 'markdown' | 'html',
  pretty?: boolean
})
```

### `saveExport(data, filepath, options?)`

Save data to file (format inferred from extension).

```typescript
import { saveExport } from 'ts-web-scraper'

await saveExport(data, 'output.csv')
await saveExport(data, 'output.json', { pretty: true })
```

## Change Detection

### `ContentTracker`

Track content changes over time.

```typescript
import { ContentTracker } from 'ts-web-scraper'

const tracker = new ContentTracker({
  maxSnapshots: 10,
  storageDir: './snapshots'
})

// Take snapshot
const snapshot = await tracker.snapshot(url, content)

// Check for changes
const hasChanged = await tracker.hasChanged(url, newContent)

// Get changes
const changes = await tracker.getChanges(url, newContent)
```

### `diff(oldObj, newObj, path?)`

Deep diff between two objects.

```typescript
import { diff } from 'ts-web-scraper'

const changes = diff(
  { price: 99.99, name: 'Product' },
  { price: 79.99, name: 'Product' }
)
// Returns Change[] with type, path, oldValue, newValue
```

## Monitoring

### `PerformanceMonitor`

Track and analyze performance metrics.

```typescript
import { PerformanceMonitor } from 'ts-web-scraper'

const monitor = new PerformanceMonitor({
  maxMetrics: 1000,
  flushInterval: 60000,
  onFlush: async (metrics) => {
    // Handle metrics
  }
})

// Record metrics
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
  timestamp: new Date()
})

// Get statistics
const summary = monitor.getSummary()
```

## Validation

### `validate(data, schema)`

Validate data against a schema.

```typescript
import { validate } from 'ts-web-scraper'

const result = validate(data, {
  name: { type: 'string', required: true },
  price: { type: 'number', min: 0, max: 10000 },
  email: { type: 'string', pattern: /^[^@]+@[^@]+$/ },
  tags: { type: 'array', items: { type: 'string' } }
})

if (result.valid) {
  console.log(result.data) // Validated data
} else {
  console.log(result.errors) // Validation errors
}
```

## Types

### `ScrapeResult<T>`

Result from scraping operation.

### `ExportFormat`

Export format type: `'json' | 'csv' | 'xml' | 'yaml' | 'markdown' | 'html'`

### `Schema`

Validation schema type.

### `Change`

Content change information.

### `DiffResult`

Result from diff operation.

### `MetricsSummary`

Performance metrics summary.

See the TypeScript definitions for complete type information.
