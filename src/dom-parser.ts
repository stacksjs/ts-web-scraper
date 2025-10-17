/**
 * Simple DOM parser using pure Bun/JavaScript
 * Extracts structured data from HTML without executing scripts
 */

export interface ParsedElement {
  tag: string
  text: string
  html: string
  attributes: Record<string, string>
  children: ParsedElement[]
}

/**
 * Extract list items from HTML (for versions, programs, etc.)
 */
export function extractListItems(html: string, sectionTitle?: string): string[] {
  const items: string[] = []

  // If a section title is provided, find that section first
  let relevantHtml = html
  if (sectionTitle) {
    // Find the section with this title
    const sectionRegex = new RegExp(
      `<[^>]*>${sectionTitle}</[^>]*>.*?<ul[^>]*>(.*?)</ul>`,
      'is'
    )
    const match = html.match(sectionRegex)
    if (match) {
      relevantHtml = match[1]
    }
  }

  // Extract all <li> items
  const liRegex = /<li[^>]*>(.*?)<\/li>/gis
  let match = liRegex.exec(relevantHtml)

  while (match !== null) {
    const content = match[1]
    // Strip HTML tags and get text content
    const text = content.replace(/<[^>]+>/g, '').trim()
    if (text && text.length > 0) {
      items.push(text)
    }
    match = liRegex.exec(relevantHtml)
  }

  return items
}

/**
 * Extract text content from specific sections
 */
export function extractSections(html: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {}

  // Common section titles to look for
  const sectionTitles = [
    'Programs',
    'Companions',
    'Dependencies',
    'Versions',
    'Install',
    'Usage',
  ]

  for (const title of sectionTitles) {
    const items = extractListItems(html, title)
    if (items.length > 0) {
      sections[title.toLowerCase()] = items
    }
  }

  return sections
}

/**
 * Simple query selector for finding elements
 */
export function querySelector(html: string, selector: string): string | null {
  // Support basic selectors: tag, .class, #id

  if (selector.startsWith('#')) {
    // ID selector
    const id = selector.slice(1)
    const regex = new RegExp(`<[^>]+id=["']${id}["'][^>]*>(.*?)</[^>]+>`, 'is')
    const match = html.match(regex)
    return match ? match[1] : null
  }

  if (selector.startsWith('.')) {
    // Class selector
    const className = selector.slice(1)
    const regex = new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)</[^>]+>`, 'is')
    const match = html.match(regex)
    return match ? match[1] : null
  }

  // Tag selector
  const regex = new RegExp(`<${selector}[^>]*>(.*?)</${selector}>`, 'is')
  const match = html.match(regex)
  return match ? match[1] : null
}

/**
 * Extract all elements matching a selector
 */
export function querySelectorAll(html: string, selector: string): string[] {
  const results: string[] = []

  if (selector.startsWith('.')) {
    // Class selector
    const className = selector.slice(1)
    const regex = new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)</[^>]+>`, 'gis')
    let match = regex.exec(html)
    while (match !== null) {
      results.push(match[1])
      match = regex.exec(html)
    }
  } else {
    // Tag selector
    const regex = new RegExp(`<${selector}[^>]*>(.*?)</${selector}>`, 'gis')
    let match = regex.exec(html)
    while (match !== null) {
      results.push(match[1])
      match = regex.exec(html)
    }
  }

  return results
}

/**
 * Strip all HTML tags and get plain text
 */
export function getTextContent(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove scripts
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove styles
    .replace(/<[^>]+>/g, '') // Remove all tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
