/**
 * Advanced language and internationalization detection
 */

export interface LanguageDetection {
  /**
   * Primary language code (ISO 639-1)
   */
  primary: string

  /**
   * Confidence score (0-100)
   */
  confidence: number

  /**
   * Alternative languages detected
   */
  alternatives: string[]

  /**
   * Alternate language versions available
   */
  alternateVersions: AlternateLanguage[]

  /**
   * Direction (ltr or rtl)
   */
  direction: 'ltr' | 'rtl'

  /**
   * Character set
   */
  charset?: string

  /**
   * Translation readiness
   */
  i18n: {
    hasLanguageSwitcher: boolean
    hasHreflang: boolean
    multilingualReady: boolean
  }
}

export interface AlternateLanguage {
  lang: string
  href: string
}

/**
 * Detect language with confidence scoring
 */
export function detectLanguage(html: string): LanguageDetection {
  // Extract primary language
  const primary = extractPrimaryLanguage(html)

  // Detect alternatives
  const alternatives = detectAlternativeLanguages(html)

  // Extract alternate versions
  const alternateVersions = extractAlternateVersions(html)

  // Determine direction
  const direction = isRTL(primary) ? 'rtl' : 'ltr'

  // Extract charset
  const charset = extractCharset(html)

  // Check i18n readiness
  const i18n = {
    hasLanguageSwitcher: detectLanguageSwitcher(html),
    hasHreflang: alternateVersions.length > 0,
    multilingualReady: alternateVersions.length > 0 || detectLanguageSwitcher(html),
  }

  // Calculate confidence
  const confidence = calculateLanguageConfidence(html, primary)

  return {
    primary,
    confidence,
    alternatives,
    alternateVersions,
    direction,
    charset,
    i18n,
  }
}

/**
 * Extract primary language
 */
function extractPrimaryLanguage(html: string): string {
  // Try <html lang="">
  let match = html.match(/<html[^>]+lang=["']([^"']+)["']/i)
  if (match)
    return match[1].split('-')[0] // Get language code without region

  // Try meta content-language
  match = html.match(/<meta[^>]+http-equiv=["']content-language["'][^>]+content=["']([^"']+)["']/i)
  if (match)
    return match[1].split('-')[0]

  // Try og:locale
  match = html.match(/<meta[^>]+property=["']og:locale["'][^>]+content=["']([^"']+)["']/i)
  if (match)
    return match[1].split('_')[0]

  // Fallback: detect from content
  return detectFromContent(html)
}

/**
 * Detect language from content using character frequency
 */
function detectFromContent(html: string): string {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()

  // Common words in different languages
  const indicators = {
    en: ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day'],
    es: ['que', 'los', 'del', 'las', 'por', 'para', 'una', 'con', 'esta', 'sus', 'más', 'año', 'como'],
    fr: ['les', 'des', 'que', 'dans', 'pour', 'par', 'une', 'avec', 'est', 'plus', 'été', 'ces'],
    de: ['der', 'die', 'und', 'den', 'das', 'von', 'ist', 'mit', 'des', 'dem', 'ein', 'auf'],
    it: ['che', 'per', 'una', 'sono', 'della', 'con', 'anche', 'dal', 'più', 'come', 'dei'],
    pt: ['que', 'para', 'uma', 'com', 'dos', 'das', 'pelo', 'pela', 'mais', 'como', 'sua'],
    ru: ['что', 'это', 'как', 'его', 'она', 'был', 'все', 'для', 'еще', 'мне'],
    ja: ['です', 'した', 'する', 'ます', 'ない', 'この', 'その', 'ある', 'いる'],
    zh: ['的', '了', '是', '在', '我', '有', '他', '这', '为', '之', '大', '来'],
  }

  const scores: Record<string, number> = {}

  for (const [lang, words] of Object.entries(indicators)) {
    scores[lang] = 0
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches) {
        scores[lang] += matches.length
      }
    }
  }

  // Return language with highest score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[1] > 0 ? sorted[0][0] : 'en'
}

/**
 * Detect alternative languages in content
 */
function detectAlternativeLanguages(html: string): string[] {
  const languages = new Set<string>()

  // Check for multilingual content markers
  const langAttrRegex = /lang=["']([^"']+)["']/gi
  let match = langAttrRegex.exec(html)
  while (match) {
    languages.add(match[1].split('-')[0])
    match = langAttrRegex.exec(html)
  }

  return Array.from(languages)
}

/**
 * Extract alternate language versions
 */
function extractAlternateVersions(html: string): AlternateLanguage[] {
  const versions: AlternateLanguage[] = []

  // Extract hreflang links
  const hreflangRegex = /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi
  let match = hreflangRegex.exec(html)
  while (match) {
    versions.push({
      lang: match[1],
      href: match[2],
    })
    match = hreflangRegex.exec(html)
  }

  // Also check reverse order
  const reverseRegex = /<link[^>]+hreflang=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/gi
  let reverseMatch = reverseRegex.exec(html)
  while (reverseMatch) {
    const existing = versions.find(v => v.lang === reverseMatch![1])
    if (!existing) {
      versions.push({
        lang: reverseMatch[1],
        href: reverseMatch[2],
      })
    }
    reverseMatch = reverseRegex.exec(html)
  }

  return versions
}

/**
 * Check if language is right-to-left
 */
function isRTL(lang: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi']
  return rtlLanguages.includes(lang)
}

/**
 * Extract character set
 */
function extractCharset(html: string): string | undefined {
  const match = html.match(/<meta[^>]+charset=["']([^"']+)["']/i)
  return match ? match[1] : undefined
}

/**
 * Detect language switcher UI
 */
function detectLanguageSwitcher(html: string): boolean {
  // Look for common language switcher patterns
  const patterns = [
    /language[-_]?switcher/i,
    /lang[-_]?selector/i,
    /choose[-_]?language/i,
    /select[-_]?language/i,
    /language[-_]?picker/i,
  ]

  return patterns.some(pattern => pattern.test(html))
}

/**
 * Calculate language detection confidence
 */
function calculateLanguageConfidence(html: string, detectedLang: string): number {
  let confidence = 50 // Base confidence

  // Increase confidence if multiple sources agree
  const htmlLang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)
  if (htmlLang && htmlLang[1].startsWith(detectedLang)) {
    confidence += 25
  }

  const metaLang = html.match(/<meta[^>]+http-equiv=["']content-language["'][^>]+content=["']([^"']+)["']/i)
  if (metaLang && metaLang[1].startsWith(detectedLang)) {
    confidence += 15
  }

  const ogLocale = html.match(/<meta[^>]+property=["']og:locale["'][^>]+content=["']([^"']+)["']/i)
  if (ogLocale && ogLocale[1].startsWith(detectedLang)) {
    confidence += 10
  }

  return Math.min(confidence, 100)
}
