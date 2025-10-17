/**
 * Open Graph Meta Information Extraction
 *
 * Comprehensive Open Graph and Twitter Card meta tag extraction
 * for rich link previews and web data scraping.
 *
 * Competes with services like opengraph.tools, providing:
 * - Open Graph protocol support (og:*)
 * - Twitter Card support (twitter:*)
 * - Intelligent fallbacks when tags are missing
 * - Image resolution and validation
 * - Complete metadata extraction
 *
 * @example
 * ```ts
 * import { extractOpenGraph, extractLinkPreview } from 'ts-web-scraper'
 *
 * const html = await fetch('https://example.com').then(r => r.text())
 * const preview = extractLinkPreview(html, 'https://example.com')
 * console.log(preview.title, preview.description, preview.image)
 * ```
 */

// Legacy re-exports (moved to top-level analysis and detection modules)
export { calculateReadingTime, generateExcerpt } from '../analysis/content'

export { calculateQualityScore } from '../analysis/quality'
export { extractLinkPreview } from './core/link-preview'
// Core functions
export { extractOpenGraph, resolveOpenGraphImages } from './core/open-graph'

export { extractTwitterCard } from './core/twitter-card'
export { extractLanguage, extractStandardMeta, extractTitle } from './extractors/language'
export { extractFavicon, extractFeeds, extractLogo } from './extractors/media'
export { extractProductMetadata } from './extractors/product'
// Extractors
export { extractEnhancedStructuredData } from './extractors/structured-data'

export { extractVideoMetadata } from './extractors/video'
// Types
export type {
  ImageValidationResult,
  LinkPreview,
  MetadataQuality,
  OpenGraphArticle,
  OpenGraphAudio,
  OpenGraphBasic,
  OpenGraphBook,
  OpenGraphImage,
  OpenGraphProfile,
  OpenGraphVideo,
  ProductMetadata,
  StructuredDataResult,
  TwitterCard,
  VideoMetadata,
} from './types'

// Utilities
export { resolveUrl, toCamelCase } from './utils/url'
export { validateImage } from './utils/validation'
