// Caching
export {
  generateCacheKey,
  ScraperCache,
} from './cache'
export type {
  CachedData,
  CacheOptions,
} from './cache'

// Client-side rendered scraping
export {
  extractData,
  isClientSideRendered,
  scrapeClientSide,
} from './client-side-scraper'

export type {
  ClientSideScraperOptions,
  ScrapedData,
} from './client-side-scraper'

export * from './config'

// Cookie and session management
export {
  CookieJar,
  SessionManager,
} from './cookies'

export type {
  Cookie,
  CookieJarOptions,
} from './cookies'
// Content change detection
export {
  arrayDiff,
  ChangeType,
  compare,
  ContentTracker,
  diff,
  hashContent,
  stringSimilarity,
} from './diff'

export type {
  Change,
  ContentSnapshot,
  DiffResult,
} from './diff'
// Error handling
export {
  createHTTPError,
  ErrorCode,
  ScraperError,
  toScraperError,
} from './errors'

// Export formats
export {
  createExporter,
  exportData,
  saveExport,
} from './export'
export type {
  ExportFormat,
  ExportOptions,
} from './export'

// GraphQL detection and execution
export {
  detectGraphQL,
  extractGraphQLQueries,
  getOperationName,
  getOperationType,
  GraphQLClient,
  verifyGraphQLEndpoint,
} from './graphql'
export type {
  GraphQLClientOptions,
  GraphQLDetectionResult,
  GraphQLEndpoint,
  GraphQLQuery,
  GraphQLResponse,
} from './graphql'

// Performance monitoring
export {
  createReport,
  formatBytes,
  formatDuration,
  measure,
  monitored,
  PerformanceMonitor,
} from './monitor'
export type {
  MetricsSummary,
  PerformanceMetric,
  RequestMetrics,
  ScrapeMetrics,
} from './monitor'

// Pagination detection
export {
  autoPaginate,
  detectPagination,
  extractAllPageUrls,
  extractPageFromUrl,
  generatePageUrl,
  getNextPageUrl,
  hasMorePages,
  PaginationType,
} from './pagination'
export type {
  PaginationInfo,
  PaginationPattern,
} from './pagination'

// Extraction pipelines
export {
  ExtractionPipeline,
  extractors,
  pipeline,
} from './pipeline'
export type {
  PipelineContext,
  PipelineResult,
  PipelineStep,
} from './pipeline'

// Rate limiting
export {
  RateLimiter,
} from './rate-limiter'

export type {
  RateLimiterOptions,
} from './rate-limiter'
// Retry logic
export {
  calculateDelay,
  retryable,
  RetryBudget,
  withRetry,
} from './retry'

export type {
  RetryOptions,
  RetryStats,
} from './retry'
// Robots.txt
export {
  RobotsParser,
} from './robots'

export type {
  RobotsInfo,
  RobotsOptions,
} from './robots'
// Unified Scraper (🌟 recommended entry point)
export {
  createScraper,
  Scraper,
} from './scraper'

export type {
  ScrapeResult,
  ScraperOptions,
} from './scraper'
// Sitemap parsing
export {
  discoverSitemaps,
  parseSitemap,
  SitemapParser,
} from './sitemap'

export type {
  SitemapEntry,
  SitemapOptions,
} from './sitemap'
export * from './types'

// Data validation
export {
  assert,
  createValidator,
  sanitize,
  validate,
  ValidationErrorCode,
} from './validation'
export type {
  FieldSchema,
  Schema,
  SchemaType,
  ValidationError,
  ValidationResult,
} from './validation'

// Static HTML scraping
export {
  extractLinks,
  extractMeta,
  extractStructuredData,
  extractText,
  fetchHTML,
  fetchMultiple,
  parseHTML,
  waitFor,
} from './web-scraper'
// Types
export type {
  Document,
  FetchHTMLOptions,
  HTMLElement,
} from './web-scraper'
