import { describe, expect, it } from 'bun:test'
import { extractMLFeatures } from '../../src/analysis/ml-ready'

describe('extractMLFeatures', () => {
  it('should extract clean text content', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Article Title</h1>
        <p>This is the first paragraph with some content.</p>
        <p>This is the second paragraph with more information.</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.textContent).toContain('Article Title')
    expect(result.textContent).toContain('first paragraph')
    expect(result.textContent).toContain('second paragraph')
    expect(result.stats.totalWords).toBeGreaterThan(10)
  })

  it('should extract email addresses', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Contact us at info@example.com or support@test.org</p>
        <p>Sales: sales@company.net</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.entities.emails.length).toBe(3)
    expect(result.entities.emails).toContain('info@example.com')
    expect(result.entities.emails).toContain('support@test.org')
    expect(result.entities.emails).toContain('sales@company.net')
  })

  it('should extract phone numbers', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Call us at (555) 123-4567 or 555-987-6543</p>
        <p>International: +1-800-555-0199</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.entities.phones.length).toBeGreaterThanOrEqual(2)
    expect(result.entities.phones.some(p => p.includes('555'))).toBe(true)
  })

  it('should extract URLs', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Visit https://example.com or http://test.org for more info</p>
        <a href="https://docs.example.com/guide">Documentation</a>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.entities.urls.length).toBeGreaterThanOrEqual(2)
    expect(result.entities.urls).toContain('https://example.com')
    expect(result.entities.urls).toContain('http://test.org')
  })

  it('should extract dates and prices', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Event on January 15, 2025 costs $99.99</p>
        <p>Sale ends 2025-12-31 at $49.00</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.entities.dates.length).toBeGreaterThanOrEqual(1)
    expect(result.entities.prices.length).toBeGreaterThanOrEqual(1)
  })

  it('should perform basic sentiment analysis', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Amazing Product Review</h1>
        <p>This is an excellent product! I love it. Great quality and fantastic value.</p>
        <p>Highly recommended! Best purchase ever!</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.sentiment.score).toBeGreaterThan(0)
    expect(result.sentiment.positiveWords).toBeGreaterThan(0)
  })

  it('should detect negative sentiment', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Terrible Experience</h1>
        <p>This is awful. Poor quality and horrible service. Waste of money.</p>
        <p>Very disappointed. Worst purchase ever.</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.sentiment.score).toBeLessThan(0)
    expect(result.sentiment.negativeWords).toBeGreaterThan(0)
  })

  it('should detect neutral sentiment', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>The product is available in multiple colors.</p>
        <p>It measures 10 inches by 15 inches.</p>
        <p>Shipping takes 3-5 business days.</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(Math.abs(result.sentiment.score)).toBeLessThan(0.3)
    expect(result.sentiment.neutralWords).toBeGreaterThan(0)
  })

  it('should extract structured sections', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Web Development Tutorial</h1>
        <p>Learn JavaScript, TypeScript, and React for modern web development.</p>
        <h2>Introduction</h2>
        <p>This tutorial covers HTML, CSS, and responsive design principles.</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.sections.length).toBeGreaterThan(0)
    // Should have both headings and paragraphs
    expect(result.sections.some(s => s.type === 'heading')).toBe(true)
    expect(result.sections.some(s => s.type === 'paragraph')).toBe(true)
  })

  it('should handle HTML with scripts and styles', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>console.log('test')</script>
        <style>body { margin: 0; }</style>
      </head>
      <body>
        <h1>Title</h1>
        <p>Content here</p>
        <script>alert('popup')</script>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    // Should not include script/style content
    expect(result.textContent).not.toContain('console.log')
    expect(result.textContent).not.toContain('margin: 0')
    expect(result.textContent).not.toContain('alert')
    expect(result.textContent).toContain('Title')
    expect(result.textContent).toContain('Content')
  })

  it('should calculate text statistics', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Test Document</h1>
        <p>This is a sample paragraph with several words.</p>
        <p>Another paragraph with more content for testing purposes.</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.stats.totalWords).toBeGreaterThan(0)
    expect(result.stats.uniqueWords).toBeGreaterThan(0)
    expect(result.stats.totalSentences).toBeGreaterThanOrEqual(2)
    expect(result.stats.totalParagraphs).toBeGreaterThanOrEqual(1)
    expect(result.stats.vocabularyRichness).toBeGreaterThan(0)
  })

  it('should handle empty HTML', () => {
    const html = ''

    const result = extractMLFeatures(html)

    expect(result.textContent).toBe('')
    expect(result.stats.totalWords).toBe(0)
    expect(result.entities.emails).toEqual([])
    expect(result.entities.phones).toEqual([])
  })

  it('should handle minimal HTML', () => {
    const html = '<html><body><p>Hi</p></body></html>'

    const result = extractMLFeatures(html)

    expect(result.textContent).toBe('Hi')
    expect(result.stats.totalWords).toBe(1)
  })

  it('should extract multiple entity types together', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Contact Information</h1>
        <p>Email: contact@example.com | Phone: (555) 123-4567</p>
        <p>Website: https://example.com</p>
      </body>
      </html>
    `

    const result = extractMLFeatures(html)

    expect(result.entities.emails.length).toBeGreaterThanOrEqual(1)
    expect(result.entities.phones.length).toBeGreaterThanOrEqual(1)
    expect(result.entities.urls.length).toBeGreaterThanOrEqual(1)
  })
})
