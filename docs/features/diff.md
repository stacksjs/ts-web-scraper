# Change Detection

Track and monitor content changes over time.

## Basic Change Tracking

Enable change tracking:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  trackChanges: true,
  cache: { enabled: true },  // Required for change tracking
})

// First scrape
const result1 = await scraper.scrape('https://example.com/price', {
  extract: (doc) => ({
    price: doc.querySelector('.price')?.textContent,
  }),
})
console.log(result1.changed) // undefined (no previous data)

// Second scrape
const result2 = await scraper.scrape('https://example.com/price', {
  extract: (doc) => ({
    price: doc.querySelector('.price')?.textContent,
  }),
})
console.log(result2.changed) // false or true
```

## Price Monitoring

Monitor price changes:

```typescript
const scraper = createScraper({
  trackChanges: true,
  cache: { enabled: true, ttl: 300000 },  // 5 minutes
})

async function checkPrice(url: string) {
  const result = await scraper.scrape(url, {
    extract: (doc) => ({
      name: doc.querySelector('.product-name')?.textContent,
      price: parseFloat(doc.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'),
      inStock: doc.querySelector('.in-stock') !== null,
    }),
  })

  if (result.changed) {
    console.log('Price changed!')
    console.log('New data:', result.data)
    // Send notification
    // Update database
  }

  return result
}

// Check periodically
setInterval(() => checkPrice('https://example.com/product'), 300000)
```

## Content Tracker

Use ContentTracker for advanced tracking:

```typescript
import { ContentTracker } from 'ts-web-scraper'

const tracker = new ContentTracker({
  maxSnapshots: 10,           // Keep last 10 snapshots
  storageDir: './snapshots',  // Persist to disk
})

// Take snapshot
const snapshot = await tracker.snapshot(
  'https://example.com',
  { title: 'Example', content: '...' }
)

// Check for changes
const hasChanged = await tracker.hasChanged(
  'https://example.com',
  { title: 'Example Domain', content: '...' }
)

console.log('Content changed:', hasChanged)
```

## Deep Diff

Get detailed changes:

```typescript
import { diff } from 'ts-web-scraper'

const oldData = {
  name: 'Product',
  price: 99.99,
  specs: { color: 'blue', size: 'L' },
}

const newData = {
  name: 'Product',
  price: 79.99,
  specs: { color: 'red', size: 'L' },
}

const changes = diff(oldData, newData)

console.log(changes)
// [
//   { type: 'modified', path: 'price', oldValue: 99.99, newValue: 79.99 },
//   { type: 'modified', path: 'specs.color', oldValue: 'blue', newValue: 'red' }
// ]
```

## Change Types

Diff detects three types of changes:

```typescript
import { diff } from 'ts-web-scraper'

const changes = diff(
  { a: 1, b: 2, c: 3 },
  { a: 1, b: 20, d: 4 }
)

// Returns:
// [
//   { type: 'modified', path: 'b', oldValue: 2, newValue: 20 },
//   { type: 'deleted', path: 'c', oldValue: 3 },
//   { type: 'added', path: 'd', newValue: 4 }
// ]
```

## Snapshot History

Access snapshot history:

```typescript
const tracker = new ContentTracker({
  maxSnapshots: 10,
})

// Take multiple snapshots
await tracker.snapshot('url', { price: 100 })
await tracker.snapshot('url', { price: 95 })
await tracker.snapshot('url', { price: 90 })

// Get all changes
const changes = await tracker.getChanges('url', { price: 90 })

console.log('Change history:', changes)
```

## Monitoring Specific Fields

Track only specific fields:

```typescript
async function monitorPrice(url: string) {
  const result = await scraper.scrape(url, {
    extract: (doc) => ({
      price: parseFloat(
        doc.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'
      ),
    }),
  })

  if (result.changed) {
    // Price changed
    return result.data.price
  }

  return null
}
```

## Change Notifications

Implement change notifications:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  trackChanges: true,
  cache: { enabled: true, ttl: 60000 },
})

async function watchUrl(url: string, onChanged: (data: any) => void) {
  const result = await scraper.scrape(url, {
    extract: (doc) => ({
      title: doc.querySelector('h1')?.textContent,
      content: doc.querySelector('.content')?.textContent,
    }),
  })

  if (result.changed) {
    onChanged(result.data)
  }
}

// Monitor multiple URLs
const urls = [
  'https://example.com/news',
  'https://example.com/updates',
  'https://example.com/announcements',
]

setInterval(async () => {
  for (const url of urls) {
    await watchUrl(url, (data) => {
      console.log(`Change detected at ${url}:`, data)
      // Send email, webhook, etc.
    })
  }
}, 60000) // Check every minute
```

## Persistent Storage

Store snapshots persistently:

```typescript
const tracker = new ContentTracker({
  maxSnapshots: 50,
  storageDir: './data/snapshots',  // Persists to disk
})

// Snapshots survive process restarts
await tracker.snapshot('url', data)

// Later, after restart
const hasChanged = await tracker.hasChanged('url', newData)
```

## Change Detection with Pagination

Track changes across paginated content:

```typescript
const scraper = createScraper({
  trackChanges: true,
  cache: { enabled: true },
})

for await (const page of scraper.scrapeAll('https://example.com', {
  extract: (doc) => ({
    items: Array.from(doc.querySelectorAll('.item')).map(item => ({
      id: item.getAttribute('data-id'),
      title: item.querySelector('.title')?.textContent,
    })),
  }),
}, {
  maxPages: 10,
})) {
  if (page.changed) {
    console.log(`Page ${page.pageNumber} changed`)
    console.log('New items:', page.data.items)
  }
}
```

## Best Practices

1. Enable caching for change tracking to work
2. Set appropriate cache TTL for your monitoring frequency
3. Use maxSnapshots to limit memory usage
4. Persist snapshots to disk for long-term tracking
5. Monitor specific fields instead of entire pages
6. Implement notifications for important changes
7. Handle false positives (dynamic content, ads, timestamps)

```typescript
const scraper = createScraper({
  trackChanges: true,
  cache: {
    enabled: true,
    ttl: 300000,  // 5 minutes
  },
  maxSnapshots: 20,
})

async function monitorProduct(url: string) {
  const result = await scraper.scrape(url, {
    extract: (doc) => {
      // Extract only relevant fields (ignore timestamps, ads, etc.)
      return {
        price: parseFloat(
          doc.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'
        ),
        inStock: doc.querySelector('.in-stock') !== null,
        rating: parseFloat(
          doc.querySelector('.rating')?.textContent || '0'
        ),
      }
    },
  })

  if (result.changed) {
    console.log('Product changed:', result.data)
    // Implement notification logic
  }
}
```

## Next Steps

- Enable [Caching](/features/caching)
- Configure [Monitoring](/features/monitoring)
- Learn about [Validation](/features/validation)
