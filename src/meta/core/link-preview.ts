/**
 * Comprehensive link preview extraction with intelligent fallbacks
 */

import type { LinkPreview } from '../types'
import { calculateReadingTime, generateExcerpt } from '../../analysis/content'
import { calculateQualityScore } from '../../analysis/quality'
import { extractLanguage, extractStandardMeta, extractTitle } from '../extractors/language'
import { extractFavicon, extractFeeds, extractLogo } from '../extractors/media'
import { extractProductMetadata } from '../extractors/product'
import { extractEnhancedStructuredData } from '../extractors/structured-data'
import { extractVideoMetadata } from '../extractors/video'
import { extractOpenGraph } from './open-graph'
import { extractTwitterCard } from './twitter-card'

/**
 * Extract a comprehensive link preview with intelligent fallbacks
 *
 * @param html - The HTML content to analyze
 * @param url - The base URL of the page (optional but recommended)
 * @param options - Additional options for extraction
 * @returns A comprehensive link preview with all available metadata
 */
export function extractLinkPreview(
  html: string,
  url?: string,
  options: {
    validateImage?: boolean
    includeQualityScore?: boolean
  } = {},
): LinkPreview {
  const og = extractOpenGraph(html)
  const twitter = extractTwitterCard(html)

  // Extract standard meta tags for fallbacks
  const standardMeta = extractStandardMeta(html)

  // Extract enhanced metadata
  const structuredData = extractEnhancedStructuredData(html)
  const language = extractLanguage(html)
  const feeds = extractFeeds(html, url)

  // Extract favicon and logo
  const favicon = extractFavicon(html, url)
  const logo = extractLogo(html, url, structuredData)

  // Extract keywords
  const keywordsMeta = standardMeta.keywords
  const keywords = keywordsMeta ? keywordsMeta.split(',').map(k => k.trim()) : undefined

  // Calculate reading time and generate excerpt
  const readingTime = calculateReadingTime(html)
  const excerpt = generateExcerpt(html)

  // Extract product data if applicable
  const product = extractProductMetadata(html, structuredData)

  // Extract video URL
  const videoUrl = typeof og.video === 'string'
    ? og.video
    : typeof og.video === 'object' && !Array.isArray(og.video)
      ? og.video.url
      : Array.isArray(og.video) && og.video.length > 0
        ? typeof og.video[0] === 'string' ? og.video[0] : og.video[0].url
        : twitter.player

  // Extract video metadata if video URL exists
  const videoData = videoUrl ? extractVideoMetadata(videoUrl, og) : undefined

  // Build the preview with intelligent fallbacks
  const preview: LinkPreview = {
    // Title: og:title > twitter:title > <title>
    title: og.title
      || twitter.title
      || extractTitle(html),

    // Description: og:description > twitter:description > meta description > excerpt
    description: og.description
      || twitter.description
      || standardMeta.description
      || excerpt,

    // URL: og:url > canonical > provided url
    url: og.url
      || standardMeta.canonical
      || url,

    // Image: og:image > twitter:image
    image: typeof og.image === 'string'
      ? og.image
      : typeof og.image === 'object' && !Array.isArray(og.image)
        ? og.image.url
        : Array.isArray(og.image) && og.image.length > 0
          ? typeof og.image[0] === 'string' ? og.image[0] : og.image[0].url
          : twitter.image,

    // Image dimensions
    imageWidth: typeof og.image === 'object' && !Array.isArray(og.image)
      ? og.image.width
      : undefined,
    imageHeight: typeof og.image === 'object' && !Array.isArray(og.image)
      ? og.image.height
      : undefined,

    // Site name: og:site_name > domain from url
    siteName: og.siteName
      || (url ? new URL(url).hostname : undefined),

    logo,
    favicon,

    // Type: og:type
    type: og.type,

    // Author
    author: typeof og.article?.author === 'string'
      ? og.article.author
      : Array.isArray(og.article?.author) && og.article.author.length > 0
        ? og.article.author[0]
        : standardMeta.author,

    // Published time
    publishedTime: og.article?.publishedTime,

    // Modified time
    modifiedTime: og.article?.modifiedTime,

    // Twitter site
    twitterSite: twitter.site,

    // Video
    video: videoUrl,
    videoData,

    // Language
    language,

    // Keywords
    keywords,

    // Reading time
    readingTime,

    // Excerpt
    excerpt,

    // Feeds
    feeds: feeds.length > 0 ? feeds : undefined,

    // Product data
    product,

    // Structured data
    structuredData,

    // Complete data
    openGraph: og,
    twitterCard: twitter,
  }

  // Calculate quality score if requested
  if (options.includeQualityScore) {
    preview.qualityScore = calculateQualityScore(preview)
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(preview).filter(([_, value]) => value !== undefined),
  ) as LinkPreview
}
