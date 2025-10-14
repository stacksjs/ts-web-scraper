import { describe, expect, it } from 'bun:test'
import { createReport, formatBytes, formatDuration, PerformanceMonitor } from '../src/monitor'

describe('PerformanceMonitor', () => {
  describe('Timer Management', () => {
    it('should start and end timers', () => {
      const monitor = new PerformanceMonitor()

      monitor.startTimer('test-operation')
      const duration = monitor.endTimer('test-operation')

      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('should throw error when ending non-existent timer', () => {
      const monitor = new PerformanceMonitor()

      expect(() => monitor.endTimer('non-existent')).toThrow()
    })

    it('should handle multiple timers simultaneously', () => {
      const monitor = new PerformanceMonitor()

      monitor.startTimer('timer1')
      monitor.startTimer('timer2')
      monitor.startTimer('timer3')

      const duration1 = monitor.endTimer('timer1')
      const duration2 = monitor.endTimer('timer2')
      const duration3 = monitor.endTimer('timer3')

      expect(duration1).toBeGreaterThanOrEqual(0)
      expect(duration2).toBeGreaterThanOrEqual(0)
      expect(duration3).toBeGreaterThanOrEqual(0)
    })

    it('should handle nested timers', () => {
      const monitor = new PerformanceMonitor()

      monitor.startTimer('outer')
      monitor.startTimer('inner')
      const innerDuration = monitor.endTimer('inner')
      const outerDuration = monitor.endTimer('outer')

      expect(outerDuration).toBeGreaterThanOrEqual(innerDuration)
    })

    it('should record metrics with tags', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordMetric({
        name: 'test-metric',
        value: 100,
        unit: 'ms',
        timestamp: new Date(),
        tags: { operation: 'fetch', status: 'success' },
      })

      const metrics = monitor.getMetrics()
      expect(metrics.length).toBe(1)
      expect(metrics[0].tags?.operation).toBe('fetch')
    })
  })

  describe('Request Metrics', () => {
    it('should record request metrics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1234,
        size: 50000,
        cached: false,
      })

      const requests = monitor.getRequestMetrics()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toBe('https://example.com')
      expect(requests[0].statusCode).toBe(200)
    })

    it('should track cached requests', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1234,
        size: 50000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 5,
        size: 50000,
        cached: true,
      })

      const summary = monitor.getSummary()
      expect(summary.cacheHitRate).toBe(0.5) // 1 of 2 cached
    })

    it('should track failed requests', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 500,
        duration: 1234,
        size: 0,
        cached: false,
        error: new Error('Server error'),
      })

      const summary = monitor.getSummary()
      expect(summary.failedRequests).toBe(1)
      expect(summary.errorRate).toBe(1)
    })

    it('should handle different HTTP methods', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        size: 1000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'POST',
        statusCode: 201,
        duration: 200,
        size: 500,
        cached: false,
      })

      const requests = monitor.getRequestMetrics()
      expect(requests.find(r => r.method === 'GET')).toBeDefined()
      expect(requests.find(r => r.method === 'POST')).toBeDefined()
    })

    it('should track request sizes', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        size: 1000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        size: 5000,
        cached: false,
      })

      const summary = monitor.getSummary()
      expect(summary.totalSize).toBe(6000)
      expect(summary.averageSize).toBe(3000)
    })
  })

  describe('Scrape Metrics', () => {
    it('should record scrape metrics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordScrape({
        url: 'https://example.com',
        duration: 2000,
        itemsExtracted: 10,
        cached: false,
        success: true,
      })

      const scrapes = monitor.getScrapeMetrics()
      expect(scrapes.length).toBe(1)
      expect(scrapes[0].itemsExtracted).toBe(10)
    })

    it('should track scrape success rate', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordScrape({
        url: 'https://example.com/1',
        duration: 1000,
        itemsExtracted: 10,
        cached: false,
        success: true,
      })

      monitor.recordScrape({
        url: 'https://example.com/2',
        duration: 1000,
        itemsExtracted: 0,
        cached: false,
        success: false,
        error: new Error('Parse error'),
      })

      const scrapes = monitor.getScrapeMetrics()
      const successful = scrapes.filter(s => s.success).length
      const failed = scrapes.filter(s => !s.success).length

      expect(successful).toBe(1)
      expect(failed).toBe(1)
    })

    it('should track items extracted', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordScrape({
        url: 'https://example.com/1',
        duration: 1000,
        itemsExtracted: 10,
        cached: false,
        success: true,
      })

      monitor.recordScrape({
        url: 'https://example.com/2',
        duration: 1000,
        itemsExtracted: 25,
        cached: false,
        success: true,
      })

      const scrapes = monitor.getScrapeMetrics()
      const totalItems = scrapes.reduce((sum, s) => sum + (s.itemsExtracted || 0), 0)

      expect(totalItems).toBe(35)
    })
  })

  describe('Statistics', () => {
    it('should calculate summary statistics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 5000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 2000,
        size: 3000,
        cached: true,
      })

      const summary = monitor.getSummary()

      expect(summary.totalRequests).toBe(2)
      expect(summary.successfulRequests).toBe(2)
      expect(summary.failedRequests).toBe(0)
      expect(summary.averageDuration).toBe(1500)
      expect(summary.cacheHitRate).toBe(0.5)
      expect(summary.errorRate).toBe(0)
      expect(summary.totalSize).toBe(8000)
      expect(summary.averageSize).toBe(4000)
    })

    it('should calculate percentiles', () => {
      const monitor = new PerformanceMonitor()

      // Add requests with varying durations
      const durations = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

      for (const duration of durations) {
        monitor.recordRequest({
          url: 'https://example.com',
          method: 'GET',
          statusCode: 200,
          duration,
          size: 1000,
          cached: false,
        })
      }

      const summary = monitor.getSummary()

      expect(summary.p50Duration).toBeGreaterThanOrEqual(400)
      expect(summary.p50Duration).toBeLessThanOrEqual(600)
      expect(summary.p95Duration).toBeGreaterThanOrEqual(900)
      expect(summary.p99Duration).toBeGreaterThanOrEqual(900)
    })

    it('should calculate min and max durations', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        size: 1000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 1000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 500,
        size: 1000,
        cached: false,
      })

      const summary = monitor.getSummary()

      expect(summary.minDuration).toBe(100)
      expect(summary.maxDuration).toBe(1000)
    })

    it('should handle empty metrics', () => {
      const monitor = new PerformanceMonitor()
      const summary = monitor.getSummary()

      expect(summary.totalRequests).toBe(0)
      expect(summary.averageDuration).toBe(0)
      expect(summary.cacheHitRate).toBe(0)
      expect(summary.errorRate).toBe(0)
    })
  })

  describe('Metric Filtering', () => {
    it('should get metrics by name', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordMetric({
        name: 'fetch-time',
        value: 100,
        unit: 'ms',
        timestamp: new Date(),
      })

      monitor.recordMetric({
        name: 'parse-time',
        value: 50,
        unit: 'ms',
        timestamp: new Date(),
      })

      monitor.recordMetric({
        name: 'fetch-time',
        value: 200,
        unit: 'ms',
        timestamp: new Date(),
      })

      const fetchMetrics = monitor.getMetricsByName('fetch-time')
      expect(fetchMetrics.length).toBe(2)
      expect(fetchMetrics[0].value).toBe(100)
      expect(fetchMetrics[1].value).toBe(200)
    })

    it('should calculate percentiles for specific metrics', () => {
      const monitor = new PerformanceMonitor()

      for (let i = 1; i <= 100; i++) {
        monitor.recordMetric({
          name: 'test-metric',
          value: i,
          unit: 'ms',
          timestamp: new Date(),
        })
      }

      const p50 = monitor.percentile('test-metric', 50)
      const p95 = monitor.percentile('test-metric', 95)
      const p99 = monitor.percentile('test-metric', 99)

      expect(p50).toBeGreaterThanOrEqual(45)
      expect(p50).toBeLessThanOrEqual(55)
      expect(p95).toBeGreaterThanOrEqual(90)
      expect(p99).toBeGreaterThanOrEqual(95)
    })

    it('should calculate average for specific metrics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordMetric({ name: 'test', value: 100, unit: 'ms', timestamp: new Date() })
      monitor.recordMetric({ name: 'test', value: 200, unit: 'ms', timestamp: new Date() })
      monitor.recordMetric({ name: 'test', value: 300, unit: 'ms', timestamp: new Date() })

      const avg = monitor.average('test')
      expect(avg).toBe(200)
    })

    it('should calculate min for specific metrics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordMetric({ name: 'test', value: 300, unit: 'ms', timestamp: new Date() })
      monitor.recordMetric({ name: 'test', value: 100, unit: 'ms', timestamp: new Date() })
      monitor.recordMetric({ name: 'test', value: 200, unit: 'ms', timestamp: new Date() })

      const min = monitor.min('test')
      expect(min).toBe(100)
    })

    it('should calculate max for specific metrics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordMetric({ name: 'test', value: 100, unit: 'ms', timestamp: new Date() })
      monitor.recordMetric({ name: 'test', value: 300, unit: 'ms', timestamp: new Date() })
      monitor.recordMetric({ name: 'test', value: 200, unit: 'ms', timestamp: new Date() })

      const max = monitor.max('test')
      expect(max).toBe(300)
    })

    it('should return 0 for non-existent metrics', () => {
      const monitor = new PerformanceMonitor()

      expect(monitor.average('non-existent')).toBe(0)
      expect(monitor.min('non-existent')).toBe(0)
      expect(monitor.max('non-existent')).toBe(0)
      expect(monitor.percentile('non-existent', 50)).toBe(0)
    })
  })

  describe('Reset', () => {
    it('should reset all metrics', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 5000,
        cached: false,
      })

      monitor.recordScrape({
        url: 'https://example.com',
        duration: 2000,
        itemsExtracted: 10,
        cached: false,
        success: true,
      })

      monitor.recordMetric({
        name: 'test',
        value: 100,
        unit: 'ms',
        timestamp: new Date(),
      })

      monitor.clear()

      expect(monitor.getMetrics().length).toBe(0)
      expect(monitor.getRequestMetrics().length).toBe(0)
      expect(monitor.getScrapeMetrics().length).toBe(0)
    })
  })

  describe('Export and Save', () => {
    it('should export metrics to JSON', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 5000,
        cached: false,
      })

      const exported = JSON.parse(monitor.export())

      expect(exported.summary.totalRequests).toBe(1)
      expect(exported.requestMetrics.length).toBe(1)
    })

    it('should save metrics to file', async () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 5000,
        cached: false,
      })

      const tmpPath = `/tmp/test-metrics-${Date.now()}.json`
      await monitor.save(tmpPath)

      const content = await Bun.file(tmpPath).text()
      const parsed = JSON.parse(content)

      expect(parsed.summary.totalRequests).toBe(1)

      // Cleanup
      await Bun.write(tmpPath, '')
    })
  })
})

describe('Utility Functions', () => {
  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500.00ms')
    })

    it('should format seconds', () => {
      expect(formatDuration(1500)).toBe('1.50s')
      expect(formatDuration(2000)).toBe('2.00s')
    })

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1m 0s')
      expect(formatDuration(90000)).toBe('1m 30s')
    })

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('60m 0s')
      expect(formatDuration(5400000)).toBe('90m 0s')
    })

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0.00ms')
    })

    it('should handle very large values', () => {
      expect(formatDuration(7200000)).toBe('120m 0s')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500.00 B')
    })

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.00 KB')
      expect(formatBytes(1536)).toBe('1.50 KB')
    })

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.00 MB')
      expect(formatBytes(1572864)).toBe('1.50 MB')
    })

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.00 GB')
      expect(formatBytes(1610612736)).toBe('1.50 GB')
    })

    it('should handle zero', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('should handle very large values', () => {
      expect(formatBytes(2147483648)).toBe('2.00 GB')
    })
  })

  describe('createReport', () => {
    it('should create formatted report', () => {
      const monitor = new PerformanceMonitor()

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1234,
        size: 50000,
        cached: false,
      })

      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 5,
        size: 50000,
        cached: true,
      })

      const report = createReport(monitor)

      expect(report).toContain('Performance Report')
      expect(report).toContain('Total Requests')
      expect(report).toContain('Cache Hit Rate')
      expect(report).toContain('Average Duration')
      expect(report).toContain('Total Size')
    })

    it('should handle empty monitor', () => {
      const monitor = new PerformanceMonitor()
      const report = createReport(monitor)

      expect(report).toContain('Performance Report')
      expect(report).toContain('Total Requests: 0')
    })

    it('should include percentiles in report', () => {
      const monitor = new PerformanceMonitor()

      for (let i = 1; i <= 100; i++) {
        monitor.recordRequest({
          url: 'https://example.com',
          method: 'GET',
          statusCode: 200,
          duration: i * 10,
          size: 1000,
          cached: false,
        })
      }

      const report = createReport(monitor)

      expect(report).toContain('P50')
      expect(report).toContain('P95')
      expect(report).toContain('P99')
    })
  })
})

describe('Real-World Scenarios', () => {
  it('should track complete scraping session', () => {
    const monitor = new PerformanceMonitor()

    // Simulate scraping multiple pages
    for (let i = 1; i <= 10; i++) {
      monitor.recordRequest({
        url: `https://example.com/page/${i}`,
        method: 'GET',
        statusCode: 200,
        duration: 1000 + Math.random() * 500,
        size: 50000 + Math.random() * 10000,
        cached: i % 3 === 0, // Every 3rd request is cached
      })

      monitor.recordScrape({
        url: `https://example.com/page/${i}`,
        totalDuration: 2000 + Math.random() * 1000,
        fetchDuration: 1000,
        parseDuration: 500,
        extractionDuration: 500,
        itemsExtracted: 10 + Math.floor(Math.random() * 5),
        bytesDownloaded: 50000 + Math.random() * 10000,
        cached: i % 3 === 0,
        retries: 0,
        timestamp: new Date(),
        error: i % 10 === 0 ? 'Error' : undefined,
      })
    }

    const summary = monitor.getSummary()

    // recordScrape also creates request metrics, so we get 20 total (10 recordRequest + 10 recordScrape)
    expect(summary.totalRequests).toBe(20)
    expect(summary.cacheHitRate).toBeGreaterThan(0)
    expect(summary.cacheHitRate).toBeLessThan(1)
    expect(summary.averageDuration).toBeGreaterThan(1000)
    expect(summary.totalSize).toBeGreaterThan(500000)
  })

  it('should track performance degradation', () => {
    const monitor = new PerformanceMonitor()

    // Simulate increasing response times
    for (let i = 1; i <= 10; i++) {
      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: i * 100, // Increasing duration
        size: 5000,
        cached: false,
      })
    }

    const summary = monitor.getSummary()

    expect(summary.minDuration).toBe(100)
    expect(summary.maxDuration).toBe(1000)
    expect(summary.averageDuration).toBe(550) // Average of 100-1000
  })

  it('should track error spikes', () => {
    const monitor = new PerformanceMonitor()

    // Normal requests
    for (let i = 1; i <= 8; i++) {
      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 5000,
        cached: false,
      })
    }

    // Error spike
    for (let i = 1; i <= 2; i++) {
      monitor.recordRequest({
        url: 'https://example.com',
        method: 'GET',
        statusCode: 500,
        duration: 1000,
        size: 0,
        cached: false,
        error: new Error('Server error'),
      })
    }

    const summary = monitor.getSummary()

    expect(summary.totalRequests).toBe(10)
    expect(summary.successfulRequests).toBe(8)
    expect(summary.failedRequests).toBe(2)
    expect(summary.errorRate).toBe(0.2) // 20% error rate
  })

  it('should track cache effectiveness', () => {
    const monitor = new PerformanceMonitor()

    // Simulate repeated scraping with cache
    const urls = [
      'https://example.com/page/1',
      'https://example.com/page/2',
      'https://example.com/page/3',
    ]

    // First pass - all cache misses
    for (const url of urls) {
      monitor.recordRequest({
        url,
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 50000,
        cached: false,
      })
    }

    // Second pass - all cache hits
    for (const url of urls) {
      monitor.recordRequest({
        url,
        method: 'GET',
        statusCode: 200,
        duration: 5,
        size: 50000,
        cached: true,
      })
    }

    const summary = monitor.getSummary()

    expect(summary.totalRequests).toBe(6)
    expect(summary.cacheHitRate).toBe(0.5) // 50% hit rate
  })

  it('should track parallel scraping', () => {
    const monitor = new PerformanceMonitor()

    // Simulate concurrent requests
    const _startTime = Date.now()

    for (let i = 1; i <= 5; i++) {
      monitor.recordRequest({
        url: `https://example.com/page/${i}`,
        method: 'GET',
        statusCode: 200,
        duration: 1000,
        size: 50000,
        cached: false,
      })
    }

    const summary = monitor.getSummary()

    expect(summary.totalRequests).toBe(5)
    expect(summary.averageDuration).toBe(1000)
  })
})

describe('Edge Cases', () => {
  it('should handle very fast requests', () => {
    const monitor = new PerformanceMonitor()

    monitor.recordRequest({
      url: 'https://example.com',
      method: 'GET',
      statusCode: 200,
      duration: 0.5,
      size: 100,
      cached: true,
    })

    const summary = monitor.getSummary()

    expect(summary.averageDuration).toBe(0.5)
    expect(summary.minDuration).toBe(0.5)
  })

  it('should handle very slow requests', () => {
    const monitor = new PerformanceMonitor()

    monitor.recordRequest({
      url: 'https://example.com',
      method: 'GET',
      statusCode: 200,
      duration: 60000, // 1 minute
      size: 100000,
      cached: false,
    })

    const summary = monitor.getSummary()

    expect(summary.averageDuration).toBe(60000)
    expect(summary.maxDuration).toBe(60000)
  })

  it('should handle very large response sizes', () => {
    const monitor = new PerformanceMonitor()

    monitor.recordRequest({
      url: 'https://example.com',
      method: 'GET',
      statusCode: 200,
      duration: 5000,
      size: 100000000, // 100MB
      cached: false,
    })

    const summary = monitor.getSummary()

    expect(summary.totalSize).toBe(100000000)
    expect(summary.averageSize).toBe(100000000)
  })

  it('should handle zero-size responses', () => {
    const monitor = new PerformanceMonitor()

    monitor.recordRequest({
      url: 'https://example.com',
      method: 'GET',
      statusCode: 204, // No Content
      duration: 100,
      size: 0,
      cached: false,
    })

    const summary = monitor.getSummary()

    expect(summary.totalSize).toBe(0)
    expect(summary.averageSize).toBe(0)
  })

  it('should handle many concurrent metrics', () => {
    const monitor = new PerformanceMonitor()

    // Record 1000 metrics
    for (let i = 1; i <= 1000; i++) {
      monitor.recordRequest({
        url: `https://example.com/page/${i}`,
        method: 'GET',
        statusCode: 200,
        duration: Math.random() * 1000,
        size: Math.random() * 100000,
        cached: Math.random() > 0.5,
      })
    }

    const summary = monitor.getSummary()

    expect(summary.totalRequests).toBe(1000)
    expect(summary.averageDuration).toBeGreaterThan(0)
    expect(summary.cacheHitRate).toBeGreaterThan(0)
    expect(summary.cacheHitRate).toBeLessThan(1)
  })
})
