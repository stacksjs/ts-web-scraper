/**
 * Sitemap Parser
 *
 * Parse XML sitemaps for URL discovery
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export interface SitemapEntry {
  loc: string
  lastmod?: Date
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export interface SitemapOptions {
  /**
   * Maximum depth for sitemap indexes
   * @default 3
   */
  maxDepth?: number

  /**
   * Follow sitemap indexes
   * @default true
   */
  followIndexes?: boolean

  /**
   * Filters
   */
  filters?: {
    includePatterns?: RegExp[]
    excludePatterns?: RegExp[]
    minLastMod?: Date
    maxLastMod?: Date
    minPriority?: number
  }

  /**
   * Timeout for fetching sitemaps
   * @default 10000
   */
  timeout?: number
}

/**
 * Sitemap Parser
 */
export class SitemapParser {
  constructor(private options: Required<SitemapOptions>) {}

  /**
   * Parse sitemap from URL
   */
  async parse(sitemapUrl: string, depth = 0): Promise<SitemapEntry[]> {
    if (depth > this.options.maxDepth) {
      return []
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

      const response = await fetch(sitemapUrl, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const content = await response.text()

      // Check if it's a sitemap index or regular sitemap
      if (content.includes('<sitemapindex')) {
        return await this.parseIndex(content, sitemapUrl, depth)
      }
      else {
        return this.parseUrlSet(content)
      }
    }
    catch (error) {
      console.error(`Failed to parse sitemap ${sitemapUrl}:`, error)
      return []
    }
  }

  /**
   * Parse sitemap index
   */
  private async parseIndex(content: string, baseUrl: string, depth: number): Promise<SitemapEntry[]> {
    if (!this.options.followIndexes) {
      return []
    }

    const sitemapUrls = this.extractSitemapUrls(content)
    const allEntries: SitemapEntry[] = []

    // Parse each sitemap in parallel
    const promises = sitemapUrls.map(url => this.parse(url, depth + 1))
    const results = await Promise.all(promises)

    for (const entries of results) {
      allEntries.push(...entries)
    }

    return this.applyFilters(allEntries)
  }

  /**
   * Parse URL set
   */
  private parseUrlSet(content: string): SitemapEntry[] {
    const entries: SitemapEntry[] = []

    // Extract all <url> blocks
    const urlRegex = /<url>([\s\S]*?)<\/url>/g
    let match = urlRegex.exec(content)

    while (match !== null) {
      const urlBlock = match[1]
      const entry = this.parseUrlBlock(urlBlock)

      if (entry) {
        entries.push(entry)
      }

      match = urlRegex.exec(content)
    }

    return this.applyFilters(entries)
  }

  /**
   * Parse single URL block
   */
  private parseUrlBlock(block: string): SitemapEntry | null {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/)
    if (!locMatch) {
      return null
    }

    const entry: SitemapEntry = {
      loc: locMatch[1].trim(),
    }

    // Parse lastmod
    const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/)
    if (lastmodMatch) {
      entry.lastmod = new Date(lastmodMatch[1].trim())
    }

    // Parse changefreq
    const changefreqMatch = block.match(/<changefreq>(.*?)<\/changefreq>/)
    if (changefreqMatch) {
      entry.changefreq = changefreqMatch[1].trim() as SitemapEntry['changefreq']
    }

    // Parse priority
    const priorityMatch = block.match(/<priority>(.*?)<\/priority>/)
    if (priorityMatch) {
      entry.priority = Number.parseFloat(priorityMatch[1].trim())
    }

    return entry
  }

  /**
   * Extract sitemap URLs from index
   */
  private extractSitemapUrls(content: string): string[] {
    const urls: string[] = []
    const sitemapRegex = /<sitemap>([\s\S]*?)<\/sitemap>/g
    let match = sitemapRegex.exec(content)

    while (match !== null) {
      const locMatch = match[1].match(/<loc>(.*?)<\/loc>/)
      if (locMatch) {
        urls.push(locMatch[1].trim())
      }
      match = sitemapRegex.exec(content)
    }

    return urls
  }

  /**
   * Apply filters to entries
   */
  private applyFilters(entries: SitemapEntry[]): SitemapEntry[] {
    let filtered = entries

    const { filters } = this.options

    // Include patterns
    if (filters.includePatterns && filters.includePatterns.length > 0) {
      filtered = filtered.filter(entry =>
        filters.includePatterns!.some(pattern => pattern.test(entry.loc)),
      )
    }

    // Exclude patterns
    if (filters.excludePatterns && filters.excludePatterns.length > 0) {
      filtered = filtered.filter(entry =>
        !filters.excludePatterns!.some(pattern => pattern.test(entry.loc)),
      )
    }

    // Min lastmod
    if (filters.minLastMod) {
      filtered = filtered.filter(entry =>
        entry.lastmod && entry.lastmod >= filters.minLastMod!,
      )
    }

    // Max lastmod
    if (filters.maxLastMod) {
      filtered = filtered.filter(entry =>
        entry.lastmod && entry.lastmod <= filters.maxLastMod!,
      )
    }

    // Min priority
    if (filters.minPriority !== undefined) {
      filtered = filtered.filter(entry =>
        entry.priority !== undefined && entry.priority >= filters.minPriority!,
      )
    }

    return filtered
  }

  /**
   * Discover sitemaps from robots.txt or common locations
   */
  static async discoverSitemaps(baseUrl: string): Promise<string[]> {
    const sitemaps: string[] = []
    const parsed = new URL(baseUrl)
    const origin = `${parsed.protocol}//${parsed.host}`

    // Try robots.txt
    try {
      const robotsResponse = await fetch(`${origin}/robots.txt`)
      if (robotsResponse.ok) {
        const robotsContent = await robotsResponse.text()
        const sitemapRegex = /Sitemap:\s*(.+)/gi
        let match = sitemapRegex.exec(robotsContent)

        while (match !== null) {
          sitemaps.push(match[1].trim())
          match = sitemapRegex.exec(robotsContent)
        }
      }
    }
    catch {
      // Ignore errors
    }

    // Try common locations
    const commonPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap-index.xml',
      '/sitemap1.xml',
    ]

    for (const path of commonPaths) {
      const url = `${origin}${path}`
      if (!sitemaps.includes(url)) {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          if (response.ok) {
            sitemaps.push(url)
          }
        }
        catch {
          // Ignore errors
        }
      }
    }

    return sitemaps
  }
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<SitemapOptions> = {
  maxDepth: 3,
  followIndexes: true,
  filters: {
    includePatterns: [],
    excludePatterns: [],
  },
  timeout: 10000,
}

/**
 * Quick helper to parse sitemap
 */
export async function parseSitemap(url: string, options?: SitemapOptions): Promise<SitemapEntry[]> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const parser = new SitemapParser(mergedOptions)
  return parser.parse(url)
}

/**
 * Quick helper to discover sitemaps
 */
export async function discoverSitemaps(baseUrl: string): Promise<string[]> {
  return SitemapParser.discoverSitemaps(baseUrl)
}
