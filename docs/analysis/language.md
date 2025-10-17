# Language Detection

Detect page language, identify alternate language versions, and assess internationalization readiness.

## Overview

The language detector provides comprehensive language analysis including primary language detection with confidence scoring, alternate language version discovery, writing direction detection, and internationalization readiness assessment. It supports both explicit language declarations and content-based detection.

## Basic Usage

```typescript
import { detectLanguage } from 'ts-web-scraper'

const html = await fetch('https://example.com').then(r => r.text())
const language = detectLanguage(html)

console.log(`Primary Language: ${language.primary}`)
console.log(`Confidence: ${language.confidence}%`)
console.log(`Direction: ${language.direction}`)
console.log(`Multilingual Ready: ${language.i18n.multilingualReady}`)
```

## Language Detection

### Primary Language

Detect the main language of the page:

```typescript
const { primary, confidence } = language

console.log(`Primary Language: ${primary}`) // e.g., 'en', 'es', 'fr'
console.log(`Confidence: ${confidence}%`)

// Language codes follow ISO 639-1 standard
const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic',
}

console.log(`Language: ${languageNames[primary] || primary}`)
```

Detection sources (in order of priority):

1. `<html lang="">` attribute
2. `<meta http-equiv="content-language">` tag
3. `og:locale` Open Graph meta tag
4. Content analysis using word frequency

### Confidence Scoring

Understand how confident the detection is:

```typescript
const { confidence } = language

if (confidence >= 90) {
  console.log('Very confident - multiple sources agree')
}
else if (confidence >= 75) {
  console.log('Confident - main indicators present')
}
else if (confidence >= 50) {
  console.log('Moderate - based on limited indicators')
}
else {
  console.log('Low confidence - fallback detection used')
}
```

Confidence calculation:

- Base confidence: 50%
- +25% if `<html lang="">` matches detected language
- +15% if content-language meta matches
- +10% if og:locale matches
- Maximum: 100%

### Alternative Languages

Detect multiple languages present in the content:

```typescript
const { alternatives } = language

if (alternatives.length > 1) {
  console.log('Multilingual content detected!')
  console.log('Languages found:')
  alternatives.forEach((lang) => {
    console.log(`  - ${lang}`)
  })
}
```

This detects `lang` attributes throughout the document, indicating embedded content in different languages (e.g., quotes, code samples, multilingual sections).

### Alternate Language Versions

Find hreflang alternate URLs for different languages:

```typescript
const { alternateVersions } = language

if (alternateVersions.length > 0) {
  console.log('This page is available in multiple languages:')
  alternateVersions.forEach((alt) => {
    console.log(`  ${alt.lang}: ${alt.href}`)
  })
}

// Example output:
// This page is available in multiple languages:
//   en: https://example.com/en/page
//   es: https://example.com/es/page
//   fr: https://example.com/fr/page
//   de: https://example.com/de/page
```

Hreflang links are used by search engines to:

- Serve the correct language version to users
- Avoid duplicate content penalties
- Improve international SEO

### Writing Direction

Determine text direction for proper display:

```typescript
const { direction } = language

console.log(`Text Direction: ${direction}`)

// Use in CSS
const textDirection = direction === 'rtl' ? 'rtl' : 'ltr'
document.documentElement.dir = textDirection
```

Right-to-left (RTL) languages:

- Arabic (ar)
- Hebrew (he)
- Persian/Farsi (fa)
- Urdu (ur)
- Yiddish (yi)

All other languages default to left-to-right (LTR).

### Character Set

Detect the declared character encoding:

```typescript
const { charset } = language

console.log(`Character Set: ${charset || 'Not specified'}`)

// Common character sets:
// - utf-8: Universal Unicode encoding (recommended)
// - iso-8859-1: Western European
// - windows-1252: Windows Western European
```

## Internationalization (i18n) Readiness

### Multilingual Site Assessment

Check if the site is prepared for multiple languages:

```typescript
const { i18n } = language

console.log('Internationalization Readiness:')
console.log(`  Language Switcher UI: ${i18n.hasLanguageSwitcher ? '✓' : '✗'}`)
console.log(`  Hreflang Tags: ${i18n.hasHreflang ? '✓' : '✗'}`)
console.log(`  Multilingual Ready: ${i18n.multilingualReady ? '✓' : '✗'}`)

if (i18n.multilingualReady) {
  console.log('\nThis site is ready for multiple languages!')
}
else {
  console.log('\nThis site is not yet multilingual')
}
```

i18n readiness indicators:

- **hasLanguageSwitcher**: UI element for switching languages
- **hasHreflang**: Alternate language versions linked
- **multilingualReady**: Either switcher or hreflang present

### Language Switcher Detection

The detector looks for common language switcher patterns:

```typescript
// Patterns detected:
// - language-switcher
// - lang-selector
// - choose-language
// - select-language
// - language-picker

if (language.i18n.hasLanguageSwitcher) {
  console.log('Language switcher found in UI')
}
```

## Advanced Usage

### Complete Language Report

Generate a comprehensive language analysis report:

```typescript
import { detectLanguage } from 'ts-web-scraper'

function generateLanguageReport(html: string) {
  const lang = detectLanguage(html)

  const report = {
    primary: {
      language: lang.primary,
      confidence: lang.confidence,
      direction: lang.direction,
      charset: lang.charset,
    },
    multilingual: {
      alternativeLanguages: lang.alternatives,
      alternateVersions: lang.alternateVersions.length,
      versions: lang.alternateVersions,
    },
    i18n: {
      ready: lang.i18n.multilingualReady,
      hasLanguageSwitcher: lang.i18n.hasLanguageSwitcher,
      hasHreflang: lang.i18n.hasHreflang,
    },
    seo: {
      hreflangCount: lang.alternateVersions.length,
      hreflangConfigured: lang.alternateVersions.length > 0,
      languagesDeclared: lang.alternatives.length > 1,
    },
  }

  console.log('=== Language Analysis Report ===\n')
  console.log(`Primary: ${report.primary.language} (${report.primary.confidence}% confidence)`)
  console.log(`Direction: ${report.primary.direction}`)
  console.log(`Character Set: ${report.primary.charset || 'Not specified'}`)
  console.log()

  if (report.multilingual.alternateVersions > 0) {
    console.log(`Available Languages: ${report.multilingual.alternateVersions}`)
    report.multilingual.versions.forEach((v) => {
      console.log(`  - ${v.lang}: ${v.href}`)
    })
    console.log()
  }

  console.log('i18n Status:')
  console.log(`  Ready: ${report.i18n.ready ? 'Yes' : 'No'}`)
  console.log(`  Language Switcher: ${report.i18n.hasLanguageSwitcher ? 'Yes' : 'No'}`)
  console.log(`  Hreflang Tags: ${report.i18n.hasHreflang ? 'Yes' : 'No'}`)
  console.log()

  console.log('SEO:')
  console.log(`  Hreflang Configured: ${report.seo.hreflangConfigured ? 'Yes' : 'No'}`)
  console.log(`  Alternate Versions: ${report.seo.hreflangCount}`)

  return report
}

const html = await fetch('https://example.com').then(r => r.text())
const report = generateLanguageReport(html)
```

### Multi-Site Language Comparison

Compare language support across multiple websites:

```typescript
interface SiteLanguageSupport {
  url: string
  primaryLanguage: string
  languages: string[]
  hasI18n: boolean
  hasSwitcher: boolean
}

async function compareLanguageSupport(urls: string[]) {
  const results: SiteLanguageSupport[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const lang = detectLanguage(html)

    results.push({
      url,
      primaryLanguage: lang.primary,
      languages: lang.alternateVersions.map(v => v.lang),
      hasI18n: lang.i18n.multilingualReady,
      hasSwitcher: lang.i18n.hasLanguageSwitcher,
    })
  }

  console.log('Language Support Comparison:\n')
  console.log('Site | Primary | Languages | i18n | Switcher')
  console.log('-'.repeat(70))

  results.forEach((r) => {
    const langCount = r.languages.length || 1
    console.log(
      `${r.url.slice(0, 30).padEnd(30)} | ${r.primaryLanguage} | ${langCount} | ${r.hasI18n ? '✓' : '✗'} | ${r.hasSwitcher ? '✓' : '✗'}`
    )
  })

  return results
}

await compareLanguageSupport([
  'https://site1.com',
  'https://site2.com',
  'https://site3.com',
])
```

### Language-Specific Content Extraction

Extract content based on detected language:

```typescript
function extractByLanguage(html: string) {
  const lang = detectLanguage(html)

  // Extract content in the primary language only
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const content: string[] = []

  // Find all elements with matching lang attribute
  const elements = doc.querySelectorAll(`[lang="${lang.primary}"]`)
  elements.forEach((el) => {
    content.push(el.textContent || '')
  })

  // If no lang-specific elements, extract all content
  if (content.length === 0) {
    content.push(doc.body.textContent || '')
  }

  return {
    language: lang.primary,
    content: content.join('\n'),
  }
}
```

### Hreflang Validation

Validate hreflang implementation:

```typescript
interface HreflangIssue {
  type: 'missing_self' | 'invalid_code' | 'duplicate' | 'no_return_link'
  message: string
  severity: 'error' | 'warning'
}

function validateHreflang(
  html: string,
  currentUrl: string
): { valid: boolean, issues: HreflangIssue[] } {
  const lang = detectLanguage(html)
  const issues: HreflangIssue[] = []

  // Check for self-referencing hreflang
  const hasSelf = lang.alternateVersions.some(v =>
    v.href === currentUrl || v.lang === 'x-default'
  )

  if (!hasSelf && lang.alternateVersions.length > 0) {
    issues.push({
      type: 'missing_self',
      message: 'Missing self-referencing hreflang tag',
      severity: 'error',
    })
  }

  // Check for duplicate languages
  const langCodes = lang.alternateVersions.map(v => v.lang)
  const duplicates = langCodes.filter((lang, i) => langCodes.indexOf(lang) !== i)

  if (duplicates.length > 0) {
    issues.push({
      type: 'duplicate',
      message: `Duplicate hreflang codes: ${[...new Set(duplicates)].join(', ')}`,
      severity: 'error',
    })
  }

  // Validate language codes (basic check)
  const validCodes = /^[a-z]{2}(?:-[A-Z]{2})?$/
  const invalidCodes = langCodes.filter(code =>
    code !== 'x-default' && !validCodes.test(code)
  )

  if (invalidCodes.length > 0) {
    issues.push({
      type: 'invalid_code',
      message: `Invalid language codes: ${invalidCodes.join(', ')}`,
      severity: 'warning',
    })
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  }
}

const validation = validateHreflang(html, 'https://example.com/en/page')
if (!validation.valid) {
  console.log('Hreflang Issues:')
  validation.issues.forEach((issue) => {
    console.log(`  [${issue.severity}] ${issue.message}`)
  })
}
```

## Real-World Use Cases

### 1. Automatic Content Localization

```typescript
async function detectAndRoute(url: string, userLanguage: string) {
  const html = await fetch(url).then(r => r.text())
  const lang = detectLanguage(html)

  // Check if user's language is available
  const userLangVersion = lang.alternateVersions.find(v =>
    v.lang.startsWith(userLanguage)
  )

  if (userLangVersion) {
    console.log(`Redirecting to: ${userLangVersion.href}`)
    return userLangVersion.href
  }

  // Fallback to x-default or primary language
  const defaultVersion = lang.alternateVersions.find(v => v.lang === 'x-default')
  if (defaultVersion) {
    return defaultVersion.href
  }

  return url // Stay on current page
}

// User prefers Spanish
const localizedUrl = await detectAndRoute('https://example.com', 'es')
```

### 2. International SEO Audit

```typescript
interface SEOAudit {
  url: string
  language: string
  confidence: number
  issues: string[]
  recommendations: string[]
  score: number
}

async function auditInternationalSEO(url: string): Promise<SEOAudit> {
  const html = await fetch(url).then(r => r.text())
  const lang = detectLanguage(html)

  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  // Check language declaration
  if (lang.confidence < 75) {
    issues.push('Language not clearly declared')
    recommendations.push('Add lang attribute to <html> tag')
    score -= 20
  }

  // Check charset
  if (!lang.charset || lang.charset.toLowerCase() !== 'utf-8') {
    issues.push('Character set not UTF-8')
    recommendations.push('Use UTF-8 character encoding for international support')
    score -= 10
  }

  // Check hreflang
  if (lang.alternateVersions.length === 0) {
    recommendations.push('Consider adding hreflang tags for international versions')
    score -= 15
  }
  else {
    // Validate hreflang implementation
    const validation = validateHreflang(html, url)
    if (!validation.valid) {
      issues.push(...validation.issues.map(i => i.message))
      score -= 20
    }
  }

  // Check language switcher
  if (!lang.i18n.hasLanguageSwitcher && lang.alternateVersions.length > 0) {
    recommendations.push('Add language switcher UI for better user experience')
    score -= 10
  }

  return {
    url,
    language: lang.primary,
    confidence: lang.confidence,
    issues,
    recommendations,
    score: Math.max(0, score),
  }
}

const audit = await auditInternationalSEO('https://example.com')
console.log(`International SEO Score: ${audit.score}/100`)
```

### 3. Content Translation Workflow

```typescript
interface TranslationJob {
  sourceUrl: string
  sourceLanguage: string
  targetLanguages: string[]
  existingTranslations: string[]
  missingTranslations: string[]
}

async function planTranslations(
  url: string,
  desiredLanguages: string[]
): Promise<TranslationJob> {
  const html = await fetch(url).then(r => r.text())
  const lang = detectLanguage(html)

  const existing = lang.alternateVersions.map(v => v.lang)
  const missing = desiredLanguages.filter(target => !existing.includes(target))

  return {
    sourceUrl: url,
    sourceLanguage: lang.primary,
    targetLanguages: desiredLanguages,
    existingTranslations: existing,
    missingTranslations: missing,
  }
}

const job = await planTranslations('https://example.com', ['es', 'fr', 'de', 'ja'])
console.log(`Need to translate to: ${job.missingTranslations.join(', ')}`)
```

## Best Practices

1. **Always Set lang Attribute**: Use `<html lang="en">` for best detection accuracy
2. **Use UTF-8 Encoding**: Declare `<meta charset="utf-8">` for universal support
3. **Implement Hreflang**: Add hreflang tags for all language versions
4. **Self-Reference**: Include current page in hreflang with its own language code
5. **Use x-default**: Add `x-default` hreflang for default/fallback version
6. **Bidirectional Links**: Ensure all hreflang links are reciprocal
7. **Consistent URLs**: Use absolute URLs in hreflang tags
8. **Language Switcher**: Provide UI for users to change language
9. **Content-Language Match**: Ensure meta content-language matches actual content

## Limitations

- Content-based detection is English-focused (good coverage for 9 languages)
- Cannot detect languages from images or embedded content
- Basic word-list approach may misidentify short content
- No automatic translation capability
- Cannot verify if hreflang URLs are accessible
- No support for regional variants beyond standard codes (en-US, en-GB)

For production internationalization:

- Use specialized language detection libraries (lingua, franc)
- Validate hreflang by fetching alternate URLs
- Implement proper i18n framework (i18next, FormatJS)
- Test with native speakers
- Consider regional dialects and cultural differences

## TypeScript Types

```typescript
interface LanguageDetection {
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

interface AlternateLanguage {
  lang: string
  href: string
}
```
