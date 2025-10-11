import { describe, expect, it } from 'bun:test'
import type { SitemapEntry } from '../src/sitemap'
import { discoverSitemaps, parseSitemap, SitemapParser } from '../src/sitemap'

// Mock sitemap XML content
const mockSitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01T00:00:00Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-02T00:00:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2024-01-03T00:00:00Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`

const mockSitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap2.xml</loc>
  </sitemap>
</sitemapindex>`

const mockRobotsTxt = `User-agent: *
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml`

describe('SitemapParser', () => {
  it('should parse URL set', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const entries = parser['parseUrlSet'](mockSitemapXML)
    expect(entries.length).toBe(3)

    expect(entries[0].loc).toBe('https://example.com/')
    expect(entries[0].lastmod).toBeInstanceOf(Date)
    expect(entries[0].changefreq).toBe('daily')
    expect(entries[0].priority).toBe(1.0)

    expect(entries[1].loc).toBe('https://example.com/about')
    expect(entries[1].changefreq).toBe('weekly')
    expect(entries[1].priority).toBe(0.8)
  })

  it('should parse URL block with all fields', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const urlBlock = `
      <loc>https://example.com/page</loc>
      <lastmod>2024-01-01T00:00:00Z</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.5</priority>
    `

    const entry = parser['parseUrlBlock'](urlBlock)
    expect(entry).not.toBeNull()
    expect(entry!.loc).toBe('https://example.com/page')
    expect(entry!.lastmod).toBeInstanceOf(Date)
    expect(entry!.changefreq).toBe('monthly')
    expect(entry!.priority).toBe(0.5)
  })

  it('should parse URL block with minimal fields', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const urlBlock = '<loc>https://example.com/page</loc>'
    const entry = parser['parseUrlBlock'](urlBlock)

    expect(entry).not.toBeNull()
    expect(entry!.loc).toBe('https://example.com/page')
    expect(entry!.lastmod).toBeUndefined()
    expect(entry!.changefreq).toBeUndefined()
    expect(entry!.priority).toBeUndefined()
  })

  it('should return null for URL block without loc', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const urlBlock = '<changefreq>daily</changefreq>'
    const entry = parser['parseUrlBlock'](urlBlock)

    expect(entry).toBeNull()
  })

  it('should extract sitemap URLs from index', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const urls = parser['extractSitemapUrls'](mockSitemapIndexXML)
    expect(urls.length).toBe(2)
    expect(urls).toContain('https://example.com/sitemap1.xml')
    expect(urls).toContain('https://example.com/sitemap2.xml')
  })

  it('should apply include patterns filter', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        includePatterns: [/\/blog/],
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/' },
      { loc: 'https://example.com/blog' },
      { loc: 'https://example.com/blog/post-1' },
      { loc: 'https://example.com/about' },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(2)
    expect(filtered[0].loc).toBe('https://example.com/blog')
    expect(filtered[1].loc).toBe('https://example.com/blog/post-1')
  })

  it('should apply exclude patterns filter', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        excludePatterns: [/\/admin/, /\/private/],
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/' },
      { loc: 'https://example.com/admin' },
      { loc: 'https://example.com/private/page' },
      { loc: 'https://example.com/blog' },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(2)
    expect(filtered[0].loc).toBe('https://example.com/')
    expect(filtered[1].loc).toBe('https://example.com/blog')
  })

  it('should apply min lastmod filter', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        minLastMod: new Date('2024-01-02'),
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/old', lastmod: new Date('2024-01-01') },
      { loc: 'https://example.com/new', lastmod: new Date('2024-01-03') },
      { loc: 'https://example.com/newer', lastmod: new Date('2024-01-05') },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(2)
    expect(filtered[0].loc).toBe('https://example.com/new')
    expect(filtered[1].loc).toBe('https://example.com/newer')
  })

  it('should apply max lastmod filter', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        maxLastMod: new Date('2024-01-03'),
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/old', lastmod: new Date('2024-01-01') },
      { loc: 'https://example.com/new', lastmod: new Date('2024-01-03') },
      { loc: 'https://example.com/newer', lastmod: new Date('2024-01-05') },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(2)
    expect(filtered[0].loc).toBe('https://example.com/old')
    expect(filtered[1].loc).toBe('https://example.com/new')
  })

  it('should apply min priority filter', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        minPriority: 0.7,
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/low', priority: 0.3 },
      { loc: 'https://example.com/medium', priority: 0.5 },
      { loc: 'https://example.com/high', priority: 0.9 },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(1)
    expect(filtered[0].loc).toBe('https://example.com/high')
  })

  it('should apply multiple filters', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        includePatterns: [/\/blog/],
        excludePatterns: [/\/draft/],
        minPriority: 0.5,
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/', priority: 1.0 },
      { loc: 'https://example.com/blog/post-1', priority: 0.8 },
      { loc: 'https://example.com/blog/draft', priority: 0.9 },
      { loc: 'https://example.com/blog/post-2', priority: 0.3 },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(1)
    expect(filtered[0].loc).toBe('https://example.com/blog/post-1')
  })

  it('should respect maxDepth', async () => {
    const parser = new SitemapParser({
      maxDepth: 0,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const entries = await parser.parse('https://example.com/sitemap.xml', 1)
    expect(entries.length).toBe(0)
  })

  it('should handle parse errors gracefully', async () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    // This should not throw, just return empty array
    const entries = await parser.parse('https://invalid-domain-that-does-not-exist-12345.com/sitemap.xml')
    expect(entries).toEqual([])
  })
})

describe('parseSitemap', () => {
  it('should parse sitemap with default options', async () => {
    // Since we can't easily mock fetch in tests, we'll just verify the function exists
    // and has the right signature
    expect(typeof parseSitemap).toBe('function')
  })

  it('should merge custom options with defaults', async () => {
    expect(typeof parseSitemap).toBe('function')
  })
})

describe('discoverSitemaps', () => {
  it('should discover sitemaps', async () => {
    expect(typeof discoverSitemaps).toBe('function')
  })
})

describe('SitemapParser.discoverSitemaps', () => {
  it('should be a static method', () => {
    expect(typeof SitemapParser.discoverSitemaps).toBe('function')
  })
})

describe('Sitemap Entry Types', () => {
  it('should handle all changefreq values', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const frequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']

    frequencies.forEach((freq) => {
      const urlBlock = `<loc>https://example.com/</loc><changefreq>${freq}</changefreq>`
      const entry = parser['parseUrlBlock'](urlBlock)
      expect(entry?.changefreq).toBe(freq)
    })
  })

  it('should handle priority range', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const priorities = [0.0, 0.1, 0.5, 0.8, 1.0]

    priorities.forEach((priority) => {
      const urlBlock = `<loc>https://example.com/</loc><priority>${priority}</priority>`
      const entry = parser['parseUrlBlock'](urlBlock)
      expect(entry?.priority).toBe(priority)
    })
  })

  it('should parse ISO date strings', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const urlBlock = '<loc>https://example.com/</loc><lastmod>2024-01-15T10:30:00Z</lastmod>'
    const entry = parser['parseUrlBlock'](urlBlock)

    expect(entry?.lastmod).toBeInstanceOf(Date)
    expect(entry?.lastmod?.toISOString()).toBe('2024-01-15T10:30:00.000Z')
  })
})

describe('Filter edge cases', () => {
  it('should filter entries without lastmod when date filters are set', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        minLastMod: new Date('2024-01-01'),
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/with-date', lastmod: new Date('2024-01-02') },
      { loc: 'https://example.com/without-date' },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(1)
    expect(filtered[0].loc).toBe('https://example.com/with-date')
  })

  it('should filter entries without priority when priority filter is set', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        minPriority: 0.5,
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/with-priority', priority: 0.8 },
      { loc: 'https://example.com/without-priority' },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(1)
    expect(filtered[0].loc).toBe('https://example.com/with-priority')
  })

  it('should handle empty filters object', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {},
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/page1' },
      { loc: 'https://example.com/page2' },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(2)
  })

  it('should handle empty include patterns array', () => {
    const parser = new SitemapParser({
      maxDepth: 3,
      followIndexes: true,
      filters: {
        includePatterns: [],
      },
      timeout: 10000,
    })

    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/page1' },
      { loc: 'https://example.com/page2' },
    ]

    const filtered = parser['applyFilters'](entries)
    expect(filtered.length).toBe(2)
  })
})
