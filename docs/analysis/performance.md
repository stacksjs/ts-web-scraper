# Performance Analysis

Analyze web page performance metrics including resource usage, external dependencies, and optimization opportunities.

## Overview

The performance analyzer provides comprehensive insights into page load performance by examining resource counts, external dependencies, size estimates, and optimization hints. It generates actionable recommendations to improve page speed and user experience.

## Basic Usage

```typescript
import { extractPerformanceMetrics } from 'ts-web-scraper'

const html = await fetch('https://example.com').then(r => r.text())
const metrics = extractPerformanceMetrics(html)

console.log(`Performance Score: ${metrics.score}/100`)
console.log(`Scripts: ${metrics.resources.scripts}`)
console.log(`Images: ${metrics.resources.images}`)
console.log(`External Domains: ${metrics.externalResources.domains.length}`)
```

## Performance Metrics

### Resource Counts

Track all resource types on the page:

```typescript
console.log('Resources:')
console.log(`  Scripts: ${metrics.resources.scripts}`)
console.log(`  Stylesheets: ${metrics.resources.stylesheets}`)
console.log(`  Images: ${metrics.resources.images}`)
console.log(`  Fonts: ${metrics.resources.fonts}`)
console.log(`  Videos: ${metrics.resources.videos}`)
console.log(`  Iframes: ${metrics.resources.iframes}`)
```

The analyzer counts both external resources (loaded via `src` or `href`) and inline resources (e.g., `<script>` without src, `<style>` tags).

### External Resources

Understand third-party dependencies:

```typescript
const { externalResources } = metrics

console.log(`External Resources: ${externalResources.count}`)
console.log(`Unique Domains: ${externalResources.domains.length}`)
console.log('\nDomains:')
externalResources.domains.forEach((domain) => {
  console.log(`  - ${domain}`)
})
```

This helps identify:

- Third-party scripts that may slow down your page
- CDN usage
- External tracking and analytics services
- Potential privacy concerns

### Size Estimates

Get rough estimates of page weight:

```typescript
const { estimates } = metrics

console.log('Size Estimates:')
console.log(`  HTML: ${estimates.htmlSize} KB`)
console.log(`  Potential Scripts: ${estimates.potentialScriptSize} KB`)
console.log(`  Potential Styles: ${estimates.potentialStyleSize} KB`)
console.log(`  Total Estimate: ${
  estimates.htmlSize
  + estimates.potentialScriptSize
  + estimates.potentialStyleSize
} KB`)
```

Note: These are rough estimates based on:

- HTML: Actual document size
- Scripts: 50 KB per external script (average)
- Styles: 20 KB per stylesheet (average)

For accurate measurements, use browser developer tools or real user monitoring.

### Performance Hints

Check for modern optimization techniques:

```typescript
const { hints } = metrics

console.log('Performance Optimizations:')
console.log(`  Lazy Loading: ${hints.hasLazyLoading ? '✓' : '✗'}`)
console.log(`  Resource Preload: ${hints.hasPreload ? '✓' : '✗'}`)
console.log(`  Resource Prefetch: ${hints.hasPrefetch ? '✓' : '✗'}`)
console.log(`  DNS Prefetch: ${hints.hasDNSPrefetch ? '✓' : '✗'}`)
console.log(`  Async Scripts: ${hints.hasAsyncScripts ? '✓' : '✗'}`)
console.log(`  Defer Scripts: ${hints.hasDeferScripts ? '✓' : '✗'}`)
```

Optimization techniques detected:

- **Lazy Loading**: Images with `loading="lazy"` attribute
- **Preload**: Critical resources loaded early via `<link rel="preload">`
- **Prefetch**: Future resources hinted via `<link rel="prefetch">`
- **DNS Prefetch**: Early DNS resolution via `<link rel="dns-prefetch">`
- **Async Scripts**: Scripts with `async` attribute (download in parallel)
- **Defer Scripts**: Scripts with `defer` attribute (execute after parsing)

### Performance Score

The analyzer calculates a score from 0-100 based on:

```typescript
console.log(`Performance Score: ${metrics.score}/100`)

if (metrics.score >= 90) {
  console.log('Excellent performance!')
}
else if (metrics.score >= 70) {
  console.log('Good performance with minor issues')
}
else if (metrics.score >= 50) {
  console.log('Moderate performance, needs optimization')
}
else {
  console.log('Poor performance, significant issues found')
}
```

Score deductions:

- -10: Excessive scripts (>20)
- -5: Too many stylesheets (>10)
- -10: Too many images (>50)
- -10: Resources from too many domains (>10)
- -10: Large HTML document (>500 KB)
- -5: No lazy loading with many images
- -10: No async/defer scripts
- -5: No DNS prefetch with many external domains
- -15: Render-blocking scripts in `<head>`

### Warnings

Review specific performance issues:

```typescript
if (metrics.warnings.length > 0) {
  console.log('\nPerformance Warnings:')
  metrics.warnings.forEach((warning) => {
    console.log(`  ⚠️  ${warning}`)
  })
}

// Example output:
// ⚠️  High number of external scripts (25)
// ⚠️  Resources loaded from 15 different domains
// ⚠️  Consider using lazy loading for images
// ⚠️  Consider using async or defer for scripts
// ⚠️  Render-blocking scripts found in <head>
```

## Advanced Usage

### Performance Report Generator

Create detailed performance reports:

```typescript
import { extractPerformanceMetrics } from 'ts-web-scraper'

interface PerformanceReport {
  url: string
  timestamp: string
  score: number
  resources: {
    total: number
    breakdown: Record<string, number>
  }
  externalDependencies: {
    domainCount: number
    topDomains: string[]
  }
  optimizations: {
    implemented: string[]
    missing: string[]
  }
  recommendations: string[]
}

function generatePerformanceReport(html: string, url: string): PerformanceReport {
  const metrics = extractPerformanceMetrics(html)

  const totalResources = Object.values(metrics.resources).reduce((a, b) => a + b, 0)

  const implemented: string[] = []
  const missing: string[] = []

  if (metrics.hints.hasLazyLoading)
    implemented.push('Image lazy loading')
  else missing.push('Image lazy loading')

  if (metrics.hints.hasAsyncScripts || metrics.hints.hasDeferScripts) {
    implemented.push('Async/defer scripts')
  }
  else {
    missing.push('Async/defer scripts')
  }

  if (metrics.hints.hasPreload)
    implemented.push('Resource preloading')
  else missing.push('Resource preloading')

  if (metrics.hints.hasDNSPrefetch)
    implemented.push('DNS prefetching')
  else missing.push('DNS prefetching')

  return {
    url,
    timestamp: new Date().toISOString(),
    score: metrics.score,
    resources: {
      total: totalResources,
      breakdown: metrics.resources,
    },
    externalDependencies: {
      domainCount: metrics.externalResources.domains.length,
      topDomains: metrics.externalResources.domains.slice(0, 5),
    },
    optimizations: {
      implemented,
      missing,
    },
    recommendations: metrics.warnings,
  }
}

const report = generatePerformanceReport(html, 'https://example.com')
console.log(JSON.stringify(report, null, 2))
```

### Comparative Analysis

Compare performance across multiple pages:

```typescript
async function comparePagePerformance(urls: string[]) {
  const results = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const metrics = extractPerformanceMetrics(html)

    results.push({
      url,
      score: metrics.score,
      scripts: metrics.resources.scripts,
      images: metrics.resources.images,
      domains: metrics.externalResources.domains.length,
      htmlSize: metrics.estimates.htmlSize,
    })
  }

  // Sort by score (best first)
  results.sort((a, b) => b.score - a.score)

  console.log('Performance Comparison:')
  console.log('Rank | Score | Scripts | Images | Domains | HTML KB | URL')
  console.log('-'.repeat(80))

  results.forEach((r, i) => {
    console.log(
      `${i + 1}. | ${r.score} | ${r.scripts} | ${r.images} | ${r.domains} | ${r.htmlSize} | ${r.url}`
    )
  })

  return results
}

await comparePagePerformance([
  'https://example.com',
  'https://example.com/blog',
  'https://example.com/products',
])
```

### Performance Monitoring

Track performance over time:

```typescript
interface PerformanceHistory {
  url: string
  measurements: Array<{
    timestamp: string
    score: number
    metrics: ReturnType<typeof extractPerformanceMetrics>
  }>
}

class PerformanceMonitor {
  private history: Map<string, PerformanceHistory> = new Map()

  async measure(url: string) {
    const html = await fetch(url).then(r => r.text())
    const metrics = extractPerformanceMetrics(html)

    if (!this.history.has(url)) {
      this.history.set(url, { url, measurements: [] })
    }

    this.history.get(url)!.measurements.push({
      timestamp: new Date().toISOString(),
      score: metrics.score,
      metrics,
    })

    return metrics
  }

  getTrend(url: string): 'improving' | 'declining' | 'stable' | 'unknown' {
    const history = this.history.get(url)
    if (!history || history.measurements.length < 2)
      return 'unknown'

    const recent = history.measurements.slice(-5)
    const scores = recent.map(m => m.score)

    const trend = scores[scores.length - 1] - scores[0]

    if (trend > 5)
      return 'improving'
    if (trend < -5)
      return 'declining'
    return 'stable'
  }

  getReport(url: string) {
    const history = this.history.get(url)
    if (!history)
      return null

    const scores = history.measurements.map(m => m.score)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const trend = this.getTrend(url)

    return {
      url,
      measurementCount: history.measurements.length,
      currentScore: scores[scores.length - 1],
      averageScore: Math.round(avgScore),
      trend,
      firstMeasurement: history.measurements[0].timestamp,
      lastMeasurement: history.measurements[history.measurements.length - 1].timestamp,
    }
  }
}

// Usage
const monitor = new PerformanceMonitor()
await monitor.measure('https://example.com')

// Measure periodically
setInterval(async () => {
  await monitor.measure('https://example.com')
  const report = monitor.getReport('https://example.com')
  console.log(`Performance ${report?.trend}: ${report?.currentScore}/100`)
}, 3600000) // Every hour
```

## Real-World Use Cases

### 1. Website Performance Audit

```typescript
async function auditWebsitePerformance(url: string) {
  const html = await fetch(url).then(r => r.text())
  const metrics = extractPerformanceMetrics(html)

  console.log(`\n=== Performance Audit: ${url} ===\n`)
  console.log(`Overall Score: ${metrics.score}/100\n`)

  // Critical issues (score impact > 10)
  const critical = metrics.warnings.filter(w =>
    w.includes('Render-blocking')
    || w.includes('High number')
  )

  if (critical.length > 0) {
    console.log('CRITICAL ISSUES:')
    critical.forEach(issue => console.log(`  🔴 ${issue}`))
    console.log()
  }

  // Recommendations
  const recommendations: string[] = []

  if (!metrics.hints.hasAsyncScripts && !metrics.hints.hasDeferScripts) {
    recommendations.push('Add async or defer attributes to script tags')
  }

  if (!metrics.hints.hasLazyLoading && metrics.resources.images > 10) {
    recommendations.push('Implement lazy loading for images')
  }

  if (metrics.externalResources.domains.length > 10) {
    recommendations.push('Reduce number of third-party domains')
    recommendations.push('Consider self-hosting critical resources')
  }

  if (metrics.resources.scripts > 20) {
    recommendations.push('Bundle and minify JavaScript files')
    recommendations.push('Remove unused scripts')
  }

  if (recommendations.length > 0) {
    console.log('RECOMMENDATIONS:')
    recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`)
    })
  }
}

await auditWebsitePerformance('https://example.com')
```

### 2. Competitor Performance Benchmarking

```typescript
async function benchmarkCompetitors(competitors: string[]) {
  console.log('Competitor Performance Benchmark\n')

  const results = []

  for (const url of competitors) {
    const html = await fetch(url).then(r => r.text())
    const metrics = extractPerformanceMetrics(html)

    results.push({
      url,
      score: metrics.score,
      resources: metrics.resources,
      externalDomains: metrics.externalResources.domains.length,
      htmlSize: metrics.estimates.htmlSize,
      hasModernOptimizations:
        metrics.hints.hasLazyLoading
        && (metrics.hints.hasAsyncScripts || metrics.hints.hasDeferScripts),
    })
  }

  // Find best performer
  const best = results.reduce((a, b) => a.score > b.score ? a : b)

  console.log('Performance Leaders:')
  results
    .sort((a, b) => b.score - a.score)
    .forEach((r, i) => {
      const badge = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '
      console.log(`${badge} ${r.score}/100 - ${r.url}`)
    })

  return { results, best }
}

const benchmark = await benchmarkCompetitors([
  'https://competitor1.com',
  'https://competitor2.com',
  'https://competitor3.com',
])
```

### 3. Performance Budget Enforcement

```typescript
interface PerformanceBudget {
  maxScripts: number
  maxImages: number
  maxExternalDomains: number
  maxHtmlSize: number // KB
  minScore: number
}

function enforcePerformanceBudget(
  metrics: ReturnType<typeof extractPerformanceMetrics>,
  budget: PerformanceBudget
): { passed: boolean, violations: string[] } {
  const violations: string[] = []

  if (metrics.resources.scripts > budget.maxScripts) {
    violations.push(
      `Too many scripts: ${metrics.resources.scripts} (max: ${budget.maxScripts})`
    )
  }

  if (metrics.resources.images > budget.maxImages) {
    violations.push(
      `Too many images: ${metrics.resources.images} (max: ${budget.maxImages})`
    )
  }

  if (metrics.externalResources.domains.length > budget.maxExternalDomains) {
    violations.push(
      `Too many external domains: ${metrics.externalResources.domains.length} (max: ${budget.maxExternalDomains})`
    )
  }

  if (metrics.estimates.htmlSize > budget.maxHtmlSize) {
    violations.push(
      `HTML too large: ${metrics.estimates.htmlSize} KB (max: ${budget.maxHtmlSize} KB)`
    )
  }

  if (metrics.score < budget.minScore) {
    violations.push(
      `Score too low: ${metrics.score} (min: ${budget.minScore})`
    )
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}

// In CI/CD pipeline
const html = await fetch(process.env.PREVIEW_URL!).then(r => r.text())
const metrics = extractPerformanceMetrics(html)

const result = enforcePerformanceBudget(metrics, {
  maxScripts: 15,
  maxImages: 30,
  maxExternalDomains: 5,
  maxHtmlSize: 200,
  minScore: 80,
})

if (!result.passed) {
  console.error('Performance budget violations:')
  result.violations.forEach(v => console.error(`  - ${v}`))
  process.exit(1)
}
```

## Best Practices

1. **Set Performance Budgets**: Define limits for resources and enforce them in CI/CD
2. **Monitor Regularly**: Track performance over time to catch regressions early
3. **Prioritize Render-Blocking**: Fix render-blocking resources first for biggest impact
4. **Optimize Images**: Use lazy loading and modern formats (WebP, AVIF)
5. **Reduce Third-Party Scripts**: Each external domain adds DNS lookup overhead
6. **Bundle Assets**: Combine scripts and styles to reduce HTTP requests
7. **Use CDNs**: Serve static assets from geographically distributed servers
8. **Enable Compression**: Use gzip or brotli for text-based resources

## Limitations

- Size estimates are rough approximations (actual sizes vary widely)
- Cannot measure actual load time or render performance (use browser tools for that)
- Does not analyze JavaScript execution time or memory usage
- Cannot detect optimization opportunities in CSS or JavaScript code
- Does not measure mobile-specific performance issues

For comprehensive performance testing, combine this tool with:

- Lighthouse or PageSpeed Insights
- WebPageTest
- Real User Monitoring (RUM)
- Browser DevTools Network and Performance tabs

## TypeScript Types

```typescript
interface PerformanceMetrics {
  /**
   * Resource counts
   */
  resources: {
    scripts: number
    stylesheets: number
    images: number
    fonts: number
    videos: number
    iframes: number
  }

  /**
   * External resources
   */
  externalResources: {
    count: number
    domains: string[]
  }

  /**
   * Page size estimates (KB)
   */
  estimates: {
    htmlSize: number
    potentialScriptSize: number
    potentialStyleSize: number
  }

  /**
   * Performance hints
   */
  hints: {
    hasLazyLoading: boolean
    hasPreload: boolean
    hasPrefetch: boolean
    hasDNSPrefetch: boolean
    hasAsyncScripts: boolean
    hasDeferScripts: boolean
  }

  /**
   * Performance warnings
   */
  warnings: string[]

  /**
   * Performance score (0-100)
   */
  score: number
}
```
