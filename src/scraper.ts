/**
 * Unified Scraper
 *
 * Complete web scraping solution integrating all features
 * Uses ONLY Bun native APIs - no external dependencies!
 */

import type { CacheOptions } from './cache'
import type { CookieJarOptions } from './cookies'
import type { DiffResult } from './diff'
import type { ExportFormat, ExportOptions } from './export'
import type { GraphQLDetectionResult } from './graphql'
import type { ScrapeMetrics } from './monitor'
import type { PaginationInfo } from './pagination'
import type { RateLimiterOptions } from './rate-limiter'
import type { RetryOptions } from './retry'
import type { RobotsOptions } from './robots'
import type { Schema } from './validation'
import type { Document } from './web-scraper'
import { ScraperCache } from './cache'
import { scrapeClientSide } from './client-side-scraper'
import { CookieJar, SessionManager } from './cookies'
import { ContentTracker } from './diff'
import { exportData, saveExport } from './export'
import { detectGraphQL } from './graphql'
import { PerformanceMonitor } from './monitor'
import { detectPagination, getNextPageUrl, hasMorePages } from './pagination'
import { RateLimiter } from './rate-limiter'
import { withRetry } from './retry'
import { RobotsParser } from './robots'
import { validate } from './validation'
import { fetchHTML, parseHTML } from './web-scraper'

export interface ScraperOptions {
  // Core options
  userAgent?: string
  timeout?: number
  followRedirects?: boolean

  // Rate limiting
  rateLimit?: RateLimiterOptions

  // Retry logic
  retry?: RetryOptions

  // Caching
  cache?: CacheOptions

  // Ethics
  respectRobotsTxt?: boolean
  robotsOptions?: RobotsOptions

  // Cookies & sessions
  cookies?: CookieJarOptions
  persistCookies?: boolean

  // Monitoring
  monitor?: boolean

  // Client-side rendering
  enableClientSideRendering?: boolean
  clientSideWaitTime?: number

  // Content tracking
  trackChanges?: boolean
  maxSnapshots?: number
}

export interface ScrapeResult<T = any> {
  success: boolean
  url: string
  html?: string
  document?: Document
  data?: T
  pagination?: PaginationInfo
  graphql?: GraphQLDetectionResult
  cached: boolean
  duration: number
  changed?: boolean
  pageNumber?: number
  metrics?: ScrapeMetrics
  error?: Error | string
}

/**
 * Unified Scraper with all features integrated
 */
export class Scraper {
  private rateLimiter?: RateLimiter
  private cache?: ScraperCache
  private robots?: RobotsParser
  private cookieJar?: CookieJar
  private sessionManager?: SessionManager
  private monitor: PerformanceMonitor
  private contentTracker?: ContentTracker

  constructor(private options: ScraperOptions = {}) {
    // Initialize rate limiter
    if (options.rateLimit) {
      this.rateLimiter = new RateLimiter(options.rateLimit)
    }

    // Initialize cache
    if (options.cache) {
      this.cache = new ScraperCache(options.cache)
    }

    // Initialize robots.txt parser
    if (options.respectRobotsTxt) {
      this.robots = new RobotsParser(options.robotsOptions || {})
    }

    // Initialize cookies
    if (options.cookies || options.persistCookies) {
      this.cookieJar = new CookieJar(options.cookies)
      this.sessionManager = new SessionManager({
        cookieJar: this.cookieJar,
      })
    }

    // Initialize monitor
    this.monitor = new PerformanceMonitor({
      maxMetrics: 10000,
    })

    // Initialize content tracker
    if (options.trackChanges) {
      this.contentTracker = new ContentTracker({
        maxSnapshots: options.maxSnapshots || 10,
      })
    }
  }

  /**
   * Scrape a single URL
   */
  async scrape<T = any>(
    url: string,
    options: {
      selector?: string
      extract?: (doc: Document) => T | Promise<T>
      validate?: Schema
      detectPagination?: boolean
      detectGraphQL?: boolean
    } = {},
  ): Promise<ScrapeResult<T>> {
    const startTime = performance.now()

    try {
      // Rate limit
      if (this.rateLimiter) {
        await this.rateLimiter.throttle()
      }

      // Check robots.txt
      if (this.robots) {
        const allowed = await this.robots.canFetch(url)
        if (!allowed) {
          throw new Error(`Blocked by robots.txt: ${url}`)
        }
      }

      let html: string
      let cached = false

      // Try cache first
      if (this.cache) {
        const cachedData = await this.cache.get<string>(url)
        if (cachedData) {
          html = cachedData.data
          cached = true
        }
      }

      // Fetch if not cached
      if (!cached) {
        const fetchStart = performance.now()

        if (this.options.enableClientSideRendering) {
          const result = await withRetry(
            () => scrapeClientSide(url, {
              waitTime: this.options.clientSideWaitTime,
            }),
            this.options.retry,
          )
          html = result.html
        }
        else if (this.sessionManager) {
          const response = await withRetry(
            () => this.sessionManager!.fetch(url, {
              headers: {
                'User-Agent': this.options.userAgent || 'ts-web-scraper',
              },
            }),
            this.options.retry,
          )
          html = await response.text()
        }
        else {
          html = await withRetry(
            () => fetchHTML(url, {
              timeout: this.options.timeout,
              userAgent: this.options.userAgent,
            }),
            this.options.retry,
          )
        }

        const fetchDuration = performance.now() - fetchStart

        // Cache the result
        if (this.cache) {
          await this.cache.set(url, html)
        }

        this.monitor.recordMetric({
          name: 'fetch',
          value: fetchDuration,
          unit: 'ms',
          timestamp: new Date(),
          tags: { url },
        })
      }

      // Parse HTML
      const parseStart = performance.now()
      const document = parseHTML(html)
      const parseDuration = performance.now() - parseStart

      // Extract data
      let data: T | undefined
      let extractionDuration = 0

      if (options.extract) {
        const extractStart = performance.now()
        data = await options.extract(document)
        extractionDuration = performance.now() - extractStart

        // Validate if schema provided
        if (options.validate) {
          const validation = validate(data, options.validate)
          if (!validation.valid) {
            const errors = validation.errors.map(e => e.message).join('; ')
            throw new Error(`Validation failed: ${errors}`)
          }
          data = validation.data as T
        }
      }
      else if (options.selector) {
        // Simple selector extraction
        const elements = document.querySelectorAll(options.selector)
        data = elements.map(el => el.textContent?.trim() || '') as any
      }

      // Track changes if enabled
      let changed: boolean | undefined
      if (this.contentTracker && data) {
        const latest = this.contentTracker.getLatest(url)
        if (latest) {
          // Has previous snapshot - check if changed
          changed = await this.contentTracker.hasChanged(url, data)
        }
        // else: No previous snapshot, changed stays undefined
        await this.contentTracker.snapshot(url, data)
      }

      // Detect pagination if requested
      let pagination: PaginationInfo | undefined
      if (options.detectPagination) {
        pagination = detectPagination(html, url)
      }

      // Detect GraphQL if requested
      let graphql: GraphQLDetectionResult | undefined
      if (options.detectGraphQL) {
        graphql = detectGraphQL(html, url)
      }

      // Record metrics
      const totalDuration = performance.now() - startTime
      const metrics: ScrapeMetrics = {
        url,
        totalDuration,
        fetchDuration: cached ? 0 : totalDuration - parseDuration - extractionDuration,
        parseDuration,
        extractionDuration,
        itemsExtracted: data ? (Array.isArray(data) ? data.length : 1) : 0,
        bytesDownloaded: html.length,
        cached,
        retries: 0,
        timestamp: new Date(),
      }

      this.monitor.recordScrape(metrics)

      return {
        success: true,
        url,
        html,
        document,
        data,
        pagination,
        graphql,
        cached,
        duration: totalDuration,
        changed,
        metrics,
      }
    }
    catch (error) {
      const totalDuration = performance.now() - startTime
      const err = error as Error

      // Record failed metrics
      const metrics: ScrapeMetrics = {
        url,
        totalDuration,
        fetchDuration: 0,
        parseDuration: 0,
        extractionDuration: 0,
        itemsExtracted: 0,
        bytesDownloaded: 0,
        cached: false,
        retries: 0,
        error: err.message || String(error),
        timestamp: new Date(),
      }
      this.monitor.recordScrape(metrics)

      return {
        success: false,
        url,
        cached: false,
        duration: totalDuration,
        error: err.message || String(error),
      }
    }
  }

  /**
   * Scrape multiple URLs in parallel
   */
  async scrapeMany<T = any>(
    urls: string[],
    options?: Parameters<typeof this.scrape>[1] & {
      concurrency?: number
    },
  ): Promise<Array<ScrapeResult<T>>> {
    const { concurrency = 5, ...scrapeOptions } = options || {}

    const results: Array<ScrapeResult<T>> = []
    const queue = [...urls]

    // Process in batches for concurrency control
    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency)
      const batchResults = await Promise.all(
        batch.map(url => this.scrape<T>(url, scrapeOptions).catch(error => ({
          url,
          html: '',
          document: null as any,
          data: undefined,
          cached: false,
          metrics: {
            url,
            totalDuration: 0,
            fetchDuration: 0,
            parseDuration: 0,
            extractionDuration: 0,
            itemsExtracted: 0,
            bytesDownloaded: 0,
            cached: false,
            retries: 0,
            error: error.message,
            timestamp: new Date(),
          },
        }))),
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Auto-paginate and scrape all pages
   */
  async* scrapeAll<T = any>(
    startUrl: string,
    options?: Parameters<typeof this.scrape>[1] & {
      maxPages?: number
      delay?: number
    },
  ): AsyncGenerator<ScrapeResult<T>> {
    const { maxPages = 100, delay = 1000, ...scrapeOptions } = options || {}
    const visited = new Set<string>()

    let currentUrl: string | null = startUrl
    let pageNum = 1

    while (currentUrl && pageNum <= maxPages) {
      if (visited.has(currentUrl)) {
        break
      }

      visited.add(currentUrl)

      // Scrape page
      const result = await this.scrape<T>(currentUrl, {
        ...scrapeOptions,
        detectPagination: true,
      })

      // Add page number to result
      yield { ...result, pageNumber: pageNum }

      // Get next page
      if (!result.pagination || !hasMorePages(result.pagination)) {
        break
      }

      currentUrl = getNextPageUrl(result.pagination, result.url)
      pageNum++

      // Delay before next page
      if (currentUrl && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Check for content changes
   */
  async checkChanges(url: string): Promise<DiffResult | null> {
    if (!this.contentTracker) {
      throw new Error('Content tracking not enabled. Set trackChanges: true in options.')
    }

    const result = await this.scrape(url)
    return this.contentTracker.getChanges(url, result.data || result.html)
  }

  /**
   * Export scraped data
   */
  export(data: any, options: ExportOptions): string {
    return exportData(data, options)
  }

  /**
   * Save scraped data to file
   */
  async save(data: any, filepath: string, options?: Omit<ExportOptions, 'format'> & { format?: ExportFormat }): Promise<void> {
    return saveExport(data, filepath, options)
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      summary: this.monitor.getSummary(),
      requests: this.monitor.getRequestMetrics(),
      scrapes: this.monitor.getScrapeMetrics(),
    }
  }

  /**
   * Get performance stats summary
   */
  getStats() {
    return this.monitor.getSummary()
  }

  /**
   * Get formatted performance report
   */
  getReport(): string {
    const { createReport } = require('./monitor')
    return createReport(this.monitor)
  }

  /**
   * Get cookies for a URL
   */
  getCookies(url: string) {
    return this.cookieJar?.getCookies(url) || []
  }

  /**
   * Clear session cookies
   */
  clearSession(): void {
    if (this.sessionManager) {
      this.sessionManager.clearSession()
    }
    else if (this.cookieJar) {
      this.cookieJar.clearCookies()
    }
  }

  /**
   * Get content tracker
   */
  getContentTracker(): ContentTracker | undefined {
    return this.contentTracker
  }

  /**
   * Get cookie jar
   */
  getCookieJar(): CookieJar | undefined {
    return this.cookieJar
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear()
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return this.cache?.getStats()
  }
}

/**
 * Quick helper to create a scraper
 */
export function createScraper(options?: ScraperOptions): Scraper {
  return new Scraper(options)
}
