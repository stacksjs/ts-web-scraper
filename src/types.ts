export interface ScraperConfig {
  /**
   * Enable verbose logging
   * @default true
   */
  verbose?: boolean

  /**
   * Default timeout for fetch requests in milliseconds
   * @default 30000
   */
  timeout?: number

  /**
   * Default user agent for requests
   * @default 'Mozilla/5.0 (compatible; BunScraper/1.0)'
   */
  userAgent?: string

  /**
   * Maximum number of JS files to analyze for client-side scraping
   * @default 10
   */
  maxJSFiles?: number

  /**
   * Whether to analyze JavaScript bundles by default
   * @default true
   */
  analyzeJavaScript?: boolean

  /**
   * Whether to find embedded data by default
   * @default true
   */
  findEmbeddedData?: boolean

  /**
   * Whether to attempt API reconstruction by default
   * @default true
   */
  reconstructAPI?: boolean

  /**
   * Custom headers to include in all requests
   */
  headers?: Record<string, string>

  /**
   * Rate limit: delay between requests in milliseconds
   * @default 0
   */
  rateLimit?: number

  /**
   * Number of retry attempts for failed requests
   * @default 0
   */
  retries?: number

  /**
   * Whether to follow redirects
   * @default true
   */
  followRedirects?: boolean
}
