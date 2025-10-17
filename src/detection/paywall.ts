/**
 * Paywall and content restriction detection
 */

export interface PaywallDetection {
  /**
   * Whether a paywall is detected
   */
  detected: boolean

  /**
   * Confidence level (0-100)
   */
  confidence: number

  /**
   * Type of restriction
   */
  type?: 'hard' | 'soft' | 'metered' | 'registration'

  /**
   * Detected indicators
   */
  indicators: string[]
}

/**
 * Detect if content is behind a paywall or requires registration
 */
export function detectPaywall(html: string): PaywallDetection {
  const indicators: string[] = []
  let score = 0

  // Check for common paywall indicators
  const paywallPatterns = [
    { pattern: /paywall|subscription[-\s]?wall/i, points: 30, desc: 'paywall keyword' },
    { pattern: /subscribe to (read|continue|unlock)/i, points: 25, desc: 'subscription prompt' },
    { pattern: /this article is (exclusive|premium)/i, points: 25, desc: 'premium content marker' },
    { pattern: /member[-\s]?only|members[-\s]?only/i, points: 20, desc: 'members-only content' },
    { pattern: /register to (read|continue|view)/i, points: 15, desc: 'registration requirement' },
    { pattern: /unlock (this|full) (article|story)/i, points: 20, desc: 'unlock prompt' },
    { pattern: /free articles? remaining/i, points: 30, desc: 'metered paywall' },
    { pattern: /article[-\s]?limit[-\s]?reached/i, points: 30, desc: 'article limit' },
    { pattern: /already a subscriber/i, points: 15, desc: 'subscriber login prompt' },
    { pattern: /upgrade to premium/i, points: 15, desc: 'premium upgrade' },
  ]

  for (const { pattern, points, desc } of paywallPatterns) {
    if (pattern.test(html)) {
      score += points
      indicators.push(desc)
    }
  }

  // Check for subscription schema
  if (html.match(/"@type"\s*:\s*".*Subscription.*"/)) {
    score += 20
    indicators.push('subscription schema')
  }

  // Check for restricted content attributes
  if (html.match(/data-paywall|data-subscription|class=".*paywall.*"/i)) {
    score += 20
    indicators.push('paywall attributes')
  }

  // Determine paywall type
  let type: PaywallDetection['type']
  if (score >= 40) {
    if (html.match(/free articles? remaining|article[-\s]?limit/i)) {
      type = 'metered'
    }
    else if (html.match(/register|sign up|create account/i)) {
      type = 'registration'
    }
    else if (html.match(/subscribe|premium|member/i)) {
      type = 'hard'
    }
    else {
      type = 'soft'
    }
  }

  return {
    detected: score >= 40,
    confidence: Math.min(score, 100),
    type,
    indicators,
  }
}

/**
 * Detect newsletter signup prompts
 */
export function detectNewsletterPrompt(html: string): {
  detected: boolean
  confidence: number
  indicators: string[]
} {
  const indicators: string[] = []
  let score = 0

  const patterns = [
    { pattern: /subscribe to (our|the) newsletter/i, points: 30, desc: 'newsletter subscription' },
    { pattern: /join our mailing list/i, points: 25, desc: 'mailing list signup' },
    { pattern: /get (our|the) newsletter/i, points: 25, desc: 'newsletter offer' },
    { pattern: /email updates|stay updated/i, points: 15, desc: 'email updates' },
    { pattern: /type="email"[^>]*placeholder=".*email.*"/i, points: 10, desc: 'email input field' },
  ]

  for (const { pattern, points, desc } of patterns) {
    if (pattern.test(html)) {
      score += points
      indicators.push(desc)
    }
  }

  return {
    detected: score >= 30,
    confidence: Math.min(score, 100),
    indicators,
  }
}
