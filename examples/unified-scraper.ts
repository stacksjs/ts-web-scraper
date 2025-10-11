/**
 * Unified Scraper Examples
 *
 * Showcasing the power and simplicity of the unified Scraper API
 */

import { createScraper } from '../src'

// Example 1: Basic Scraping with Auto-features
async function basicExample() {
  const scraper = createScraper({
    // Rate limiting
    rateLimit: {
      requestsPerSecond: 2,
    },

    // Automatic retries with exponential backoff
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
    },

    // Caching
    cache: {
      enabled: true,
      ttl: 3600000, // 1 hour
      storage: 'memory',
    },

    // Respect robots.txt
    respectRobotsTxt: true,

    // Track content changes
    trackChanges: true,

    // Performance monitoring
    monitor: true,
  })

  // Scrape with extraction
  const result = await scraper.scrape('https://example.com', {
    extract: (doc) => {
      const title = doc.querySelector('title')?.textContent
      const links = doc.querySelectorAll('a[href]')
        .map(a => a.getAttribute('href'))
        .filter(Boolean)

      return { title, links }
    },
    detectPagination: true,
    detectGraphQL: true,
  })

  console.log('📊 Scrape Results:')
  console.log(`Title: ${result.data?.title}`)
  console.log(`Links found: ${result.data?.links.length}`)
  console.log(`Cached: ${result.cached}`)
  console.log(`Duration: ${result.metrics.totalDuration.toFixed(2)}ms`)

  if (result.pagination?.hasMore) {
    console.log(`\n📄 Pagination detected: ${result.pagination.type}`)
  }

  if (result.graphql?.hasGraphQL) {
    console.log(`\n🔍 GraphQL detected: ${result.graphql.endpoints.length} endpoints`)
  }

  // Export results in multiple formats
  await scraper.save(result.data, 'output.json', { pretty: true })
  await scraper.save(result.data, 'output.csv')
  await scraper.save(result.data, 'output.xml', { pretty: true })
  await scraper.save(result.data, 'output.yaml')
  await scraper.save(result.data, 'output.md')

  console.log('\n💾 Exported to multiple formats!')
}

// Example 2: E-commerce Product Scraping with Validation
async function ecommerceExample() {
  const scraper = createScraper({
    rateLimit: { requestsPerSecond: 1 },
    cache: { enabled: true, ttl: 1800000 },
    respectRobotsTxt: true,
  })

  const result = await scraper.scrape('https://example-shop.com/products', {
    extract: (doc) => {
      return doc.querySelectorAll('.product').map((el) => {
        return {
          name: el.querySelector('.product-name')?.textContent?.trim(),
          price: el.querySelector('.price')?.textContent?.trim(),
          image: el.querySelector('img')?.getAttribute('src'),
          rating: el.querySelector('.rating')?.textContent?.trim(),
        }
      })
    },

    // Validate extracted data
    validate: {
      name: { type: 'string', required: true, minLength: 1 },
      price: { type: 'string', required: true, pattern: /\$\d+/ },
      image: { type: 'url' },
      rating: { type: 'string' },
    },
  })

  console.log(`\n🛍️  Found ${result.data?.length} products`)

  // Export as CSV for spreadsheet analysis
  await scraper.save(result.data, 'products.csv')
}

// Example 3: Auto-pagination - Scrape ALL Pages Automatically
async function paginationExample() {
  const scraper = createScraper({
    rateLimit: { requestsPerSecond: 2 },
    cache: { enabled: true },
  })

  console.log('\n📚 Auto-paginating through blog posts...')

  let totalPosts = 0

  // Automatically follows pagination and scrapes all pages!
  for await (const page of scraper.scrapeAll('https://blog.example.com', {
    maxPages: 10,
    delay: 1000,
    extract: (doc) => {
      return doc.querySelectorAll('article').map(article => ({
        title: article.querySelector('h2')?.textContent?.trim(),
        date: article.querySelector('.date')?.textContent?.trim(),
        excerpt: article.querySelector('.excerpt')?.textContent?.trim(),
      }))
    },
  })) {
    const posts = page.data?.length || 0
    totalPosts += posts
    console.log(`  Page ${page.url}: ${posts} posts (cached: ${page.cached})`)
  }

  console.log(`\n✅ Total posts scraped: ${totalPosts}`)
}

// Example 4: Content Change Tracking
async function changeTrackingExample() {
  const scraper = createScraper({
    trackChanges: true,
    maxSnapshots: 5,
  })

  const url = 'https://news.example.com'

  // First scrape - creates baseline
  await scraper.scrape(url, {
    extract: (doc) => ({
      headline: doc.querySelector('h1')?.textContent,
      articles: doc.querySelectorAll('article').length,
    }),
  })

  // Simulate time passing...
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Check for changes
  const changes = await scraper.checkChanges(url)

  if (changes?.hasChanges) {
    console.log('\n🔄 Content changed!')
    console.log(`Changes: ${changes.summary.modified} modified, ${changes.summary.added} added, ${changes.summary.removed} removed`)

    for (const change of changes.changes) {
      console.log(`  ${change.type}: ${change.path}`)
    }
  }
  else {
    console.log('\n✓ No changes detected')
  }
}

// Example 5: Parallel Scraping with Pipeline
async function parallelExample() {
  const scraper = createScraper({
    rateLimit: { requestsPerSecond: 5 },
    cache: { enabled: true },
  })

  const urls = [
    'https://example.com/page1',
    'https://example.com/page2',
    'https://example.com/page3',
    'https://example.com/page4',
    'https://example.com/page5',
  ]

  console.log(`\n⚡ Scraping ${urls.length} URLs in parallel...`)

  const results = await scraper.scrapeMany(urls, {
    concurrency: 3,
    extract: (doc) => ({
      title: doc.querySelector('title')?.textContent,
      wordCount: doc.body?.textContent?.split(/\s+/).length || 0,
    }),
  })

  const successful = results.filter(r => r.data)
  console.log(`✅ Successfully scraped: ${successful.length}/${urls.length}`)

  // Export all results
  await scraper.save(results.map(r => r.data), 'batch-results.json', { pretty: true })

  // View performance metrics
  const metrics = scraper.getMetrics()
  console.log(`\n📊 Performance:`)
  console.log(`  Average duration: ${metrics.summary.averageDuration.toFixed(2)}ms`)
  console.log(`  Cache hit rate: ${(metrics.summary.cacheHitRate * 100).toFixed(1)}%`)
}

// Example 6: Complete Workflow - E-commerce Price Monitor
async function priceMonitorExample() {
  const scraper = createScraper({
    rateLimit: { requestsPerSecond: 1 },
    cache: { enabled: true, ttl: 300000 }, // 5 min cache
    trackChanges: true,
    respectRobotsTxt: true,
    persistCookies: true, // Handle auth if needed
  })

  const productUrls = [
    'https://shop.example.com/product/123',
    'https://shop.example.com/product/456',
    'https://shop.example.com/product/789',
  ]

  console.log('\n💰 Monitoring prices...')

  for (const url of productUrls) {
    const result = await scraper.scrape(url, {
      extract: (doc) => ({
        name: doc.querySelector('.product-name')?.textContent?.trim(),
        price: Number.parseFloat(
          doc.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0',
        ),
        inStock: doc.querySelector('.in-stock') !== null,
      }),
      validate: {
        name: { type: 'string', required: true },
        price: { type: 'number', required: true, min: 0 },
        inStock: { type: 'boolean', required: true },
      },
    })

    // Check for price changes
    const changes = await scraper.checkChanges(url)
    if (changes?.hasChanges) {
      const priceChange = changes.changes.find(c => c.path === 'price')
      if (priceChange) {
        console.log(`\n🔔 Price alert for ${result.data?.name}:`)
        console.log(`  Old: $${priceChange.oldValue}`)
        console.log(`  New: $${priceChange.newValue}`)
        console.log(`  Difference: $${(priceChange.newValue - priceChange.oldValue).toFixed(2)}`)
      }
    }
  }

  // Export price history
  const tracker = scraper.getContentTracker()
  if (tracker) {
    const history = tracker.getTrackedUrls().map((url) => {
      const snapshots = tracker.getSnapshots(url)
      return {
        url,
        history: snapshots.map(s => ({
          timestamp: s.timestamp,
          data: s.content,
        })),
      }
    })

    await scraper.save(history, 'price-history.json', { pretty: true })
    await scraper.save(history, 'price-history.csv')
    await scraper.save(history, 'price-history.html')

    console.log('\n📊 Price history exported in multiple formats!')
  }
}

// Run examples
async function main() {
  console.log('🚀 Unified Scraper Examples\n')
  console.log('=''.repeat(50))

  try {
    console.log('\n1️⃣  Basic Scraping')
    console.log('-'.repeat(50))
    // await basicExample()

    console.log('\n2️⃣  E-commerce Product Scraping')
    console.log('-'.repeat(50))
    // await ecommerceExample()

    console.log('\n3️⃣  Auto-pagination')
    console.log('-'.repeat(50))
    // await paginationExample()

    console.log('\n4️⃣  Change Tracking')
    console.log('-'.repeat(50))
    // await changeTrackingExample()

    console.log('\n5️⃣  Parallel Scraping')
    console.log('-'.repeat(50))
    // await parallelExample()

    console.log('\n6️⃣  Price Monitor')
    console.log('-'.repeat(50))
    // await priceMonitorExample()

    console.log('\n✅ All examples completed!')
  }
  catch (error) {
    console.error('❌ Error:', error)
  }
}

// Uncomment to run
// main()
