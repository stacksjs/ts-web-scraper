# Client-Side Rendering

Scrape JavaScript-heavy websites and single-page applications (SPAs) by analyzing client-side rendered content.

## Overview

Modern websites often render content with JavaScript frameworks like React, Vue, Next.js, or Angular. The client-side scraper can extract data from these sites by:

1. Analyzing JavaScript bundles to find API endpoints
2. Extracting embedded data (like `__NEXT_DATA__`)
3. Reconstructing API calls to fetch data directly

## Basic Client-Side Scraping

Scrape a client-side rendered website:

```typescript
import { scrapeClientSide } from 'ts-web-scraper'

const result = await scrapeClientSide('https://example.com')

console.log('HTML:', result.html.length, 'bytes')
console.log('Script URLs:', result.scriptUrls.length)
console.log('API Endpoints:', result.apiEndpoints)
console.log('Embedded Data:', Object.keys(result.embeddedData))
console.log('API Responses:', result.apiResponses.size)
```

## Detecting Client-Side Rendering

Check if a site uses client-side rendering:

```typescript
import { isClientSideRendered } from 'ts-web-scraper'

const isCSR = await isClientSideRendered('https://example.com')

if (isCSR) {
  console.log('Site uses client-side rendering')
  // Use client-side scraper
  const data = await scrapeClientSide('https://example.com')
} else {
  console.log('Site uses server-side rendering')
  // Use regular scraper
  const scraper = createScraper()
  const result = await scraper.scrape('https://example.com')
}
```

## Extracting Embedded Data

Extract data embedded in the HTML:

```typescript
const result = await scrapeClientSide('https://example.com')

// Next.js data
if (result.embeddedData.__NEXT_DATA__) {
  const nextData = result.embeddedData.__NEXT_DATA__
  console.log('Page props:', nextData.props)
  console.log('Page data:', nextData.props?.pageProps)
}

// Redux/Apollo state
if (result.embeddedData.__INITIAL_STATE__) {
  console.log('Initial state:', result.embeddedData.__INITIAL_STATE__)
}

// JSON-LD structured data
if (result.embeddedData.jsonLd) {
  console.log('Structured data:', result.embeddedData.jsonLd)
}
```

## Discovering API Endpoints

Analyze JavaScript to find API endpoints:

```typescript
const result = await scrapeClientSide('https://example.com', {
  analyzeJavaScript: true,
  maxJSFiles: 10,  // Analyze up to 10 JS files
})

console.log('Found API endpoints:')
result.apiEndpoints.forEach(endpoint => {
  console.log('  -', endpoint)
})

// Access API responses (automatically fetched)
for (const [endpoint, data] of result.apiResponses.entries()) {
  console.log(`\nData from ${endpoint}:`)
  console.log(data)
}
```

## Configuration Options

Customize client-side scraping:

```typescript
const result = await scrapeClientSide('https://example.com', {
  timeout: 30000,                 // 30 second timeout
  userAgent: 'MyBot/1.0',        // Custom user agent
  analyzeJavaScript: true,       // Analyze JS bundles
  findEmbeddedData: true,        // Extract embedded data
  reconstructAPI: true,          // Fetch discovered APIs
  maxJSFiles: 5,                 // Max JS files to analyze
  headers: {                     // Custom headers
    'Accept-Language': 'en-US',
  },
})
```

## Extracting Data Automatically

Use the helper to get the most relevant data:

```typescript
import { extractData } from 'ts-web-scraper'

const data = await extractData('https://example.com')

// Returns embedded data, API responses, or meta info
// in order of priority
console.log(data)
```

## Next.js Applications

Scraping Next.js applications:

```typescript
const result = await scrapeClientSide('https://nextjs-app.com/product/123')

// Next.js embeds data in __NEXT_DATA__
const nextData = result.embeddedData.__NEXT_DATA__

if (nextData) {
  // Access page props
  const pageProps = nextData.props?.pageProps

  console.log('Product data:', pageProps?.product)
  console.log('Initial props:', pageProps)
}
```

## React Applications

Scraping React SPAs:

```typescript
const result = await scrapeClientSide('https://react-app.com/dashboard')

// Look for API endpoints in JS bundles
console.log('API endpoints found:', result.apiEndpoints)

// Check API responses
for (const [url, data] of result.apiResponses.entries()) {
  if (url.includes('/api/user')) {
    console.log('User data:', data)
  }
}
```

## Vue.js Applications

Scraping Vue applications:

```typescript
const result = await scrapeClientSide('https://vue-app.com')

// Vue apps often have window.__INITIAL_STATE__
if (result.embeddedData.__INITIAL_STATE__) {
  const state = result.embeddedData.__INITIAL_STATE__
  console.log('Vuex state:', state)
}
```

## Handling Authentication

Scrape authenticated pages:

```typescript
const result = await scrapeClientSide('https://app.example.com/dashboard', {
  headers: {
    'Cookie': 'session=abc123; auth_token=xyz789',
    'Authorization': 'Bearer your-token-here',
  },
})

// APIs will be called with the same headers
console.log('API responses:', result.apiResponses)
```

## Meta Information

Extract page metadata:

```typescript
const result = await scrapeClientSide('https://example.com')

console.log('Title:', result.meta.title)
console.log('Description:', result.meta.description)
console.log('Keywords:', result.meta.keywords)
console.log('OG Image:', result.meta.image)
console.log('All meta:', result.meta)
```

## Combining with Regular Scraper

Use both approaches together:

```typescript
import { createScraper, scrapeClientSide, isClientSideRendered } from 'ts-web-scraper'

async function smartScrape(url: string) {
  // Detect rendering method
  const isCSR = await isClientSideRendered(url)

  if (isCSR) {
    // Client-side rendered - use CSR scraper
    const result = await scrapeClientSide(url)
    return {
      data: result.embeddedData,
      apis: result.apiResponses,
      meta: result.meta,
    }
  } else {
    // Server-side rendered - use regular scraper
    const scraper = createScraper()
    const result = await scraper.scrape(url, {
      extract: (doc) => ({
        title: doc.querySelector('h1')?.textContent,
        content: doc.querySelector('.content')?.textContent,
      }),
    })
    return { data: result.data }
  }
}

const data = await smartScrape('https://example.com')
console.log(data)
```

## API Endpoint Patterns

The scraper looks for these patterns in JavaScript:

```typescript
// Patterns detected:
// - /api/... endpoints
// - fetch() calls
// - axios/request calls
// - baseURL/apiUrl configurations
// - Route patterns

const result = await scrapeClientSide('https://example.com', {
  analyzeJavaScript: true,
})

// Found endpoints like:
// - https://example.com/api/products
// - https://example.com/api/user/profile
// - https://api.example.com/v1/data
```

## Performance Considerations

Optimize client-side scraping:

```typescript
// Fast: Only extract embedded data
const fast = await scrapeClientSide('https://example.com', {
  analyzeJavaScript: false,
  reconstructAPI: false,
  findEmbeddedData: true,
})

// Thorough: Analyze JS and call APIs
const thorough = await scrapeClientSide('https://example.com', {
  analyzeJavaScript: true,
  reconstructAPI: true,
  maxJSFiles: 20,
  timeout: 60000,
})

// Balanced: Analyze few JS files, skip API calls
const balanced = await scrapeClientSide('https://example.com', {
  analyzeJavaScript: true,
  reconstructAPI: false,
  maxJSFiles: 5,
})
```

## Error Handling

Handle errors gracefully:

```typescript
try {
  const result = await scrapeClientSide('https://example.com', {
    timeout: 30000,
  })

  if (result.apiResponses.size === 0) {
    console.warn('No API data found')
  }

  if (Object.keys(result.embeddedData).length === 0) {
    console.warn('No embedded data found')
  }

} catch (error) {
  console.error('Client-side scraping failed:', error)
  // Fall back to regular scraping
}
```

## Advanced: Custom Analysis

Analyze specific JavaScript files:

```typescript
const result = await scrapeClientSide('https://example.com')

// Manually analyze specific scripts
const mainScript = result.scriptUrls.find(url => url.includes('main'))

if (mainScript) {
  const response = await fetch(mainScript)
  const jsCode = await response.text()

  // Look for specific patterns
  const apiKeys = jsCode.match(/apiKey["']?\s*[:=]\s*["']([^"']+)["']/g)
  const endpoints = jsCode.match(/https?:\/\/[^"'\s]+/g)

  console.log('API keys found:', apiKeys)
  console.log('Endpoints found:', endpoints)
}
```

## Best Practices

1. Always check if site is client-side rendered first
2. Use embedded data when available (faster)
3. Limit `maxJSFiles` to avoid analyzing too many files
4. Set reasonable timeouts for slow sites
5. Combine with caching to avoid re-analyzing
6. Handle cases where no data is found
7. Use custom headers for authentication

```typescript
const result = await scrapeClientSide('https://example.com', {
  timeout: 30000,
  maxJSFiles: 5,
  analyzeJavaScript: true,
  findEmbeddedData: true,
  reconstructAPI: false,  // Skip if you only need structure
})

// Priority order: embedded -> API -> meta
const data =
  Object.keys(result.embeddedData).length > 0
    ? result.embeddedData
    : result.apiResponses.size > 0
      ? Object.fromEntries(result.apiResponses)
      : result.meta

console.log('Extracted data:', data)
```

## Next Steps

- Learn about [GraphQL Detection](/advanced/graphql)
- Configure [Session Management](/advanced/sessions)
- Explore [Pipelines](/advanced/pipelines)
