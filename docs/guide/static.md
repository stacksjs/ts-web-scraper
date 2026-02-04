# Static Pages

Static page scraping is the fastest and most efficient way to extract data from server-rendered HTML content.

## Basic HTML Fetching

```typescript
import { fetchHTML } from 'ts-web-scraper'

const { document, html, response } = await fetchHTML('https://example.com')

// Access the parsed document
const title = document.querySelector('title')?.textContent

// Access raw HTML
console.log(html.length)

// Access response info
console.log(response.status)
console.log(response.headers.get('content-type'))
```

## Fetch Options

```typescript
import { fetchHTML } from 'ts-web-scraper'

const { document } = await fetchHTML('https://example.com', {
  // Custom headers
  headers: {
    'User-Agent': 'MyBot/1.0',
    'Accept-Language': 'en-US',
  },

  // Request timeout (ms)
  timeout: 10000,

  // Follow redirects
  followRedirects: true,
  maxRedirects: 5,

  // Authentication
  auth: {
    username: 'user',
    password: 'pass',
  },
})
```

## Parse HTML Strings

For HTML content you already have:

```typescript
import { parseHTML } from 'ts-web-scraper'

const html = `
<!DOCTYPE html>
<html>
  <head><title>Example</title></head>
  <body>
    <h1>Hello World</h1>
    <p class="content">Some text</p>
  </body>
</html>
`

const doc = parseHTML(html)

const title = doc.querySelector('title')?.textContent // 'Example'
const heading = doc.querySelector('h1')?.textContent // 'Hello World'
const content = doc.querySelector('.content')?.textContent // 'Some text'
```

## Extract Text Content

```typescript
import { extractText } from 'ts-web-scraper'

// Extract text from specific element
const mainContent = extractText(document, 'main')

// Extract from multiple selectors
const allHeadings = extractText(document, 'h1, h2, h3')
```

## Extract Links

```typescript
import { extractLinks } from 'ts-web-scraper'

// Basic link extraction
const links = extractLinks(document)

// With options
const filteredLinks = extractLinks(document, {
  // Convert to absolute URLs
  absolute: true,
  baseUrl: 'https://example.com',

  // Filter by type
  internal: true,  // Only internal links
  external: false, // Exclude external links

  // Filter by selector
  selector: 'nav a',

  // Include/exclude patterns
  include: [/\/products\//],
  exclude: [/\/login/, /\/logout/],
})

// Each link object
links.forEach(link => {
  console.log(link.href)    // URL
  console.log(link.text)    // Link text
  console.log(link.rel)     // rel attribute
  console.log(link.target)  // target attribute
})
```

## Extract Metadata

```typescript
import { extractMeta, extractStandardMeta } from 'ts-web-scraper'

// Standard meta tags
const meta = extractMeta(document)

console.log(meta.title)       // <title>
console.log(meta.description) // meta[name="description"]
console.log(meta.keywords)    // meta[name="keywords"]
console.log(meta.author)      // meta[name="author"]
console.log(meta.canonical)   // link[rel="canonical"]
console.log(meta.robots)      // meta[name="robots"]
```

## Extract Open Graph Data

```typescript
import { extractOpenGraph } from 'ts-web-scraper'

const og = extractOpenGraph(document)

console.log(og.title)       // og:title
console.log(og.description) // og:description
console.log(og.image)       // og:image
console.log(og.url)         // og:url
console.log(og.type)        // og:type
console.log(og.siteName)    // og:site_name
```

## Extract Structured Data

```typescript
import { extractStructuredData } from 'ts-web-scraper'

// Extracts JSON-LD, Microdata, RDFa
const structured = extractStructuredData(document)

// JSON-LD scripts
structured.jsonLd.forEach(data => {
  console.log(data['@type'])
  console.log(data.name)
})
```

## Fetch Multiple Pages

```typescript
import { fetchMultiple } from 'ts-web-scraper'

const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
]

const results = await fetchMultiple(urls, {
  concurrency: 3, // Max concurrent requests
  delay: 1000,    // Delay between requests (ms)
})

results.forEach(({ url, document, error }) => {
  if (error) {
    console.error(`Failed: ${url}`, error)
  } else {
    console.log(`Success: ${url}`)
  }
})
```

## Using the Scraper Class

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  rateLimit: { requestsPerSecond: 2 },
  cache: { enabled: true, ttl: 60000 },
})

const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('title')?.textContent,
    links: Array.from(doc.querySelectorAll('a'))
      .map(a => a.getAttribute('href'))
      .filter(Boolean),
  }),
})

if (result.success) {
  console.log(result.data.title)
  console.log(result.data.links)
}
```

## Example: News Article Scraper

```typescript
import { createScraper, extractMainContent, extractMeta } from 'ts-web-scraper'

const scraper = createScraper({
  cache: { enabled: true, ttl: 300000 }, // 5 min cache
})

async function scrapeArticle(url: string) {
  const result = await scraper.scrape(url, {
    extract: doc => {
      const meta = extractMeta(doc)
      const content = extractMainContent(doc)

      return {
        title: meta.title,
        author: doc.querySelector('.author')?.textContent || meta.author,
        publishDate: doc.querySelector('time')?.getAttribute('datetime'),
        content: content.text,
        wordCount: content.wordCount,
        readingTime: content.readingTime,
      }
    },
  })

  return result.data
}
```

## Example: Product Catalog Scraper

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper()

async function scrapeProducts(url: string) {
  const result = await scraper.scrape(url, {
    extract: doc => {
      const products = Array.from(doc.querySelectorAll('.product'))

      return products.map(product => ({
        name: product.querySelector('.name')?.textContent?.trim(),
        price: parseFloat(
          product.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'
        ),
        image: product.querySelector('img')?.getAttribute('src'),
        url: product.querySelector('a')?.getAttribute('href'),
        inStock: product.querySelector('.in-stock') !== null,
      }))
    },
  })

  return result.data
}
```

## Performance Tips

1. **Enable caching** for repeated requests
2. **Use rate limiting** to avoid being blocked
3. **Set timeouts** to handle slow responses
4. **Extract only what you need** to reduce processing time
5. **Use concurrency** for multiple pages, but respect rate limits
