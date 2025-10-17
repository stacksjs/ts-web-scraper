/**
 * Advanced SEO analysis utilities
 */

export interface SEOAnalysis {
  /**
   * Readability score (0-100, higher is better)
   */
  readabilityScore: number

  /**
   * Flesch Reading Ease score
   */
  fleschScore: number

  /**
   * Keyword density map (keyword -> percentage)
   */
  keywordDensity: Record<string, number>

  /**
   * Top keywords
   */
  topKeywords: Array<{ keyword: string, count: number, density: number }>

  /**
   * Content statistics
   */
  stats: {
    wordCount: number
    sentenceCount: number
    paragraphCount: number
    averageWordsPerSentence: number
    averageSyllablesPerWord: number
  }

  /**
   * Heading structure
   */
  headings: {
    h1: number
    h2: number
    h3: number
    h4: number
    h5: number
    h6: number
  }

  /**
   * SEO warnings
   */
  warnings: string[]

  /**
   * SEO recommendations
   */
  recommendations: string[]
}

/**
 * Analyze SEO aspects of HTML content
 */
export function analyzeSEO(html: string): SEOAnalysis {
  // Extract clean text
  const text = extractCleanText(html)

  // Calculate content statistics
  const stats = calculateContentStats(text)

  // Calculate readability scores
  const fleschScore = calculateFleschScore(stats)
  const readabilityScore = mapFleschToPercentage(fleschScore)

  // Extract and analyze keywords
  const words = extractWords(text)
  const keywordDensity = calculateKeywordDensity(words)
  const topKeywords = getTopKeywords(keywordDensity, stats.wordCount)

  // Analyze heading structure
  const headings = analyzeHeadings(html)

  // Generate warnings and recommendations
  const warnings: string[] = []
  const recommendations: string[] = []

  // Check heading structure
  if (headings.h1 === 0) {
    warnings.push('No H1 heading found')
    recommendations.push('Add a single H1 heading that describes the main topic')
  }
  else if (headings.h1 > 1) {
    warnings.push(`Multiple H1 headings found (${headings.h1})`)
    recommendations.push('Use only one H1 heading per page')
  }

  // Check content length
  if (stats.wordCount < 300) {
    warnings.push('Content is too short (< 300 words)')
    recommendations.push('Aim for at least 300-500 words for better SEO')
  }

  // Check readability
  if (readabilityScore < 50) {
    warnings.push('Content readability is difficult')
    recommendations.push('Simplify sentences and use more common words')
  }

  // Check keyword usage
  if (topKeywords.length === 0) {
    warnings.push('No clear keyword focus detected')
    recommendations.push('Focus on specific keywords throughout the content')
  }

  // Check for keyword stuffing
  for (const { keyword, density } of topKeywords) {
    if (density > 5) {
      warnings.push(`Possible keyword stuffing detected for "${keyword}" (${density.toFixed(2)}%)`)
      recommendations.push('Reduce keyword repetition and use synonyms')
    }
  }

  return {
    readabilityScore,
    fleschScore,
    keywordDensity,
    topKeywords,
    stats,
    headings,
    warnings,
    recommendations,
  }
}

/**
 * Extract clean text from HTML
 */
function extractCleanText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate content statistics
 */
function calculateContentStats(text: string) {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0)

  const wordCount = words.length
  const sentenceCount = sentences.length
  const paragraphCount = Math.max(paragraphs.length, 1)

  const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0
  const averageSyllablesPerWord = words.length > 0
    ? words.reduce((sum, word) => sum + countSyllables(word), 0) / words.length
    : 0

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    averageWordsPerSentence,
    averageSyllablesPerWord,
  }
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3)
    return 1

  // Count vowel groups
  let syllables = 0
  let previousWasVowel = false

  for (const char of word) {
    const isVowel = /[aeiouy]/.test(char)
    if (isVowel && !previousWasVowel) {
      syllables++
    }
    previousWasVowel = isVowel
  }

  // Adjust for silent e
  if (word.endsWith('e')) {
    syllables--
  }

  return Math.max(syllables, 1)
}

/**
 * Calculate Flesch Reading Ease score
 */
function calculateFleschScore(stats: ReturnType<typeof calculateContentStats>): number {
  const { averageWordsPerSentence, averageSyllablesPerWord } = stats
  return 206.835 - 1.015 * averageWordsPerSentence - 84.6 * averageSyllablesPerWord
}

/**
 * Map Flesch score to 0-100 percentage
 */
function mapFleschToPercentage(fleschScore: number): number {
  // Flesch score ranges from 0-100 (higher is easier)
  // We'll map it to a 0-100 scale where higher is better
  return Math.max(0, Math.min(100, fleschScore))
}

/**
 * Extract words for keyword analysis
 */
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3) // Ignore short words
}

/**
 * Calculate keyword density
 */
function calculateKeywordDensity(words: string[]): Record<string, number> {
  const totalWords = words.length
  const wordCounts: Record<string, number> = {}

  // Count single words
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  }

  // Calculate density as percentage
  const density: Record<string, number> = {}
  for (const [word, count] of Object.entries(wordCounts)) {
    if (count > 1) { // Only include words that appear more than once
      density[word] = (count / totalWords) * 100
    }
  }

  return density
}

/**
 * Get top keywords
 */
function getTopKeywords(
  density: Record<string, number>,
  totalWords: number,
): Array<{ keyword: string, count: number, density: number }> {
  const commonWords = new Set([
    'about',
    'after',
    'also',
    'been',
    'before',
    'being',
    'between',
    'both',
    'called',
    'could',
    'does',
    'doing',
    'during',
    'each',
    'first',
    'from',
    'have',
    'into',
    'more',
    'most',
    'much',
    'only',
    'other',
    'over',
    'same',
    'some',
    'such',
    'than',
    'that',
    'their',
    'them',
    'then',
    'there',
    'these',
    'they',
    'this',
    'through',
    'under',
    'very',
    'were',
    'what',
    'when',
    'where',
    'which',
    'while',
    'with',
    'would',
    'your',
  ])

  return Object.entries(density)
    .filter(([word]) => !commonWords.has(word))
    .map(([keyword, densityValue]) => ({
      keyword,
      count: Math.round((densityValue / 100) * totalWords),
      density: densityValue,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

/**
 * Analyze heading structure
 */
function analyzeHeadings(html: string) {
  return {
    h1: (html.match(/<h1[^>]*>/gi) || []).length,
    h2: (html.match(/<h2[^>]*>/gi) || []).length,
    h3: (html.match(/<h3[^>]*>/gi) || []).length,
    h4: (html.match(/<h4[^>]*>/gi) || []).length,
    h5: (html.match(/<h5[^>]*>/gi) || []).length,
    h6: (html.match(/<h6[^>]*>/gi) || []).length,
  }
}
