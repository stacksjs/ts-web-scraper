import { describe, expect, it } from 'bun:test'
import { extractMainContent } from '../../src/extraction/content'
import { extractLinkPreview } from '../../src/meta'
import { parseHTML } from '../../src/web-scraper'

describe('Malformed HTML Edge Cases', () => {
  describe('Unclosed Tags', () => {
    it('should handle unclosed div tags', () => {
      const html = `
        <html>
        <body>
          <div>
            <p>Content here
            <div>Another section
              <span>Nested content
          </div>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const doc = parseHTML(html)
      expect(doc).toBeDefined()
    })

    it('should handle unclosed paragraph tags', () => {
      const html = `
        <article>
          <p>First paragraph
          <p>Second paragraph
          <p>Third paragraph
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toContain('First paragraph')
    })

    it('should handle unclosed list tags', () => {
      const html = `
        <ul>
          <li>Item 1
          <li>Item 2
          <li>Item 3
        </ul>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle missing closing body and html tags', () => {
      const html = `
        <html>
        <head><title>Test</title></head>
        <body>
        <h1>Content</h1>
        <p>Text here
      `

      expect(() => parseHTML(html)).not.toThrow()
      const doc = parseHTML(html)
      expect(doc.querySelector('h1')?.textContent).toBeDefined()
    })
  })

  describe('Invalid Nesting', () => {
    it('should handle p tags inside p tags', () => {
      const html = `
        <article>
          <p>Outer paragraph
            <p>Invalid inner paragraph</p>
          </p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toBeDefined()
    })

    it('should handle block elements inside inline elements', () => {
      const html = `
        <span>
          <div>Block inside inline</div>
          <h1>Heading inside span</h1>
        </span>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle list items outside lists', () => {
      const html = `
        <article>
          <li>Item without ul/ol</li>
          <li>Another orphan item</li>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle tbody without table', () => {
      const html = `
        <tbody>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </tbody>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Missing Required Attributes', () => {
    it('should handle img tags without src', () => {
      const html = `
        <article>
          <img alt="Missing source" />
          <img />
          <p>Content</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.leadImage).toBeUndefined()
    })

    it('should handle links without href', () => {
      const html = `
        <a>Link without href</a>
        <a href="">Empty href</a>
        <a href=" ">Whitespace href</a>
      `

      const doc = parseHTML(html)
      const links = doc.querySelectorAll('a')
      expect(links.length).toBeGreaterThan(0)
    })

    it('should handle meta tags without content', () => {
      const html = `
        <head>
          <meta name="description" />
          <meta property="og:title" content="" />
          <meta property="og:image" />
        </head>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })

    it('should handle form elements without required attributes', () => {
      const html = `
        <form>
          <input type="text" />
          <input />
          <select></select>
          <textarea></textarea>
        </form>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Corrupted HTML Entities', () => {
    it('should handle incomplete HTML entities', () => {
      const html = `
        <article>
          <p>Text with &amp incomplete entity</p>
          <p>Another &nbsp incomplete</p>
          <p>Missing semicolon &lt content</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toBeDefined()
    })

    it('should handle invalid numeric entities', () => {
      const html = `
        <p>&#999999; &#-1; &#; &#abc;</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle unknown named entities', () => {
      const html = `
        <p>&unknown; &fakeentity; &notreal;</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle malformed entities in attributes', () => {
      const html = `
        <a href="/path?param=&value&amp">Link</a>
        <img src="image.jpg?w=&h=&" alt="&broken" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Mixed Encodings', () => {
    it('should handle mixed content with special characters', () => {
      const html = `
        <article>
          <p>Latin: Café, naïve, résumé</p>
          <p>Symbols: © ® ™ € £ ¥</p>
          <p>Math: × ÷ ± ≤ ≥</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toBeDefined()
    })

    it('should handle content with different scripts', () => {
      const html = `
        <article>
          <p>English text</p>
          <p>日本語のテキスト</p>
          <p>中文文本</p>
          <p>한국어 텍스트</p>
          <p>العربية النص</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent.length).toBeGreaterThan(0)
    })
  })

  describe('Invalid Doctype', () => {
    it('should handle missing doctype', () => {
      const html = `
        <html>
        <head><title>No Doctype</title></head>
        <body><p>Content</p></body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle malformed doctype', () => {
      const html = `
        <!DOCTYPE>
        <html><body><p>Content</p></body></html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle multiple doctypes', () => {
      const html = `
        <!DOCTYPE html>
        <!DOCTYPE html PUBLIC>
        <html><body><p>Content</p></body></html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Broken Comment Syntax', () => {
    it('should handle unclosed comments', () => {
      const html = `
        <html>
        <!-- This comment is never closed
        <body>
          <p>Content after unclosed comment</p>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle nested comments', () => {
      const html = `
        <!-- Outer <!-- Inner --> comment -->
        <p>Content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle malformed comment syntax', () => {
      const html = `
        <!- Invalid comment ->
        <! Another invalid >
        <p>Content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Invalid Attribute Syntax', () => {
    it('should handle attributes without quotes', () => {
      const html = `
        <div class=unquoted id=test data-value=123>
          <p>Content</p>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle attributes with mixed quotes', () => {
      const html = `
        <div class="double' id='single" data-mixed='value">
          <p>Content</p>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle duplicate attributes', () => {
      const html = `
        <div id="first" class="a" id="second" class="b">
          <p>Content</p>
        </div>
      `

      const doc = parseHTML(html)
      const div = doc.querySelector('div')
      expect(div).toBeDefined()
    })

    it('should handle attributes with special characters', () => {
      const html = `
        <div data-test="value<>&" onclick="alert('test')" class="a b  c">
          <p>Content</p>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Truncated HTML', () => {
    it('should handle HTML cut off mid-tag', () => {
      const html = `
        <html>
        <body>
          <article>
            <h1>Title</h1>
            <p>Content here and suddenly it ends<div
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle HTML cut off mid-attribute', () => {
      const html = `
        <div class="test" id="incomplete
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle HTML cut off mid-content', () => {
      const html = `
        <article>
          <p>This is some content that gets cut o
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Empty and Whitespace-Only Elements', () => {
    it('should handle empty elements', () => {
      const html = `
        <article></article>
        <div></div>
        <p></p>
        <span></span>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toBe('')
    })

    it('should handle whitespace-only elements', () => {
      const html = `
        <article>



        </article>
        <p>   </p>
        <div>

        </div>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle mixed empty and content elements', () => {
      const html = `
        <article>
          <p></p>
          <p>Real content</p>
          <p>   </p>
          <p>More content</p>
          <p></p>
        </article>
      `

      const result = extractMainContent(html)
      expect(result.textContent).toContain('Real content')
      expect(result.textContent).toContain('More content')
    })
  })

  describe('Invalid Self-Closing Tags', () => {
    it('should handle incorrectly self-closed non-void elements', () => {
      const html = `
        <div />
        <p />
        <span />
        <article />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle void elements with closing tags', () => {
      const html = `
        <img src="test.jpg"></img>
        <br></br>
        <input type="text"></input>
        <hr></hr>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Malformed JSON-LD', () => {
    it('should handle invalid JSON in script tags', () => {
      const html = `
        <script type="application/ld+json">
          {
            "invalid": json,
            missing: "quotes",
            "trailing": "comma",
          }
        </script>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })

    it('should handle incomplete JSON-LD', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@type": "Article",
            "headline": "Test
        </script>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })

    it('should handle multiple JSON-LD blocks with mixed validity', () => {
      const html = `
        <script type="application/ld+json">
          {"@type": "Valid", "name": "Test"}
        </script>
        <script type="application/ld+json">
          {invalid json}
        </script>
        <script type="application/ld+json">
          {"@type": "AlsoValid"}
        </script>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })
  })

  describe('Ambiguous Tag Boundaries', () => {
    it('should handle tags with > in attributes', () => {
      const html = `
        <div title="a > b" data-compare="x > y">
          <p>Content</p>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle tags with < in content', () => {
      const html = `
        <p>If x < y then do something</p>
        <p>Price: <$100</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle CDATA sections', () => {
      const html = `
        <![CDATA[
          This is <raw> content with <tags>
        ]]>
        <p>Normal content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Dangerous Element Combinations', () => {
    it('should handle script tags in various contexts', () => {
      const html = `
        <article>
          <script>alert('xss')</script>
          <p>Content</p>
          <script src="evil.js"></script>
        </article>
      `

      const result = extractMainContent(html)
      // Scripts should be removed from content
      expect(result.textContent).not.toContain('alert')
      expect(result.textContent).toContain('Content')
    })

    it('should handle style tags that could break parsing', () => {
      const html = `
        <style>
          .class { content: "</style><script>alert('xss')</script>"; }
        </style>
        <p>Content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle deeply nested tables', () => {
      const html = `
        <table>
          <tr><td>
            <table>
              <tr><td>
                <table>
                  <tr><td>Deep content</td></tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
        </table>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Missing or Invalid Head/Body', () => {
    it('should handle HTML without head tag', () => {
      const html = `
        <html>
        <body>
          <h1>No Head Section</h1>
          <p>Content</p>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle HTML without body tag', () => {
      const html = `
        <html>
        <h1>No Body Tag</h1>
        <p>Direct content</p>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle content before html tag', () => {
      const html = `
        Content before HTML
        <html>
        <body>
          <p>Normal content</p>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle multiple body tags', () => {
      const html = `
        <html>
        <body>
          <p>First body</p>
        </body>
        <body>
          <p>Second body</p>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Complex Real-World Malformed HTML', () => {
    it('should handle legacy WordPress HTML with unclosed divs', () => {
      const html = `
        <div class="post">
          <h1>Article Title
          <div class="meta">
            <span class="author">John Doe
            <span class="date">2025-01-01
          <div class="content">
            <p>Article content here
            <p>More content
        </div>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle email-generated HTML with bad formatting', () => {
      const html = `
        <html><head></head><body>
        <div>
        <table width=100% cellpadding=0><tr><td>
        <font face=Arial size=2>
        <p>Email content here</p>
        </font>
        </td></tr></table>
        </div>
        </body></html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle user-generated content with mixed valid/invalid HTML', () => {
      const html = `
        <article>
          <p>Normal paragraph</p>
          <div>
            <b>Bold text <i>italic text</b> invalid nesting</i>
          <p>Unclosed paragraph
          <script>document.write('<p>Generated content</p>');</script>
          <p>More content</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })
})
