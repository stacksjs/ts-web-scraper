# Machine Learning Feature Extraction

Extract structured features from web content for machine learning, AI applications, embeddings, and text classification.

## Overview

The ML feature extractor transforms unstructured HTML into clean, structured data optimized for machine learning pipelines. It extracts text content, identifies entities, analyzes sentiment, calculates text statistics, and structures content into sections - perfect for feeding into embeddings, RAG systems, or classification models.

## Basic Usage

```typescript
import { extractMLFeatures } from 'ts-web-scraper'

const html = await fetch('https://example.com/article').then(r => r.text())
const features = extractMLFeatures(html)

console.log(`Text Length: ${features.textContent.length} characters`)
console.log(`Sections: ${features.sections.length}`)
console.log(`Sentiment Score: ${features.sentiment.score}`)
console.log(`Vocabulary Richness: ${features.stats.vocabularyRichness.toFixed(2)}`)
```

## Extracted Features

### Clean Text Content

Get clean, embedding-ready text with navigation and boilerplate removed:

```typescript
// Original HTML includes headers, footers, navigation, scripts, styles
const { textContent } = features

// Clean text suitable for:
// - OpenAI embeddings
// - Semantic search
// - Text classification
// - RAG systems
console.log(textContent)
```

The extractor automatically removes:

- Scripts and styles
- Navigation menus
- Headers and footers
- Sidebars
- Excessive whitespace

### Structured Content Sections

Content broken down into semantic sections:

```typescript
features.sections.forEach((section) => {
  console.log(`[${section.type}] ${section.content}`)
  if (section.level) {
    console.log(`  Heading Level: H${section.level}`)
  }
})

// Example output:
// [heading] Introduction to Machine Learning
//   Heading Level: H1
// [paragraph] Machine learning is a subset of artificial intelligence...
// [heading] Types of Machine Learning
//   Heading Level: H2
// [paragraph] There are three main types...
// [quote] The best way to predict the future is to invent it.
```

Section types:

- **heading**: Headings (H1-H6) with level information
- **paragraph**: Text paragraphs (filtered for length > 20 chars)
- **quote**: Blockquote content
- **list**: List items (future enhancement)
- **code**: Code blocks (future enhancement)

### Named Entity Extraction

Automatically detect and extract structured entities:

```typescript
const { entities } = features

console.log('Emails:')
entities.emails.forEach(email => console.log(`  - ${email}`))

console.log('\nPhone Numbers:')
entities.phones.forEach(phone => console.log(`  - ${phone}`))

console.log('\nURLs:')
entities.urls.forEach(url => console.log(`  - ${url}`))

console.log('\nDates:')
entities.dates.forEach(date => console.log(`  - ${date}`))

console.log('\nPrices:')
entities.prices.forEach(price => console.log(`  - ${price}`))
```

Detected entity types:

- **Emails**: Standard email addresses (<user@domain.com>)
- **Phones**: Various formats (US, international, toll-free)
- **URLs**: HTTP/HTTPS links
- **Dates**: Multiple formats (2024-01-15, Jan 15, 2024, 1/15/2024)
- **Prices**: Currency amounts ($99.99, 100 USD, 50.00 EUR)

### Content Features for Classification

Numerical features useful for text classification:

```typescript
const { features: contentFeatures } = features

console.log('Content Features:')
console.log(`  Average Sentence Length: ${contentFeatures.averageSentenceLength.toFixed(1)} words`)
console.log(`  Average Word Length: ${contentFeatures.averageWordLength.toFixed(1)} chars`)
console.log(`  Punctuation Density: ${(contentFeatures.punctuationDensity * 100).toFixed(2)}%`)
console.log(`  Uppercase Ratio: ${(contentFeatures.uppercaseRatio * 100).toFixed(2)}%`)
console.log(`  Number Density: ${(contentFeatures.numberDensity * 100).toFixed(2)}%`)
console.log(`  Link Density: ${(contentFeatures.linkDensity * 100).toFixed(2)}%`)
console.log(`  Question Ratio: ${(contentFeatures.questionRatio * 100).toFixed(2)}%`)
```

Use these features to classify content as:

- Technical documentation (high number density)
- News articles (balanced features)
- Marketing content (high question ratio)
- Academic papers (long sentences, complex vocabulary)
- Social media (short sentences, high link density)

### Sentiment Analysis

Basic sentiment scoring using positive/negative word lists:

```typescript
const { sentiment } = features

console.log('Sentiment Analysis:')
console.log(`  Positive Words: ${sentiment.positiveWords}`)
console.log(`  Negative Words: ${sentiment.negativeWords}`)
console.log(`  Neutral Words: ${sentiment.neutralWords}`)
console.log(`  Score: ${sentiment.score.toFixed(2)} (range: -1 to +1)`)

if (sentiment.score > 0.2) {
  console.log('  Overall: Positive')
}
else if (sentiment.score < -0.2) {
  console.log('  Overall: Negative')
}
else {
  console.log('  Overall: Neutral')
}
```

Sentiment scoring:

- **+1.0**: Extremely positive
- **+0.5**: Moderately positive
- **0.0**: Neutral
- **-0.5**: Moderately negative
- **-1.0**: Extremely negative

Note: This is basic word-list sentiment analysis. For production use, consider integrating with specialized sentiment analysis APIs or models.

### Document Statistics

Get comprehensive text statistics:

```typescript
const { stats } = features

console.log('Document Statistics:')
console.log(`  Total Words: ${stats.totalWords}`)
console.log(`  Unique Words: ${stats.uniqueWords}`)
console.log(`  Total Sentences: ${stats.totalSentences}`)
console.log(`  Total Paragraphs: ${stats.totalParagraphs}`)
console.log(`  Vocabulary Richness: ${(stats.vocabularyRichness * 100).toFixed(1)}%`)

// Vocabulary richness (unique words / total words)
// - High (>0.7): Diverse vocabulary, technical or literary content
// - Medium (0.4-0.7): Normal varied content
// - Low (<0.4): Repetitive content, may be spam or low-quality
```

## Advanced Usage

### Document Embeddings Pipeline

Prepare content for embedding generation:

```typescript
import { extractMLFeatures } from 'ts-web-scraper'

interface DocumentEmbedding {
  url: string
  title: string
  content: string
  chunks: string[]
  metadata: {
    wordCount: number
    sentiment: number
    entities: number
  }
}

function prepareForEmbedding(
  html: string,
  url: string,
  chunkSize: number = 500
): DocumentEmbedding {
  const features = extractMLFeatures(html)

  // Split into chunks for embedding (500 words per chunk)
  const words = features.textContent.split(/\s+/)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 0) {
      chunks.push(chunk)
    }
  }

  // Extract title from first heading
  const title = features.sections.find(s => s.type === 'heading')?.content || 'Untitled'

  // Count total entities
  const entityCount
    = features.entities.emails.length
      + features.entities.phones.length
      + features.entities.urls.length
      + features.entities.dates.length
      + features.entities.prices.length

  return {
    url,
    title,
    content: features.textContent,
    chunks,
    metadata: {
      wordCount: features.stats.totalWords,
      sentiment: features.sentiment.score,
      entities: entityCount,
    },
  }
}

const doc = prepareForEmbedding(html, 'https://example.com')

// Send chunks to OpenAI for embeddings
for (const chunk of doc.chunks) {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunk,
  })
  // Store embedding with metadata
}
```

### Content Classification

Build a content type classifier:

```typescript
type ContentType = 'article' | 'product' | 'documentation' | 'forum' | 'social'

function classifyContent(features: ReturnType<typeof extractMLFeatures>): ContentType {
  const { features: cf, entities, stats } = features

  // Product pages have prices and structured data
  if (entities.prices.length > 0 && stats.totalWords < 1000) {
    return 'product'
  }

  // Documentation has high vocabulary richness and technical terms
  if (
    stats.vocabularyRichness > 0.6
    && cf.numberDensity > 0.05
    && cf.linkDensity > 0.1
  ) {
    return 'documentation'
  }

  // Forum posts have high question ratio and short paragraphs
  if (cf.questionRatio > 0.2 && stats.totalWords < 2000) {
    return 'forum'
  }

  // Social media has short text and high link density
  if (stats.totalWords < 500 && cf.linkDensity > 0.15) {
    return 'social'
  }

  // Default to article
  return 'article'
}

const html = await fetch('https://example.com').then(r => r.text())
const features = extractMLFeatures(html)
const type = classifyContent(features)
console.log(`Content Type: ${type}`)
```

### Quality Scoring

Score content quality for filtering:

```typescript
interface QualityScore {
  score: number // 0-100
  factors: {
    length: number
    vocabularyRichness: number
    structure: number
    sentiment: number
  }
  verdict: 'excellent' | 'good' | 'fair' | 'poor'
}

function scoreContentQuality(
  features: ReturnType<typeof extractMLFeatures>
): QualityScore {
  let lengthScore = 0
  if (features.stats.totalWords > 1000)
    lengthScore = 100
  else if (features.stats.totalWords > 500)
    lengthScore = 75
  else if (features.stats.totalWords > 200)
    lengthScore = 50
  else lengthScore = 25

  const vocabScore = features.stats.vocabularyRichness * 100

  let structureScore = 0
  const headingCount = features.sections.filter(s => s.type === 'heading').length
  const paragraphCount = features.sections.filter(s => s.type === 'paragraph').length
  if (headingCount > 0 && paragraphCount > 3)
    structureScore = 100
  else if (paragraphCount > 0)
    structureScore = 50

  // Neutral to slightly positive sentiment is good
  const sentimentScore = 50 + (features.sentiment.score * 25)

  const totalScore = (
    lengthScore * 0.3
    + vocabScore * 0.3
    + structureScore * 0.3
    + sentimentScore * 0.1
  )

  let verdict: QualityScore['verdict']
  if (totalScore >= 80)
    verdict = 'excellent'
  else if (totalScore >= 60)
    verdict = 'good'
  else if (totalScore >= 40)
    verdict = 'fair'
  else verdict = 'poor'

  return {
    score: Math.round(totalScore),
    factors: {
      length: Math.round(lengthScore),
      vocabularyRichness: Math.round(vocabScore),
      structure: Math.round(structureScore),
      sentiment: Math.round(sentimentScore),
    },
    verdict,
  }
}

const quality = scoreContentQuality(features)
console.log(`Quality: ${quality.verdict} (${quality.score}/100)`)
```

### RAG System Integration

Prepare content for Retrieval-Augmented Generation:

```typescript
interface RAGDocument {
  id: string
  text: string
  sections: Array<{
    heading: string
    content: string
    order: number
  }>
  entities: {
    contacts: string[]
    references: string[]
    dates: string[]
  }
  metadata: {
    wordCount: number
    sentiment: number
    topics: string[]
  }
}

function prepareForRAG(
  html: string,
  url: string
): RAGDocument {
  const features = extractMLFeatures(html)
  const sections = features.sections

  // Group paragraphs under headings
  const structuredSections: RAGDocument['sections'] = []
  let currentHeading = 'Introduction'

  for (const section of sections) {
    if (section.type === 'heading') {
      currentHeading = section.content
      structuredSections.push({
        heading: currentHeading,
        content: '',
        order: section.order,
      })
    }
    else if (section.type === 'paragraph') {
      const lastSection = structuredSections[structuredSections.length - 1]
      if (lastSection) {
        lastSection.content += `${section.content} `
      }
      else {
        structuredSections.push({
          heading: currentHeading,
          content: section.content,
          order: section.order,
        })
      }
    }
  }

  // Extract topic keywords (simplified)
  const words = features.textContent.toLowerCase().split(/\s+/)
  const wordCounts: Record<string, number> = {}
  words.forEach((word) => {
    if (word.length > 5) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    }
  })
  const topics = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  return {
    id: url,
    text: features.textContent,
    sections: structuredSections,
    entities: {
      contacts: [...features.entities.emails, ...features.entities.phones],
      references: features.entities.urls,
      dates: features.entities.dates,
    },
    metadata: {
      wordCount: features.stats.totalWords,
      sentiment: features.sentiment.score,
      topics,
    },
  }
}

const ragDoc = prepareForRAG(html, 'https://example.com')

// Store in vector database
// await vectorDB.upsert({
//   id: ragDoc.id,
//   text: ragDoc.text,
//   metadata: ragDoc.metadata
// })
```

## Real-World Use Cases

### 1. Building a Semantic Search Engine

```typescript
import { extractMLFeatures } from 'ts-web-scraper'

interface SearchableDocument {
  id: string
  url: string
  title: string
  content: string
  embedding: number[] // From OpenAI or similar
  metadata: {
    wordCount: number
    sentiment: number
    entities: string[]
  }
}

async function indexWebPage(url: string): Promise<SearchableDocument> {
  const html = await fetch(url).then(r => r.text())
  const features = extractMLFeatures(html)

  const title = features.sections.find(s => s.type === 'heading')?.content || url

  // Get all entities
  const entities = [
    ...features.entities.emails,
    ...features.entities.phones,
    ...features.entities.urls,
  ]

  // Generate embedding (pseudo-code)
  const embedding = await generateEmbedding(features.textContent)

  return {
    id: crypto.randomUUID(),
    url,
    title,
    content: features.textContent,
    embedding,
    metadata: {
      wordCount: features.stats.totalWords,
      sentiment: features.sentiment.score,
      entities,
    },
  }
}

// Index multiple pages
const urls = [
  'https://example.com/doc1',
  'https://example.com/doc2',
  'https://example.com/doc3',
]

for (const url of urls) {
  const doc = await indexWebPage(url)
  // Store in vector database
  console.log(`Indexed: ${doc.title}`)
}
```

### 2. Content Recommendation System

```typescript
function calculateSimilarity(
  doc1: ReturnType<typeof extractMLFeatures>,
  doc2: ReturnType<typeof extractMLFeatures>
): number {
  // Calculate feature similarity
  const sentimentDiff = Math.abs(doc1.sentiment.score - doc2.sentiment.score)
  const vocabDiff = Math.abs(doc1.stats.vocabularyRichness - doc2.stats.vocabularyRichness)
  const lengthRatio = Math.min(doc1.stats.totalWords, doc2.stats.totalWords)
    / Math.max(doc1.stats.totalWords, doc2.stats.totalWords)

  // Word overlap
  const words1 = new Set(doc1.textContent.toLowerCase().split(/\s+/))
  const words2 = new Set(doc2.textContent.toLowerCase().split(/\s+/))
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const overlap = intersection.size / Math.max(words1.size, words2.size)

  // Combine metrics (0-100 scale)
  const score
    = (1 - sentimentDiff) * 20
      + (1 - vocabDiff) * 20
      + lengthRatio * 20
      + overlap * 40

  return Math.round(score * 100) / 100
}

async function findSimilarContent(targetUrl: string, candidateUrls: string[]) {
  const targetHtml = await fetch(targetUrl).then(r => r.text())
  const targetFeatures = extractMLFeatures(targetHtml)

  const similarities = []

  for (const url of candidateUrls) {
    const html = await fetch(url).then(r => r.text())
    const features = extractMLFeatures(html)
    const similarity = calculateSimilarity(targetFeatures, features)

    similarities.push({ url, similarity })
  }

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
}
```

### 3. Content Monitoring and Alerting

```typescript
interface ContentAlert {
  url: string
  timestamp: string
  alertType: 'sentiment' | 'quality' | 'entity'
  message: string
  severity: 'low' | 'medium' | 'high'
}

function monitorContent(
  features: ReturnType<typeof extractMLFeatures>,
  url: string
): ContentAlert[] {
  const alerts: ContentAlert[] = []

  // Check for negative sentiment
  if (features.sentiment.score < -0.5) {
    alerts.push({
      url,
      timestamp: new Date().toISOString(),
      alertType: 'sentiment',
      message: `Strongly negative sentiment detected (${features.sentiment.score.toFixed(2)})`,
      severity: 'high',
    })
  }

  // Check for low quality
  if (features.stats.totalWords < 100 || features.stats.vocabularyRichness < 0.3) {
    alerts.push({
      url,
      timestamp: new Date().toISOString(),
      alertType: 'quality',
      message: 'Low content quality detected',
      severity: 'medium',
    })
  }

  // Check for sensitive entities (example: emails in public content)
  if (features.entities.emails.length > 5) {
    alerts.push({
      url,
      timestamp: new Date().toISOString(),
      alertType: 'entity',
      message: `Many email addresses found (${features.entities.emails.length})`,
      severity: 'low',
    })
  }

  return alerts
}
```

## Best Practices

1. **Chunk Long Documents**: For embeddings, split content into 500-1000 word chunks
2. **Clean Before Processing**: Remove navigation and boilerplate for better quality
3. **Combine with Metadata**: Use alongside SEO metadata for richer context
4. **Validate Entities**: Entity extraction is pattern-based; validate critical data
5. **Consider Language**: Current implementation is English-focused
6. **Filter Short Content**: Content < 100 words may not have meaningful features
7. **Cache Extracted Features**: Feature extraction is CPU-intensive; cache results

## Limitations

- Sentiment analysis is basic word-list based (not context-aware)
- Entity extraction uses regex patterns (may have false positives)
- No language-specific optimizations beyond English
- Cannot extract entities from images or embedded content
- No named entity recognition for people, organizations, locations
- Section extraction limited to common HTML patterns

For production ML pipelines, consider:

- Using specialized NLP libraries (spaCy, NLTK) for entity extraction
- Integrating sentiment analysis APIs (Google Cloud, AWS Comprehend)
- Adding language detection and multi-language support
- Implementing custom models for domain-specific entity extraction
- Using transformer-based models for better text understanding

## TypeScript Types

```typescript
interface MLFeatures {
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

interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code'
  content: string
  level?: number // for headings
  order: number
}
```
