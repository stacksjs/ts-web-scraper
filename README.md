<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# ts-web-scraper

A powerful, type-safe web scraping library for TypeScript and Bun with **zero external dependencies**. Built entirely on Bun's native APIs for maximum performance and minimal footprint.

## Features

- 🚀 **Zero Dependencies** - Built entirely on Bun native APIs
- 💪 **Fully Typed** - Complete TypeScript support with type inference
- ⚡️ **High Performance** - Optimized for speed with native Bun performance
- 🔄 **Rate Limiting** - Built-in token bucket rate limiter with burst support
- 💾 **Smart Caching** - LRU cache with TTL support
- 🔁 **Automatic Retries** - Exponential backoff retry logic
- 📊 **Data Extraction** - Powerful pipeline-based data extraction and transformation
- 🎯 **Validation** - Built-in schema validation for extracted data
- 📈 **Monitoring** - Performance metrics and analytics
- 🔍 **Change Detection** - Track content changes over time with diff algorithms
- 🤖 **Ethical Scraping** - Robots.txt support and user-agent management
- 🍪 **Session Management** - Cookie jar and session persistence
- 📝 **Multiple Export Formats** - JSON, CSV, XML, YAML, Markdown, HTML
- 🌐 **Pagination** - Automatic pagination detection and traversal
- 🎨 **Client-Side Rendering** - Support for JavaScript-heavy sites
- 📚 **Comprehensive Docs** - Full documentation with examples

## Installation

```bash
bun add ts-web-scraper
```

## Quick Start

```typescript
import { createScraper } from 'ts-web-scraper'

// Create a scraper instance
const scraper = createScraper({
  rateLimit: { requestsPerSecond: 2 },
  cache: { enabled: true, ttl: 60000 },
  retry: { maxRetries: 3 },
})

// Scrape a website
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    title: doc.querySelector('title')?.textContent,
    headings: Array.from(doc.querySelectorAll('h1')).map(h => h.textContent),
  }),
})

console.log(result.data)
```

## Core Concepts

### Scraper

The main scraper class provides a unified API for all scraping operations:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  // Rate limiting
  rateLimit: {
    requestsPerSecond: 2,
    burstSize: 5
  },

  // Caching
  cache: {
    enabled: true,
    ttl: 60000,
    maxSize: 100
  },

  // Retry logic
  retry: {
    maxRetries: 3,
    initialDelay: 1000
  },

  // Performance monitoring
  monitor: true,

  // Change tracking
  trackChanges: true,

  // Cookies & sessions
  cookies: { enabled: true },
})
```

### Data Extraction

Extract and transform data using pipelines:

```typescript
import { pipeline, extractors } from 'ts-web-scraper'

const extractProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.product-name',
    price: '.product-price',
    rating: '.rating',
  }))
  .map('parse-price', (p) => ({
    ...p,
    price: parseFloat(p.price.replace(/[^0-9.]/g, '')),
  }))
  .filter('in-stock', (products) => products.every(p => p.price > 0))
  .sort('by-price', (a, b) => a.price - b.price)

const result = await extractProducts.execute(document)
```

### Change Detection

Track content changes over time:

```typescript
const scraper = createScraper({ trackChanges: true })

// First scrape
const result1 = await scraper.scrape('https://example.com', {
  extract: (doc) => ({ price: doc.querySelector('.price')?.textContent }),
})
// result1.changed === undefined (no previous snapshot)

// Second scrape
const result2 = await scraper.scrape('https://example.com', {
  extract: (doc) => ({ price: doc.querySelector('.price')?.textContent }),
})
// result2.changed === false (if price hasn't changed)
```

### Export Data

Export scraped data to multiple formats:

```typescript
import { exportData, saveExport } from 'ts-web-scraper'

// Export to JSON
const json = exportData(data, { format: 'json', pretty: true })

// Export to CSV
const csv = exportData(data, { format: 'csv' })

// Save to file (format auto-detected from extension)
await saveExport(data, 'output.csv')
await saveExport(data, 'output.json')
await saveExport(data, 'output.xml')
```

## Advanced Features

### Pagination

Automatically traverse paginated content:

```typescript
for await (const page of scraper.scrapeAll('https://example.com/posts', {
  extract: (doc) => ({
    posts: extractors.structured('article', {
      title: 'h2',
      content: '.content',
    }).execute(doc),
  }),
}, { maxPages: 10 })) {
  console.log(`Page ${page.pageNumber}:`, page.data)
}
```

### Performance Monitoring

Track and analyze scraping performance:

```typescript
const scraper = createScraper({ monitor: true })

await scraper.scrape('https://example.com')
await scraper.scrape('https://example.com/page2')

const stats = scraper.getStats()
console.log(stats.totalRequests) // 2
console.log(stats.averageDuration) // Average time per request
console.log(stats.cacheHitRate) // Cache effectiveness

const report = scraper.getReport()
console.log(report) // Formatted performance report
```

### Content Validation

Validate extracted data against schemas:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    title: doc.querySelector('title')?.textContent,
    price: parseFloat(doc.querySelector('.price')?.textContent || '0'),
  }),
  validate: {
    title: { type: 'string', required: true },
    price: { type: 'number', min: 0, required: true },
  },
})

if (result.success) {
  // Data is valid and typed
  console.log(result.data.title, result.data.price)
} else {
  console.error(result.error)
}
```

## Documentation

For full documentation, visit [https://ts-web-scraper.netlify.app](https://ts-web-scraper.netlify.app)

- [Getting Started Guide](https://ts-web-scraper.netlify.app/guide/)
- [API Reference](https://ts-web-scraper.netlify.app/api/)
- [Examples](https://ts-web-scraper.netlify.app/examples/)

## Testing

```bash
bun test
```

All 482 tests passing with comprehensive coverage of:
- Core scraping functionality
- Rate limiting and caching
- Data extraction pipelines
- Change detection and monitoring
- Export formats
- Error handling and edge cases

## Changelog

Please see our [releases](https://github.com/stacksjs/ts-web-scraper/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/ts-web-scraper/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

"Software that is free, but hopes for a postcard." We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/ts-web-scraper?style=flat-square
[npm-version-href]: https://npmjs.com/package/ts-web-scraper
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/ts-web-scraper/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/ts-web-scraper/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/ts-web-scraper/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/ts-web-scraper -->
