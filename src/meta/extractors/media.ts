/**
 * Media extraction utilities (favicons, logos, feeds)
 */

import type { StructuredDataResult } from '../types'
import { resolveUrl } from '../utils/url'

/**
 * Extract favicon URL from HTML
 */
export function extractFavicon(html: string, baseUrl?: string): string | undefined {
  // Try various favicon link tags
  const faviconPatterns = [
    /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["'][^>]*>/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["'][^>]*>/i,
  ]

  for (const pattern of faviconPatterns) {
    const match = html.match(pattern)
    if (match) {
      const href = match[1]
      if (baseUrl && !href.startsWith('http')) {
        try {
          return new URL(href, baseUrl).href
        }
        catch {
          return href
        }
      }
      return href
    }
  }

  // Fallback to /favicon.ico
  if (baseUrl) {
    try {
      const url = new URL(baseUrl)
      return `${url.protocol}//${url.host}/favicon.ico`
    }
    catch {
      // Invalid URL
    }
  }

  return undefined
}

/**
 * Extract site logo (separate from favicon)
 */
export function extractLogo(html: string, baseUrl?: string, structuredData?: StructuredDataResult): string | undefined {
  // Try JSON-LD first
  if (structuredData?.jsonLd) {
    for (const data of structuredData.jsonLd) {
      if ((data['@type'] === 'Organization' || data['@type'] === 'WebSite') && data.logo) {
        const logo = typeof data.logo === 'string' ? data.logo : data.logo.url
        return baseUrl ? resolveUrl(logo, baseUrl) : logo
      }
    }
  }

  // Try Open Graph image as fallback (often used for logos)
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  if (ogImageMatch && baseUrl) {
    return resolveUrl(ogImageMatch[1], baseUrl)
  }

  return undefined
}

/**
 * Extract RSS/Atom feed URLs
 */
export function extractFeeds(html: string, baseUrl?: string): string[] {
  const feeds: string[] = []

  const feedRegex = /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["'][^>]*>/gi
  let match = feedRegex.exec(html)
  while (match !== null) {
    let feedUrl = match[1]
    if (baseUrl && !feedUrl.startsWith('http')) {
      feedUrl = resolveUrl(feedUrl, baseUrl)
    }
    feeds.push(feedUrl)
    match = feedRegex.exec(html)
  }

  // Also check reverse order
  const feedReverseRegex = /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]*>/gi
  let reverseMatch = feedReverseRegex.exec(html)
  while (reverseMatch !== null) {
    let feedUrl = reverseMatch[1]
    if (baseUrl && !feedUrl.startsWith('http')) {
      feedUrl = resolveUrl(feedUrl, baseUrl)
    }
    if (!feeds.includes(feedUrl)) {
      feeds.push(feedUrl)
    }
    reverseMatch = feedReverseRegex.exec(html)
  }

  return feeds
}
