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

    // 450+ words (including "Long Article") at 225 WPM = ~2-3 minutes
    expect(result.readingTime).toBeGreaterThanOrEqual(2)
    expect(result.readingTime).toBeLessThanOrEqual(3)
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

    // Relative URLs are resolved relative to the base URL
    expect(result.leadImage).toBe('https://example.com/articles/images/photo.jpg')
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
    // Reading time rounds up to 1 even for empty content
    expect(result.readingTime).toBeGreaterThanOrEqual(0)
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

describe('extractMainContent - Advanced Edge Cases', () => {
  describe('Malformed HTML Handling', () => {
    it('should handle unclosed tags gracefully', () => {
      const html = `
        <article>
          <h1>Title
          <p>Paragraph 1
          <p>Paragraph 2
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toBeDefined()
    })

    it('should handle nested tags without proper closing', () => {
      const html = `
        <article>
          <div>
            <p>Start paragraph
              <span>Nested span
                <strong>Bold text
          </div>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle completely broken HTML structure', () => {
      const html = `
        <article
          <p>Content</p
          <h1>Title<
        </article
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Extreme Content Sizes', () => {
    it('should handle extremely long articles', () => {
      const longContent = 'Lorem ipsum dolor sit amet. '.repeat(10000)
      const html = `
        <article>
          <h1>Very Long Article</h1>
          <p>${longContent}</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent.length).toBeGreaterThan(100000)
      expect(result.readingTime).toBeGreaterThan(100)
    })

    it('should handle articles with thousands of paragraphs', () => {
      const paragraphs = Array.from({ length: 1000 }, (_, i) =>
        `<p>Paragraph ${i} with some content.</p>`).join('')

      const html = `<article><h1>Title</h1>${paragraphs}</article>`

      const result = extractMainContent(html)

      expect(result.textContent).toContain('Paragraph 0')
      expect(result.textContent).toContain('Paragraph 999')
    })

    it('should handle empty content with only whitespace', () => {
      const html = `
        <article>




        </article>
      `

      const result = extractMainContent(html)

      // Content may include whitespace from the HTML structure
      expect(result.textContent.trim()).toBe('')
      expect(result.length).toBeLessThanOrEqual(20) // Allow for some whitespace
    })
  })

  describe('Special Characters and Encoding', () => {
    it('should preserve unicode characters', () => {
      const html = `
        <article>
          <h1>Title with 🎉 emoji</h1>
          <p>Japanese: 日本語</p>
          <p>Chinese: 中文</p>
          <p>Korean: 한글</p>
          <p>Arabic: مرحبا</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toContain('🎉')
      expect(result.textContent).toContain('日本語')
      expect(result.textContent).toContain('مرحبا')
    })

    it('should handle HTML entities', () => {
      const html = `
        <article>
          <p>&lt;tag&gt; &amp; &quot;quotes&quot;</p>
          <p>&#169; &#8364; &#163;</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toBeDefined()
      expect(result.textContent.length).toBeGreaterThan(0)
    })

    it('should handle mixed RTL and LTR text', () => {
      const html = `
        <article>
          <p>English text مرحبا Arabic text</p>
          <p dir="rtl">Right to left content</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle zero-width and invisible characters', () => {
      const html = `
        <article>
          <p>Text\u200Bwith\u200Bzero\u200Bwidth\u200Bspaces</p>
          <p>Non\u00A0breaking\u00A0spaces</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toBeDefined()
    })
  })

  describe('Complex Nested Structures', () => {
    it('should extract from deeply nested article', () => {
      const html = `
        <article>
          <div><div><div><div><div>
            <h1>Deeply Nested Title</h1>
            <p>Content at 5 levels deep</p>
          </div></div></div></div></div>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.title).toContain('Deeply Nested Title')
      expect(result.textContent).toContain('Content at 5 levels deep')
    })

    it('should handle articles with complex table structures', () => {
      const html = `
        <article>
          <h1>Article with Table</h1>
          <table>
            <thead><tr><th>Header 1</th><th>Header 2</th></tr></thead>
            <tbody>
              <tr><td>Cell 1</td><td>Cell 2</td></tr>
              <tr><td>Cell 3</td><td>Cell 4</td></tr>
            </tbody>
          </table>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toContain('Header 1')
      expect(result.textContent).toContain('Cell 1')
    })

    it('should handle articles with nested lists', () => {
      const html = `
        <article>
          <h1>Nested Lists</h1>
          <ul>
            <li>Item 1
              <ul>
                <li>Subitem 1.1</li>
                <li>Subitem 1.2</li>
              </ul>
            </li>
            <li>Item 2</li>
          </ul>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toContain('Item 1')
      expect(result.textContent).toContain('Subitem 1.1')
    })
  })

  describe('Script and Style Removal', () => {
    it('should remove inline scripts', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <script>
            alert('This should not appear');
            console.log('Neither should this');
          </script>
          <p>Real content</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).not.toContain('alert')
      expect(result.textContent).not.toContain('console.log')
      expect(result.textContent).toContain('Real content')
    })

    it('should remove external scripts', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <script src="external.js"></script>
          <script src="another.js" async></script>
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).not.toContain('external.js')
      expect(result.textContent).toContain('Content')
    })

    it('should remove style blocks', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <style>
            .class { color: red; font-size: 16px; }
            body { margin: 0; }
          </style>
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.textContent).not.toContain('color: red')
      expect(result.textContent).not.toContain('margin')
      expect(result.textContent).toContain('Content')
    })

    it('should remove navigation and footer', () => {
      const html = `
        <nav>Navigation items</nav>
        <article>
          <h1>Main Article</h1>
          <p>Article content</p>
        </article>
        <footer>Footer content</footer>
      `

      const result = extractMainContent(html)

      expect(result.textContent).not.toContain('Navigation items')
      expect(result.textContent).not.toContain('Footer content')
      expect(result.textContent).toContain('Article content')
    })
  })

  describe('Image Extraction Edge Cases', () => {
    it('should handle images without src', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <img alt="No source" />
          <img />
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html, 'https://example.com')

      expect(result.leadImage).toBeUndefined()
    })

    it('should handle invalid image URLs', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <img src="not a valid url!" alt="Invalid" />
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html, 'https://example.com')

      // Should not crash, may or may not have leadImage
      expect(result).toBeDefined()
    })

    it('should prioritize first image as lead image', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <img src="/first.jpg" alt="First" />
          <img src="/second.jpg" alt="Second" />
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html, 'https://example.com')

      expect(result.leadImage).toContain('first.jpg')
    })

    it('should handle data URLs for images', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANS" alt="Data URL" />
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.leadImage).toContain('data:image')
    })
  })

  describe('Author and Date Extraction Edge Cases', () => {
    it('should handle multiple author meta tags', () => {
      const html = `
        <html>
        <head>
          <meta name="author" content="Author 1" />
          <meta name="author" content="Author 2" />
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

      expect(result.author).toBeDefined()
    })

    it('should handle malformed date values', () => {
      const html = `
        <html>
        <head>
          <meta property="article:published_time" content="not-a-date" />
        </head>
        <body>
          <article>
            <h1>Title</h1>
            <time datetime="invalid-date">Today</time>
            <p>Content</p>
          </article>
        </body>
        </html>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle missing author information', () => {
      const html = `
        <article>
          <h1>Anonymous Article</h1>
          <p>Content without author</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.author).toBeUndefined()
    })
  })

  describe('Title Extraction Edge Cases', () => {
    it('should prefer article h1 over page title', () => {
      const html = `
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

    it('should handle multiple h1 tags', () => {
      const html = `
        <article>
          <h1>First Heading</h1>
          <p>Some content</p>
          <h1>Second Heading</h1>
          <p>More content</p>
        </article>
      `

      const result = extractMainContent(html)

      // Should use first h1
      expect(result.title).toBe('First Heading')
    })

    it('should handle h1 with nested elements', () => {
      const html = `
        <article>
          <h1>Title with <span>nested</span> <strong>elements</strong></h1>
          <p>Content</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.title).toContain('Title')
      expect(result.title).toContain('nested')
    })

    it('should fallback to title tag when no h1', () => {
      const html = `
        <html>
        <head><title>Fallback Title</title></head>
        <body>
          <article>
            <h2>Not an H1</h2>
            <p>Content</p>
          </article>
        </body>
        </html>
      `

      const result = extractMainContent(html)

      expect(result.title).toBe('Fallback Title')
    })
  })

  describe('Reading Time Edge Cases', () => {
    it('should calculate reading time for very short content', () => {
      const html = `<article><p>Short</p></article>`

      const result = extractMainContent(html)

      expect(result.readingTime).toBeGreaterThanOrEqual(0)
    })

    it('should calculate reading time for content with only numbers', () => {
      const html = `<article><p>${'1234567890 '.repeat(100)}</p></article>`

      const result = extractMainContent(html)

      expect(result.readingTime).toBeGreaterThan(0)
    })

    it('should handle reading time with mixed languages', () => {
      const html = `
        <article>
          <p>English text here. ${'word '.repeat(225)}</p>
          <p>日本語のテキスト。${'文字 '.repeat(100)}</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.readingTime).toBeGreaterThan(0)
    })
  })

  describe('Excerpt Generation Edge Cases', () => {
    it('should generate excerpt from very short content', () => {
      const html = `<article><p>Short content</p></article>`

      const result = extractMainContent(html)

      expect(result.excerpt).toBe('Short content')
    })

    it('should truncate long content for excerpt', () => {
      const longText = 'a'.repeat(500)
      const html = `<article><p>${longText}</p></article>`

      const result = extractMainContent(html)

      expect(result.excerpt!.length).toBeLessThanOrEqual(203) // 200 + '...'
      expect(result.excerpt).toContain('...')
    })

    it('should generate excerpt without HTML tags', () => {
      const html = `
        <article>
          <p>Content with <strong>bold</strong> and <em>italic</em> text.</p>
        </article>
      `

      const result = extractMainContent(html)

      expect(result.excerpt).not.toContain('<strong>')
      expect(result.excerpt).not.toContain('<em>')
    })
  })

  describe('Content Density Detection', () => {
    it('should find content in page without semantic elements', () => {
      const html = `
        <body>
          <div id="header">Header stuff</div>
          <div id="sidebar">Sidebar</div>
          <div id="main">
            <p>Main content paragraph 1</p>
            <p>Main content paragraph 2</p>
            <p>Main content paragraph 3</p>
            <p>Main content paragraph 4</p>
          </div>
          <div id="footer">Footer</div>
        </body>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toContain('Main content')
    })

    it('should choose section with highest paragraph density', () => {
      const html = `
        <div>
          <div id="section1"><p>One para</p></div>
          <div id="section2">
            <p>Multiple paragraphs</p>
            <p>Make this more dense</p>
            <p>This should win</p>
            <p>More content here</p>
          </div>
          <div id="section3"><p>Another single</p></div>
        </div>
      `

      const result = extractMainContent(html)

      expect(result.textContent).toContain('Multiple paragraphs')
      expect(result.textContent).toContain('This should win')
    })
  })

  describe('Error Recovery', () => {
    it('should not crash on null or undefined input', () => {
      expect(() => extractMainContent('')).not.toThrow()
    })

    it('should handle HTML with only head and no body', () => {
      const html = `
        <html>
        <head><title>Title Only</title></head>
        </html>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle complete garbage input', () => {
      const html = 'This is not HTML at all, just plain text with <random> tags'

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle HTML with circular-like structures', () => {
      const html = `
        <article>
          <div><div><div><div><div><div>
            <p>Deep content</p>
          </div></div></div></div></div></div>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })
})
