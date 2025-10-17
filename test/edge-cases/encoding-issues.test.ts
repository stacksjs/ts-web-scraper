import { describe, expect, it } from 'bun:test'
import { extractMainContent } from '../../src/extraction/content'
import { extractLinkPreview } from '../../src/meta'
import { parseHTML } from '../../src/web-scraper'

describe('Encoding Issues Edge Cases', () => {
  describe('Invalid UTF-8 Sequences', () => {
    it('should handle invalid UTF-8 start bytes', () => {
      // Invalid UTF-8 sequences (represented as strings)
      const html = '<article><p>Text with invalid UTF-8: \uFFFD</p></article>'

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle overlong UTF-8 encodings', () => {
      const html = `
        <article>
          <p>Overlong null: \xC0\x80</p>
          <p>Overlong slash: \xC0\xAF</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle truncated UTF-8 sequences', () => {
      const html = `
        <article>
          <p>Truncated 2-byte: \xC2</p>
          <p>Truncated 3-byte: \xE0\xA0</p>
          <p>Truncated 4-byte: \xF0\x90\x80</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Byte Order Mark (BOM)', () => {
    it('should handle UTF-8 BOM at start of document', () => {
      const html = '\uFEFF<html><body><p>Content</p></body></html>'

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle BOM in middle of document', () => {
      const html = '<html><body>\uFEFF<p>Content</p></body></html>'

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle multiple BOMs', () => {
      const html = '\uFEFF<html>\uFEFF<body>\uFEFF<p>Content</p></body></html>'

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle UTF-16 BOM patterns', () => {
      const html = '\uFFFE<html><body><p>Content</p></body></html>'

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Mixed Character Sets', () => {
    it('should handle mixed Latin and Cyrillic', () => {
      const html = `
        <article>
          <p>English: Hello World</p>
          <p>Russian: Привет мир</p>
          <p>Mixed: Hello Привет World мир</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toContain('Hello')
      expect(result.textContent).toContain('Привет')
    })

    it('should handle mixed Asian scripts', () => {
      const html = `
        <article>
          <p>Japanese: こんにちは 世界</p>
          <p>Chinese: 你好 世界</p>
          <p>Korean: 안녕하세요 세계</p>
          <p>Mixed: Hello こんにちは 你好 안녕하세요</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle mixed scripts with RTL text', () => {
      const html = `
        <article>
          <p>English and Arabic: Hello مرحبا World</p>
          <p>Hebrew and English: שלום Hello עולם World</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle Latin-1 extended characters', () => {
      const html = `
        <article>
          <p>Symbols: § ¶ † ‡ • ‰ ′ ″</p>
          <p>Currency: ¢ £ ¤ ¥ ₠ ₡ ₢ ₣ ₤ ₥ ₦</p>
          <p>Fractions: ¼ ½ ¾ ⅐ ⅑ ⅒ ⅓ ⅔ ⅕</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Invalid HTML Entities', () => {
    it('should handle malformed numeric entities', () => {
      const html = `
        <article>
          <p>Invalid hex: &#xGGGG;</p>
          <p>Out of range: &#9999999;</p>
          <p>Negative: &#-123;</p>
          <p>Empty: &#;</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle unclosed entities', () => {
      const html = `
        <article>
          <p>Unclosed amp: &amp</p>
          <p>Unclosed lt: &lt</p>
          <p>Unclosed numeric: &#65</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle invalid entity names', () => {
      const html = `
        <article>
          <p>&thisIsNotAnEntity;</p>
          <p>&fake123;</p>
          <p>&_invalid;</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle ambiguous entities', () => {
      const html = `
        <article>
          <p>&ampamp;</p>
          <p>&amp;amp;</p>
          <p>&&amp;</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Control Characters', () => {
    it('should handle ASCII control characters', () => {
      const html = `
        <article>
          <p>Null: \x00</p>
          <p>Bell: \x07</p>
          <p>Backspace: \x08</p>
          <p>Tab: \t</p>
          <p>Newline: \n</p>
          <p>Form Feed: \f</p>
          <p>Carriage Return: \r</p>
          <p>Escape: \x1B</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle vertical tab and other rare controls', () => {
      const html = `
        <article>
          <p>Vertical Tab: \x0B</p>
          <p>Shift Out: \x0E</p>
          <p>Shift In: \x0F</p>
          <p>Device Control: \x11\x12\x13\x14</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle Unicode control characters', () => {
      const html = `
        <article>
          <p>Zero Width Space: \u200B</p>
          <p>Zero Width Non-Joiner: \u200C</p>
          <p>Zero Width Joiner: \u200D</p>
          <p>Left-to-Right Mark: \u200E</p>
          <p>Right-to-Left Mark: \u200F</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle soft hyphen and other invisible characters', () => {
      const html = `
        <article>
          <p>Soft Hyphen: test\u00ADword</p>
          <p>Non-Breaking Space: test\u00A0word</p>
          <p>Em Space: test\u2003word</p>
          <p>Hair Space: test\u200Aword</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Invalid Escape Sequences', () => {
    it('should handle invalid backslash escapes', () => {
      const html = `
        <article>
          <p>Invalid: \\x \\u \\z</p>
          <p>Incomplete: \\x1 \\u123</p>
          <p>Mixed: text\\nwith\\ttabs</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle malformed Unicode escapes', () => {
      const html = `
        <article>
          <p>Bad escapes: \\uGGGG \\u{999999}</p>
          <p>Incomplete: \\u12 \\u</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle percent encoding in wrong context', () => {
      const html = `
        <article>
          <p>%20 %3C %3E %22</p>
          <p>%XX %YY %ZZ</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Charset Declaration Conflicts', () => {
    it('should handle conflicting charset declarations', () => {
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <meta charset="iso-8859-1" />
          <meta http-equiv="Content-Type" content="text/html; charset=windows-1252" />
        </head>
        <body><p>Content</p></body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle invalid charset names', () => {
      const html = `
        <head>
          <meta charset="not-a-real-charset" />
          <meta charset="utf-99" />
          <meta charset="" />
        </head>
        <body><p>Content</p></body>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle charset in wrong position', () => {
      const html = `
        <html>
        <body>
          <meta charset="utf-8" />
          <p>Content</p>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Surrogate Pairs', () => {
    it('should handle valid surrogate pairs', () => {
      const html = `
        <article>
          <p>Emoji: 😀 🎉 🌟</p>
          <p>Rare chars: 𝕳𝖊𝖑𝖑𝖔</p>
          <p>Musical: 𝄞 𝄢 𝄫</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle unpaired surrogates', () => {
      // High surrogate without low surrogate
      const html = `<article><p>Test\uD800 content</p></article>`

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle reversed surrogates', () => {
      // Low surrogate before high surrogate
      const html = `<article><p>Test\uDC00\uD800 content</p></article>`

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Normalization Issues', () => {
    it('should handle precomposed vs decomposed characters', () => {
      const html = `
        <article>
          <p>Precomposed: é ñ ü</p>
          <p>Decomposed: e\u0301 n\u0303 u\u0308</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle different Unicode normalizations of same text', () => {
      // NFD vs NFC
      const nfd = 'Cafe\u0301' // NFD (decomposed)
      const nfc = 'Café' // NFC (composed)
      const html = `
        <article>
          <h1>${nfd}</h1>
          <p>${nfc}</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Line Ending Variations', () => {
    it('should handle different line ending styles', () => {
      const html = `<article>\n<p>Unix LF</p>\r\n<p>Windows CRLF</p>\r<p>Old Mac CR</p>\n\r<p>Mixed</p></article>`

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle Unicode line separators', () => {
      const html = `
        <article>
          <p>Line Separator: Text\u2028here</p>
          <p>Paragraph Separator: Text\u2029here</p>
          <p>Next Line: Text\u0085here</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Homograph Attacks', () => {
    it('should handle homograph characters', () => {
      const html = `
        <article>
          <p>Latin a vs Cyrillic а: a а</p>
          <p>Latin e vs Greek ε: e ε</p>
          <p>Latin o vs Greek ο: o ο</p>
          <p>ASCII 0 vs digit ０: 0 ０</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle confusables in URLs', () => {
      const html = `
        <a href="http://exаmple.com">Latin a</a>
        <a href="http://еxample.com">Cyrillic e</a>
        <a href="http://example.сom">Cyrillic o</a>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Invalid XML Characters', () => {
    it('should handle characters invalid in XML', () => {
      const html = `
        <article>
          <p>Invalid: \x00 \x01 \x02 \x03</p>
          <p>More invalid: \x0B \x0C \x0E \x0F</p>
        </article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle restricted characters', () => {
      const html = `
        <article>
          <p>Restricted: \x7F \x80 \x84 \x86</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Encoding in Attributes', () => {
    it('should handle special characters in attribute values', () => {
      const html = `
        <div
          title="Title with "quotes" and 'apostrophes'"
          data-text="Text<with>tags"
          data-special="&amp;&lt;&gt;">
          Content
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle URL encoding in href attributes', () => {
      const html = `
        <a href="/path?q=hello%20world&foo=bar%26baz">Link 1</a>
        <a href="/path?q=%E2%9C%93">Link 2</a>
        <a href="/path?q=%XX">Link 3</a>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle non-ASCII in attribute values', () => {
      const html = `
        <div
          title="Título en español"
          data-japanese="日本語"
          data-emoji="🎉">
          Content
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Base64 and Data URLs', () => {
    it('should handle invalid base64 in data URLs', () => {
      const html = `
        <img src="data:image/png;base64,INVALID_BASE64!!!" />
        <img src="data:text/html;base64,SGVsbG8=" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle malformed data URLs', () => {
      const html = `
        <img src="data:,Hello World" />
        <img src="data:;base64" />
        <img src="data:" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle data URLs with special characters', () => {
      const html = `
        <img src="data:text/html,<script>alert('xss')</script>" />
        <img src="data:text/html,%3Cscript%3Ealert('xss')%3C/script%3E" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Character Set Edge Cases', () => {
    it('should handle Windows-1252 special characters', () => {
      const html = `
        <article>
          <p>Euro: €</p>
          <p>Quotes: " " ' '</p>
          <p>Dashes: – —</p>
          <p>Ellipsis: …</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle Latin-1 supplement', () => {
      const html = `
        <article>
          <p>¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ­ ® ¯</p>
          <p>° ± ² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Mixed Encoding in Single Document', () => {
    it('should handle document with mixed encoding indicators', () => {
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Title with é</title>
        </head>
        <body>
          <p>UTF-8: 你好</p>
          <p>Entities: &eacute;&ntilde;</p>
          <p>Numeric: &#233;&#241;</p>
        </body>
        </html>
      `

      expect(() => parseHTML(html)).not.toThrow()
      expect(() => extractLinkPreview(html)).not.toThrow()
    })
  })

  describe('Encoding Error Recovery', () => {
    it('should recover from encoding errors gracefully', () => {
      const html = `
        <article>
          <p>Start valid text</p>
          <p>Invalid: \uFFFD\uFFFD</p>
          <p>Continue with valid text</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toContain('Start valid text')
      expect(result.textContent).toContain('Continue with valid text')
    })

    it('should handle replacement characters', () => {
      const html = `
        <article>
          <p>Text with replacement: \uFFFD character</p>
          <p>Multiple: \uFFFD\uFFFD\uFFFD</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Special Unicode Blocks', () => {
    it('should handle mathematical alphanumeric symbols', () => {
      const html = `
        <article>
          <p>Bold: 𝐀𝐁𝐂 𝐚𝐛𝐜 𝟎𝟏𝟐</p>
          <p>Italic: 𝐴𝐵𝐶 𝑎𝑏𝑐</p>
          <p>Script: 𝒜ℬ𝒞 𝒶𝒷𝒸</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle enclosed alphanumerics', () => {
      const html = `
        <article>
          <p>Circled: ① ② ③ Ⓐ Ⓑ Ⓒ</p>
          <p>Parenthesized: ⑴ ⑵ ⑶</p>
          <p>Squared: 🄰 🄱 🄲</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle ancient and exotic scripts', () => {
      const html = `
        <article>
          <p>Egyptian: 𓀀 𓀁 𓀂</p>
          <p>Cuneiform: 𒀀 𒀁 𒀂</p>
          <p>Linear B: 𐀀 𐀁 𐀂</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })
})
