import { describe, expect, it } from 'bun:test'
import { RobotsParser } from '../src/robots'

describe('RobotsParser', () => {
  it('should parse simple robots.txt', () => {
    const content = `
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /public/

Sitemap: https://example.com/sitemap.xml
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    expect(parsed.rules.length).toBe(1)
    expect(parsed.rules[0].userAgent).toBe('*')
    expect(parsed.rules[0].disallow).toContain('/admin/')
    expect(parsed.rules[0].disallow).toContain('/private/')
    expect(parsed.rules[0].allow).toContain('/public/')
    expect(parsed.sitemaps).toContain('https://example.com/sitemap.xml')
  })

  it('should parse multiple user agents', () => {
    const content = `
User-agent: Googlebot
Disallow: /nogoogle/

User-agent: *
Disallow: /admin/
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    expect(parsed.rules.length).toBe(2)
    expect(parsed.rules[0].userAgent).toBe('Googlebot')
    expect(parsed.rules[1].userAgent).toBe('*')
  })

  it('should parse crawl delay', () => {
    const content = `
User-agent: *
Crawl-delay: 2
Disallow: /admin/
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    expect(parsed.rules[0].crawlDelay).toBe(2000) // Converted to ms
  })

  it('should handle comments', () => {
    const content = `
# This is a comment
User-agent: * # inline comment
Disallow: /admin/ # don't crawl admin
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    expect(parsed.rules.length).toBe(1)
    expect(parsed.rules[0].userAgent).toBe('*')
    expect(parsed.rules[0].disallow).toContain('/admin/')
  })

  it('should handle empty lines', () => {
    const content = `
User-agent: *


Disallow: /admin/

    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    expect(parsed.rules.length).toBe(1)
    expect(parsed.rules[0].disallow).toContain('/admin/')
  })

  it('should match exact paths', () => {
    const content = `
User-agent: *
Disallow: /admin
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const _parsed = parser.parse(content)

    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/admin', '/admin')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/admin/page', '/admin')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/administrator', '/admin')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/public', '/admin')).toBe(false)
  })

  it('should match wildcard patterns', () => {
    const content = `
User-agent: *
Disallow: /*.pdf$
Disallow: /temp*
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const _parsed = parser.parse(content)

    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/document.pdf', '/*.pdf$')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/doc/file.pdf', '/*.pdf$')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/document.pdf.html', '/*.pdf$')).toBe(false)

    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/temp', '/temp*')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/temporary', '/temp*')).toBe(true)
    // @ts-expect-error accessing private method for testing
    expect(parser.matchesPattern('/template', '/temp*')).toBe(true)
  })

  it('should respect allow rules', () => {
    const content = `
User-agent: *
Disallow: /private/
Allow: /private/public/
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    // @ts-expect-error accessing private method
    expect(parser.isAllowedByRules('/private/secret', parsed)).toBe(false)
    // @ts-expect-error accessing private method
    expect(parser.isAllowedByRules('/private/public/file', parsed)).toBe(true)
  })

  it('should allow by default when no rules match', () => {
    const content = `
User-agent: Googlebot
Disallow: /admin/
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot', // Different user agent
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    // @ts-expect-error accessing private method
    expect(parser.isAllowedByRules('/admin/', parsed)).toBe(true)
  })

  it('should find matching rule for specific user agent', () => {
    const content = `
User-agent: Googlebot
Disallow: /nogoogle/

User-agent: *
Disallow: /admin/
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'Googlebot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    // @ts-expect-error accessing private method
    const rule = parser.findMatchingRule('Googlebot', parsed)
    expect(rule?.userAgent).toBe('Googlebot')
    expect(rule?.disallow).toContain('/nogoogle/')
  })

  it('should fallback to wildcard rule', () => {
    const content = `
User-agent: Googlebot
Disallow: /nogoogle/

User-agent: *
Disallow: /admin/
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: 'TestBot',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    // @ts-expect-error accessing private method
    const rule = parser.findMatchingRule('TestBot', parsed)
    expect(rule?.userAgent).toBe('*')
    expect(rule?.disallow).toContain('/admin/')
  })

  it('should handle root disallow', () => {
    const content = `
User-agent: *
Disallow: /
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    // @ts-expect-error accessing private method
    expect(parser.isAllowedByRules('/', parsed)).toBe(false)
    // @ts-expect-error accessing private method
    expect(parser.isAllowedByRules('/anything', parsed)).toBe(false)
  })

  it('should handle empty disallow', () => {
    const content = `
User-agent: *
Disallow:
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    // Empty disallow means allow everything
    // @ts-expect-error accessing private method
    expect(parser.isAllowedByRules('/anything', parsed)).toBe(true)
  })

  it('should parse multiple sitemaps', () => {
    const content = `
User-agent: *
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
    `

    const parser = new RobotsParser({
      respectRobotsTxt: true,
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    const parsed = parser.parse(content)

    expect(parsed.sitemaps.length).toBe(2)
    expect(parsed.sitemaps).toContain('https://example.com/sitemap.xml')
    expect(parsed.sitemaps).toContain('https://example.com/sitemap-news.xml')
  })

  it('should allow fetching when respectRobotsTxt is false', async () => {
    const parser = new RobotsParser({
      respectRobotsTxt: false, // Disabled
      userAgent: '*',
      cacheTime: 3600000,
      timeout: 5000,
    })

    // Should always return true when disabled
    const canFetch = await parser.canFetch('https://example.com/admin/')
    expect(canFetch).toBe(true)
  })
})
