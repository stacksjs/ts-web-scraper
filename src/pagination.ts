/**
 * Pagination Auto-Detection
 *
 * Detect and handle various pagination patterns
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export enum PaginationType {
  NONE = 'none',
  PAGE_NUMBERS = 'page_numbers',
  NEXT_PREV = 'next_prev',
  LOAD_MORE = 'load_more',
  INFINITE_SCROLL = 'infinite_scroll',
  CURSOR = 'cursor',
}

export interface PaginationInfo {
  type: PaginationType
  currentPage?: number
  totalPages?: number
  nextUrl?: string
  prevUrl?: string
  pageUrls?: string[]
  hasMore?: boolean
  cursorNext?: string
  cursorPrev?: string
}

export interface PaginationPattern {
  selector?: string
  urlPattern?: RegExp
  pageParam?: string
}

/**
 * Detect pagination type and extract info from HTML
 */
export function detectPagination(html: string, currentUrl: string): PaginationInfo {
  const url = new URL(currentUrl)

  // Try to detect different pagination types
  const pageNumbers = detectPageNumbers(html, url)
  if (pageNumbers.type !== PaginationType.NONE) {
    return pageNumbers
  }

  const nextPrev = detectNextPrev(html, url)
  if (nextPrev.type !== PaginationType.NONE) {
    return nextPrev
  }

  const loadMore = detectLoadMore(html)
  if (loadMore.type !== PaginationType.NONE) {
    return loadMore
  }

  const infiniteScroll = detectInfiniteScroll(html)
  if (infiniteScroll.type !== PaginationType.NONE) {
    return infiniteScroll
  }

  return { type: PaginationType.NONE }
}

/**
 * Detect page number pagination (1, 2, 3, ...)
 */
function detectPageNumbers(html: string, baseUrl: URL): PaginationInfo {
  // Look for common pagination patterns
  const patterns = [
    // Match page numbers in links: <a href="/page/2">2</a>
    /<a[^>]*href=["']([^"']*)["'][^>]*>(\d+)<\/a>/gi,
    // Match numbered pagination: <a class="page">2</a>
    /<a[^>]*class=["'][^"']*page[^"']*["'][^>]*>(\d+)<\/a>/gi,
    // Match data attributes: <button data-page="2">2</button>
    /<(?:a|button)[^>]*data-page=["'](\d+)["'][^>]*>/gi,
  ]

  const pageNumbers: Array<{ number: number, url?: string }> = []
  const urlSet = new Set<string>()

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const pageNum = Number.parseInt(match[match.length - 1], 10)
      const href = match[1]

      if (!Number.isNaN(pageNum) && pageNum > 0) {
        let fullUrl: string | undefined

        if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
          try {
            fullUrl = new URL(href, baseUrl).toString()
            if (!urlSet.has(fullUrl)) {
              urlSet.add(fullUrl)
              pageNumbers.push({ number: pageNum, url: fullUrl })
            }
          }
          catch {
            // Invalid URL
          }
        }
        else {
          pageNumbers.push({ number: pageNum })
        }
      }
    }
  }

  if (pageNumbers.length === 0) {
    return { type: PaginationType.NONE }
  }

  // Sort by page number
  pageNumbers.sort((a, b) => a.number - b.number)

  // Determine current page from URL
  const urlPageParam = extractPageFromUrl(baseUrl)
  const currentPage = urlPageParam || 1

  // Determine total pages
  const maxPage = Math.max(...pageNumbers.map(p => p.number))

  return {
    type: PaginationType.PAGE_NUMBERS,
    currentPage,
    totalPages: maxPage,
    pageUrls: pageNumbers.map(p => p.url).filter(Boolean) as string[],
  }
}

/**
 * Detect next/previous pagination
 */
function detectNextPrev(html: string, baseUrl: URL): PaginationInfo {
  let nextUrl: string | undefined
  let prevUrl: string | undefined

  // Patterns for "next" links
  const nextPatterns = [
    /<a[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Next|next|NEXT|[→›»]|&gt;|&raquo;)\s*<\/a>/i,
    /<a[^>]*class=["'][^"']*next[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<a[^>]*rel=["']next["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']next["'][^>]*href=["']([^"']+)["']/i,
  ]

  // Patterns for "previous" links
  const prevPatterns = [
    /<a[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Previous|Prev|prev|PREV|[←‹«]|&lt;|&laquo;)\s*<\/a>/i,
    /<a[^>]*class=["'][^"']*prev[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<a[^>]*rel=["']prev["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']prev["'][^>]*href=["']([^"']+)["']/i,
  ]

  // Find next URL
  for (const pattern of nextPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      try {
        nextUrl = new URL(match[1], baseUrl).toString()
        break
      }
      catch {
        // Invalid URL
      }
    }
  }

  // Find prev URL
  for (const pattern of prevPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      try {
        prevUrl = new URL(match[1], baseUrl).toString()
        break
      }
      catch {
        // Invalid URL
      }
    }
  }

  if (!nextUrl && !prevUrl) {
    return { type: PaginationType.NONE }
  }

  const currentPage = extractPageFromUrl(baseUrl) || 1

  return {
    type: PaginationType.NEXT_PREV,
    currentPage,
    nextUrl,
    prevUrl,
    hasMore: !!nextUrl,
  }
}

/**
 * Detect "load more" button
 */
function detectLoadMore(html: string): PaginationInfo {
  const patterns = [
    /<button[^>]*>\s*(?:Load More|Show More|See More|More)\s*<\/button>/i,
    /<a[^>]*class=["'][^"']*load[_-]?more[^"']*["'][^>]*>/i,
    /<button[^>]*class=["'][^"']*load[_-]?more[^"']*["'][^>]*>/i,
    /<(?:a|button)[^>]*data-load[_-]?more[^>]*>/i,
  ]

  for (const pattern of patterns) {
    if (pattern.test(html)) {
      return {
        type: PaginationType.LOAD_MORE,
        hasMore: true,
      }
    }
  }

  return { type: PaginationType.NONE }
}

/**
 * Detect infinite scroll indicators
 */
function detectInfiniteScroll(html: string): PaginationInfo {
  const patterns = [
    /data-infinite[_-]?scroll/i,
    /class=["'][^"']*infinite[_-]?scroll[^"']*["']/i,
    /lazyload|lazy[_-]load/i,
    /data-page-url/i,
  ]

  for (const pattern of patterns) {
    if (pattern.test(html)) {
      return {
        type: PaginationType.INFINITE_SCROLL,
        hasMore: true,
      }
    }
  }

  return { type: PaginationType.NONE }
}

/**
 * Extract page number from URL
 */
export function extractPageFromUrl(url: URL): number | null {
  // Check common page parameters
  const pageParams = ['page', 'p', 'pg', 'pageNum', 'pageNumber']

  for (const param of pageParams) {
    const value = url.searchParams.get(param)
    if (value) {
      const pageNum = Number.parseInt(value, 10)
      if (!Number.isNaN(pageNum) && pageNum > 0) {
        return pageNum
      }
    }
  }

  // Check for page in path: /page/2, /p/2, /2
  const pathPatterns = [
    /\/page\/(\d+)/i,
    /\/p\/(\d+)/i,
    /\/(\d+)(?:\/|$)/,
  ]

  for (const pattern of pathPatterns) {
    const match = url.pathname.match(pattern)
    if (match) {
      const pageNum = Number.parseInt(match[1], 10)
      if (!Number.isNaN(pageNum) && pageNum > 0) {
        return pageNum
      }
    }
  }

  return null
}

/**
 * Generate URL for a specific page
 */
export function generatePageUrl(baseUrl: string, page: number, pattern?: PaginationPattern): string {
  const url = new URL(baseUrl)

  if (pattern?.pageParam) {
    // Use custom page parameter
    url.searchParams.set(pattern.pageParam, page.toString())
  }
  else {
    // Try to detect existing page parameter
    const pageParams = ['page', 'p', 'pg', 'pageNum', 'pageNumber']
    let paramFound = false

    for (const param of pageParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, page.toString())
        paramFound = true
        break
      }
    }

    // If no parameter found, check path pattern
    if (!paramFound) {
      const pathPatterns = [
        { pattern: /\/page\/\d+/i, replacement: `/page/${page}` },
        { pattern: /\/p\/\d+/i, replacement: `/p/${page}` },
      ]

      for (const { pattern, replacement } of pathPatterns) {
        if (pattern.test(url.pathname)) {
          url.pathname = url.pathname.replace(pattern, replacement)
          paramFound = true
          break
        }
      }
    }

    // Default to 'page' parameter
    if (!paramFound) {
      url.searchParams.set('page', page.toString())
    }
  }

  return url.toString()
}

/**
 * Extract all page URLs from pagination
 */
export function extractAllPageUrls(paginationInfo: PaginationInfo): string[] {
  if (paginationInfo.type === PaginationType.PAGE_NUMBERS && paginationInfo.pageUrls) {
    return paginationInfo.pageUrls
  }

  if (paginationInfo.type === PaginationType.NEXT_PREV) {
    const urls: string[] = []
    if (paginationInfo.prevUrl) {
      urls.push(paginationInfo.prevUrl)
    }
    if (paginationInfo.nextUrl) {
      urls.push(paginationInfo.nextUrl)
    }
    return urls
  }

  return []
}

/**
 * Check if pagination has more pages
 */
export function hasMorePages(paginationInfo: PaginationInfo): boolean {
  if (paginationInfo.hasMore !== undefined) {
    return paginationInfo.hasMore
  }

  if (paginationInfo.type === PaginationType.PAGE_NUMBERS) {
    if (paginationInfo.currentPage && paginationInfo.totalPages) {
      return paginationInfo.currentPage < paginationInfo.totalPages
    }
  }

  if (paginationInfo.type === PaginationType.NEXT_PREV) {
    return !!paginationInfo.nextUrl
  }

  return false
}

/**
 * Get next page URL
 */
export function getNextPageUrl(paginationInfo: PaginationInfo, baseUrl?: string): string | null {
  if (paginationInfo.nextUrl) {
    return paginationInfo.nextUrl
  }

  if (
    baseUrl
    && paginationInfo.type === PaginationType.PAGE_NUMBERS
    && paginationInfo.currentPage
    && paginationInfo.totalPages
    && paginationInfo.currentPage < paginationInfo.totalPages
  ) {
    return generatePageUrl(baseUrl, paginationInfo.currentPage + 1)
  }

  return null
}

/**
 * Auto-paginate and collect all pages
 */
export async function* autoPaginate(
  startUrl: string,
  fetcher: (url: string) => Promise<{ html: string, url: string }>,
  options: {
    maxPages?: number
    delay?: number
  } = {},
): AsyncGenerator<{ html: string, url: string, pageNumber: number }> {
  const { maxPages = 100, delay = 1000 } = options
  const visited = new Set<string>()

  let currentUrl = startUrl
  let pageNumber = 1

  while (pageNumber <= maxPages) {
    if (visited.has(currentUrl)) {
      break
    }

    visited.add(currentUrl)

    // Fetch page
    const result = await fetcher(currentUrl)
    yield { ...result, pageNumber }

    // Detect pagination
    const pagination = detectPagination(result.html, result.url)

    // Get next page URL
    const nextUrl = getNextPageUrl(pagination, result.url)

    if (!nextUrl || !hasMorePages(pagination)) {
      break
    }

    currentUrl = nextUrl
    pageNumber++

    // Delay before next request
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
