import { describe, expect, it } from 'bun:test'
import { extractMainContent } from '../../src/extraction/content'

describe('extractMainContent', () => {
  it('should extract content from article element', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <header>Site Header</header>
        <nav>Navigation</nav>
        <article>
          <h1>Article Title</h1>
          <p>This is the main article content.</p>
          <p>Another paragraph of content.</p>
        </article>
        <footer>Site Footer</footer>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.title).toBe('Article Title')
    expect(result.content).toContain('main article content')
    expect(result.content).not.toContain('Site Header')
    expect(result.content).not.toContain('Navigation')
    expect(result.content).not.toContain('Site Footer')
  })

  it('should extract content from main element', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <nav>Navigation</nav>
        <main>
          <h1>Page Title</h1>
          <p>Main content goes here.</p>
        </main>
        <aside>Sidebar</aside>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.title).toBe('Page Title')
    expect(result.content).toContain('Main content')
    expect(result.content).not.toContain('Navigation')
    expect(result.content).not.toContain('Sidebar')
  })

  it('should remove scripts and styles', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>console.log('test')</script>
        <style>body { margin: 0; }</style>
      </head>
      <body>
        <article>
          <h1>Title</h1>
          <p>Content here</p>
          <script>alert('popup')</script>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.textContent).not.toContain('console.log')
    expect(result.textContent).not.toContain('margin:')
    expect(result.textContent).not.toContain('alert')
    expect(result.textContent).toContain('Title')
    expect(result.textContent).toContain('Content here')
  })

  it('should extract title from h1', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Page Title</title></head>
      <body>
        <article>
          <h1>Article Heading</h1>
          <p>Content</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.title).toBe('Article Heading')
  })

  it('should fallback to title tag when no h1', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Fallback Title</title></head>
      <body>
        <article>
          <p>Content without heading</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.title).toBe('Fallback Title')
  })

  it('should extract author from meta tag', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="author" content="John Doe" />
      </head>
      <body>
        <article>
          <h1>Title</h1>
          <p>Content</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.author).toBe('John Doe')
  })

  it('should extract author from rel=author link', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <p>By <a rel="author" href="/author">Jane Smith</a></p>
          <p>Content here</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.author).toBe('Jane Smith')
  })

  it('should extract published date from time element', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <time datetime="2025-01-15T10:00:00Z">January 15, 2025</time>
          <p>Content</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.publishedDate).toBe('2025-01-15T10:00:00Z')
  })

  it('should extract published date from meta tag', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="article:published_time" content="2025-01-15T10:00:00Z" />
      </head>
      <body>
        <article>
          <h1>Title</h1>
          <p>Content</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.publishedDate).toBe('2025-01-15T10:00:00Z')
  })

  it('should calculate reading time', () => {
    const words = Array.from({ length: 450 }, (_, i) => `word${i}`).join(' ')
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Long Article</h1>
          <p>${words}</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    // 450 words at 225 WPM = 2 minutes
    expect(result.readingTime).toBe(2)
  })

  it('should generate excerpt', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <p>${'a'.repeat(250)} more text here</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.excerpt).toBeDefined()
    expect(result.excerpt!.length).toBeLessThanOrEqual(203) // 200 + '...'
    expect(result.excerpt).toContain('...')
  })

  it('should extract lead image', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <img src="/featured-image.jpg" alt="Featured" />
          <p>Content with image</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html, 'https://example.com')

    expect(result.leadImage).toBe('https://example.com/featured-image.jpg')
  })

  it('should handle relative image URLs', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <img src="images/photo.jpg" alt="Photo" />
          <p>Content</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html, 'https://example.com/articles/post')

    expect(result.leadImage).toBe('https://example.com/images/photo.jpg')
  })

  it('should fallback to paragraph density when no semantic elements', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div>
          <div>Sidebar content</div>
          <div>
            <p>This is the main content area.</p>
            <p>It has multiple paragraphs of text.</p>
            <p>This should be detected as the main content.</p>
            <p>Even without semantic HTML tags.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.textContent).toContain('main content area')
    expect(result.textContent).toContain('multiple paragraphs')
  })

  it('should calculate content length', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <p>Some content here for testing.</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBe(result.textContent.length)
  })

  it('should handle empty article gracefully', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article></article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.content).toBe('')
    expect(result.textContent).toBe('')
    expect(result.length).toBe(0)
    expect(result.readingTime).toBe(0)
  })

  it('should handle HTML without article or main', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Simple Page</h1>
        <p>Just a paragraph.</p>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.textContent).toContain('Simple Page')
    expect(result.textContent).toContain('paragraph')
  })

  it('should strip HTML tags from text content', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <article>
          <h1>Title</h1>
          <p>Text with <strong>bold</strong> and <em>italic</em> formatting.</p>
        </article>
      </body>
      </html>
    `

    const result = extractMainContent(html)

    expect(result.textContent).not.toContain('<strong>')
    expect(result.textContent).not.toContain('</strong>')
    expect(result.textContent).toContain('bold')
    expect(result.textContent).toContain('italic')
  })
})
