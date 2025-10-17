/**
 * Content analysis utilities (reading time, excerpts)
 */

/**
 * Calculate reading time based on word count
 */
export function calculateReadingTime(html: string): number {
  // Extract text content, removing scripts, styles, and HTML tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Count words
  const words = text.split(/\s+/).filter(word => word.length > 0).length

  // Average reading speed: 200-250 words per minute
  // We'll use 225 as a middle ground
  const readingSpeed = 225
  const minutes = Math.ceil(words / readingSpeed)

  return minutes
}

/**
 * Generate a smart excerpt from HTML content
 */
export function generateExcerpt(html: string, maxLength: number = 200): string {
  // Extract main content, removing scripts, styles, nav, header, footer
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // If text is shorter than maxLength, return it
  if (text.length <= maxLength) {
    return text
  }

  // Find the last complete sentence within maxLength
  const truncated = text.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')

  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)

  if (lastSentenceEnd > maxLength * 0.6) {
    // If we found a sentence end in the last 40% of the excerpt, use it
    return text.substring(0, lastSentenceEnd + 1).trim()
  }

  // Otherwise, find the last space and add ellipsis
  const lastSpace = truncated.lastIndexOf(' ')
  return `${text.substring(0, lastSpace).trim()}...`
}
