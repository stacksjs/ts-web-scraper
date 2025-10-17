/**
 * Main content extraction (Readability-style algorithm)
 * Extracts the main article content from HTML, removing navigation, ads, etc.
 */

export interface ExtractedContent {
  /**
   * Main article title
   */
  title?: string

  /**
   * Main article content (HTML)
   */
  content: string

  /**
   * Plain text version
   */
  textContent: string

  /**
   * Article excerpt/summary
   */
  excerpt?: string

  /**
   * Article author
   */
  author?: string

  /**
   * Published date
   */
  publishedDate?: string

  /**
   * Reading time in minutes
   */
  readingTime: number

  /**
   * Content length
   */
  length: number

  /**
   * Main image
   */
  leadImage?: string
}

/**
 * Extract main content from HTML using readability-style algorithm
 */
export function extractMainContent(html: string, url?: string): ExtractedContent {
  // Remove unwanted elements
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')

  // Find article element
  let content = ''
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    content = articleMatch[1]
  }
  else {
    // Look for main content container
    const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) {
      content = mainMatch[1]
    }
    else {
      // Fallback: find the element with most <p> tags
      content = findContentByDensity(cleaned)
    }
  }

  // Extract title
  const title = extractContentTitle(html, content)

  // Extract author
  const author = extractAuthor(html)

  // Extract published date
  const publishedDate = extractPublishedDate(html)

  // Extract lead image
  const leadImage = extractLeadImage(content, url)

  // Convert to plain text
  const textContent = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Calculate reading time (225 WPM)
  const words = textContent.split(/\s+/).length
  const readingTime = Math.ceil(words / 225)

  // Generate excerpt
  const excerpt = textContent.substring(0, 200).trim() + (textContent.length > 200 ? '...' : '')

  return {
    title,
    content,
    textContent,
    excerpt,
    author,
    publishedDate,
    readingTime,
    length: textContent.length,
    leadImage,
  }
}

/**
 * Find content by paragraph density
 */
function findContentByDensity(html: string): string {
  // Split into potential content blocks
  const blocks = html.split(/<\/(?:div|section|article)>/i)

  let bestBlock = ''
  let bestScore = 0

  for (const block of blocks) {
    const pCount = (block.match(/<p[^>]*>/gi) || []).length
    const textLength = block.replace(/<[^>]+>/g, '').trim().length

    // Score based on paragraph count and text length
    const score = pCount * 100 + textLength

    if (score > bestScore) {
      bestScore = score
      bestBlock = block
    }
  }

  return bestBlock || html
}

/**
 * Extract content title
 */
function extractContentTitle(html: string, content: string): string | undefined {
  // Try h1 in article
  let match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (match) {
    return match[1].replace(/<[^>]+>/g, '').trim()
  }

  // Try title tag
  match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (match) {
    return match[1].trim()
  }

  return undefined
}

/**
 * Extract author information
 */
function extractAuthor(html: string): string | undefined {
  // Try meta author
  let match = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)
  if (match)
    return match[1]

  // Try rel=author
  match = html.match(/<a[^>]+rel=["']author["'][^>]*>([^<]+)<\/a>/i)
  if (match)
    return match[1].trim()

  // Try class=author
  match = html.match(/<(?:span|div)[^>]+class=["'][^"']*author[^"']*["'][^>]*>([^<]+)</i)
  if (match)
    return match[1].trim()

  return undefined
}

/**
 * Extract published date
 */
function extractPublishedDate(html: string): string | undefined {
  // Try time element
  let match = html.match(/<time[^>]+datetime=["']([^"']+)["']/i)
  if (match)
    return match[1]

  // Try meta published_time
  match = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
  if (match)
    return match[1]

  return undefined
}

/**
 * Extract lead image
 */
function extractLeadImage(content: string, baseUrl?: string): string | undefined {
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (!match)
    return undefined

  const src = match[1]

  // Resolve relative URLs
  if (baseUrl && !src.startsWith('http')) {
    try {
      return new URL(src, baseUrl).href
    }
    catch {
      return src
    }
  }

  return src
}
