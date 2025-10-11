# Pagination

Automatically detect and traverse paginated content with intelligent pattern recognition.

## Automatic Pagination Detection

Detect and handle pagination automatically:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper()

// Auto-detect and traverse all pages
for await (const page of scraper.scrapeAll('https://example.com/products', {
  extract: (doc) => ({
    products: Array.from(doc.querySelectorAll('.product')).map(p => ({
      name: p.querySelector('.name')?.textContent,
      price: p.querySelector('.price')?.textContent,
    })),
  }),
}, {
  maxPages: 10,  // Limit to 10 pages
})) {
  console.log(`Page ${page.pageNumber}:`, page.data)
  console.log(`Pagination type: ${page.pagination?.type}`)
}
```

## Supported Pagination Types

The scraper automatically detects multiple pagination patterns:

### Page Numbers

Traditional numbered pagination (1, 2, 3, ...):

```typescript
// Automatically detected from:
// <a href="/page/2">2</a>
// <a href="/products?page=2">2</a>
// <button data-page="2">2</button>

for await (const page of scraper.scrapeAll('https://example.com/blog')) {
  if (page.pagination?.type === 'page_numbers') {
    console.log(`Page ${page.pagination.currentPage} of ${page.pagination.totalPages}`)
  }
}
```

### Next/Previous Links

Next and Previous button pagination:

```typescript
// Automatically detected from:
// <a href="/next">Next</a>
// <a rel="next" href="/page/2">→</a>
// <link rel="next" href="/page/2" />

for await (const page of scraper.scrapeAll('https://example.com/articles')) {
  if (page.pagination?.type === 'next_prev') {
    console.log('Has more pages:', page.pagination.hasMore)
    console.log('Next URL:', page.pagination.nextUrl)
  }
}
```

### Load More Buttons

"Load More" style pagination:

```typescript
// Detected from:
// <button>Load More</button>
// <a class="load-more">Show More</a>

const result = await scraper.scrape('https://example.com/feed')
if (result.pagination?.type === 'load_more') {
  console.log('Supports load more:', result.pagination.hasMore)
}
```

### Infinite Scroll

Infinite scroll patterns:

```typescript
// Detected from:
// data-infinite-scroll
// class="infinite-scroll"
// Lazy loading indicators

const result = await scraper.scrape('https://example.com/timeline')
if (result.pagination?.type === 'infinite_scroll') {
  console.log('Uses infinite scroll')
}
```

## Manual Pagination Control

Control pagination manually:

```typescript
import { detectPagination, generatePageUrl, hasMorePages } from 'ts-web-scraper'

// Detect pagination from HTML
const result = await scraper.scrape('https://example.com/list')
const pagination = detectPagination(result.html, result.url)

console.log('Pagination type:', pagination.type)
console.log('Current page:', pagination.currentPage)
console.log('Total pages:', pagination.totalPages)

// Generate next page URL
if (hasMorePages(pagination)) {
  const nextPageUrl = generatePageUrl(result.url, pagination.currentPage + 1)
  console.log('Next page:', nextPageUrl)
}
```

## Custom Pagination Patterns

Define custom pagination patterns:

```typescript
for await (const page of scraper.scrapeAll('https://example.com/custom', {
  extract: (doc) => ({
    items: Array.from(doc.querySelectorAll('.item')).map(i => i.textContent),
  }),
}, {
  maxPages: 20,
  pattern: {
    pageParam: 'offset',  // Custom query parameter
  },
})) {
  console.log(`Fetched ${page.data.items.length} items`)
}
```

## Pagination with Delay

Add delay between page requests:

```typescript
for await (const page of scraper.scrapeAll('https://example.com/products', {
  extract: (doc) => ({
    count: doc.querySelectorAll('.product').length,
  }),
}, {
  maxPages: 50,
  delay: 2000,  // 2 second delay between pages
})) {
  console.log(`Page ${page.pageNumber}: ${page.data.count} products`)
}
```

## Collecting All Pages

Collect all page results:

```typescript
const scraper = createScraper({
  rateLimit: { requestsPerSecond: 1 },
})

const allProducts: any[] = []

for await (const page of scraper.scrapeAll('https://example.com/products', {
  extract: (doc) => ({
    products: Array.from(doc.querySelectorAll('.product')).map(p => ({
      id: p.getAttribute('data-id'),
      name: p.querySelector('.name')?.textContent,
      price: parseFloat(p.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'),
    })),
  }),
}, { maxPages: 10 })) {
  allProducts.push(...page.data.products)
}

console.log(`Total products collected: ${allProducts.length}`)
```

## Pagination Info

Access detailed pagination information:

```typescript
for await (const page of scraper.scrapeAll('https://example.com/blog')) {
  const pagination = page.pagination

  if (pagination) {
    console.log('Pagination Details:')
    console.log('  Type:', pagination.type)
    console.log('  Current Page:', pagination.currentPage)
    console.log('  Total Pages:', pagination.totalPages)
    console.log('  Has More:', pagination.hasMore)
    console.log('  Next URL:', pagination.nextUrl)
    console.log('  Previous URL:', pagination.prevUrl)
  }
}
```

## Error Handling

Handle pagination errors gracefully:

```typescript
const scraper = createScraper({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
})

try {
  for await (const page of scraper.scrapeAll('https://example.com/list', {
    extract: (doc) => ({
      items: Array.from(doc.querySelectorAll('.item')).map(i => i.textContent),
    }),
  }, { maxPages: 100 })) {
    if (!page.success) {
      console.error(`Page ${page.pageNumber} failed:`, page.error)
      continue
    }

    console.log(`Page ${page.pageNumber}: ${page.data.items.length} items`)
  }
} catch (error) {
  console.error('Pagination failed:', error)
}
```

## Advanced: Custom Pagination Fetcher

Implement custom pagination logic:

```typescript
import { autoPaginate } from 'ts-web-scraper'

// Custom fetcher function
const customFetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CustomBot/1.0',
      'Authorization': 'Bearer token',
    },
  })
  return {
    html: await response.text(),
    url: response.url,
  }
}

// Use custom fetcher with auto-pagination
for await (const page of autoPaginate(
  'https://api.example.com/data',
  customFetcher,
  { maxPages: 50, delay: 1000 }
)) {
  console.log(`Page ${page.pageNumber}:`, page.html.length, 'bytes')
}
```

## Best Practices

1. Always set `maxPages` to prevent infinite loops
2. Use `delay` to be respectful to servers
3. Combine with rate limiting for production use
4. Handle errors for each page individually
5. Track progress when scraping many pages
6. Use caching to avoid re-fetching pages

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 1,
    perDomain: true,
  },
  cache: {
    enabled: true,
    ttl: 300000,  // 5 minutes
  },
  retry: {
    maxRetries: 3,
    backoff: 'exponential',
  },
})

let successCount = 0
let failCount = 0

for await (const page of scraper.scrapeAll('https://example.com/products', {
  extract: (doc) => ({
    products: Array.from(doc.querySelectorAll('.product')).map(p => ({
      name: p.querySelector('.name')?.textContent,
    })),
  }),
}, {
  maxPages: 100,
  delay: 1000,
})) {
  if (page.success) {
    successCount++
    console.log(`✓ Page ${page.pageNumber}: ${page.data.products.length} products`)
  } else {
    failCount++
    console.error(`✗ Page ${page.pageNumber} failed:`, page.error)
  }
}

console.log(`\nCompleted: ${successCount} succeeded, ${failCount} failed`)
```

## Next Steps

- Learn about [Client-Side Rendering](/advanced/client-side)
- Configure [Rate Limiting](/features/rate-limiting)
- Enable [Caching](/features/caching)
