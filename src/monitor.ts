/**
 * Performance Monitoring
 *
 * Track and analyze scraping performance
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface RequestMetrics {
  url: string
  method: string
  statusCode?: number
  duration: number
  size?: number
  cached?: boolean
  retries?: number
  error?: string
  timestamp: Date
}

export interface ScrapeMetrics {
  url: string
  totalDuration: number
  fetchDuration: number
  parseDuration: number
  extractionDuration: number
  itemsExtracted: number
  bytesDownloaded: number
  cached: boolean
  retries: number
  error?: string
  timestamp: Date
}

export interface MetricsSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageDuration: number
  totalDuration: number
  averageSize: number
  totalSize: number
  cacheHitRate: number
  errorRate: number
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private requestMetrics: RequestMetrics[] = []
  private scrapeMetrics: ScrapeMetrics[] = []
  private timers: Map<string, number> = new Map()

  constructor(private options: {
    maxMetrics?: number
    flushInterval?: number
    onFlush?: (metrics: PerformanceMetric[]) => void | Promise<void>
  } = {}) {
    // Auto-flush if configured
    if (options.flushInterval && options.onFlush) {
      setInterval(() => {
        this.flush().catch(console.error)
      }, options.flushInterval)
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now())
  }

  /**
   * End timing and record metric
   */
  endTimer(name: string, tags?: Record<string, string>): number {
    const start = this.timers.get(name)
    if (!start) {
      throw new Error(`Timer '${name}' was not started`)
    }

    const duration = performance.now() - start
    this.timers.delete(name)

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags,
    })

    return duration
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Limit metrics
    if (this.options.maxMetrics && this.metrics.length > this.options.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics)

    // Limit metrics
    if (this.options.maxMetrics && this.requestMetrics.length > this.options.maxMetrics) {
      this.requestMetrics.shift()
    }
  }

  /**
   * Record scrape metrics
   */
  recordScrape(metrics: ScrapeMetrics): void {
    this.scrapeMetrics.push(metrics)

    // Limit metrics
    if (this.options.maxMetrics && this.scrapeMetrics.length > this.options.maxMetrics) {
      this.scrapeMetrics.shift()
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get request metrics
   */
  getRequestMetrics(): RequestMetrics[] {
    return [...this.requestMetrics]
  }

  /**
   * Get scrape metrics
   */
  getScrapeMetrics(): ScrapeMetrics[] {
    return [...this.scrapeMetrics]
  }

  /**
   * Get metrics summary
   */
  getSummary(): MetricsSummary {
    const requests = this.requestMetrics

    if (requests.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageDuration: 0,
        totalDuration: 0,
        averageSize: 0,
        totalSize: 0,
        cacheHitRate: 0,
        errorRate: 0,
      }
    }

    const successful = requests.filter(r => !r.error && r.statusCode && r.statusCode < 400)
    const failed = requests.filter(r => r.error || (r.statusCode && r.statusCode >= 400))
    const cached = requests.filter(r => r.cached)

    const totalDuration = requests.reduce((sum, r) => sum + r.duration, 0)
    const totalSize = requests.reduce((sum, r) => sum + (r.size || 0), 0)

    return {
      totalRequests: requests.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageDuration: totalDuration / requests.length,
      totalDuration,
      averageSize: totalSize / requests.length,
      totalSize,
      cacheHitRate: cached.length / requests.length,
      errorRate: failed.length / requests.length,
    }
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * Get metrics by tag
   */
  getMetricsByTag(key: string, value: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.tags?.[key] === value)
  }

  /**
   * Calculate percentile
   */
  percentile(name: string, p: number): number {
    const values = this.getMetricsByName(name)
      .map(m => m.value)
      .sort((a, b) => a - b)

    if (values.length === 0) {
      return 0
    }

    const index = Math.ceil((p / 100) * values.length) - 1
    return values[Math.max(0, index)]
  }

  /**
   * Calculate average
   */
  average(name: string): number {
    const values = this.getMetricsByName(name).map(m => m.value)

    if (values.length === 0) {
      return 0
    }

    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  /**
   * Calculate min/max
   */
  min(name: string): number {
    const values = this.getMetricsByName(name).map(m => m.value)
    return values.length > 0 ? Math.min(...values) : 0
  }

  max(name: string): number {
    const values = this.getMetricsByName(name).map(m => m.value)
    return values.length > 0 ? Math.max(...values) : 0
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.requestMetrics = []
    this.scrapeMetrics = []
  }

  /**
   * Flush metrics to callback
   */
  async flush(): Promise<void> {
    if (this.options.onFlush && this.metrics.length > 0) {
      await this.options.onFlush([...this.metrics])
      this.metrics = []
    }
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      requestMetrics: this.requestMetrics,
      scrapeMetrics: this.scrapeMetrics,
      summary: this.getSummary(),
      timestamp: new Date().toISOString(),
    }, null, 2)
  }

  /**
   * Save metrics to file
   */
  async save(filepath: string): Promise<void> {
    await Bun.write(filepath, this.export())
  }

  /**
   * Load metrics from file
   */
  async load(filepath: string): Promise<void> {
    const content = await Bun.file(filepath).text()
    const data = JSON.parse(content)

    this.metrics = data.metrics.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))

    this.requestMetrics = data.requestMetrics.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))

    this.scrapeMetrics = data.scrapeMetrics.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))
  }
}

/**
 * Create a monitored function wrapper
 */
export function monitored<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  monitor: PerformanceMonitor,
): T {
  return (async (...args: any[]) => {
    monitor.startTimer(name)
    try {
      const result = await fn(...args)
      monitor.endTimer(name, { status: 'success' })
      return result
    }
    catch (error) {
      monitor.endTimer(name, { status: 'error' })
      throw error
    }
  }) as T
}

/**
 * Performance decorator
 */
export function measure(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (this: any, ...args: any[]) {
      const start = performance.now()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - start

        // If instance has a monitor, record metric
        if (this.monitor && typeof this.monitor.recordMetric === 'function') {
          this.monitor.recordMetric({
            name: metricName,
            value: duration,
            unit: 'ms',
            timestamp: new Date(),
            tags: { status: 'success' },
          })
        }

        return result
      }
      catch (error) {
        const duration = performance.now() - start

        // If instance has a monitor, record metric
        if (this.monitor && typeof this.monitor.recordMetric === 'function') {
          this.monitor.recordMetric({
            name: metricName,
            value: duration,
            unit: 'ms',
            timestamp: new Date(),
            tags: { status: 'error' },
          })
        }

        throw error
      }
    }

    return descriptor
  }
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

/**
 * Format duration to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  }

  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}

/**
 * Create a report from metrics
 */
export function createReport(monitor: PerformanceMonitor): string {
  const summary = monitor.getSummary()

  return `
# Performance Report

## Summary
- Total Requests: ${summary.totalRequests}
- Successful: ${summary.successfulRequests} (${((summary.successfulRequests / summary.totalRequests) * 100).toFixed(2)}%)
- Failed: ${summary.failedRequests} (${(summary.errorRate * 100).toFixed(2)}%)
- Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(2)}%

## Performance
- Average Duration: ${formatDuration(summary.averageDuration)}
- Total Duration: ${formatDuration(summary.totalDuration)}
- Average Size: ${formatBytes(summary.averageSize)}
- Total Size: ${formatBytes(summary.totalSize)}

## Percentiles
- P50 (Median): ${formatDuration(monitor.percentile('request', 50))}
- P95: ${formatDuration(monitor.percentile('request', 95))}
- P99: ${formatDuration(monitor.percentile('request', 99))}

## Range
- Min: ${formatDuration(monitor.min('request'))}
- Max: ${formatDuration(monitor.max('request'))}
- Average: ${formatDuration(monitor.average('request'))}
`.trim()
}
