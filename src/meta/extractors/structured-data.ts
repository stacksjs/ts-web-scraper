/**
 * Structured data extraction (JSON-LD, Microdata, Dublin Core)
 */

import type { StructuredDataResult } from '../types'

/**
 * Extract enhanced structured data including Schema.org, Dublin Core, etc.
 */
export function extractEnhancedStructuredData(html: string): StructuredDataResult {
  const result: StructuredDataResult = {
    jsonLd: [],
    microdata: [],
    dublinCore: {},
    schemaTypes: [],
  }

  // Extract JSON-LD
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let jsonLdMatch = jsonLdRegex.exec(html)
  while (jsonLdMatch !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1])
      result.jsonLd!.push(data)

      // Extract schema types
      if (data['@type']) {
        const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']]
        result.schemaTypes!.push(...types)
      }
    }
    catch {
      // Invalid JSON
    }
    jsonLdMatch = jsonLdRegex.exec(html)
  }

  // Extract Dublin Core metadata
  const dcRegex = /<meta[^>]+name=["']DC\.([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi
  let dcMatch = dcRegex.exec(html)
  while (dcMatch !== null) {
    const [, name, content] = dcMatch
    result.dublinCore![name.toLowerCase()] = content
    dcMatch = dcRegex.exec(html)
  }

  // Also check reverse order for Dublin Core
  const dcReverseRegex = /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']DC\.([^"']+)["'][^>]*>/gi
  let dcReverseMatch = dcReverseRegex.exec(html)
  while (dcReverseMatch !== null) {
    const [, content, name] = dcReverseMatch
    if (!result.dublinCore![name.toLowerCase()]) {
      result.dublinCore![name.toLowerCase()] = content
    }
    dcReverseMatch = dcReverseRegex.exec(html)
  }

  return result
}
