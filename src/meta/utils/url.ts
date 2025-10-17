/**
 * URL resolution utilities
 */

/**
 * Resolve relative URLs to absolute URLs
 */
export function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url.startsWith('//') ? `https:${url}` : url
  }

  try {
    return new URL(url, baseUrl).href
  }
  catch {
    return url
  }
}

/**
 * Convert snake_case or kebab-case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase())
}
