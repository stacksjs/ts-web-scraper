import { describe, expect, it } from 'bun:test'
import { extractMainContent } from '../../src/extraction/content'
import { extractLinkPreview } from '../../src/meta'
import { parseHTML } from '../../src/web-scraper'

describe('Extreme Values Edge Cases', () => {
  describe('Empty Strings', () => {
    it('should handle completely empty HTML string', () => {
      const html = ''

      expect(() => parseHTML(html)).not.toThrow()
      const doc = parseHTML(html)
      expect(doc).toBeDefined()
    })

    it('should handle empty string in extractMainContent', () => {
      const result = extractMainContent('')

      expect(result).toBeDefined()
      expect(result.content).toBe('')
      expect(result.textContent).toBe('')
      expect(result.length).toBe(0)
    })

    it('should handle empty string in extractLinkPreview', () => {
      expect(() => extractLinkPreview('')).not.toThrow()
      const preview = extractLinkPreview('')
      expect(preview).toBeDefined()
    })

    it('should handle whitespace-only string', () => {
      const html = '      \n\n\n    \t\t\t    '

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Very Long Strings', () => {
    it('should handle very long text content (100k+ characters)', () => {
      const longText = 'a'.repeat(150000)
      const html = `
        <article>
          <h1>Title</h1>
          <p>${longText}</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent.length).toBeGreaterThan(100000)
    })

    it('should handle very long attribute values', () => {
      const longValue = 'x'.repeat(100000)
      const html = `<div data-long="${longValue}"><p>Content</p></div>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle very long URLs', () => {
      const longPath = 'segment/'.repeat(1000)
      const longUrl = `https://example.com/${longPath}page.html`
      const html = `
        <a href="${longUrl}">Link</a>
        <img src="${longUrl}" alt="Image" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle very long class names', () => {
      const longClassName = 'class-'.repeat(1000)
      const html = `<div class="${longClassName}"><p>Content</p></div>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle very long title', () => {
      const longTitle = 'Title '.repeat(10000)
      const html = `
        <html>
        <head><title>${longTitle}</title></head>
        <body><p>Content</p></body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const preview = extractLinkPreview(html)
      expect(preview.title).toBeDefined()
    })

    it('should handle very long meta descriptions', () => {
      const longDesc = 'description '.repeat(10000)
      const html = `
        <head>
          <meta name="description" content="${longDesc}" />
        </head>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })
  })

  describe('Deeply Nested Structures', () => {
    it('should handle deeply nested divs (100+ levels)', () => {
      const html = `${'<div>'.repeat(150)}Deep content${'</div>'.repeat(150)}`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle deeply nested lists', () => {
      const html = `${'<ul><li>'.repeat(100)}Deep item${'</li></ul>'.repeat(100)}`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle deeply nested tables', () => {
      const html = `${'<table><tr><td>'.repeat(50)}Content${'</td></tr></table>'.repeat(50)}`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle nested spans inside paragraphs (100+ levels)', () => {
      const html = `<article><p>${'<span>'.repeat(120)}text${'</span>'.repeat(120)}</p></article>`

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should not cause stack overflow with extreme nesting', () => {
      const depth = 200
      let html = ''
      for (let i = 0; i < depth; i++) {
        html += `<div id="level${i}">`
      }
      html += 'Content'
      for (let i = 0; i < depth; i++) {
        html += '</div>'
      }

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Thousands of Similar Elements', () => {
    it('should handle thousands of paragraphs', () => {
      const paragraphs = Array.from({ length: 5000 }, (_, i) =>
        `<p>Paragraph number ${i}</p>`).join('')

      const html = `<article>${paragraphs}</article>`

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent.length).toBeGreaterThan(0)
    })

    it('should handle thousands of links', () => {
      const links = Array.from({ length: 5000 }, (_, i) =>
        `<a href="/page${i}">Link ${i}</a>`).join('')

      const html = `<body>${links}</body>`

      expect(() => parseHTML(html)).not.toThrow()
      const doc = parseHTML(html)
      const allLinks = doc.querySelectorAll('a')
      expect(allLinks.length).toBeGreaterThan(0)
    })

    it('should handle thousands of images', () => {
      const images = Array.from({ length: 3000 }, (_, i) =>
        `<img src="/image${i}.jpg" alt="Image ${i}" />`).join('')

      const html = `<body>${images}</body>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle thousands of list items', () => {
      const items = Array.from({ length: 5000 }, (_, i) =>
        `<li>Item ${i}</li>`).join('')

      const html = `<ul>${items}</ul>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle thousands of meta tags', () => {
      const metaTags = Array.from({ length: 2000 }, (_, i) =>
        `<meta name="tag${i}" content="value${i}" />`).join('')

      const html = `<head>${metaTags}</head><body><p>Content</p></body>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle page with thousands of classes', () => {
      const classes = Array.from({ length: 10000 }, (_, i) => `class${i}`).join(' ')
      const html = `<div class="${classes}"><p>Content</p></div>`

      expect(() => parseHTML(html)).not.toThrow()
      const doc = parseHTML(html)
      const div = doc.querySelector('div')
      expect(div?.attributes.class).toBeDefined()
    })
  })

  describe('Unicode Edge Cases', () => {
    it('should handle emoji in content', () => {
      const html = `
        <article>
          <h1>Title with 🎉🎊🎈</h1>
          <p>Content with emojis: 😀😃😄😁😆😅🤣😂</p>
          <p>Animals: 🐶🐱🐭🐹🐰🦊🐻🐼</p>
          <p>Food: 🍕🍔🍟🌭🍿🥓🥞🧇</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toContain('🎉')
    })

    it('should handle right-to-left (RTL) text', () => {
      const html = `
        <article>
          <p dir="rtl">مرحبا بك في هذا الموقع</p>
          <p dir="rtl">שלום וברכה</p>
          <p>Mixed LTR and RTL: Hello مرحبا World</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent.length).toBeGreaterThan(0)
    })

    it('should handle zero-width characters', () => {
      const html = `
        <article>
          <p>Text\u200Bwith\u200Bzero\u200Bwidth\u200Bspaces</p>
          <p>Zero\u200Cwidth\u200Cnon\u200Cjoiners</p>
          <p>Zero\u200Dwidth\u200Djoiners</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle combining characters and diacritics', () => {
      const html = `
        <article>
          <p>e\u0301 a\u0308 o\u0303</p>
          <p>Café naïve résumé</p>
          <p>Ḿúltíplé díácríṫíćś</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle bidirectional text markers', () => {
      const html = `
        <article>
          <p>\u202ALeft-to-right embedding\u202C</p>
          <p>\u202BRight-to-left embedding\u202C</p>
          <p>\u202DLeft-to-right override\u202C</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle obscure Unicode symbols', () => {
      const html = `
        <article>
          <p>Mathematical: ∑∫∂∇∞√∛∜</p>
          <p>Arrows: ←↑→↓↔↕⇐⇑⇒⇓</p>
          <p>Boxes: ╔═╗║╚═╝</p>
          <p>Special: ™©®℠℗</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle supplementary characters (beyond BMP)', () => {
      const html = `
        <article>
          <p>Gothic: 𐌰𐌱𐌲𐌳𐌴</p>
          <p>Emoji: 🌍🌎🌏</p>
          <p>Ancient: 𓀀𓀁𓀂𓀃𓀄</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Extreme Whitespace', () => {
    it('should handle excessive whitespace in content', () => {
      const html = `
        <article>
          <p>Word1     ${' '.repeat(1000)}     Word2</p>
          <p>Multiple




          line breaks</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toContain('Word1')
      expect(result.textContent).toContain('Word2')
    })

    it('should handle tabs and various whitespace characters', () => {
      const html = `
        <article>
          <p>Text\t\t\twith\t\ttabs</p>
          <p>Non-breaking\u00A0spaces</p>
          <p>Em\u2003spaces\u2003here</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Circular References (in URLs)', () => {
    it('should handle self-referencing canonical URL', () => {
      const html = `
        <head>
          <link rel="canonical" href="https://example.com/page" />
          <link rel="canonical" href="https://example.com/page" />
        </head>
      `

      expect(() => extractLinkPreview(html, 'https://example.com/page')).not.toThrow()
    })

    it('should handle recursive link structures', () => {
      const html = `
        <nav>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
          <a href="/page1">Page 1 Again</a>
          <a href="/page2">Page 2 Again</a>
        </nav>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Performance Stress Tests', () => {
    it('should handle document with 1MB of text content', () => {
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(40000)
      const html = `
        <article>
          <h1>Large Article</h1>
          <p>${largeText}</p>
        </article>
      `

      const start = performance.now()
      expect(() => extractMainContent(html)).not.toThrow()
      const duration = performance.now() - start

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000)
    })

    it('should handle document with complex nested structure efficiently', () => {
      let html = '<div>'
      for (let i = 0; i < 100; i++) {
        html += `<section id="section${i}"><h2>Section ${i}</h2>`
        for (let j = 0; j < 10; j++) {
          html += `<article><p>Content ${i}-${j}</p></article>`
        }
        html += '</section>'
      }
      html += '</div>'

      const start = performance.now()
      expect(() => parseHTML(html)).not.toThrow()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(3000)
    })

    it('should handle repeated parsing of same large document', () => {
      const html = `<div>${'<p>Paragraph</p>'.repeat(1000)}</div>`

      const iterations = 10
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        parseHTML(html)
      }

      const duration = performance.now() - start
      const avgDuration = duration / iterations

      // Average should be reasonable
      expect(avgDuration).toBeLessThan(1000)
    })
  })

  describe('Extreme Attribute Counts', () => {
    it('should handle element with hundreds of attributes', () => {
      const attributes = Array.from({ length: 500 }, (_, i) =>
        `data-attr${i}="value${i}"`).join(' ')

      const html = `<div ${attributes}><p>Content</p></div>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle element with duplicate attribute names', () => {
      const html = `
        <div id="first" id="second" id="third" class="a" class="b" class="c">
          <p>Content</p>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Extreme URL Variations', () => {
    it('should handle URLs with thousands of query parameters', () => {
      const params = Array.from({ length: 1000 }, (_, i) =>
        `param${i}=value${i}`).join('&')

      const url = `https://example.com/page?${params}`
      const html = `<a href="${url}">Link</a>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle URLs with extremely long fragments', () => {
      const fragment = `#${'section-'.repeat(1000)}end`
      const html = `<a href="https://example.com${fragment}">Link</a>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle data URLs with large content', () => {
      const largeData = 'A'.repeat(100000)
      const dataUrl = `data:text/plain;base64,${btoa(largeData)}`
      const html = `<img src="${dataUrl}" alt="Large data URL" />`

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Memory Stress Tests', () => {
    it('should handle creation of many document objects without memory leak', () => {
      const html = '<div><p>Test content</p></div>'

      // Parse many times
      for (let i = 0; i < 1000; i++) {
        const doc = parseHTML(html)
        expect(doc).toBeDefined()
      }

      // If we got here without OOM, test passes
      expect(true).toBe(true)
    })

    it('should handle large array of similar elements', () => {
      const elements = Array.from({ length: 10000 }, (_, i) => ({
        tag: 'div',
        id: `element-${i}`,
        content: `Content ${i}`,
      }))

      const html = elements
        .map(el => `<div id="${el.id}">${el.content}</div>`)
        .join('')

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Edge Case Combinations', () => {
    it('should handle deeply nested structure with long content at each level', () => {
      const longText = 'text '.repeat(1000)
      let html = ''

      for (let i = 0; i < 50; i++) {
        html += `<div id="level${i}"><p>${longText}</p>`
      }

      html += '<p>Deep content</p>'

      for (let i = 0; i < 50; i++) {
        html += '</div>'
      }

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle many empty elements mixed with content', () => {
      let html = '<article>'

      for (let i = 0; i < 1000; i++) {
        html += '<div></div>'
        if (i % 10 === 0) {
          html += '<p>Content</p>'
        }
        html += '<span></span>'
      }

      html += '</article>'

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle extreme unicode with deep nesting', () => {
      let html = ''
      const emojis = ['🎉', '🎊', '🎈', '🎁', '🎀', '🎪', '🎭', '🎬']

      for (let i = 0; i < 100; i++) {
        html += `<div data-level="${i}" data-emoji="${emojis[i % emojis.length]}">`
      }

      html += '<p>Deep emoji content 🌟</p>'

      for (let i = 0; i < 100; i++) {
        html += '</div>'
      }

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Special Number Values', () => {
    it('should handle numeric attributes with special values', () => {
      const html = `
        <div data-infinity="Infinity" data-nan="NaN" data-zero="-0">
          <p data-max="${Number.MAX_SAFE_INTEGER}">Content</p>
          <p data-min="${Number.MIN_SAFE_INTEGER}">More</p>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle very large numbers in content', () => {
      const html = `
        <article>
          <p>Price: ${Number.MAX_SAFE_INTEGER}</p>
          <p>Count: ${Number.MAX_VALUE}</p>
          <p>Small: ${Number.MIN_VALUE}</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Reading Time Edge Cases', () => {
    it('should calculate reading time for extremely long content', () => {
      const words = Array.from({ length: 100000 }, (_, i) => `word${i}`).join(' ')
      const html = `<article><p>${words}</p></article>`

      const result = extractMainContent(html)

      // 100k words at 225 WPM should be ~444 minutes
      expect(result.readingTime).toBeGreaterThan(400)
    })

    it('should handle reading time for content with only special characters', () => {
      const html = `<article><p>${'!@#$%^&*()'.repeat(1000)}</p></article>`

      const result = extractMainContent(html)
      expect(result.readingTime).toBeGreaterThanOrEqual(0)
    })
  })
})
