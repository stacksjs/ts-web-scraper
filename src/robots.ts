/**
 * Robots.txt Parser
 *
 * Parse and respect robots.txt files for ethical scraping
 * Uses ONLY Bun native APIs - no external dependencies!
 */

import { getGlobalCache } from './cache'

export interface RobotsOptions {
  /**
   * Respect robots.txt rules
   * @default true
   */
  respectRobotsTxt?: boolean

  /**
   * User agent to check rules for
   * @default 'BunScraper'
   */
  userAgent?: string

  /**
   * Cache time for robots.txt in milliseconds
   * @default 3600000 (1 hour)
   */
  cacheTime?: number

  /**
   * Timeout for fetching robots.txt
   * @default 5000
   */
  timeout?: number
}

export interface RobotRule {
  userAgent: string
  allow: string[]
  disallow: string[]
  crawlDelay?: number
}

export interface ParsedRobots {
  rules: RobotRule[]
  sitemaps: string[]
}

/**
 * Robots.txt Parser and Manager
 */
export class RobotsParser {
  private cache = getGlobalCache({ ttl: 3600000 })

  constructor(private options: Required<RobotsOptions>) {}

  /**
   * Check if URL can be fetched according to robots.txt
   */
  async canFetch(url: string): Promise<boolean> {
    if (!this.options.respectRobotsTxt) {
      return true
    }

    // Deliberately not caught: an unparseable URL is the caller's bug, and
    // swallowing it here turns a fast, clear failure into a request that
    // proceeds and then hangs on a URL that was never valid.
    const parsed = new URL(url)

    // A valid non-http(s) URL has no robots.txt to consult, so skip
    // straight past rather than spending a request and a timeout finding
    // that out.
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return true

    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`

    try {
      const robots = await this.fetch(robotsUrl)
      return this.isAllowedByRules(parsed.pathname, robots)
    }
    catch {
      // If robots.txt doesn't exist or fails to load, allow by default
      return true
    }
  }

  /**
   * Get crawl delay for a URL
   */
  async getCrawlDelay(url: string): Promise<number> {
    if (!this.options.respectRobotsTxt) {
      return 0
    }

    const parsed = new URL(url)
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`

    try {
      const robots = await this.fetch(robotsUrl)
      const rule = this.findMatchingRule(this.options.userAgent, robots)
      return rule?.crawlDelay || 0
    }
    catch {
      return 0
    }
  }

  /**
   * Get sitemaps from robots.txt
   */
  async getSitemaps(url: string): Promise<string[]> {
    const parsed = new URL(url)
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`

    try {
      const robots = await this.fetch(robotsUrl)
      return robots.sitemaps
    }
    catch {
      return []
    }
  }

  /**
   * Fetch and parse robots.txt
   */
  async fetch(robotsUrl: string): Promise<ParsedRobots> {
    // Check cache
    const cached = await this.cache.get<ParsedRobots>(robotsUrl)
    if (cached) {
      return cached.data
    }

    // Fetch robots.txt
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

    try {
      const response = await fetch(robotsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.options.userAgent,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const content = await response.text()
      const parsed = this.parse(content)

      // Cache the result
      await this.cache.set(robotsUrl, parsed, this.options.cacheTime)

      return parsed
    }
    finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Parse robots.txt content
   */
  parse(content: string): ParsedRobots {
    const lines = content.split('\n')
    const rules: RobotRule[] = []
    const sitemaps: string[] = []

    let currentRule: RobotRule | null = null

    for (let line of lines) {
      // Remove comments
      const commentIndex = line.indexOf('#')
      if (commentIndex !== -1) {
        line = line.substring(0, commentIndex)
      }

      line = line.trim()

      if (!line) {
        continue
      }

      const [directive, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()

      const directiveLower = directive.trim().toLowerCase()

      if (directiveLower === 'user-agent') {
        // Start new rule
        if (currentRule) {
          rules.push(currentRule)
        }
        currentRule = {
          userAgent: value,
          allow: [],
          disallow: [],
        }
      }
      else if (directiveLower === 'allow' && currentRule) {
        currentRule.allow.push(value)
      }
      else if (directiveLower === 'disallow' && currentRule) {
        currentRule.disallow.push(value)
      }
      else if (directiveLower === 'crawl-delay' && currentRule) {
        currentRule.crawlDelay = Number.parseFloat(value) * 1000 // Convert to ms
      }
      else if (directiveLower === 'sitemap') {
        sitemaps.push(value)
      }
    }

    // Add last rule
    if (currentRule) {
      rules.push(currentRule)
    }

    return { rules, sitemaps }
  }

  /**
   * Check if path is allowed by rules
   */
  private isAllowedByRules(path: string, robots: ParsedRobots): boolean {
    const rule = this.findMatchingRule(this.options.userAgent, robots)

    if (!rule) {
      // No rule found, allow by default
      return true
    }

    // Check allow rules first (they take precedence)
    for (const allowPattern of rule.allow) {
      if (this.matchesPattern(path, allowPattern)) {
        return true
      }
    }

    // Check disallow rules
    for (const disallowPattern of rule.disallow) {
      if (this.matchesPattern(path, disallowPattern)) {
        return false
      }
    }

    // If no rules matched, allow
    return true
  }

  /**
   * Find matching rule for user agent
   */
  /**
   * Find the group that applies to our user agent, per RFC 9309 §2.2.1.
   *
   * A group matches when its product token appears in our user agent, not
   * only when the two strings are equal. Crawlers send something like
   * `Mozilla/5.0 (compatible; ExampleBot/1.0; +https://example.com/bot)`,
   * and a site writes `User-agent: ExampleBot`. Exact comparison never
   * matches those, so the crawler fell through to `*` and proceeded, which
   * means a group naming that crawler specifically was silently ignored.
   * That is the one case where getting this wrong actually matters.
   *
   * The most specific match wins, again per the RFC: with groups for both
   * `Example` and `ExampleBot`, a request from ExampleBot obeys the longer
   * one. `*` is the fallback and never competes on length.
   */
  private findMatchingRule(userAgent: string, robots: ParsedRobots): RobotRule | null {
    const ua = userAgent.toLowerCase()
    let best: RobotRule | null = null

    for (const rule of robots.rules) {
      const token = rule.userAgent.toLowerCase()

      if (token === '*' || !ua.includes(token))
        continue

      if (!best || token.length > best.userAgent.length)
        best = rule
    }

    return best ?? robots.rules.find(rule => rule.userAgent === '*') ?? null
  }

  /**
   * Check if path matches robots.txt pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    if (!pattern) {
      return false
    }

    // Empty pattern means disallow nothing or allow nothing
    if (pattern === '/') {
      return true
    }

    // Convert robots.txt pattern to regex
    // * matches any sequence
    // $ matches end of URL
    const hasEndAnchor = pattern.endsWith('$')
    let regexPattern = hasEndAnchor ? pattern.slice(0, -1) : pattern

    // Escape regex special chars except *
    regexPattern = regexPattern
      .replace(/[.+?^{}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*') // * becomes .*

    if (hasEndAnchor) {
      regexPattern = `^${regexPattern}$`
    }
    else {
      regexPattern = `^${regexPattern}`
    }

    const regex = new RegExp(regexPattern)
    return regex.test(path)
  }
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<RobotsOptions> = {
  respectRobotsTxt: true,
  userAgent: 'BunScraper',
  cacheTime: 3600000,
  timeout: 5000,
}

/**
 * Global robots parser instance
 */
let globalRobotsParser: RobotsParser | null = null

export function getGlobalRobotsParser(options?: RobotsOptions): RobotsParser {
  if (!globalRobotsParser || options) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    globalRobotsParser = new RobotsParser(mergedOptions)
  }
  return globalRobotsParser
}

export function resetGlobalRobotsParser(): void {
  globalRobotsParser = null
}

/**
 * Quick helper to check if URL can be fetched
 */
export async function canFetch(url: string, options?: RobotsOptions): Promise<boolean> {
  const parser = getGlobalRobotsParser(options)
  return parser.canFetch(url)
}

/**
 * Quick helper to get crawl delay
 */
export async function getCrawlDelay(url: string, options?: RobotsOptions): Promise<number> {
  const parser = getGlobalRobotsParser(options)
  return parser.getCrawlDelay(url)
}
