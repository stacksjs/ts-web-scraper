import { describe, expect, it } from 'bun:test'
import { extractPerformanceMetrics } from '../../src/analysis/performance'

describe('extractPerformanceMetrics', () => {
  it('should count scripts and styles', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/theme.css" />
        <script src="/app.js"></script>
        <script src="/vendor.js"></script>
        <script src="/analytics.js"></script>
      </head>
      <body>
        <h1>Test Page</h1>
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.resources.scripts).toBe(3)
    expect(result.resources.stylesheets).toBe(2)
  })

  it('should count images', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <img src="/image1.jpg" />
        <img src="/image2.png" />
        <img src="/image3.webp" />
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.resources.images).toBe(3)
  })

  it('should detect external resources', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.example.com/lib.js"></script>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css" />
        <script src="https://analytics.google.com/ga.js"></script>
      </head>
      <body>
        <img src="https://images.unsplash.com/photo.jpg" />
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.externalResources.count).toBe(4)
    expect(result.externalResources.domains.length).toBeGreaterThan(0)
    expect(result.externalResources.domains).toContain('cdn.example.com')
    expect(result.externalResources.domains).toContain('fonts.googleapis.com')
  })

  it('should count inline scripts and styles in resources', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>console.log('inline')</script>
        <style>body { margin: 0; }</style>
        <script>alert('another')</script>
      </head>
      <body>
        <h1>Test</h1>
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    // Inline scripts and styles are included in the resource counts
    expect(result.resources.scripts).toBe(2)
    expect(result.resources.stylesheets).toBe(1)
  })

  it('should detect render-blocking resources', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/critical.css" />
        <script src="/blocking.js"></script>
      </head>
      <body>
        <h1>Test</h1>
        <script src="/deferred.js" defer></script>
        <script src="/async.js" async></script>
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    // Render-blocking scripts trigger a warning
    expect(result.warnings.some(w => w.includes('Render-blocking'))).toBe(true)
  })

  it('should detect lazy-loaded images', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <img src="/eager.jpg" />
        <img src="/lazy1.jpg" loading="lazy" />
        <img src="/lazy2.jpg" loading="lazy" />
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.hints.hasLazyLoading).toBe(true)
  })

  it('should count iframes', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <iframe src="https://www.youtube.com/embed/video"></iframe>
        <iframe src="https://maps.google.com/embed"></iframe>
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.resources.iframes).toBe(2)
  })

  it('should detect fonts', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @font-face {
            font-family: 'CustomFont';
            src: url('/font1.woff2');
          }
          @font-face {
            font-family: 'AnotherFont';
            src: url('/font2.woff2');
          }
        </style>
      </head>
      <body>
        <h1>Test</h1>
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.resources.fonts).toBe(2)
  })

  it('should provide performance hints for slow sites', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn1.example.com/lib1.js"></script>
        <script src="https://cdn2.example.com/lib2.js"></script>
        <script src="https://cdn3.example.com/lib3.js"></script>
        <script src="https://cdn4.example.com/lib4.js"></script>
        <script src="https://cdn5.example.com/lib5.js"></script>
        <script src="https://cdn6.example.com/lib6.js"></script>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/theme.css" />
        <link rel="stylesheet" href="/custom.css" />
        <link rel="stylesheet" href="/fonts.css" />
        <link rel="stylesheet" href="/icons.css" />
      </head>
      <body>
        <img src="/img1.jpg" />
        <img src="/img2.jpg" />
        <img src="/img3.jpg" />
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.resources.scripts).toBeGreaterThanOrEqual(6)
    expect(result.resources.stylesheets).toBeGreaterThanOrEqual(5)
  })

  it('should handle empty HTML', () => {
    const html = ''

    const result = extractPerformanceMetrics(html)

    expect(result.resources.scripts).toBe(0)
    expect(result.resources.stylesheets).toBe(0)
    expect(result.resources.images).toBe(0)
  })

  it('should handle minimal HTML', () => {
    const html = '<html><body><p>Text</p></body></html>'

    const result = extractPerformanceMetrics(html)

    expect(result.resources.scripts).toBe(0)
    expect(result.resources.stylesheets).toBe(0)
    expect(result.resources.images).toBe(0)
    expect(result.warnings.length).toBe(0)
  })

  it('should detect preconnect and dns-prefetch', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://cdn.example.com" />
      </head>
      <body>
        <h1>Test</h1>
      </body>
      </html>
    `

    const result = extractPerformanceMetrics(html)

    // Should detect DNS prefetch as a hint
    expect(result.hints.hasDNSPrefetch).toBe(true)
  })
})
