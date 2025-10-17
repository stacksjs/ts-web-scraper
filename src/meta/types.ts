/**
 * Type definitions for Open Graph and metadata extraction
 */

export interface OpenGraphBasic {
  /**
   * The title of your object as it should appear within the graph
   */
  title?: string

  /**
   * The type of your object (e.g., website, article, video.movie)
   */
  type?: string

  /**
   * The canonical URL of your object that will be used as its permanent ID
   */
  url?: string

  /**
   * An image URL which should represent your object within the graph
   */
  image?: string | OpenGraphImage | OpenGraphImage[]

  /**
   * A one to two sentence description of your object
   */
  description?: string

  /**
   * The word that appears before this object's title in a sentence
   */
  determiner?: string

  /**
   * The locale these tags are marked up in (format: language_TERRITORY)
   */
  locale?: string

  /**
   * An array of other locales this page is available in
   */
  localeAlternate?: string[]

  /**
   * The site name which should be displayed for the overall site
   */
  siteName?: string

  /**
   * A URL to an audio file to accompany this object
   */
  audio?: string | OpenGraphAudio | OpenGraphAudio[]

  /**
   * A URL to a video file that complements this object
   */
  video?: string | OpenGraphVideo | OpenGraphVideo[]
}

export interface OpenGraphImage {
  /**
   * The URL of the image
   */
  url: string

  /**
   * An alternate URL to use if the webpage requires HTTPS
   */
  secureUrl?: string

  /**
   * A MIME type for this image
   */
  type?: string

  /**
   * The number of pixels wide
   */
  width?: number

  /**
   * The number of pixels high
   */
  height?: number

  /**
   * A description of what is in the image (not a caption)
   */
  alt?: string
}

export interface OpenGraphVideo {
  /**
   * The URL of the video
   */
  url: string

  /**
   * An alternate URL to use if the webpage requires HTTPS
   */
  secureUrl?: string

  /**
   * A MIME type for this video
   */
  type?: string

  /**
   * The number of pixels wide
   */
  width?: number

  /**
   * The number of pixels high
   */
  height?: number
}

export interface OpenGraphAudio {
  /**
   * The URL of the audio
   */
  url: string

  /**
   * An alternate URL to use if the webpage requires HTTPS
   */
  secureUrl?: string

  /**
   * A MIME type for this audio
   */
  type?: string
}

export interface OpenGraphArticle {
  /**
   * When the article was first published
   */
  publishedTime?: string

  /**
   * When the article was last changed
   */
  modifiedTime?: string

  /**
   * When the article is out of date after
   */
  expirationTime?: string

  /**
   * Writers of the article
   */
  author?: string | string[]

  /**
   * A high-level section name (e.g., Technology)
   */
  section?: string

  /**
   * Tag words associated with this article
   */
  tag?: string | string[]
}

export interface OpenGraphBook {
  /**
   * Writers of the book
   */
  author?: string | string[]

  /**
   * The ISBN
   */
  isbn?: string

  /**
   * The date the book was released
   */
  releaseDate?: string

  /**
   * Tag words associated with this book
   */
  tag?: string | string[]
}

export interface OpenGraphProfile {
  /**
   * A name normally given to an individual by a parent or self-chosen
   */
  firstName?: string

  /**
   * A name inherited from a family or marriage and by which the individual is commonly known
   */
  lastName?: string

  /**
   * A short unique string to identify them
   */
  username?: string

  /**
   * Their gender
   */
  gender?: string
}

export interface TwitterCard {
  /**
   * The card type (summary, summary_large_image, app, player)
   */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player' | string

  /**
   * @username of website (e.g., @nytimes)
   */
  site?: string

  /**
   * @username of content creator
   */
  creator?: string

  /**
   * Title of content (max 70 characters)
   */
  title?: string

  /**
   * Description of content (max 200 characters)
   */
  description?: string

  /**
   * URL of image to use in the card
   */
  image?: string

  /**
   * Alt text for image
   */
  imageAlt?: string

  /**
   * HTTPS URL of player iframe
   */
  player?: string

  /**
   * Width of player iframe in pixels
   */
  playerWidth?: number

  /**
   * Height of player iframe in pixels
   */
  playerHeight?: number

  /**
   * URL to raw video or audio stream
   */
  playerStream?: string

  /**
   * Name of your iPhone app
   */
  appNameIphone?: string

  /**
   * Your app ID in the iTunes App Store
   */
  appIdIphone?: string

  /**
   * Your app's custom URL scheme
   */
  appUrlIphone?: string

  /**
   * Name of your iPad app
   */
  appNameIpad?: string

  /**
   * Your app ID in the iTunes App Store
   */
  appIdIpad?: string

  /**
   * Your app's custom URL scheme
   */
  appUrlIpad?: string

  /**
   * Name of your Android app
   */
  appNameGoogleplay?: string

  /**
   * Your app ID in the Google Play Store
   */
  appIdGoogleplay?: string

  /**
   * Your app's custom URL scheme
   */
  appUrlGoogleplay?: string
}

export interface LinkPreview {
  /**
   * The title of the page
   */
  title?: string

  /**
   * A description of the page
   */
  description?: string

  /**
   * The canonical URL of the page
   */
  url?: string

  /**
   * The primary image URL
   */
  image?: string

  /**
   * Image dimensions if available
   */
  imageWidth?: number
  imageHeight?: number

  /**
   * Image validation results
   */
  imageStatus?: ImageValidationResult

  /**
   * Site name/domain
   */
  siteName?: string

  /**
   * Site logo URL (separate from favicon)
   */
  logo?: string

  /**
   * Favicon URL
   */
  favicon?: string

  /**
   * Content type (article, website, video, etc.)
   */
  type?: string

  /**
   * Author information
   */
  author?: string

  /**
   * Publication date
   */
  publishedTime?: string

  /**
   * Modified date
   */
  modifiedTime?: string

  /**
   * Twitter handle of the site
   */
  twitterSite?: string

  /**
   * Video URL if applicable
   */
  video?: string

  /**
   * Video metadata
   */
  videoData?: VideoMetadata

  /**
   * Language of the content
   */
  language?: string

  /**
   * Keywords/tags
   */
  keywords?: string[]

  /**
   * Estimated reading time in minutes
   */
  readingTime?: number

  /**
   * Smart content excerpt
   */
  excerpt?: string

  /**
   * RSS/Atom feed URLs
   */
  feeds?: string[]

  /**
   * Metadata quality score (0-100)
   */
  qualityScore?: MetadataQuality

  /**
   * E-commerce product data if applicable
   */
  product?: ProductMetadata

  /**
   * Structured data (Schema.org, JSON-LD)
   */
  structuredData?: StructuredDataResult

  /**
   * Complete Open Graph data
   */
  openGraph?: OpenGraphBasic & {
    article?: OpenGraphArticle
    book?: OpenGraphBook
    profile?: OpenGraphProfile
  }

  /**
   * Complete Twitter Card data
   */
  twitterCard?: TwitterCard
}

export interface ImageValidationResult {
  /**
   * Whether the image URL is accessible
   */
  accessible: boolean

  /**
   * HTTP status code
   */
  statusCode?: number

  /**
   * Actual content type
   */
  contentType?: string

  /**
   * Actual file size in bytes
   */
  fileSize?: number

  /**
   * Whether dimensions match claimed dimensions
   */
  dimensionsMatch?: boolean

  /**
   * Error message if validation failed
   */
  error?: string
}

export interface VideoMetadata {
  /**
   * Video URL
   */
  url: string

  /**
   * Video platform (youtube, vimeo, etc.)
   */
  platform?: string

  /**
   * Video ID on the platform
   */
  videoId?: string

  /**
   * Video thumbnail URL
   */
  thumbnail?: string

  /**
   * Video duration in seconds
   */
  duration?: number

  /**
   * Video dimensions
   */
  width?: number
  height?: number
}

export interface ProductMetadata {
  /**
   * Product name
   */
  name?: string

  /**
   * Product description
   */
  description?: string

  /**
   * Product image
   */
  image?: string

  /**
   * Product price
   */
  price?: string

  /**
   * Currency
   */
  currency?: string

  /**
   * Availability (in stock, out of stock, preorder)
   */
  availability?: string

  /**
   * Product brand
   */
  brand?: string

  /**
   * Product rating
   */
  rating?: number

  /**
   * Review count
   */
  reviewCount?: number

  /**
   * Product condition (new, used, refurbished)
   */
  condition?: string
}

export interface StructuredDataResult {
  /**
   * JSON-LD structured data
   */
  jsonLd?: any[]

  /**
   * Microdata items
   */
  microdata?: any[]

  /**
   * Dublin Core metadata
   */
  dublinCore?: Record<string, string>

  /**
   * Detected schema types
   */
  schemaTypes?: string[]
}

export interface MetadataQuality {
  /**
   * Overall quality score (0-100)
   */
  score: number

  /**
   * Individual component scores
   */
  scores: {
    openGraph: number
    twitterCard: number
    basicMeta: number
    structuredData: number
    images: number
    accessibility: number
  }

  /**
   * Missing critical tags
   */
  missing: string[]

  /**
   * Warnings and suggestions
   */
  warnings: string[]

  /**
   * SEO readiness
   */
  seoReady: boolean

  /**
   * Social media readiness
   */
  socialReady: boolean
}
