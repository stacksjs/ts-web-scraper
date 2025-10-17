/**
 * Language and internationalization extraction
 */

/**
 * Extract language from HTML
 */
export function extractLanguage(html: string): string | undefined {
  // Check <html lang="...">
  const htmlLangMatch = html.match(/<html[^>]+lang=["']([^"']+)["'][^>]*>/i)
  if (htmlLangMatch) {
    return htmlLangMatch[1]
  }

  // Check meta tag
  const metaLangMatch = html.match(/<meta[^>]+http-equiv=["']content-language["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+http-equiv=["']content-language["'][^>]*>/i)
  if (metaLangMatch) {
    return metaLangMatch[1]
  }

  return undefined
}

/**
 * Extract standard HTML meta tags
 */
export function extractStandardMeta(html: string): {
  title?: string
  description?: string
  keywords?: string
  author?: string
  canonical?: string
} {
  const meta: any = {}

  // Extract description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)
  if (descMatch) {
    meta.description = descMatch[1]
  }

  // Extract keywords
  const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']keywords["'][^>]*>/i)
  if (keywordsMatch) {
    meta.keywords = keywordsMatch[1]
  }

  // Extract author
  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']author["'][^>]*>/i)
  if (authorMatch) {
    meta.author = authorMatch[1]
  }

  // Extract canonical URL
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i)
  if (canonicalMatch) {
    meta.canonical = canonicalMatch[1]
  }

  return meta
}

/**
 * Extract the page title from <title> tag
 */
export function extractTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : undefined
}
