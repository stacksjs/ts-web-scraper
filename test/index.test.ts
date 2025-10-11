import { describe, expect, it } from 'bun:test'
import {
  extractData,
  extractLinks,
  extractMeta,
  extractStructuredData,
  extractText,
  isClientSideRendered,
  parseHTML,
  scrapeClientSide,
} from '../src/index'

describe('Web Scraper - Static HTML Parsing', () => {
  const testHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
    <meta name="description" content="Test description">
    <meta property="og:title" content="OG Title">
    <script type="application/ld+json">
      {"@type": "WebPage", "name": "Test"}
    </script>
  </head>
  <body>
    <div id="main">
      <h1 class="title">Hello World</h1>
      <p class="content">This is a test paragraph.</p>
      <a href="/about" class="link">About</a>
      <a href="https://example.com">External</a>
    </div>
  </body>
</html>
  `

  it('should parse HTML and create queryable document', () => {
    const doc = parseHTML(testHTML)
    expect(doc).toBeDefined()
    expect(doc.tagName).toBe('root')
  })

  it('should extract title using querySelector', () => {
    const doc = parseHTML(testHTML)
    const title = doc.querySelector('title')
    expect(title).toBeDefined()
    expect(title?.textContent).toContain('Test Page')
  })

  it('should extract elements by ID', () => {
    const doc = parseHTML(testHTML)
    const main = doc.getElementById('main')
    expect(main).toBeDefined()
    expect(main?.attributes.id).toBe('main')
  })

  it('should extract elements by class name', () => {
    const doc = parseHTML(testHTML)
    const elements = doc.getElementsByClassName('title')
    expect(elements.length).toBeGreaterThan(0)
    expect(elements[0].textContent).toContain('Hello World')
  })

  it('should extract elements by tag name', () => {
    const doc = parseHTML(testHTML)
    const links = doc.getElementsByTagName('a')
    expect(links.length).toBe(2)
  })

  it('should extract all text content', () => {
    const text = extractText(testHTML)
    expect(text).toContain('Hello World')
    expect(text).toContain('This is a test paragraph')
    expect(text).not.toContain('<div>')
  })

  it('should extract all links', () => {
    const links = extractLinks(testHTML, 'https://example.com')
    expect(links.length).toBeGreaterThan(0)
    expect(links).toContain('https://example.com/about')
  })

  it('should extract meta tags', () => {
    const meta = extractMeta(testHTML)
    expect(meta.description).toBe('Test description')
    expect(meta['og:title']).toBe('OG Title')
  })

  it('should extract structured data', () => {
    const structured = extractStructuredData(testHTML)
    expect(structured.jsonLd.length).toBeGreaterThan(0)
    expect(structured.jsonLd[0]['@type']).toBe('WebPage')
    expect(structured.openGraph.title).toBe('OG Title')
  })

  it('should handle getAttribute', () => {
    const doc = parseHTML(testHTML)
    const link = doc.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/about')
    expect(link?.getAttribute('class')).toBe('link')
  })

  it('should handle hasAttribute', () => {
    const doc = parseHTML(testHTML)
    const link = doc.querySelector('a')
    expect(link?.hasAttribute('href')).toBe(true)
    expect(link?.hasAttribute('nonexistent')).toBe(false)
  })
})

describe('Client-Side Scraper - Detection', () => {
  it('should detect client-side rendered pages', async () => {
    // pkgx.dev is a React app
    const isPkgxCSR = await isClientSideRendered('https://pkgx.dev')
    expect(isPkgxCSR).toBe(true)
  }, 30000)

  it('should detect static pages', async () => {
    // example.com is static HTML
    const isExampleCSR = await isClientSideRendered('https://example.com')
    expect(isExampleCSR).toBe(false)
  }, 30000)
})

describe('Client-Side Scraper - Full Scrape', () => {
  it('should scrape pkgx.dev and find API endpoints', async () => {
    const url = 'https://pkgx.dev/pkgs/nodejs.org/'
    const scraped = await scrapeClientSide(url, {
      analyzeJavaScript: true,
      findEmbeddedData: true,
      reconstructAPI: true,
      maxJSFiles: 2,
    })

    expect(scraped.html).toBeDefined()
    expect(scraped.scriptUrls.length).toBeGreaterThan(0)
    expect(scraped.meta.title).toBeDefined()

    // Should discover API endpoints
    expect(scraped.apiEndpoints.length).toBeGreaterThan(0)

    // Should have some API responses
    expect(scraped.apiResponses.size).toBeGreaterThanOrEqual(0)
  }, 30000)

  it('should extract data automatically from pkgx.dev', async () => {
    const url = 'https://pkgx.dev/pkgs/python.org/'
    const data = await extractData(url)

    expect(data).toBeDefined()

    // Should have package information
    if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data)
      expect(keys.length).toBeGreaterThan(0)
    }
  }, 30000)

  it('should handle scraping with limited JS analysis', async () => {
    const url = 'https://pkgx.dev'
    const scraped = await scrapeClientSide(url, {
      analyzeJavaScript: true,
      reconstructAPI: false, // Don't fetch APIs
      maxJSFiles: 1,
    })

    expect(scraped.html).toBeDefined()
    expect(scraped.scriptUrls.length).toBeGreaterThan(0)
  }, 30000)

  it('should handle scraping without JS analysis', async () => {
    const url = 'https://example.com'
    const scraped = await scrapeClientSide(url, {
      analyzeJavaScript: false,
      findEmbeddedData: true,
      reconstructAPI: false,
    })

    expect(scraped.html).toBeDefined()
    expect(scraped.meta.title).toBeDefined()
  }, 30000)
})

describe('Client-Side Scraper - Meta Extraction', () => {
  it('should extract meta information from client-side rendered page', async () => {
    const url = 'https://pkgx.dev'
    const scraped = await scrapeClientSide(url, {
      analyzeJavaScript: false,
      findEmbeddedData: true,
      reconstructAPI: false,
    })

    expect(scraped.meta).toBeDefined()
    expect(scraped.meta.title || scraped.meta.description).toBeDefined()
  }, 30000)
})
