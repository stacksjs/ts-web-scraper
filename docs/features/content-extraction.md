# Main Content Extraction

Extract the main article content from web pages using a Readability-style algorithm, automatically removing navigation, ads, and boilerplate.

## Overview

The content extractor identifies and isolates the main article or body content from HTML pages, removing navigation menus, headers, footers, sidebars, advertisements, and other boilerplate elements. It extracts titles, authors, dates, reading time, excerpts, and lead images - perfect for creating clean reading experiences, RSS feeds, or content archives.

## Basic Usage

```typescript
import { extractMainContent } from 'ts-web-scraper'

const html = await fetch('https://example.com/article').then(r => r.text())
const content = extractMainContent(html, 'https://example.com/article')

console.log('Title:', content.title)
console.log('Author:', content.author)
console.log('Reading Time:', content.readingTime, 'minutes')
console.log('Word Count:', content.length, 'characters')
console.log('\nExcerpt:', content.excerpt)
```

## Extracted Content

### Main Article Content

Get the primary article content with HTML preserved:

```typescript
const { content } = extractMainContent(html)

// Contains clean HTML with:
// - Paragraphs
// - Headings
// - Lists
// - Blockquotes
// - Images
// - Links
// But without:
// - Navigation menus
// - Headers/footers
// - Sidebars
// - Advertisements
// - Social media widgets

console.log(content)
```

The extractor uses multiple strategies:
1. Look for `<article>` element (semantic HTML5)
2. Look for `<main>` element
3. Analyze content density (most paragraphs)

### Plain Text Version

Get clean text without any HTML:

```typescript
const { textContent } = extractMainContent(html)

// Perfect for:
// - Text analysis
// - Search indexing
// - Preview generation
// - Character/word counting

console.log(textContent)
```

### Article Title

Extract the article's title:

```typescript
const { title } = extractMainContent(html)

console.log('Title:', title)
```

Title extraction priority:
1. `<h1>` within article content
2. `<title>` tag in document head
3. `undefined` if not found

### Author Information

Identify the article author:

```typescript
const { author } = extractMainContent(html)

if (author) {
  console.log('By:', author)
}
```

Author detection sources:
- `<meta name="author">` tag
- `<a rel="author">` link
- Elements with class containing "author"

### Publication Date

Get when the article was published:

```typescript
const { publishedDate } = extractMainContent(html)

if (publishedDate) {
  const date = new Date(publishedDate)
  console.log('Published:', date.toLocaleDateString())
}
```

Date extraction sources:
- `<time datetime="">` attribute
- `<meta property="article:published_time">` tag
- ISO 8601 format dates

### Reading Time

Calculate estimated reading time:

```typescript
const { readingTime } = extractMainContent(html)

console.log(`${readingTime} min read`)
```

Calculation:
- Based on 225 words per minute (average reading speed)
- Formula: `ceil(word_count / 225)`

### Content Excerpt

Get an automatic summary/preview:

```typescript
const { excerpt } = extractMainContent(html)

console.log('Summary:', excerpt)
```

Excerpt generation:
- First 200 characters of plain text
- Adds "..." if truncated
- Great for previews and meta descriptions

### Lead Image

Extract the main article image:

```typescript
const { leadImage } = extractMainContent(html, 'https://example.com/article')

if (leadImage) {
  console.log('Featured Image:', leadImage)
}
```

Image extraction:
- First `<img>` in article content
- Resolves relative URLs using provided base URL
- Returns absolute URL

### Content Length

Get the character count:

```typescript
const { length } = extractMainContent(html)

console.log('Content Length:', length, 'characters')
console.log('Word Count:', Math.round(length / 5), 'words (approx)')
```

## Advanced Usage

### Clean Reading Experience

Build a distraction-free reader:

```typescript
interface CleanArticle {
  title: string
  author?: string
  date?: string
  readingTime: number
  content: string
  image?: string
}

function createCleanArticle(url: string): Promise<CleanArticle> {
  const html = await fetch(url).then(r => r.text())
  const extracted = extractMainContent(html, url)

  return {
    title: extracted.title || 'Untitled',
    author: extracted.author,
    date: extracted.publishedDate,
    readingTime: extracted.readingTime,
    content: extracted.content,
    image: extracted.leadImage,
  }
}

const article = await createCleanArticle('https://example.com/article')

// Render in your reader UI
const readerHTML = `
  <article>
    <header>
      <h1>${article.title}</h1>
      ${article.author ? `<p class="author">By ${article.author}</p>` : ''}
      ${article.date ? `<time>${new Date(article.date).toLocaleDateString()}</time>` : ''}
      <p class="reading-time">${article.readingTime} min read</p>
    </header>
    ${article.image ? `<img src="${article.image}" alt="${article.title}" />` : ''}
    <div class="content">
      ${article.content}
    </div>
  </article>
`
```

### RSS Feed Generator

Create RSS feeds from extracted content:

```typescript
interface RSSItem {
  title: string
  link: string
  description: string
  author?: string
  pubDate?: string
  content: string
}

async function generateRSSItem(url: string): Promise<RSSItem> {
  const html = await fetch(url).then(r => r.text())
  const extracted = extractMainContent(html, url)

  return {
    title: extracted.title || url,
    link: url,
    description: extracted.excerpt || '',
    author: extracted.author,
    pubDate: extracted.publishedDate,
    content: extracted.content,
  }
}

async function generateRSSFeed(urls: string[]): Promise<string> {
  const items = await Promise.all(urls.map(generateRSSItem))

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>My Feed</title>
    <description>Generated from extracted content</description>
    <link>https://example.com</link>
`

  items.forEach((item) => {
    rss += `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      ${item.author ? `<author>${item.author}</author>` : ''}
      ${item.pubDate ? `<pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>` : ''}
      <content:encoded><![CDATA[${item.content}]]></content:encoded>
    </item>
`
  })

  rss += `
  </channel>
</rss>`

  return rss
}

const feed = await generateRSSFeed([
  'https://blog.example.com/post1',
  'https://blog.example.com/post2',
  'https://blog.example.com/post3',
])

console.log(feed)
```

### Content Archiver

Archive articles for offline reading or backup:

```typescript
interface ArchivedArticle {
  url: string
  archivedAt: string
  title: string
  author?: string
  publishedDate?: string
  readingTime: number
  wordCount: number
  content: string
  textContent: string
  leadImage?: string
  excerpt: string
}

async function archiveArticle(url: string): Promise<ArchivedArticle> {
  const html = await fetch(url).then(r => r.text())
  const extracted = extractMainContent(html, url)

  const wordCount = extracted.textContent.split(/\s+/).length

  return {
    url,
    archivedAt: new Date().toISOString(),
    title: extracted.title || 'Untitled',
    author: extracted.author,
    publishedDate: extracted.publishedDate,
    readingTime: extracted.readingTime,
    wordCount,
    content: extracted.content,
    textContent: extracted.textContent,
    leadImage: extracted.leadImage,
    excerpt: extracted.excerpt || '',
  }
}

class ArticleArchive {
  private articles: ArchivedArticle[] = []

  async add(url: string) {
    const article = await archiveArticle(url)
    this.articles.push(article)
    console.log(`Archived: ${article.title}`)
  }

  search(query: string): ArchivedArticle[] {
    const lowerQuery = query.toLowerCase()
    return this.articles.filter(
      article =>
        article.title.toLowerCase().includes(lowerQuery)
        || article.textContent.toLowerCase().includes(lowerQuery)
    )
  }

  getByDate(startDate: Date, endDate: Date): ArchivedArticle[] {
    return this.articles.filter((article) => {
      if (!article.publishedDate)
        return false
      const date = new Date(article.publishedDate)
      return date >= startDate && date <= endDate
    })
  }

  export(): string {
    return JSON.stringify(this.articles, null, 2)
  }
}

const archive = new ArticleArchive()
await archive.add('https://example.com/article1')
await archive.add('https://example.com/article2')

const results = archive.search('machine learning')
console.log(`Found ${results.length} articles`)
```

### Newsletter Digest

Create email digests from multiple articles:

```typescript
interface DigestItem {
  title: string
  url: string
  excerpt: string
  author?: string
  readingTime: number
}

async function createDigest(urls: string[]): Promise<string> {
  const items: DigestItem[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const extracted = extractMainContent(html, url)

    items.push({
      title: extracted.title || url,
      url,
      excerpt: extracted.excerpt || '',
      author: extracted.author,
      readingTime: extracted.readingTime,
    })
  }

  // Generate HTML email
  let emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Digest</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 0 auto; }
    .article { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
    .article h2 { margin-top: 0; }
    .meta { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Daily Digest</h1>
  <p>${new Date().toLocaleDateString()}</p>
`

  items.forEach((item) => {
    emailHTML += `
  <div class="article">
    <h2><a href="${item.url}">${item.title}</a></h2>
    <p class="meta">
      ${item.author ? `By ${item.author} • ` : ''}
      ${item.readingTime} min read
    </p>
    <p>${item.excerpt}</p>
    <p><a href="${item.url}">Read more →</a></p>
  </div>
`
  })

  emailHTML += `
</body>
</html>`

  return emailHTML
}

const digest = await createDigest([
  'https://news.example.com/story1',
  'https://news.example.com/story2',
  'https://news.example.com/story3',
])

// Send via email service
// await sendEmail({ to: 'user@example.com', subject: 'Daily Digest', html: digest })
```

### Content Quality Filter

Filter out low-quality or thin content:

```typescript
interface QualityMetrics {
  passesQuality: boolean
  wordCount: number
  hasTitle: boolean
  hasAuthor: boolean
  hasDate: boolean
  hasImage: boolean
  score: number
}

function assessContentQuality(
  extracted: ReturnType<typeof extractMainContent>
): QualityMetrics {
  const wordCount = extracted.textContent.split(/\s+/).length

  const hasTitle = !!extracted.title && extracted.title.length > 10
  const hasAuthor = !!extracted.author
  const hasDate = !!extracted.publishedDate
  const hasImage = !!extracted.leadImage

  let score = 0
  if (wordCount >= 300)
    score += 40
  else if (wordCount >= 150)
    score += 20
  if (hasTitle)
    score += 20
  if (hasAuthor)
    score += 15
  if (hasDate)
    score += 15
  if (hasImage)
    score += 10

  return {
    passesQuality: score >= 60,
    wordCount,
    hasTitle,
    hasAuthor,
    hasDate,
    hasImage,
    score,
  }
}

async function filterQualityContent(urls: string[]): Promise<string[]> {
  const qualityUrls: string[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const extracted = extractMainContent(html, url)
    const quality = assessContentQuality(extracted)

    if (quality.passesQuality) {
      qualityUrls.push(url)
      console.log(`✓ ${url} (score: ${quality.score})`)
    }
    else {
      console.log(`✗ ${url} (score: ${quality.score}) - filtered out`)
    }
  }

  return qualityUrls
}

const goodContent = await filterQualityContent([
  'https://example.com/article1',
  'https://example.com/article2',
  'https://example.com/thin-content',
])
```

## Real-World Use Cases

### 1. Pocket-Style Read-It-Later App

```typescript
interface SavedArticle {
  id: string
  url: string
  savedAt: string
  title: string
  excerpt: string
  readingTime: number
  content: string
  leadImage?: string
  tags: string[]
  read: boolean
}

class ReadingList {
  private articles: Map<string, SavedArticle> = new Map()

  async save(url: string, tags: string[] = []): Promise<SavedArticle> {
    const html = await fetch(url).then(r => r.text())
    const extracted = extractMainContent(html, url)

    const article: SavedArticle = {
      id: crypto.randomUUID(),
      url,
      savedAt: new Date().toISOString(),
      title: extracted.title || url,
      excerpt: extracted.excerpt || '',
      readingTime: extracted.readingTime,
      content: extracted.content,
      leadImage: extracted.leadImage,
      tags,
      read: false,
    }

    this.articles.set(article.id, article)
    return article
  }

  getUnread(): SavedArticle[] {
    return Array.from(this.articles.values()).filter(a => !a.read)
  }

  getByTag(tag: string): SavedArticle[] {
    return Array.from(this.articles.values()).filter(a => a.tags.includes(tag))
  }

  markAsRead(id: string) {
    const article = this.articles.get(id)
    if (article) {
      article.read = true
    }
  }

  getTotalReadingTime(): number {
    return this.getUnread().reduce((total, a) => total + a.readingTime, 0)
  }
}

const readingList = new ReadingList()
await readingList.save('https://example.com/article', ['tech', 'ai'])

const unread = readingList.getUnread()
console.log(`${unread.length} unread articles`)
console.log(`Total reading time: ${readingList.getTotalReadingTime()} minutes`)
```

### 2. Content Aggregator

```typescript
interface AggregatedContent {
  source: string
  articles: Array<{
    title: string
    url: string
    excerpt: string
    publishedDate?: string
  }>
}

async function aggregateFromSource(
  sourceName: string,
  articleUrls: string[]
): Promise<AggregatedContent> {
  const articles = []

  for (const url of articleUrls) {
    try {
      const html = await fetch(url).then(r => r.text())
      const extracted = extractMainContent(html, url)

      articles.push({
        title: extracted.title || url,
        url,
        excerpt: extracted.excerpt || '',
        publishedDate: extracted.publishedDate,
      })
    }
    catch (error) {
      console.error(`Failed to extract ${url}:`, error)
    }
  }

  return {
    source: sourceName,
    articles,
  }
}

const techNews = await aggregateFromSource('TechNews', [
  'https://technews.example.com/article1',
  'https://technews.example.com/article2',
])

console.log(`Aggregated ${techNews.articles.length} articles from ${techNews.source}`)
```

### 3. Content Migration Tool

```typescript
interface MigratedArticle {
  originalUrl: string
  title: string
  author?: string
  publishedDate?: string
  content: string
  status: 'success' | 'failed'
  error?: string
}

async function migrateContent(urls: string[]): Promise<MigratedArticle[]> {
  const results: MigratedArticle[] = []

  for (const url of urls) {
    try {
      const html = await fetch(url).then(r => r.text())
      const extracted = extractMainContent(html, url)

      results.push({
        originalUrl: url,
        title: extracted.title || 'Untitled',
        author: extracted.author,
        publishedDate: extracted.publishedDate,
        content: extracted.content,
        status: 'success',
      })

      console.log(`✓ Migrated: ${extracted.title}`)
    }
    catch (error) {
      results.push({
        originalUrl: url,
        title: '',
        content: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      console.error(`✗ Failed: ${url}`)
    }
  }

  const successful = results.filter(r => r.status === 'success').length
  console.log(`\nMigration complete: ${successful}/${urls.length} successful`)

  return results
}

const migrated = await migrateContent([
  'https://oldsite.com/post1',
  'https://oldsite.com/post2',
])
```

## Best Practices

1. **Always Provide Base URL**: Pass the page URL for proper relative link resolution
2. **Validate Extracted Data**: Check for null/undefined values before using
3. **Handle Errors Gracefully**: Extraction may fail on unusual HTML structures
4. **Cache Results**: Avoid re-extracting content unnecessarily
5. **Respect Copyright**: Only extract content you have permission to use
6. **Test on Multiple Sites**: Different sites have different structures
7. **Combine with Metadata**: Use alongside Open Graph/meta tag extraction
8. **Check Content Length**: Very short content may be misidentified

## Limitations

- May not work well on JavaScript-heavy single-page applications
- Cannot extract content from:
  - Images (text within images)
  - Videos (transcripts)
  - PDFs embedded in pages
  - Content behind authentication walls
- May occasionally include some boilerplate (comments, related articles)
- Date extraction limited to common formats
- Author detection may miss unconventional patterns
- Lead image may not be the most relevant image

For better results:
- Use on traditional blog posts and articles
- Prefer semantic HTML5 (`<article>`, `<main>`)
- Test extraction quality before production use
- Consider using specialized libraries for complex sites (Mozilla Readability)
- Implement fallbacks for failed extractions

## TypeScript Types

```typescript
interface ExtractedContent {
  /**
   * Main article title
   */
  title?: string

  /**
   * Main article content (HTML)
   */
  content: string

  /**
   * Plain text version
   */
  textContent: string

  /**
   * Article excerpt/summary
   */
  excerpt?: string

  /**
   * Article author
   */
  author?: string

  /**
   * Published date
   */
  publishedDate?: string

  /**
   * Reading time in minutes
   */
  readingTime: number

  /**
   * Content length
   */
  length: number

  /**
   * Main image
   */
  leadImage?: string
}
```
