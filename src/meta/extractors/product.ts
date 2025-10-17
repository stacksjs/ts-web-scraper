/**
 * E-commerce product metadata extraction
 */

import type { ProductMetadata, StructuredDataResult } from '../types'

/**
 * Extract product metadata for e-commerce sites
 */
export function extractProductMetadata(html: string, structuredData?: StructuredDataResult): ProductMetadata | undefined {
  const product: ProductMetadata = {}

  // Try to get product data from JSON-LD first
  if (structuredData?.jsonLd) {
    for (const data of structuredData.jsonLd) {
      if (data['@type'] === 'Product' || (Array.isArray(data['@type']) && data['@type'].includes('Product'))) {
        product.name = data.name
        product.description = data.description
        product.image = data.image
        product.brand = data.brand?.name || data.brand

        if (data.offers) {
          const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers
          product.price = offer.price
          product.currency = offer.priceCurrency
          product.availability = offer.availability?.replace('https://schema.org/', '')
        }

        if (data.aggregateRating) {
          product.rating = data.aggregateRating.ratingValue
          product.reviewCount = data.aggregateRating.reviewCount
        }

        return product
      }
    }
  }

  // Fallback to Open Graph product tags
  const ogProductRegex = /<meta[^>]+(?:property|name)=["'](?:product|og):([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi
  let match = ogProductRegex.exec(html)
  while (match !== null) {
    const [, property, content] = match
    const prop = property.replace('product:', '').replace('og:', '')

    if (prop === 'price:amount')
      product.price = content
    else if (prop === 'price:currency')
      product.currency = content
    else if (prop === 'availability')
      product.availability = content
    else if (prop === 'brand')
      product.brand = content
    else if (prop === 'condition')
      product.condition = content

    match = ogProductRegex.exec(html)
  }

  return Object.keys(product).length > 0 ? product : undefined
}
