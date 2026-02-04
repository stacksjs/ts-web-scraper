# JavaScript-Rendered Pages

Many modern websites use JavaScript frameworks like React, Vue, or Next.js to render content. ts-web-scraper provides tools to handle these single-page applications (SPAs).

## Detecting Client-Side Rendering

```typescript
import { isClientSideRendered } from 'ts-web-scraper'

const isCSR = await isClientSideRendered('https://example.com')

if (isCSR) {
  console.log('This page uses client-side rendering')
}
```

## Client-Side Scraping

### Basic Usage

```typescript
import { scrapeClientSide } from 'ts-web-scraper'

const result = await scrapeClientSide('https://spa-example.com', {
  waitFor: '.content', // Wait for this selector
  timeout: 10000,      // Max wait time (ms)
})

console.log(result.html)     // Rendered HTML
console.log(result.document) // Parsed document
```

### Wait Strategies

```typescript
import { scrapeClientSide } from 'ts-web-scraper'

// Wait for a specific element
const result1 = await scrapeClientSide(url, {
  waitFor: '.product-list',
})

// Wait for multiple elements
const result2 = await scrapeClientSide(url, {
  waitFor: '.header, .footer, .content',
})

// Wait for network idle
const result3 = await scrapeClientSide(url, {
  waitUntil: 'networkidle',
})

// Wait for DOM content loaded
const result4 = await scrapeClientSide(url, {
  waitUntil: 'domcontentloaded',
})

// Custom wait function
const result5 = await scrapeClientSide(url, {
  waitFor: async (page) => {
    await page.waitForFunction(() => {
      return document.querySelectorAll('.item').length >= 10
    })
  },
})
```

## Browser-Based Scraping

For more control, use the headless browser API:

```typescript
import { createBrowser } from 'ts-web-scraper'

const browser = await createBrowser({
  headless: true,
  timeout: 30000,
})

try {
  const page = await browser.newPage()

  await page.goto('https://spa-example.com', {
    waitUntil: 'networkidle',
  })

  // Execute JavaScript on the page
  const data = await page.evaluate(() => {
    return {
      title: document.title,
      items: Array.from(document.querySelectorAll('.item'))
        .map(el => el.textContent),
    }
  })

  console.log(data)
} finally {
  await browser.close()
}
```

## Page Interactions

### Click and Wait

```typescript
const browser = await createBrowser()
const page = await browser.newPage()

await page.goto('https://example.com')

// Click a button
await page.click('.load-more')

// Wait for new content
await page.waitForSelector('.new-items')

// Extract data
const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.item'))
    .map(el => el.textContent)
})
```

### Form Submission

```typescript
const page = await browser.newPage()
await page.goto('https://example.com/search')

// Fill form fields
await page.type('#search-input', 'typescript')
await page.select('#category', 'programming')

// Submit form
await page.click('#submit-button')

// Wait for results
await page.waitForSelector('.search-results')

// Extract results
const results = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.result'))
    .map(el => ({
      title: el.querySelector('.title')?.textContent,
      url: el.querySelector('a')?.href,
    }))
})
```

### Scroll and Load More

```typescript
async function scrollToLoadAll(page) {
  let previousHeight = 0
  let currentHeight = await page.evaluate(() => document.body.scrollHeight)

  while (previousHeight < currentHeight) {
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    // Wait for new content
    await page.waitForTimeout(1000)

    previousHeight = currentHeight
    currentHeight = await page.evaluate(() => document.body.scrollHeight)
  }
}
```

## Handling Authentication

```typescript
const browser = await createBrowser()
const page = await browser.newPage()

// Login
await page.goto('https://example.com/login')
await page.type('#username', 'user@example.com')
await page.type('#password', 'password')
await page.click('#login-button')

// Wait for redirect
await page.waitForNavigation()

// Now scrape authenticated content
await page.goto('https://example.com/dashboard')
const data = await page.evaluate(() => {
  // Extract dashboard data
})
```

## Screenshot and PDF

```typescript
const page = await browser.newPage()
await page.goto('https://example.com')

// Take screenshot
await page.screenshot({ path: 'screenshot.png' })

// Full page screenshot
await page.screenshot({
  path: 'fullpage.png',
  fullPage: true,
})

// Generate PDF
await page.pdf({
  path: 'page.pdf',
  format: 'A4',
})
```

## Using with the Scraper Class

```typescript
import { createScraper, scrapeClientSide } from 'ts-web-scraper'

const scraper = createScraper({
  cache: { enabled: true },
})

// Check if client-side rendering is needed
const { document: staticDoc } = await scraper.scrape(url)

// If content is missing, try client-side scraping
if (!staticDoc.querySelector('.dynamic-content')) {
  const { document } = await scrapeClientSide(url, {
    waitFor: '.dynamic-content',
  })

  // Extract from rendered document
  const data = extractData(document)
}
```

## Example: React App Scraper

```typescript
import { createBrowser } from 'ts-web-scraper'

async function scrapeReactApp(url: string) {
  const browser = await createBrowser()

  try {
    const page = await browser.newPage()

    // Navigate and wait for React to render
    await page.goto(url, { waitUntil: 'networkidle' })

    // Wait for React root to be populated
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    })

    // Extract data
    const data = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent,
        items: Array.from(document.querySelectorAll('[data-testid="item"]'))
          .map(el => ({
            name: el.querySelector('.name')?.textContent,
            value: el.querySelector('.value')?.textContent,
          })),
      }
    })

    return data
  } finally {
    await browser.close()
  }
}
```

## Example: Infinite Scroll

```typescript
import { createBrowser } from 'ts-web-scraper'

async function scrapeInfiniteScroll(url: string, maxItems: number = 100) {
  const browser = await createBrowser()
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: 'networkidle' })

  const items: any[] = []

  while (items.length < maxItems) {
    // Extract current items
    const newItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.item'))
        .map(el => ({
          id: el.getAttribute('data-id'),
          text: el.textContent,
        }))
    })

    // Add unique items
    for (const item of newItems) {
      if (!items.find(i => i.id === item.id)) {
        items.push(item)
      }
    }

    // Scroll down
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    // Wait for loading
    await page.waitForTimeout(1500)

    // Check if we've reached the end
    const hasMore = await page.evaluate(() => {
      return document.querySelector('.load-more') !== null
    })

    if (!hasMore) break
  }

  await browser.close()
  return items.slice(0, maxItems)
}
```

## Performance Considerations

1. **Use static scraping when possible** - It's much faster
2. **Set appropriate timeouts** - Don't wait forever for slow pages
3. **Reuse browser instances** - Creating browsers is expensive
4. **Close pages when done** - Free up resources
5. **Use headless mode** - Faster than headed mode
6. **Disable images/CSS** if not needed - Reduces load time
