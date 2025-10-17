/**
 * AI/ML-ready feature extraction for embeddings and classification
 */

export interface MLFeatures {
  /**
   * Clean text content suitable for embeddings
   */
  textContent: string

  /**
   * Structured content sections
   */
  sections: ContentSection[]

  /**
   * Named entities detected
   */
  entities: {
    emails: string[]
    urls: string[]
    phones: string[]
    dates: string[]
    prices: string[]
  }

  /**
   * Content features for classification
   */
  features: {
    averageSentenceLength: number
    averageWordLength: number
    punctuationDensity: number
    uppercaseRatio: number
    numberDensity: number
    linkDensity: number
    questionRatio: number
  }

  /**
   * Sentiment indicators
   */
  sentiment: {
    positiveWords: number
    negativeWords: number
    neutralWords: number
    score: number // -1 to 1
  }

  /**
   * Document statistics
   */
  stats: {
    totalWords: number
    uniqueWords: number
    totalSentences: number
    totalParagraphs: number
    vocabularyRichness: number // unique / total
  }
}

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code'
  content: string
  level?: number // for headings
  order: number
}

/**
 * Extract ML-ready features from HTML content
 */
export function extractMLFeatures(html: string): MLFeatures {
  // Extract clean text
  const textContent = extractCleanText(html)

  // Extract structured sections
  const sections = extractSections(html)

  // Extract named entities
  const entities = extractEntities(textContent)

  // Calculate content features
  const features = calculateContentFeatures(textContent)

  // Analyze sentiment
  const sentiment = analyzeSentiment(textContent)

  // Calculate statistics
  const stats = calculateStats(textContent)

  return {
    textContent,
    sections,
    entities,
    features,
    sentiment,
    stats,
  }
}

/**
 * Extract clean text suitable for embeddings
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
 * Extract structured content sections
 */
function extractSections(html: string): ContentSection[] {
  const sections: ContentSection[] = []
  let order = 0

  // Extract headings with context
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let match = headingRegex.exec(html)
  while (match) {
    sections.push({
      type: 'heading',
      level: Number.parseInt(match[1], 10),
      content: match[2].replace(/<[^>]+>/g, '').trim(),
      order: order++,
    })
    match = headingRegex.exec(html)
  }

  // Extract paragraphs
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let pMatch = pRegex.exec(html)
  while (pMatch) {
    const content = pMatch[1].replace(/<[^>]+>/g, '').trim()
    if (content.length > 20) { // Filter out short/empty paragraphs
      sections.push({
        type: 'paragraph',
        content,
        order: order++,
      })
    }
    pMatch = pRegex.exec(html)
  }

  // Extract blockquotes
  const quoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi
  let qMatch = quoteRegex.exec(html)
  while (qMatch) {
    sections.push({
      type: 'quote',
      content: qMatch[1].replace(/<[^>]+>/g, '').trim(),
      order: order++,
    })
    qMatch = quoteRegex.exec(html)
  }

  return sections.sort((a, b) => a.order - b.order)
}

/**
 * Extract named entities
 */
function extractEntities(text: string): MLFeatures['entities'] {
  // Extract emails
  const emailRegex = /\b[\w.%+-]+@[A-Z0-9.-]+\.[A-Z|]{2,}\b/gi
  const emails = [...new Set(text.match(emailRegex) || [])]

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s<>"]+/g
  const urls = [...new Set(text.match(urlRegex) || [])]

  // Extract phone numbers (basic patterns)
  const phoneRegex = /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g
  const phones = [...new Set(text.match(phoneRegex) || [])]

  // Extract dates (various formats)
  const dateRegex = /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi
  const dates = [...new Set(text.match(dateRegex) || [])]

  // Extract prices
  const priceRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})? ?(?:USD|EUR|GBP|dollars?)/gi
  const prices = [...new Set(text.match(priceRegex) || [])]

  return { emails, urls, phones, dates, prices }
}

/**
 * Calculate content features
 */
function calculateContentFeatures(text: string): MLFeatures['features'] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

  const totalChars = text.length
  const totalWords = words.length

  const averageSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0
  const averageWordLength = totalWords > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / totalWords
    : 0

  const punctuation = (text.match(/[.,;:!?]/g) || []).length
  const punctuationDensity = totalChars > 0 ? punctuation / totalChars : 0

  const uppercase = (text.match(/[A-Z]/g) || []).length
  const uppercaseRatio = totalChars > 0 ? uppercase / totalChars : 0

  const numbers = (text.match(/\d/g) || []).length
  const numberDensity = totalChars > 0 ? numbers / totalChars : 0

  const links = (text.match(/https?:\/\//g) || []).length
  const linkDensity = totalWords > 0 ? links / totalWords : 0

  const questions = (text.match(/\?/g) || []).length
  const questionRatio = sentences.length > 0 ? questions / sentences.length : 0

  return {
    averageSentenceLength,
    averageWordLength,
    punctuationDensity,
    uppercaseRatio,
    numberDensity,
    linkDensity,
    questionRatio,
  }
}

/**
 * Basic sentiment analysis
 */
function analyzeSentiment(text: string): MLFeatures['sentiment'] {
  const words = text.toLowerCase().split(/\s+/)

  // Simple positive/negative word lists
  const positiveWords = new Set([
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'best',
    'beautiful',
    'perfect',
    'awesome',
    'outstanding',
    'brilliant',
    'superb',
    'happy',
    'delighted',
    'thrilled',
    'excited',
    'pleased',
    'satisfied',
    'enjoy',
    'impressed',
  ])

  const negativeWords = new Set([
    'bad',
    'terrible',
    'awful',
    'horrible',
    'worst',
    'hate',
    'poor',
    'disappointing',
    'disappointing',
    'sad',
    'angry',
    'frustrated',
    'annoying',
    'useless',
    'broken',
    'failed',
    'failure',
    'problem',
    'issue',
    'difficult',
    'hard',
    'impossible',
  ])

  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '')
    if (positiveWords.has(cleanWord)) {
      positiveCount++
    }
    else if (negativeWords.has(cleanWord)) {
      negativeCount++
    }
    else if (cleanWord.length > 3) {
      neutralCount++
    }
  }

  const total = positiveCount + negativeCount
  const score = total > 0 ? (positiveCount - negativeCount) / total : 0

  return {
    positiveWords: positiveCount,
    negativeWords: negativeCount,
    neutralWords: neutralCount,
    score,
  }
}

/**
 * Calculate document statistics
 */
function calculateStats(text: string): MLFeatures['stats'] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  const uniqueWords = new Set(words)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0)

  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    totalSentences: sentences.length,
    totalParagraphs: paragraphs.length,
    vocabularyRichness: words.length > 0 ? uniqueWords.size / words.length : 0,
  }
}
