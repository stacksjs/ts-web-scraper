/**
 * Open Graph Protocol extraction
 */

import type { OpenGraphArticle, OpenGraphAudio, OpenGraphBasic, OpenGraphBook, OpenGraphImage, OpenGraphProfile, OpenGraphVideo } from '../types'
import { resolveUrl, toCamelCase } from '../utils/url'

/**
 * Extract Open Graph metadata from HTML
 */
export function extractOpenGraph(html: string): OpenGraphBasic & {
  article?: OpenGraphArticle
  book?: OpenGraphBook
  profile?: OpenGraphProfile
} {
  const og: any = {}
  const article: any = {}
  const book: any = {}
  const profile: any = {}

  // Match both property and name attributes for maximum compatibility
  const ogRegex = /<meta[^>]+(?:property|name)=["']og:([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi
  const ogReverseRegex = /<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']og:([^"']+)["'][^>]*>/gi

  // Process regular order (property/name first)
  let match = ogRegex.exec(html)
  while (match !== null) {
    const [, property, content] = match
    processOpenGraphProperty(property, content, og, article, book, profile)
    match = ogRegex.exec(html)
  }

  // Process reverse order (content first)
  let reverseMatch = ogReverseRegex.exec(html)
  while (reverseMatch !== null) {
    const [, content, property] = reverseMatch
    processOpenGraphProperty(property, content, og, article, book, profile)
    reverseMatch = ogReverseRegex.exec(html)
  }

  const result: any = { ...og }

  if (Object.keys(article).length > 0) {
    result.article = article
  }
  if (Object.keys(book).length > 0) {
    result.book = book
  }
  if (Object.keys(profile).length > 0) {
    result.profile = profile
  }

  return result
}

/**
 * Process an Open Graph property and add it to the appropriate object
 */
function processOpenGraphProperty(
  property: string,
  content: string,
  og: any,
  article: any,
  book: any,
  profile: any,
): void {
  if (!content)
    return

  // Handle structured properties (image, video, audio)
  if (property.startsWith('image:')) {
    const imageProp = property.replace('image:', '')
    if (!og.image || typeof og.image === 'string') {
      og.image = { url: og.image || '' }
    }
    if (Array.isArray(og.image)) {
      const lastImage = og.image[og.image.length - 1]
      if (typeof lastImage === 'object') {
        lastImage[imageProp] = imageProp === 'width' || imageProp === 'height'
          ? Number.parseInt(content, 10)
          : content
      }
    }
    else {
      og.image[imageProp] = imageProp === 'width' || imageProp === 'height'
        ? Number.parseInt(content, 10)
        : content
    }
    return
  }

  if (property.startsWith('video:')) {
    const videoProp = property.replace('video:', '')
    if (!og.video || typeof og.video === 'string') {
      og.video = { url: og.video || '' }
    }
    if (Array.isArray(og.video)) {
      const lastVideo = og.video[og.video.length - 1]
      if (typeof lastVideo === 'object') {
        lastVideo[videoProp] = videoProp === 'width' || videoProp === 'height'
          ? Number.parseInt(content, 10)
          : content
      }
    }
    else {
      og.video[videoProp] = videoProp === 'width' || videoProp === 'height'
        ? Number.parseInt(content, 10)
        : content
    }
    return
  }

  if (property.startsWith('audio:')) {
    const audioProp = property.replace('audio:', '')
    if (!og.audio || typeof og.audio === 'string') {
      og.audio = { url: og.audio || '' }
    }
    if (Array.isArray(og.audio)) {
      const lastAudio = og.audio[og.audio.length - 1]
      if (typeof lastAudio === 'object') {
        lastAudio[audioProp] = content
      }
    }
    else {
      og.audio[audioProp] = content
    }
    return
  }

  // Handle article properties
  if (property.startsWith('article:')) {
    const articleProp = toCamelCase(property.replace('article:', ''))
    if (articleProp === 'author' || articleProp === 'tag') {
      if (!article[articleProp]) {
        article[articleProp] = []
      }
      article[articleProp].push(content)
    }
    else {
      article[articleProp] = content
    }
    return
  }

  // Handle book properties
  if (property.startsWith('book:')) {
    const bookProp = toCamelCase(property.replace('book:', ''))
    if (bookProp === 'author' || bookProp === 'tag') {
      if (!book[bookProp]) {
        book[bookProp] = []
      }
      book[bookProp].push(content)
    }
    else {
      book[bookProp] = content
    }
    return
  }

  // Handle profile properties
  if (property.startsWith('profile:')) {
    const profileProp = toCamelCase(property.replace('profile:', ''))
    profile[profileProp] = content
    return
  }

  // Handle basic properties
  const prop = toCamelCase(property)

  // Handle array properties
  if (prop === 'localeAlternate') {
    if (!og.localeAlternate) {
      og.localeAlternate = []
    }
    og.localeAlternate.push(content)
    return
  }

  // Handle properties that can have multiple values
  if (prop === 'image' || prop === 'video' || prop === 'audio') {
    if (og[prop] && typeof og[prop] === 'object' && !Array.isArray(og[prop])) {
      og[prop] = [og[prop], content]
    }
    else if (og[prop]) {
      if (!Array.isArray(og[prop])) {
        og[prop] = [og[prop]]
      }
      og[prop].push(content)
    }
    else {
      og[prop] = content
    }
    return
  }

  og[prop] = content
}

/**
 * Validate and resolve image URLs in Open Graph data
 */
export function resolveOpenGraphImages(
  og: OpenGraphBasic,
  baseUrl: string,
): OpenGraphBasic {
  const resolved = { ...og }

  if (resolved.image) {
    if (typeof resolved.image === 'string') {
      resolved.image = resolveUrl(resolved.image, baseUrl)
    }
    else if (Array.isArray(resolved.image)) {
      resolved.image = resolved.image.map((img): string | OpenGraphImage => {
        if (typeof img === 'string') {
          return resolveUrl(img, baseUrl)
        }
        return {
          ...img,
          url: resolveUrl(img.url, baseUrl),
          secureUrl: img.secureUrl ? resolveUrl(img.secureUrl, baseUrl) : undefined,
        }
      }) as OpenGraphImage[]
    }
    else {
      resolved.image = {
        ...resolved.image,
        url: resolveUrl(resolved.image.url, baseUrl),
        secureUrl: resolved.image.secureUrl
          ? resolveUrl(resolved.image.secureUrl, baseUrl)
          : undefined,
      }
    }
  }

  if (resolved.video) {
    if (typeof resolved.video === 'string') {
      resolved.video = resolveUrl(resolved.video, baseUrl)
    }
    else if (Array.isArray(resolved.video)) {
      resolved.video = resolved.video.map((vid): string | OpenGraphVideo => {
        if (typeof vid === 'string') {
          return resolveUrl(vid, baseUrl)
        }
        return {
          ...vid,
          url: resolveUrl(vid.url, baseUrl),
          secureUrl: vid.secureUrl ? resolveUrl(vid.secureUrl, baseUrl) : undefined,
        }
      }) as OpenGraphVideo[]
    }
    else {
      resolved.video = {
        ...resolved.video,
        url: resolveUrl(resolved.video.url, baseUrl),
        secureUrl: resolved.video.secureUrl
          ? resolveUrl(resolved.video.secureUrl, baseUrl)
          : undefined,
      }
    }
  }

  if (resolved.audio) {
    if (typeof resolved.audio === 'string') {
      resolved.audio = resolveUrl(resolved.audio, baseUrl)
    }
    else if (Array.isArray(resolved.audio)) {
      resolved.audio = resolved.audio.map((aud): string | OpenGraphAudio => {
        if (typeof aud === 'string') {
          return resolveUrl(aud, baseUrl)
        }
        return {
          ...aud,
          url: resolveUrl(aud.url, baseUrl),
          secureUrl: aud.secureUrl ? resolveUrl(aud.secureUrl, baseUrl) : undefined,
        }
      }) as OpenGraphAudio[]
    }
    else {
      resolved.audio = {
        ...resolved.audio,
        url: resolveUrl(resolved.audio.url, baseUrl),
        secureUrl: resolved.audio.secureUrl
          ? resolveUrl(resolved.audio.secureUrl, baseUrl)
          : undefined,
      }
    }
  }

  if (resolved.url) {
    resolved.url = resolveUrl(resolved.url, baseUrl)
  }

  return resolved
}
