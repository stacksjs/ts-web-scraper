# Metadata Extraction

Extract comprehensive metadata from web pages including Open Graph, Twitter Cards, Schema.org structured data, and rich link previews.

## Overview

The metadata extractor provides complete access to all structured metadata on a web page. It extracts Open Graph protocol tags for social sharing, Twitter Card data for tweet previews, Schema.org/JSON-LD structured data, link preview information, favicons, logos, RSS feeds, and video/product metadata. Essential for building social sharing tools, content management systems, and SEO analysis.

## Basic Usage

```typescript
import { extractLinkPreview } from 'ts-web-scraper'

const html = await fetch('https://example.com').then(r => r.text())
const preview = extractLinkPreview(html, 'https://example.com')

console.log('Title:', preview.title)
console.log('Description:', preview.description)
console.log('Image:', preview.image)
console.log('Site Name:', preview.siteName)
```

## Link Previews

### Complete Link Preview

Get all metadata for rich link previews (similar to Slack, Discord, iMessage):

```typescript
const preview = extractLinkPreview(html, url)

// Basic info
console.log('Title:', preview.title)
console.log('Description:', preview.description)
console.log('URL:', preview.url)
console.log('Type:', preview.type) // 'article', 'website', 'video', etc.

// Images
console.log('Image:', preview.image)
if (preview.imageWidth && preview.imageHeight) {
  console.log(`Image Size: ${preview.imageWidth}x${preview.imageHeight}`)
}

// Site branding
console.log('Site Name:', preview.siteName)
console.log('Logo:', preview.logo)
console.log('Favicon:', preview.favicon)

// Content metadata
if (preview.author)
  console.log('Author:', preview.author)
if (preview.publishedTime)
  console.log('Published:', preview.publishedTime)
if (preview.readingTime)
  console.log('Reading Time:', preview.readingTime, 'min')
```

### Quality Score

Assess metadata completeness:

```typescript
const { qualityScore } = preview

if (qualityScore) {
  console.log(`Quality Score: ${qualityScore.score}/100`)
  console.log('SEO Ready:', qualityScore.seoReady ? 'Yes' : 'No')
  console.log('Social Ready:', qualityScore.socialReady ? 'Yes' : 'No')

  if (qualityScore.missing.length > 0) {
    console.log('Missing Tags:', qualityScore.missing.join(', '))
  }

  if (qualityScore.warnings.length > 0) {
    console.log('Warnings:')
    qualityScore.warnings.forEach(w => console.log(`  - ${w}`))
  }
}
```

## Open Graph

### Basic Open Graph

Extract Open Graph protocol tags:

```typescript
import { extractOpenGraph } from 'ts-web-scraper'

const og = extractOpenGraph(html)

console.log('Title:', og.title)
console.log('Type:', og.type)
console.log('URL:', og.url)
console.log('Description:', og.description)
console.log('Site Name:', og.siteName)
```

### Open Graph Images

Get detailed image information:

```typescript
if (og.image) {
  if (typeof og.image === 'string') {
    console.log('Image URL:', og.image)
  }
  else if (Array.isArray(og.image)) {
    console.log('Multiple Images:')
    og.image.forEach((img, i) => {
      console.log(`${i + 1}. ${img.url}`)
      if (img.width && img.height) {
        console.log(`   Size: ${img.width}x${img.height}`)
      }
      if (img.alt) {
        console.log(`   Alt: ${img.alt}`)
      }
    })
  }
  else {
    console.log('Image URL:', og.image.url)
    console.log('Secure URL:', og.image.secureUrl)
    console.log('Type:', og.image.type)
    console.log('Size:', `${og.image.width}x${og.image.height}`)
    console.log('Alt:', og.image.alt)
  }
}
```

### Article Metadata

For article pages:

```typescript
const { article } = preview.openGraph || {}

if (article) {
  console.log('Published:', article.publishedTime)
  console.log('Modified:', article.modifiedTime)
  console.log('Section:', article.section)

  if (Array.isArray(article.author)) {
    console.log('Authors:', article.author.join(', '))
  }
  else if (article.author) {
    console.log('Author:', article.author)
  }

  if (article.tag) {
    const tags = Array.isArray(article.tag) ? article.tag : [article.tag]
    console.log('Tags:', tags.join(', '))
  }
}
```

### Video and Audio

For multimedia content:

```typescript
// Video metadata
if (og.video) {
  const video = typeof og.video === 'string' ? { url: og.video } : og.video
  console.log('Video URL:', video.url)
  if (video.secureUrl)
    console.log('Secure URL:', video.secureUrl)
  if (video.type)
    console.log('Type:', video.type)
  if (video.width && video.height) {
    console.log(`Size: ${video.width}x${video.height}`)
  }
}

// Audio metadata
if (og.audio) {
  const audio = typeof og.audio === 'string' ? { url: og.audio } : og.audio
  console.log('Audio URL:', audio.url)
  if (audio.type)
    console.log('Type:', audio.type)
}
```

## Twitter Cards

### Twitter Card Data

Extract Twitter Card metadata:

```typescript
import { extractTwitterCard } from 'ts-web-scraper'

const twitter = extractTwitterCard(html)

console.log('Card Type:', twitter.card) // summary, summary_large_image, etc.
console.log('Site:', twitter.site) // @username
console.log('Creator:', twitter.creator) // @username
console.log('Title:', twitter.title)
console.log('Description:', twitter.description)
console.log('Image:', twitter.image)
console.log('Image Alt:', twitter.imageAlt)
```

Card types:
- **summary**: Default card with small image
- **summary_large_image**: Large image card
- **app**: Mobile app installation card
- **player**: Video/audio player card

### Player Cards

For video/audio players:

```typescript
if (twitter.card === 'player') {
  console.log('Player URL:', twitter.player)
  console.log('Stream URL:', twitter.playerStream)
  console.log('Size:', `${twitter.playerWidth}x${twitter.playerHeight}`)
}
```

### App Cards

For mobile apps:

```typescript
// iOS
if (twitter.appNameIphone) {
  console.log('iPhone App:', twitter.appNameIphone)
  console.log('App Store ID:', twitter.appIdIphone)
  console.log('URL Scheme:', twitter.appUrlIphone)
}

// Android
if (twitter.appNameGoogleplay) {
  console.log('Android App:', twitter.appNameGoogleplay)
  console.log('Play Store ID:', twitter.appIdGoogleplay)
  console.log('URL Scheme:', twitter.appUrlGoogleplay)
}
```

## Structured Data

### JSON-LD Extraction

Extract Schema.org structured data:

```typescript
import { extractEnhancedStructuredData } from 'ts-web-scraper'

const structured = extractEnhancedStructuredData(html)

if (structured.jsonLd && structured.jsonLd.length > 0) {
  console.log('JSON-LD Schemas:')
  structured.jsonLd.forEach((schema, i) => {
    console.log(`${i + 1}. ${schema['@type']}`)
    console.log(JSON.stringify(schema, null, 2))
  })
}
```

Common schema types:
- **Organization**: Company information
- **Person**: Individual profiles
- **Article**: Blog posts and articles
- **Product**: E-commerce products
- **Recipe**: Cooking recipes
- **Event**: Events and conferences
- **LocalBusiness**: Local businesses

### Schema Types

Get all detected schema types:

```typescript
if (structured.schemaTypes) {
  console.log('Schema Types:', structured.schemaTypes.join(', '))
}
```

### Microdata

Extract microdata structured data:

```typescript
if (structured.microdata && structured.microdata.length > 0) {
  console.log('Microdata Items:')
  structured.microdata.forEach((item, i) => {
    console.log(`${i + 1}.`, item)
  })
}
```

### Dublin Core

Extract Dublin Core metadata:

```typescript
if (structured.dublinCore) {
  console.log('Dublin Core Metadata:')
  Object.entries(structured.dublinCore).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
}
```

## Media Metadata

### Favicon Extraction

Get the site favicon:

```typescript
import { extractFavicon } from 'ts-web-scraper'

const favicon = extractFavicon(html, 'https://example.com')

if (favicon) {
  console.log('Favicon:', favicon)
}
```

Favicon sources (in order of priority):
1. Apple touch icon (`apple-touch-icon`)
2. Standard favicon link (`rel="icon"`)
3. Shortcut icon (`rel="shortcut icon"`)
4. Default `/favicon.ico`

### Logo Extraction

Get the site logo:

```typescript
import { extractLogo } from 'ts-web-scraper'

const logo = extractLogo(html, 'https://example.com')

if (logo) {
  console.log('Logo:', logo)
}
```

Logo sources:
- Schema.org Organization logo
- Open Graph image (if marked as logo)
- Image with "logo" in alt text or class

### RSS/Atom Feeds

Discover RSS and Atom feeds:

```typescript
import { extractFeeds } from 'ts-web-scraper'

const feeds = extractFeeds(html, 'https://example.com')

if (feeds.length > 0) {
  console.log('Available Feeds:')
  feeds.forEach((feed) => {
    console.log(`  ${feed}`)
  })
}
```

### Video Metadata

Extract video-specific metadata:

```typescript
import { extractVideoMetadata } from 'ts-web-scraper'

const video = extractVideoMetadata(html)

if (video) {
  console.log('Video URL:', video.url)
  console.log('Platform:', video.platform) // youtube, vimeo, etc.
  console.log('Video ID:', video.videoId)
  console.log('Thumbnail:', video.thumbnail)
  if (video.duration) {
    console.log('Duration:', video.duration, 'seconds')
  }
  if (video.width && video.height) {
    console.log(`Size: ${video.width}x${video.height}`)
  }
}
```

### Product Metadata

Extract e-commerce product data:

```typescript
import { extractProductMetadata } from 'ts-web-scraper'

const product = extractProductMetadata(html)

if (product) {
  console.log('Product:', product.name)
  console.log('Description:', product.description)
  console.log('Price:', product.price, product.currency)
  console.log('Availability:', product.availability)
  console.log('Brand:', product.brand)

  if (product.rating) {
    console.log(`Rating: ${product.rating}/5 (${product.reviewCount} reviews)`)
  }

  console.log('Condition:', product.condition)
}
```

## Advanced Usage

### Social Media Preview Generator

Create rich social media previews:

```typescript
interface SocialPreview {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'generic'
  title: string
  description: string
  image: string
  url: string
  metadata: Record<string, string>
}

function generateSocialPreview(
  html: string,
  url: string,
  platform: SocialPreview['platform']
): SocialPreview {
  const preview = extractLinkPreview(html, url)

  let title = preview.title || ''
  let description = preview.description || ''
  const image = preview.image || ''

  // Platform-specific optimizations
  if (platform === 'twitter') {
    // Twitter: 70 char title, 200 char description
    title = title.substring(0, 70)
    description = description.substring(0, 200)
  }
  else if (platform === 'facebook') {
    // Facebook: 100 char title, 300 char description
    title = title.substring(0, 100)
    description = description.substring(0, 300)
  }
  else if (platform === 'linkedin') {
    // LinkedIn: 200 char title, 256 char description
    title = title.substring(0, 200)
    description = description.substring(0, 256)
  }

  const metadata: Record<string, string> = {}

  if (preview.author)
    metadata.author = preview.author
  if (preview.publishedTime)
    metadata.publishedTime = preview.publishedTime
  if (preview.siteName)
    metadata.siteName = preview.siteName
  if (preview.type)
    metadata.type = preview.type

  return {
    platform,
    title,
    description,
    image,
    url: preview.url || url,
    metadata,
  }
}

const twitterPreview = generateSocialPreview(html, url, 'twitter')
console.log('Twitter Preview:', twitterPreview)
```

### Meta Tag Validator

Validate and score metadata quality:

```typescript
interface MetaValidation {
  score: number
  issues: Array<{
    severity: 'error' | 'warning' | 'info'
    message: string
  }>
  recommendations: string[]
}

function validateMetadata(html: string): MetaValidation {
  const preview = extractLinkPreview(html, '')
  const issues: MetaValidation['issues'] = []
  const recommendations: string[] = []
  let score = 100

  // Check essential tags
  if (!preview.title) {
    issues.push({ severity: 'error', message: 'Missing title tag' })
    score -= 20
  }
  else if (preview.title.length < 10 || preview.title.length > 60) {
    issues.push({
      severity: 'warning',
      message: `Title length ${preview.title.length} (optimal: 10-60 chars)`,
    })
    score -= 10
  }

  if (!preview.description) {
    issues.push({ severity: 'error', message: 'Missing description' })
    recommendations.push('Add meta description tag')
    score -= 20
  }
  else if (preview.description.length < 50 || preview.description.length > 160) {
    issues.push({
      severity: 'warning',
      message: `Description length ${preview.description.length} (optimal: 50-160 chars)`,
    })
    score -= 10
  }

  // Check Open Graph
  if (!preview.openGraph?.title) {
    issues.push({ severity: 'warning', message: 'Missing og:title' })
    recommendations.push('Add Open Graph tags for social sharing')
    score -= 10
  }

  if (!preview.openGraph?.image) {
    issues.push({ severity: 'warning', message: 'Missing og:image' })
    score -= 10
  }

  // Check Twitter Card
  if (!preview.twitterCard?.card) {
    issues.push({ severity: 'info', message: 'Missing Twitter Card tags' })
    recommendations.push('Add Twitter Card tags for better Twitter previews')
    score -= 5
  }

  // Check structured data
  if (!preview.structuredData?.jsonLd || preview.structuredData.jsonLd.length === 0) {
    issues.push({ severity: 'info', message: 'No structured data found' })
    recommendations.push('Add Schema.org structured data')
    score -= 5
  }

  // Check image optimization
  if (preview.image && !preview.imageWidth) {
    recommendations.push('Add image dimensions for better performance')
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  }
}

const validation = validateMetadata(html)
console.log(`Metadata Score: ${validation.score}/100`)
console.log('Issues:', validation.issues.length)
console.log('Recommendations:', validation.recommendations.length)
```

### SEO Meta Generator

Generate missing meta tags:

```typescript
interface GeneratedMeta {
  title?: string
  description?: string
  openGraph: Record<string, string>
  twitterCard: Record<string, string>
}

function generateMissingMeta(html: string, url: string): GeneratedMeta {
  const preview = extractLinkPreview(html, url)
  const generated: GeneratedMeta = {
    openGraph: {},
    twitterCard: {},
  }

  // Generate title if missing
  if (!preview.title) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) {
      generated.title = h1Match[1].substring(0, 60)
    }
  }

  // Generate description if missing
  if (!preview.description && preview.excerpt) {
    generated.description = preview.excerpt.substring(0, 160)
  }

  // Generate Open Graph tags
  if (!preview.openGraph?.title) {
    generated.openGraph['og:title'] = preview.title || generated.title || ''
  }
  if (!preview.openGraph?.description) {
    generated.openGraph['og:description']
      = preview.description || generated.description || ''
  }
  if (!preview.openGraph?.url) {
    generated.openGraph['og:url'] = url
  }
  if (!preview.openGraph?.type) {
    generated.openGraph['og:type'] = 'website'
  }

  // Generate Twitter Card tags
  if (!preview.twitterCard?.card) {
    generated.twitterCard['twitter:card'] = 'summary_large_image'
  }
  if (!preview.twitterCard?.title) {
    generated.twitterCard['twitter:title'] = preview.title || generated.title || ''
  }
  if (!preview.twitterCard?.description) {
    generated.twitterCard['twitter:description']
      = preview.description || generated.description || ''
  }

  return generated
}

const generated = generateMissingMeta(html, url)
console.log('Generated Meta Tags:')
console.log(JSON.stringify(generated, null, 2))
```

### Metadata Comparison Tool

Compare metadata across multiple URLs:

```typescript
interface MetaComparison {
  url: string
  hasTitle: boolean
  hasDescription: boolean
  hasOG: boolean
  hasTwitterCard: boolean
  hasStructuredData: boolean
  imageSize?: string
  score: number
}

async function compareMetadata(urls: string[]): Promise<MetaComparison[]> {
  const results: MetaComparison[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const preview = extractLinkPreview(html, url)

    let score = 0
    if (preview.title)
      score += 20
    if (preview.description)
      score += 20
    if (preview.openGraph?.title)
      score += 20
    if (preview.twitterCard?.card)
      score += 20
    if (preview.structuredData?.jsonLd?.length)
      score += 20

    results.push({
      url,
      hasTitle: !!preview.title,
      hasDescription: !!preview.description,
      hasOG: !!preview.openGraph?.title,
      hasTwitterCard: !!preview.twitterCard?.card,
      hasStructuredData: !!preview.structuredData?.jsonLd?.length,
      imageSize: preview.imageWidth && preview.imageHeight
        ? `${preview.imageWidth}x${preview.imageHeight}`
        : undefined,
      score,
    })
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score)

  console.log('Metadata Comparison:')
  console.log('Rank | Score | Title | Desc | OG | Twitter | Schema | URL')
  console.log('-'.repeat(80))

  results.forEach((r, i) => {
    const mark = (val: boolean) => val ? '✓' : '✗'
    console.log(
      `${i + 1}. | ${r.score} | ${mark(r.hasTitle)} | ${mark(r.hasDescription)} | ${mark(r.hasOG)} | ${mark(r.hasTwitterCard)} | ${mark(r.hasStructuredData)} | ${r.url}`
    )
  })

  return results
}

await compareMetadata([
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
])
```

## Real-World Use Cases

### 1. Link Preview Service (like Slack/Discord)

```typescript
interface LinkCard {
  url: string
  title: string
  description: string
  image: string
  siteName: string
  favicon: string
}

async function generateLinkCard(url: string): Promise<LinkCard> {
  const html = await fetch(url).then(r => r.text())
  const preview = extractLinkPreview(html, url)

  return {
    url: preview.url || url,
    title: preview.title || 'Untitled',
    description: preview.description || '',
    image: preview.image || '',
    siteName: preview.siteName || new URL(url).hostname,
    favicon: preview.favicon || `${new URL(url).origin}/favicon.ico`,
  }
}

// Usage in chat app
const card = await generateLinkCard('https://example.com/article')
console.log(`<div class="link-card">
  <img src="${card.image}" alt="${card.title}" />
  <div>
    <h3>${card.title}</h3>
    <p>${card.description}</p>
    <span>${card.siteName}</span>
  </div>
</div>`)
```

### 2. SEO Audit Tool

```typescript
async function auditPageSEO(url: string) {
  const html = await fetch(url).then(r => r.text())
  const preview = extractLinkPreview(html, url)
  const validation = validateMetadata(html)

  console.log(`\n=== SEO Audit: ${url} ===\n`)
  console.log(`Overall Score: ${validation.score}/100\n`)

  console.log('Meta Tags:')
  console.log(`  Title: ${preview.title ? '✓' : '✗'} ${preview.title || 'Missing'}`)
  console.log(`  Description: ${preview.description ? '✓' : '✗'} ${preview.description || 'Missing'}`)

  console.log('\nOpen Graph:')
  console.log(`  og:title: ${preview.openGraph?.title ? '✓' : '✗'}`)
  console.log(`  og:description: ${preview.openGraph?.description ? '✓' : '✗'}`)
  console.log(`  og:image: ${preview.openGraph?.image ? '✓' : '✗'}`)

  console.log('\nTwitter Card:')
  console.log(`  Card Type: ${preview.twitterCard?.card || 'Missing'}`)

  console.log('\nStructured Data:')
  if (preview.structuredData?.jsonLd) {
    console.log(`  JSON-LD: ${preview.structuredData.jsonLd.length} schema(s)`)
    console.log(`  Types: ${preview.structuredData.schemaTypes?.join(', ') || 'None'}`)
  }

  if (validation.issues.length > 0) {
    console.log('\nIssues:')
    validation.issues.forEach((issue) => {
      console.log(`  [${issue.severity}] ${issue.message}`)
    })
  }

  if (validation.recommendations.length > 0) {
    console.log('\nRecommendations:')
    validation.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`)
    })
  }
}

await auditPageSEO('https://example.com')
```

### 3. Social Media Sharing Optimizer

```typescript
interface SharingOptimization {
  original: LinkPreview
  optimized: {
    twitter: { title: string, description: string }
    facebook: { title: string, description: string }
    linkedin: { title: string, description: string }
  }
  warnings: string[]
}

function optimizeForSharing(html: string, url: string): SharingOptimization {
  const preview = extractLinkPreview(html, url)
  const warnings: string[] = []

  // Check image requirements
  if (preview.image) {
    if (preview.imageWidth && preview.imageWidth < 1200) {
      warnings.push('Image width < 1200px (recommended for social sharing)')
    }
    if (preview.imageHeight && preview.imageHeight < 630) {
      warnings.push('Image height < 630px (recommended for social sharing)')
    }
  }
  else {
    warnings.push('No image found for social sharing')
  }

  // Optimize text for each platform
  const title = preview.title || ''
  const description = preview.description || ''

  return {
    original: preview,
    optimized: {
      twitter: {
        title: title.substring(0, 70),
        description: description.substring(0, 200),
      },
      facebook: {
        title: title.substring(0, 100),
        description: description.substring(0, 300),
      },
      linkedin: {
        title: title.substring(0, 200),
        description: description.substring(0, 256),
      },
    },
    warnings,
  }
}

const optimized = optimizeForSharing(html, url)
console.log('Sharing Optimization:', optimized)
```

## Best Practices

1. **Always Provide Base URL**: Required for resolving relative URLs
2. **Cache Metadata**: Avoid re-extracting unchanged pages
3. **Validate Image URLs**: Check that images are accessible
4. **Set Fallbacks**: Have defaults for missing metadata
5. **Respect og:image Size**: Use 1200x630 for best social sharing
6. **Keep Titles Short**: 60 chars for SEO, platform limits for social
7. **Test Previews**: Use Facebook Debugger, Twitter Card Validator
8. **Use Structured Data**: Add Schema.org for rich results
9. **Include Alt Text**: Important for accessibility and SEO
10. **Monitor Quality**: Track metadata completeness over time

## Limitations

- Cannot validate if URLs are accessible
- Image validation requires HTTP requests (optional feature)
- No automatic image resizing or optimization
- Cannot extract metadata from:
  - JavaScript-rendered content (need client-side scraping)
  - Content behind authentication
  - Dynamic social sharing cards
- Limited to standard metadata formats
- Cannot verify structured data correctness

For production use:
- Implement image validation and caching
- Use specialized tools for structured data validation
- Monitor social media preview appearance
- Test with actual platform debugger tools
- Consider using services like OpenGraph.io for comprehensive data

## TypeScript Types

```typescript
interface LinkPreview {
  title?: string
  description?: string
  url?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  siteName?: string
  logo?: string
  favicon?: string
  type?: string
  author?: string
  publishedTime?: string
  twitterSite?: string
  video?: string
  videoData?: VideoMetadata
  language?: string
  keywords?: string[]
  readingTime?: number
  excerpt?: string
  feeds?: string[]
  qualityScore?: MetadataQuality
  product?: ProductMetadata
  structuredData?: StructuredDataResult
  openGraph?: OpenGraphBasic
  twitterCard?: TwitterCard
}
```

See full type definitions in the [types documentation](/src/meta/types.ts).
