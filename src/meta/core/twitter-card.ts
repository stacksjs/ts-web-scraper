/**
 * Twitter Card metadata extraction
 */

import type { TwitterCard } from '../types'
import { toCamelCase } from '../utils/url'

/**
 * Extract Twitter Card metadata from HTML
 */
export function extractTwitterCard(html: string): TwitterCard {
  const twitter: any = {}

  // Match both name and property attributes for maximum compatibility
  const twitterRegex = /<meta[^>]+(?:name|property)=["']twitter:([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi
  const twitterReverseRegex = /<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']twitter:([^"']+)["'][^>]*>/gi

  // Process regular order
  let match = twitterRegex.exec(html)
  while (match !== null) {
    const [, name, content] = match
    if (content) {
      const prop = toCamelCase(name)
      twitter[prop] = prop.includes('Width') || prop.includes('Height')
        ? Number.parseInt(content, 10)
        : content
    }
    match = twitterRegex.exec(html)
  }

  // Process reverse order
  let reverseMatch = twitterReverseRegex.exec(html)
  while (reverseMatch !== null) {
    const [, content, name] = reverseMatch
    if (content && !twitter[toCamelCase(name)]) {
      const prop = toCamelCase(name)
      twitter[prop] = prop.includes('Width') || prop.includes('Height')
        ? Number.parseInt(content, 10)
        : content
    }
    reverseMatch = twitterReverseRegex.exec(html)
  }

  return twitter
}
