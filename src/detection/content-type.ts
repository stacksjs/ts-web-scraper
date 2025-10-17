/**
 * Content type classification and detection
 */

export interface ContentClassification {
  /**
   * Primary content type
   */
  type: 'article' | 'product' | 'video' | 'recipe' | 'event' | 'profile' | 'website' | 'unknown'

  /**
   * Confidence score (0-100)
   */
  confidence: number

  /**
   * Detected indicators
   */
  indicators: string[]
}

/**
 * Classify content type based on HTML structure and metadata
 */
export function classifyContentType(html: string): ContentClassification {
  const indicators: string[] = []
  const scores: Record<string, number> = {
    article: 0,
    product: 0,
    video: 0,
    recipe: 0,
    event: 0,
    profile: 0,
    website: 0,
  }

  // Check Open Graph type
  const ogTypeMatch = html.match(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  if (ogTypeMatch) {
    const ogType = ogTypeMatch[1].toLowerCase()
    if (ogType.includes('article')) {
      scores.article += 40
      indicators.push('og:type=article')
    }
    else if (ogType.includes('product')) {
      scores.product += 40
      indicators.push('og:type=product')
    }
    else if (ogType.includes('video')) {
      scores.video += 40
      indicators.push('og:type=video')
    }
    else if (ogType.includes('profile')) {
      scores.profile += 40
      indicators.push('og:type=profile')
    }
  }

  // Check for article indicators
  if (html.includes('<article')) {
    scores.article += 20
    indicators.push('<article> tag')
  }
  if (html.match(/<meta[^>]+name=["']article:/i)) {
    scores.article += 15
    indicators.push('article metadata')
  }
  if (html.match(/<time[^>]+datetime=/i)) {
    scores.article += 10
    indicators.push('datetime element')
  }

  // Check for product indicators
  if (html.match(/price|cart|buy|purchase|checkout/i)) {
    scores.product += 15
    indicators.push('e-commerce keywords')
  }
  if (html.match(/"@type"\s*:\s*"Product"/)) {
    scores.product += 30
    indicators.push('Product schema')
  }
  if (html.match(/add to cart|buy now/i)) {
    scores.product += 20
    indicators.push('purchase buttons')
  }

  // Check for video indicators
  if (html.match(/<video|<iframe[^>]*youtube|<iframe[^>]*vimeo/i)) {
    scores.video += 25
    indicators.push('video player')
  }
  if (html.match(/twitter:player|og:video/i)) {
    scores.video += 20
    indicators.push('video metadata')
  }

  // Check for recipe indicators
  if (html.match(/"@type"\s*:\s*"Recipe"/)) {
    scores.recipe += 40
    indicators.push('Recipe schema')
  }
  if (html.match(/ingredients|instructions|cook time|prep time/i)) {
    scores.recipe += 20
    indicators.push('recipe keywords')
  }

  // Check for event indicators
  if (html.match(/"@type"\s*:\s*"Event"/)) {
    scores.event += 40
    indicators.push('Event schema')
  }
  if (html.match(/event date|venue|tickets|rsvp/i)) {
    scores.event += 20
    indicators.push('event keywords')
  }

  // Check for profile indicators
  if (html.match(/profile|about me|bio|social links/i)) {
    scores.profile += 15
    indicators.push('profile keywords')
  }

  // Find highest scoring type
  const entries = Object.entries(scores)
  const [type, confidence] = entries.reduce((max, curr) =>
    curr[1] > max[1] ? curr : max, ['website', 0] as [string, number])

  return {
    type: type as ContentClassification['type'],
    confidence: Math.min(confidence, 100),
    indicators,
  }
}
