/**
 * Metadata quality scoring and analysis
 */

import type { LinkPreview, MetadataQuality } from '../meta/types'

/**
 * Calculate metadata quality score
 */
export function calculateQualityScore(preview: LinkPreview): MetadataQuality {
  const scores = {
    openGraph: 0,
    twitterCard: 0,
    basicMeta: 0,
    structuredData: 0,
    images: 0,
    accessibility: 0,
  }

  const missing: string[] = []
  const warnings: string[] = []

  // Open Graph scoring (0-100)
  const og = preview.openGraph
  if (og) {
    if (og.title)
      scores.openGraph += 25
    else missing.push('og:title')

    if (og.description)
      scores.openGraph += 25
    else missing.push('og:description')

    if (og.image)
      scores.openGraph += 25
    else missing.push('og:image')

    if (og.url)
      scores.openGraph += 15
    else missing.push('og:url')

    if (og.type)
      scores.openGraph += 10
  }
  else {
    missing.push('Open Graph tags')
  }

  // Twitter Card scoring (0-100)
  const twitter = preview.twitterCard
  if (twitter) {
    if (twitter.card)
      scores.twitterCard += 30
    else missing.push('twitter:card')

    if (twitter.title)
      scores.twitterCard += 25
    if (twitter.description)
      scores.twitterCard += 25
    if (twitter.image)
      scores.twitterCard += 20
  }
  else {
    missing.push('Twitter Card tags')
  }

  // Basic meta scoring (0-100)
  if (preview.title)
    scores.basicMeta += 30
  else missing.push('title')

  if (preview.description)
    scores.basicMeta += 30
  else missing.push('description')

  if (preview.url)
    scores.basicMeta += 20
  if (preview.favicon)
    scores.basicMeta += 10
  if (preview.language)
    scores.basicMeta += 10

  // Structured data scoring (0-100)
  if (preview.structuredData?.jsonLd && preview.structuredData.jsonLd.length > 0) {
    scores.structuredData += 60
    if (preview.structuredData.schemaTypes && preview.structuredData.schemaTypes.length > 0) {
      scores.structuredData += 40
    }
  }
  else {
    warnings.push('No structured data (JSON-LD) found')
  }

  // Image scoring (0-100)
  if (preview.image) {
    scores.images += 40
    if (preview.imageWidth && preview.imageHeight) {
      scores.images += 30
      // Check minimum recommended size (1200x630 for OG)
      if (preview.imageWidth >= 1200 && preview.imageHeight >= 630) {
        scores.images += 30
      }
      else {
        warnings.push(`Image size ${preview.imageWidth}x${preview.imageHeight} is smaller than recommended 1200x630`)
      }
    }
    else {
      warnings.push('Image dimensions not specified')
    }
  }
  else {
    missing.push('image')
  }

  // Accessibility scoring (0-100)
  if (preview.language)
    scores.accessibility += 40
  else warnings.push('Language not specified')

  if (preview.title && preview.title.length <= 60)
    scores.accessibility += 20
  else if (preview.title)
    warnings.push('Title is longer than 60 characters')

  if (preview.description && preview.description.length <= 160)
    scores.accessibility += 20
  else if (preview.description)
    warnings.push('Description is longer than 160 characters')

  if (preview.keywords && preview.keywords.length > 0)
    scores.accessibility += 20

  // Calculate overall score
  const overallScore = Math.round(
    (scores.openGraph * 0.25)
    + (scores.twitterCard * 0.2)
    + (scores.basicMeta * 0.2)
    + (scores.structuredData * 0.15)
    + (scores.images * 0.15)
    + (scores.accessibility * 0.05),
  )

  // Determine readiness
  const seoReady = scores.basicMeta >= 70 && scores.structuredData >= 40
  const socialReady = scores.openGraph >= 75 && scores.twitterCard >= 60

  return {
    score: overallScore,
    scores,
    missing,
    warnings,
    seoReady,
    socialReady,
  }
}
