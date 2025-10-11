# Robots.txt

Parse and respect robots.txt rules for ethical and compliant web scraping.

## Basic Usage

Check if a URL can be scraped:

```typescript
import { canFetch } from 'ts-web-scraper'

// Check if URL is allowed by robots.txt
const allowed = await canFetch('https://example.com/api/data')

if (allowed) {
  console.log('URL is allowed by robots.txt')
  // Proceed with scraping
} else {
  console.log('URL is disallowed by robots.txt')
  // Skip this URL
}
```

## Automatic Robots.txt Respect

Enable automatic robots.txt checking:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  respectRobotsTxt: true,  // Default: true
  userAgent: 'MyBot/1.0',
})

// Automatically checks robots.txt before scraping
const result = await scraper.scrape('https://example.com/page')

if (!result.success && result.error?.includes('robots.txt')) {
  console.log('Blocked by robots.txt')
}
```

## Robots Parser

Use the RobotsParser directly:

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  respectRobotsTxt: true,
  userAgent: 'BunScraper',
  cacheTime: 3600000,  // 1 hour
  timeout: 5000,
})

// Check if URL can be fetched
const canScrape = await parser.canFetch('https://example.com/data')
console.log('Can scrape:', canScrape)

// Get crawl delay
const delay = await parser.getCrawlDelay('https://example.com')
console.log('Crawl delay:', delay, 'ms')

// Get sitemaps
const sitemaps = await parser.getSitemaps('https://example.com')
console.log('Sitemaps:', sitemaps)
```

## Crawl Delay

Respect crawl-delay directives:

```typescript
import { getCrawlDelay } from 'ts-web-scraper'

const delay = await getCrawlDelay('https://example.com', {
  userAgent: 'MyBot/1.0',
})

if (delay > 0) {
  console.log(`Robots.txt specifies ${delay}ms delay between requests`)

  // Use the delay in your scraper
  const scraper = createScraper({
    respectRobotsTxt: true,
    rateLimit: {
      requestsPerSecond: 1000 / delay,  // Convert delay to rate
    },
  })
}
```

## Parsing Robots.txt

Parse robots.txt manually:

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  respectRobotsTxt: true,
  userAgent: 'MyBot',
})

const robotsUrl = 'https://example.com/robots.txt'
const parsed = await parser.fetch(robotsUrl)

console.log('Rules:', parsed.rules)
console.log('Sitemaps:', parsed.sitemaps)

// Check specific rules
parsed.rules.forEach(rule => {
  console.log(`User-agent: ${rule.userAgent}`)
  console.log(`  Allow: ${rule.allow}`)
  console.log(`  Disallow: ${rule.disallow}`)
  console.log(`  Crawl-Delay: ${rule.crawlDelay}`)
})
```

## Custom User Agent

Use custom user agent for robots.txt checks:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  respectRobotsTxt: true,
  userAgent: 'MyCustomBot/2.0 (+https://mybotinfo.com)',
})

// Robots.txt will be checked for "MyCustomBot" user agent
// Falls back to "*" if specific user agent rules not found
```

## Robots.txt Example

Understanding robots.txt format:

```
# Example robots.txt

User-agent: *
Disallow: /admin/
Disallow: /private/
Crawl-delay: 1

User-agent: Googlebot
Allow: /admin/public/
Disallow: /admin/

User-agent: BadBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
```

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  userAgent: 'MyBot',
})

// Parse the robots.txt content
const robotsContent = `
User-agent: *
Disallow: /admin/
Crawl-delay: 2
`

const parsed = parser.parse(robotsContent)
console.log(parsed.rules)
// [{
//   userAgent: '*',
//   allow: [],
//   disallow: ['/admin/'],
//   crawlDelay: 2000  // Converted to milliseconds
// }]
```

## Allow and Disallow Rules

Understanding rule matching:

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  userAgent: 'MyBot',
})

// Allow takes precedence over Disallow
const robotsContent = `
User-agent: *
Disallow: /admin/
Allow: /admin/public/
`

// /admin/public/page - ALLOWED (specific allow rule)
// /admin/private/page - DISALLOWED (general disallow rule)

const allowed1 = await parser.canFetch('https://example.com/admin/public/page')
console.log(allowed1) // true

const allowed2 = await parser.canFetch('https://example.com/admin/private/page')
console.log(allowed2) // false
```

## Wildcard Patterns

Robots.txt supports wildcards:

```typescript
// Wildcards in robots.txt:
// * matches any sequence of characters
// $ matches end of URL

const robotsContent = `
User-agent: *
Disallow: /*.json$    # Blocks all .json files
Disallow: /*/private/ # Blocks any path containing /private/
Allow: /api/*/public/ # Allows /api/*/public/ paths
`

// /data/file.json - DISALLOWED (ends with .json)
// /api/v1/private/data - DISALLOWED (contains /private/)
// /api/v2/public/info - ALLOWED (matches allow pattern)
```

## Caching

Robots.txt responses are cached:

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  respectRobotsTxt: true,
  cacheTime: 3600000,  // Cache for 1 hour
})

// First check - fetches robots.txt
await parser.canFetch('https://example.com/page1')

// Second check - uses cached robots.txt
await parser.canFetch('https://example.com/page2')

// Cache automatically expires after 1 hour
```

## Sitemap Discovery

Discover sitemaps from robots.txt:

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  userAgent: 'MyBot',
})

const sitemaps = await parser.getSitemaps('https://example.com')

console.log('Found sitemaps:')
sitemaps.forEach(sitemap => {
  console.log('  -', sitemap)
})

// Use sitemaps for comprehensive scraping
for (const sitemapUrl of sitemaps) {
  const response = await fetch(sitemapUrl)
  const xml = await response.text()
  // Parse sitemap XML and extract URLs
}
```

## Disabling Robots.txt

Disable robots.txt checking (use responsibly):

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  respectRobotsTxt: false,  // Disable robots.txt checking
})

// WARNING: Only disable for:
// - Sites you own
// - Internal tools
// - With explicit permission
```

## Error Handling

Handle robots.txt errors:

```typescript
import { RobotsParser } from 'ts-web-scraper'

const parser = new RobotsParser({
  respectRobotsTxt: true,
  timeout: 5000,
})

try {
  const canScrape = await parser.canFetch('https://example.com/page')

  if (!canScrape) {
    console.log('URL is disallowed by robots.txt')
  }
} catch (error) {
  // robots.txt not found or error fetching
  // Default: allow scraping if robots.txt doesn't exist
  console.log('robots.txt not found, proceeding with scraping')
}
```

## Global Robots Parser

Use the global parser instance:

```typescript
import { getGlobalRobotsParser } from 'ts-web-scraper'

const parser = getGlobalRobotsParser({
  userAgent: 'MyBot/1.0',
  cacheTime: 7200000,  // 2 hours
})

// Reuse the same parser instance
const allowed1 = await parser.canFetch('https://example.com/page1')
const allowed2 = await parser.canFetch('https://different-site.com/page')
```

## Best Practices

1. Always respect robots.txt in production
2. Use a descriptive user agent
3. Respect crawl-delay directives
4. Cache robots.txt responses
5. Handle missing robots.txt gracefully
6. Check robots.txt before bulk scraping

```typescript
import { createScraper, getCrawlDelay } from 'ts-web-scraper'

async function ethicalScrape(urls: string[]) {
  // Check robots.txt and get crawl delay
  const baseUrl = new URL(urls[0]).origin
  const delay = await getCrawlDelay(baseUrl, {
    userAgent: 'MyBot/1.0 (+https://mysite.com/bot-info)',
  })

  // Create scraper with appropriate settings
  const scraper = createScraper({
    respectRobotsTxt: true,
    userAgent: 'MyBot/1.0 (+https://mysite.com/bot-info)',
    rateLimit: {
      requestsPerSecond: delay > 0 ? 1000 / delay : 1,
    },
  })

  // Scrape with robots.txt compliance
  const results = []
  for (const url of urls) {
    const result = await scraper.scrape(url, {
      extract: (doc) => ({
        title: doc.querySelector('h1')?.textContent,
      }),
    })

    if (result.success) {
      results.push(result.data)
    } else if (result.error?.includes('robots.txt')) {
      console.log(`Skipped ${url} - disallowed by robots.txt`)
    }
  }

  return results
}

const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
]

const data = await ethicalScrape(urls)
console.log(`Scraped ${data.length} pages ethically`)
```

## Integration with Scraper

Full integration example:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  // Robots.txt configuration
  respectRobotsTxt: true,
  userAgent: 'EthicalBot/1.0 (+https://example.com/bot)',

  // Rate limiting (will adjust based on crawl-delay)
  rateLimit: {
    requestsPerSecond: 1,
    perDomain: true,
  },

  // Other ethical scraping settings
  cache: {
    enabled: true,
    ttl: 300000,
  },
  retry: {
    maxRetries: 2,
    backoff: 'exponential',
  },
})

// All requests automatically check robots.txt
const result = await scraper.scrape('https://example.com/data')
```

## Next Steps

- Configure [Rate Limiting](/features/rate-limiting)
- Learn about [Session Management](/advanced/sessions)
- Explore [Monitoring](/features/monitoring)
