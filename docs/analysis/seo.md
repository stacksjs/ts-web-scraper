# SEO Analysis

Comprehensive SEO analysis including readability scoring, keyword density, content statistics, and actionable optimization recommendations.

## Overview

The SEO analyzer evaluates web content for search engine optimization, providing readability scores, keyword analysis, content structure assessment, and specific recommendations for improvement. It uses industry-standard metrics like Flesch Reading Ease and identifies common SEO issues.

## Basic Usage

```typescript
import { analyzeSEO } from 'ts-web-scraper'

const html = await fetch('https://example.com').then(r => r.text())
const seo = analyzeSEO(html)

console.log(`Readability Score: ${seo.readabilityScore}/100`)
console.log(`Word Count: ${seo.stats.wordCount}`)
console.log(`Top Keywords:`, seo.topKeywords.slice(0, 5))
console.log(`Warnings: ${seo.warnings.length}`)
```

## Readability Analysis

### Readability Score

Get an overall readability score from 0-100 (higher is better):

```typescript
const { readabilityScore } = seo

console.log(`Readability: ${readabilityScore}/100`)

if (readabilityScore >= 80) {
  console.log('Very easy to read - suitable for general audience')
}
else if (readabilityScore >= 60) {
  console.log('Plain English - easily understood by 13-15 year olds')
}
else if (readabilityScore >= 50) {
  console.log('Fairly difficult - high school level')
}
else if (readabilityScore >= 30) {
  console.log('Difficult - college level')
}
else {
  console.log('Very difficult - professional/academic level')
}
```

### Flesch Reading Ease

Get the standard Flesch Reading Ease score:

```typescript
const { fleschScore } = seo

console.log(`Flesch Reading Ease: ${fleschScore.toFixed(1)}`)

// Score interpretation:
// 90-100: Very Easy (5th grade)
// 80-89: Easy (6th grade)
// 70-79: Fairly Easy (7th grade)
// 60-69: Standard (8th-9th grade)
// 50-59: Fairly Difficult (10th-12th grade)
// 30-49: Difficult (College)
// 0-29: Very Confusing (College graduate)
```

The Flesch Reading Ease formula:

```
206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
```

Higher scores indicate easier readability.

## Keyword Analysis

### Keyword Density

Analyze keyword usage throughout the content:

```typescript
const { keywordDensity } = seo

console.log('Keyword Density:')
Object.entries(keywordDensity)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([keyword, density]) => {
    console.log(`  ${keyword}: ${density.toFixed(2)}%`)
  })
```

Keyword density is calculated as:

```
(keyword occurrences / total words) × 100
```

Optimal density: 1-3% for target keywords

### Top Keywords

Get the most important keywords with counts:

```typescript
const { topKeywords } = seo

console.log('Top Keywords:')
topKeywords.forEach(({ keyword, count, density }, i) => {
  console.log(`${i + 1}. ${keyword}`)
  console.log(`   Count: ${count}`)
  console.log(`   Density: ${density.toFixed(2)}%`)
})
```

The analyzer:

- Filters out common stop words (the, and, that, etc.)
- Focuses on words longer than 3 characters
- Returns top 10 keywords by frequency

## Content Statistics

### Comprehensive Stats

Get detailed content metrics:

```typescript
const { stats } = seo

console.log('Content Statistics:')
console.log(`  Words: ${stats.wordCount}`)
console.log(`  Sentences: ${stats.sentenceCount}`)
console.log(`  Paragraphs: ${stats.paragraphCount}`)
console.log(`  Avg Words/Sentence: ${stats.averageWordsPerSentence.toFixed(1)}`)
console.log(`  Avg Syllables/Word: ${stats.averageSyllablesPerWord.toFixed(1)}`)
```

Content recommendations by word count:

- Blog posts: 1,500-2,500 words
- Product pages: 300-500 words
- Landing pages: 500-1,000 words
- Pillar content: 3,000+ words

### Heading Structure

Analyze heading hierarchy:

```typescript
const { headings } = seo

console.log('Heading Structure:')
console.log(`  H1: ${headings.h1}`)
console.log(`  H2: ${headings.h2}`)
console.log(`  H3: ${headings.h3}`)
console.log(`  H4: ${headings.h4}`)
console.log(`  H5: ${headings.h5}`)
console.log(`  H6: ${headings.h6}`)

// Good structure:
// - One H1 (page title)
// - Multiple H2s (main sections)
// - H3s under H2s (subsections)
// - Avoid skipping levels (H1 → H3)
```

## Warnings and Recommendations

### SEO Warnings

Get specific SEO issues:

```typescript
if (seo.warnings.length > 0) {
  console.log('SEO Warnings:')
  seo.warnings.forEach((warning) => {
    console.log(`  ⚠️  ${warning}`)
  })
}

// Common warnings:
// - No H1 heading found
// - Multiple H1 headings found (3)
// - Content is too short (< 300 words)
// - Content readability is difficult
// - No clear keyword focus detected
// - Possible keyword stuffing detected for "example" (7.5%)
```

### Recommendations

Get actionable improvement suggestions:

```typescript
if (seo.recommendations.length > 0) {
  console.log('\nRecommendations:')
  seo.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`)
  })
}

// Common recommendations:
// - Add a single H1 heading that describes the main topic
// - Use only one H1 heading per page
// - Aim for at least 300-500 words for better SEO
// - Simplify sentences and use more common words
// - Focus on specific keywords throughout the content
// - Reduce keyword repetition and use synonyms
```

## Advanced Usage

### Complete SEO Audit

Generate a comprehensive SEO report:

```typescript
import { analyzeSEO } from 'ts-web-scraper'

interface SEOReport {
  url: string
  score: number
  readability: {
    score: number
    flesch: number
    grade: string
  }
  content: {
    wordCount: number
    adequate: boolean
    quality: string
  }
  keywords: {
    top: Array<{ keyword: string, density: number }>
    focused: boolean
    stuffing: boolean
  }
  structure: {
    h1Count: number
    valid: boolean
    totalHeadings: number
  }
  issues: string[]
  recommendations: string[]
}

function generateSEOReport(html: string, url: string): SEOReport {
  const seo = analyzeSEO(html)

  // Readability grade level
  let grade = 'Graduate'
  if (seo.fleschScore >= 90)
    grade = 'Elementary'
  else if (seo.fleschScore >= 70)
    grade = 'Middle School'
  else if (seo.fleschScore >= 60)
    grade = 'High School'
  else if (seo.fleschScore >= 30)
    grade = 'College'

  // Content quality assessment
  let quality = 'poor'
  if (seo.stats.wordCount >= 1500)
    quality = 'excellent'
  else if (seo.stats.wordCount >= 500)
    quality = 'good'
  else if (seo.stats.wordCount >= 300)
    quality = 'fair'

  // Calculate overall SEO score
  let score = 100
  score -= seo.warnings.length * 5
  if (seo.readabilityScore < 50)
    score -= 20
  if (seo.stats.wordCount < 300)
    score -= 25

  return {
    url,
    score: Math.max(0, score),
    readability: {
      score: seo.readabilityScore,
      flesch: seo.fleschScore,
      grade,
    },
    content: {
      wordCount: seo.stats.wordCount,
      adequate: seo.stats.wordCount >= 300,
      quality,
    },
    keywords: {
      top: seo.topKeywords.slice(0, 5),
      focused: seo.topKeywords.length > 0,
      stuffing: seo.topKeywords.some(k => k.density > 5),
    },
    structure: {
      h1Count: seo.headings.h1,
      valid: seo.headings.h1 === 1,
      totalHeadings: Object.values(seo.headings).reduce((a, b) => a + b, 0),
    },
    issues: seo.warnings,
    recommendations: seo.recommendations,
  }
}

const report = generateSEOReport(html, 'https://example.com')
console.log(JSON.stringify(report, null, 2))
```

### Keyword Optimization Checker

Check if content is optimized for target keywords:

```typescript
interface KeywordOptimization {
  keyword: string
  present: boolean
  density: number
  optimal: boolean
  inTitle: boolean
  inHeadings: number
  recommendations: string[]
}

function checkKeywordOptimization(
  html: string,
  targetKeyword: string
): KeywordOptimization {
  const seo = analyzeSEO(html)
  const keyword = targetKeyword.toLowerCase()

  // Check density
  const density = seo.keywordDensity[keyword] || 0
  const optimal = density >= 1 && density <= 3

  // Check title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].toLowerCase() : ''
  const inTitle = title.includes(keyword)

  // Check headings
  let inHeadings = 0
  for (let i = 1; i <= 6; i++) {
    const headingRegex = new RegExp(`<h${i}[^>]*>([^<]+)</h${i}>`, 'gi')
    const headings = html.matchAll(headingRegex)
    for (const match of headings) {
      if (match[1].toLowerCase().includes(keyword)) {
        inHeadings++
      }
    }
  }

  // Generate recommendations
  const recommendations: string[] = []

  if (!inTitle) {
    recommendations.push(`Include "${targetKeyword}" in the page title`)
  }

  if (inHeadings === 0) {
    recommendations.push(`Use "${targetKeyword}" in at least one heading`)
  }

  if (density === 0) {
    recommendations.push(`Add "${targetKeyword}" to the content`)
  }
  else if (density < 1) {
    recommendations.push(`Increase keyword density (currently ${density.toFixed(2)}%)`)
  }
  else if (density > 3) {
    recommendations.push(`Reduce keyword density to avoid stuffing (currently ${density.toFixed(2)}%)`)
  }

  return {
    keyword: targetKeyword,
    present: density > 0,
    density,
    optimal,
    inTitle,
    inHeadings,
    recommendations,
  }
}

const optimization = checkKeywordOptimization(html, 'machine learning')
console.log(`Keyword: ${optimization.keyword}`)
console.log(`Optimized: ${optimization.optimal ? 'Yes' : 'No'}`)
console.log(`Recommendations:`, optimization.recommendations)
```

### Competitive Content Analysis

Compare your content against competitors:

```typescript
interface ContentComparison {
  url: string
  wordCount: number
  readability: number
  keywordCount: number
  headingCount: number
  seoScore: number
}

async function compareContent(urls: string[]): Promise<ContentComparison[]> {
  const results: ContentComparison[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const seo = analyzeSEO(html)

    // Calculate simple SEO score
    let score = 50
    if (seo.headings.h1 === 1)
      score += 10
    if (seo.stats.wordCount >= 500)
      score += 20
    if (seo.readabilityScore >= 60)
      score += 20
    score -= seo.warnings.length * 5

    results.push({
      url,
      wordCount: seo.stats.wordCount,
      readability: seo.readabilityScore,
      keywordCount: seo.topKeywords.length,
      headingCount: Object.values(seo.headings).reduce((a, b) => a + b, 0),
      seoScore: Math.max(0, Math.min(100, score)),
    })
  }

  // Sort by SEO score
  results.sort((a, b) => b.seoScore - a.seoScore)

  console.log('Content Comparison:')
  console.log('Rank | Score | Words | Readability | Keywords | URL')
  console.log('-'.repeat(80))

  results.forEach((r, i) => {
    console.log(
      `${i + 1}. | ${r.seoScore} | ${r.wordCount} | ${r.readability} | ${r.keywordCount} | ${r.url}`
    )
  })

  return results
}

await compareContent([
  'https://yoursite.com/article',
  'https://competitor1.com/article',
  'https://competitor2.com/article',
])
```

### Content Freshness Tracker

Monitor and track SEO metrics over time:

```typescript
interface SEOHistory {
  url: string
  measurements: Array<{
    timestamp: string
    wordCount: number
    readability: number
    keywords: number
    warnings: number
  }>
}

class SEOMonitor {
  private history: Map<string, SEOHistory> = new Map()

  async measure(url: string) {
    const html = await fetch(url).then(r => r.text())
    const seo = analyzeSEO(html)

    if (!this.history.has(url)) {
      this.history.set(url, { url, measurements: [] })
    }

    this.history.get(url)!.measurements.push({
      timestamp: new Date().toISOString(),
      wordCount: seo.stats.wordCount,
      readability: seo.readabilityScore,
      keywords: seo.topKeywords.length,
      warnings: seo.warnings.length,
    })
  }

  getChanges(url: string) {
    const history = this.history.get(url)
    if (!history || history.measurements.length < 2)
      return null

    const recent = history.measurements[history.measurements.length - 1]
    const previous = history.measurements[history.measurements.length - 2]

    return {
      wordCountChange: recent.wordCount - previous.wordCount,
      readabilityChange: recent.readability - previous.readability,
      keywordChange: recent.keywords - previous.keywords,
      warningChange: recent.warnings - previous.warnings,
      improved: recent.warnings < previous.warnings,
    }
  }
}

const monitor = new SEOMonitor()
await monitor.measure('https://example.com')

// Later...
await monitor.measure('https://example.com')
const changes = monitor.getChanges('https://example.com')
console.log('SEO Changes:', changes)
```

## Real-World Use Cases

### 1. Content Quality Gates

Enforce minimum SEO standards before publishing:

```typescript
interface QualityGate {
  minWordCount: number
  minReadability: number
  requireH1: boolean
  maxWarnings: number
}

function passesQualityGate(
  html: string,
  gate: QualityGate
): { passed: boolean, failures: string[] } {
  const seo = analyzeSEO(html)
  const failures: string[] = []

  if (seo.stats.wordCount < gate.minWordCount) {
    failures.push(`Word count too low: ${seo.stats.wordCount} (min: ${gate.minWordCount})`)
  }

  if (seo.readabilityScore < gate.minReadability) {
    failures.push(`Readability too low: ${seo.readabilityScore} (min: ${gate.minReadability})`)
  }

  if (gate.requireH1 && seo.headings.h1 !== 1) {
    failures.push(`Must have exactly one H1 heading (found: ${seo.headings.h1})`)
  }

  if (seo.warnings.length > gate.maxWarnings) {
    failures.push(`Too many warnings: ${seo.warnings.length} (max: ${gate.maxWarnings})`)
  }

  return {
    passed: failures.length === 0,
    failures,
  }
}

// In CMS or CI/CD
const result = passesQualityGate(html, {
  minWordCount: 500,
  minReadability: 60,
  requireH1: true,
  maxWarnings: 2,
})

if (!result.passed) {
  console.error('Content does not meet quality standards:')
  result.failures.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
}
```

### 2. SEO-Friendly Content Generator

Generate content outlines based on SEO best practices:

```typescript
interface ContentOutline {
  title: string
  targetWordCount: number
  targetKeyword: string
  structure: Array<{
    level: number
    heading: string
    targetWords: number
  }>
  recommendations: string[]
}

function generateContentOutline(
  topic: string,
  targetKeyword: string
): ContentOutline {
  return {
    title: `The Complete Guide to ${topic}`,
    targetWordCount: 2000,
    targetKeyword,
    structure: [
      { level: 1, heading: `The Complete Guide to ${topic}`, targetWords: 0 },
      { level: 2, heading: 'Introduction', targetWords: 200 },
      { level: 2, heading: `What is ${topic}?`, targetWords: 300 },
      { level: 2, heading: `Why ${topic} Matters`, targetWords: 300 },
      { level: 2, heading: 'Getting Started', targetWords: 400 },
      { level: 3, heading: 'Step 1: Setup', targetWords: 200 },
      { level: 3, heading: 'Step 2: Implementation', targetWords: 200 },
      { level: 2, heading: 'Best Practices', targetWords: 300 },
      { level: 2, heading: 'Conclusion', targetWords: 200 },
    ],
    recommendations: [
      `Use "${targetKeyword}" in the H1 heading`,
      `Include "${targetKeyword}" in 2-3 H2 headings`,
      'Aim for 2000 words total',
      'Target readability score of 60-70',
      'Include internal links to related content',
      'Add images with descriptive alt text',
      'Write a compelling meta description',
    ],
  }
}

const outline = generateContentOutline('Machine Learning', 'machine learning basics')
console.log(outline)
```

### 3. Bulk SEO Audit

Audit multiple pages at once:

```typescript
async function bulkSEOAudit(urls: string[]) {
  console.log(`Auditing ${urls.length} pages...\n`)

  const results = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const seo = analyzeSEO(html)

    const issues = seo.warnings.length
    const score = 100 - (issues * 10) - (seo.readabilityScore < 60 ? 20 : 0)

    results.push({
      url,
      wordCount: seo.stats.wordCount,
      readability: seo.readabilityScore,
      h1Count: seo.headings.h1,
      issues,
      score: Math.max(0, score),
      topKeyword: seo.topKeywords[0]?.keyword || 'none',
    })
  }

  // Summary
  console.log('=== SEO Audit Summary ===\n')
  console.log(`Total Pages: ${results.length}`)
  console.log(`Average Score: ${(results.reduce((a, b) => a + b.score, 0) / results.length).toFixed(1)}`)
  console.log(`Pages with Issues: ${results.filter(r => r.issues > 0).length}`)
  console.log(`Pages without H1: ${results.filter(r => r.h1Count !== 1).length}`)
  console.log(`Pages < 300 words: ${results.filter(r => r.wordCount < 300).length}`)

  // Detailed results
  console.log('\n=== Detailed Results ===\n')
  results.forEach((r) => {
    const status = r.score >= 80 ? '✓' : r.score >= 60 ? '⚠' : '✗'
    console.log(`${status} ${r.url}`)
    console.log(`   Score: ${r.score}/100 | Words: ${r.wordCount} | Issues: ${r.issues}`)
  })

  return results
}

await bulkSEOAudit([
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
])
```

## Best Practices

1. **Target 300+ Words**: Minimum for meaningful SEO value
2. **One H1 Per Page**: Clear page hierarchy with single main heading
3. **Readability 60-70**: Balance between sophistication and accessibility
4. **Keyword Density 1-3%**: Natural usage without stuffing
5. **Use Subheadings**: Break content with H2-H3 for scannability
6. **Write for Humans First**: SEO follows good writing
7. **Update Regularly**: Fresh content performs better
8. **Internal Linking**: Link to related content on your site
9. **Meta Descriptions**: Write compelling descriptions (not analyzed here)
10. **Mobile-Friendly**: Ensure responsive design (not analyzed here)

## Limitations

- Does not analyze meta descriptions, title tags, or structured data
- Cannot check for broken links or image optimization
- Does not verify keyword relevance to search intent
- No competitor analysis or keyword research
- Cannot measure actual search rankings or traffic
- Does not analyze page speed or mobile-friendliness
- Basic syllable counting (not linguistically perfect)
- Stop word list is English-only

For comprehensive SEO:

- Use Google Search Console for actual performance
- Combine with tools like Ahrefs or SEMrush
- Verify technical SEO (sitemaps, robots.txt)
- Check backlinks and domain authority
- Monitor Core Web Vitals
- Test with actual users and search engines

## TypeScript Types

```typescript
interface SEOAnalysis {
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
```
