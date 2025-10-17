/**
 * Performance metrics extraction from HTML
 */

export interface PerformanceMetrics {
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

/**
 * Extract performance-related metrics from HTML
 */
export function extractPerformanceMetrics(html: string): PerformanceMetrics {
  const warnings: string[] = []
  let score = 100

  // Count resources
  const scripts = (html.match(/<script[^>]*src=/gi) || []).length
  const inlineScripts = (html.match(/<script(?![^>]*src=)[^>]*>/gi) || []).length
  const stylesheets = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length
  const inlineStyles = (html.match(/<style/gi) || []).length
  const images = (html.match(/<img[^>]*src=/gi) || []).length
  const fonts = (html.match(/@font-face/gi) || []).length
  const videos = (html.match(/<video/gi) || []).length
  const iframes = (html.match(/<iframe/gi) || []).length

  const resources = {
    scripts: scripts + inlineScripts,
    stylesheets: stylesheets + inlineStyles,
    images,
    fonts,
    videos,
    iframes,
  }

  // Check for excessive resources
  if (scripts > 20) {
    warnings.push(`High number of external scripts (${scripts})`)
    score -= 10
  }
  if (stylesheets > 10) {
    warnings.push(`High number of stylesheets (${stylesheets})`)
    score -= 5
  }
  if (images > 50) {
    warnings.push(`High number of images (${images})`)
    score -= 10
  }

  // Extract external domains
  const urlRegex = /(?:src|href)=["'](https?:\/\/[^"']+)["']/gi
  const urls = [...html.matchAll(urlRegex)].map(m => m[1])
  const domains = new Set<string>()

  for (const url of urls) {
    try {
      const domain = new URL(url).hostname
      domains.add(domain)
    }
    catch {
      // Invalid URL
    }
  }

  const externalResources = {
    count: urls.length,
    domains: Array.from(domains),
  }

  if (domains.size > 10) {
    warnings.push(`Resources loaded from ${domains.size} different domains`)
    score -= 10
  }

  // Estimate sizes
  const htmlSize = Math.round(html.length / 1024) // KB

  const estimates = {
    htmlSize,
    potentialScriptSize: scripts * 50, // Rough estimate: 50KB per script
    potentialStyleSize: stylesheets * 20, // Rough estimate: 20KB per stylesheet
  }

  if (htmlSize > 500) {
    warnings.push(`Large HTML document (${htmlSize} KB)`)
    score -= 10
  }

  // Check performance hints
  const hints = {
    hasLazyLoading: /loading=["']lazy["']/.test(html),
    hasPreload: /<link[^>]*rel=["']preload["']/.test(html),
    hasPrefetch: /<link[^>]*rel=["']prefetch["']/.test(html),
    hasDNSPrefetch: /<link[^>]*rel=["']dns-prefetch["']/.test(html),
    hasAsyncScripts: /<script[^>]*async/.test(html),
    hasDeferScripts: /<script[^>]*defer/.test(html),
  }

  // Recommendations
  if (!hints.hasLazyLoading && images > 10) {
    warnings.push('Consider using lazy loading for images')
    score -= 5
  }

  if (!hints.hasAsyncScripts && !hints.hasDeferScripts && scripts > 5) {
    warnings.push('Consider using async or defer for scripts')
    score -= 10
  }

  if (!hints.hasDNSPrefetch && domains.size > 5) {
    warnings.push('Consider using DNS prefetching for external domains')
    score -= 5
  }

  // Check for render-blocking resources
  const syncScriptsInHead = html.match(/<head[^>]*>[\s\S]*?<script(?![^>]*(async|defer))[^>]*src=/gi)
  if (syncScriptsInHead && syncScriptsInHead.length > 0) {
    warnings.push('Render-blocking scripts found in <head>')
    score -= 15
  }

  return {
    resources,
    externalResources,
    estimates,
    hints,
    warnings,
    score: Math.max(0, score),
  }
}
