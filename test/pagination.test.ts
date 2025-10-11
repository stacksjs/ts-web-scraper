import { describe, expect, it } from 'bun:test'
import {
  detectPagination,
  extractAllPageUrls,
  extractPageFromUrl,
  generatePageUrl,
  getNextPageUrl,
  hasMorePages,
  PaginationType,
} from '../src/pagination'

describe('detectPagination', () => {
  it('should detect page number pagination', () => {
    const html = `
      <div class="pagination">
        <a href="/page/1">1</a>
        <a href="/page/2">2</a>
        <a href="/page/3">3</a>
      </div>
    `

    const result = detectPagination(html, 'https://example.com/page/1')
    expect(result.type).toBe(PaginationType.PAGE_NUMBERS)
    expect(result.totalPages).toBe(3)
    expect(result.pageUrls?.length).toBe(3)
  })

  it('should detect next/prev pagination', () => {
    const html = `
      <div>
        <a href="/page/1">Previous</a>
        <a href="/page/3">Next</a>
      </div>
    `

    const result = detectPagination(html, 'https://example.com/page/2')
    expect(result.type).toBe(PaginationType.NEXT_PREV)
    expect(result.nextUrl).toBe('https://example.com/page/3')
    expect(result.prevUrl).toBe('https://example.com/page/1')
    expect(result.hasMore).toBe(true)
  })

  it('should detect load more button', () => {
    const html = '<button>Load More</button>'

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.LOAD_MORE)
    expect(result.hasMore).toBe(true)
  })

  it('should detect infinite scroll', () => {
    const html = '<div data-infinite-scroll="true"></div>'

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.INFINITE_SCROLL)
    expect(result.hasMore).toBe(true)
  })

  it('should return NONE when no pagination detected', () => {
    const html = '<div>No pagination here</div>'

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.NONE)
  })

  it('should detect rel="next" link', () => {
    const html = '<link rel="next" href="/page/2" />'

    const result = detectPagination(html, 'https://example.com/page/1')
    expect(result.type).toBe(PaginationType.NEXT_PREV)
    expect(result.nextUrl).toBe('https://example.com/page/2')
  })

  it('should detect pagination with symbols', () => {
    const html = `
      <a href="/prev">←</a>
      <a href="/next">→</a>
    `

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.NEXT_PREV)
    expect(result.nextUrl).toBe('https://example.com/next')
    expect(result.prevUrl).toBe('https://example.com/prev')
  })

  it('should detect pagination with HTML entities', () => {
    const html = `
      <a href="/prev">&lt;</a>
      <a href="/next">&gt;</a>
    `

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.NEXT_PREV)
  })
})

describe('extractPageFromUrl', () => {
  it('should extract page from query parameter', () => {
    const url = new URL('https://example.com?page=5')
    expect(extractPageFromUrl(url)).toBe(5)
  })

  it('should extract page from path', () => {
    const url = new URL('https://example.com/page/3')
    expect(extractPageFromUrl(url)).toBe(3)
  })

  it('should extract page from /p/ path', () => {
    const url = new URL('https://example.com/p/7')
    expect(extractPageFromUrl(url)).toBe(7)
  })

  it('should return null when no page found', () => {
    const url = new URL('https://example.com')
    expect(extractPageFromUrl(url)).toBeNull()
  })

  it('should handle alternative page parameters', () => {
    expect(extractPageFromUrl(new URL('https://example.com?p=2'))).toBe(2)
    expect(extractPageFromUrl(new URL('https://example.com?pg=3'))).toBe(3)
    expect(extractPageFromUrl(new URL('https://example.com?pageNum=4'))).toBe(4)
  })

  it('should ignore invalid page numbers', () => {
    const url = new URL('https://example.com?page=abc')
    expect(extractPageFromUrl(url)).toBeNull()
  })

  it('should ignore zero and negative pages', () => {
    expect(extractPageFromUrl(new URL('https://example.com?page=0'))).toBeNull()
    expect(extractPageFromUrl(new URL('https://example.com?page=-1'))).toBeNull()
  })
})

describe('generatePageUrl', () => {
  it('should generate URL with page parameter', () => {
    const url = generatePageUrl('https://example.com?page=1', 5)
    expect(url).toBe('https://example.com/?page=5')
  })

  it('should add page parameter if not present', () => {
    const url = generatePageUrl('https://example.com', 3)
    expect(url).toContain('page=3')
  })

  it('should update page in path', () => {
    const url = generatePageUrl('https://example.com/page/2', 5)
    expect(url).toBe('https://example.com/page/5')
  })

  it('should update /p/ path', () => {
    const url = generatePageUrl('https://example.com/p/1', 3)
    expect(url).toBe('https://example.com/p/3')
  })

  it('should use custom page parameter', () => {
    const url = generatePageUrl('https://example.com', 5, { pageParam: 'offset' })
    expect(url).toContain('offset=5')
  })

  it('should preserve other query parameters', () => {
    const url = generatePageUrl('https://example.com?category=books&page=1', 2)
    expect(url).toContain('category=books')
    expect(url).toContain('page=2')
  })
})

describe('extractAllPageUrls', () => {
  it('should extract URLs from page number pagination', () => {
    const pagination = {
      type: PaginationType.PAGE_NUMBERS,
      pageUrls: [
        'https://example.com/page/1',
        'https://example.com/page/2',
        'https://example.com/page/3',
      ],
    }

    const urls = extractAllPageUrls(pagination)
    expect(urls.length).toBe(3)
  })

  it('should extract URLs from next/prev pagination', () => {
    const pagination = {
      type: PaginationType.NEXT_PREV,
      nextUrl: 'https://example.com/next',
      prevUrl: 'https://example.com/prev',
    }

    const urls = extractAllPageUrls(pagination)
    expect(urls.length).toBe(2)
    expect(urls).toContain('https://example.com/next')
    expect(urls).toContain('https://example.com/prev')
  })

  it('should return empty array for load more', () => {
    const pagination = {
      type: PaginationType.LOAD_MORE,
    }

    const urls = extractAllPageUrls(pagination)
    expect(urls.length).toBe(0)
  })

  it('should handle pagination with only next URL', () => {
    const pagination = {
      type: PaginationType.NEXT_PREV,
      nextUrl: 'https://example.com/next',
    }

    const urls = extractAllPageUrls(pagination)
    expect(urls.length).toBe(1)
    expect(urls[0]).toBe('https://example.com/next')
  })
})

describe('hasMorePages', () => {
  it('should return true for next/prev with next URL', () => {
    const pagination = {
      type: PaginationType.NEXT_PREV,
      nextUrl: 'https://example.com/next',
    }

    expect(hasMorePages(pagination)).toBe(true)
  })

  it('should return false for next/prev without next URL', () => {
    const pagination = {
      type: PaginationType.NEXT_PREV,
      prevUrl: 'https://example.com/prev',
    }

    expect(hasMorePages(pagination)).toBe(false)
  })

  it('should return true for page numbers with more pages', () => {
    const pagination = {
      type: PaginationType.PAGE_NUMBERS,
      currentPage: 2,
      totalPages: 5,
    }

    expect(hasMorePages(pagination)).toBe(true)
  })

  it('should return false for page numbers on last page', () => {
    const pagination = {
      type: PaginationType.PAGE_NUMBERS,
      currentPage: 5,
      totalPages: 5,
    }

    expect(hasMorePages(pagination)).toBe(false)
  })

  it('should respect hasMore flag', () => {
    const pagination = {
      type: PaginationType.LOAD_MORE,
      hasMore: true,
    }

    expect(hasMorePages(pagination)).toBe(true)
  })

  it('should return false for NONE type', () => {
    const pagination = {
      type: PaginationType.NONE,
    }

    expect(hasMorePages(pagination)).toBe(false)
  })
})

describe('getNextPageUrl', () => {
  it('should return nextUrl if present', () => {
    const pagination = {
      type: PaginationType.NEXT_PREV,
      nextUrl: 'https://example.com/page/3',
    }

    const url = getNextPageUrl(pagination)
    expect(url).toBe('https://example.com/page/3')
  })

  it('should generate URL for page numbers', () => {
    const pagination = {
      type: PaginationType.PAGE_NUMBERS,
      currentPage: 2,
      totalPages: 5,
    }

    const url = getNextPageUrl(pagination, 'https://example.com/page/2')
    expect(url).toContain('3')
  })

  it('should return null on last page', () => {
    const pagination = {
      type: PaginationType.PAGE_NUMBERS,
      currentPage: 5,
      totalPages: 5,
    }

    const url = getNextPageUrl(pagination, 'https://example.com/page/5')
    expect(url).toBeNull()
  })

  it('should return null without baseUrl for page numbers', () => {
    const pagination = {
      type: PaginationType.PAGE_NUMBERS,
      currentPage: 2,
      totalPages: 5,
    }

    const url = getNextPageUrl(pagination)
    expect(url).toBeNull()
  })
})

describe('pagination patterns', () => {
  it('should detect data-page attributes', () => {
    const html = `
      <button data-page="1">1</button>
      <button data-page="2">2</button>
      <button data-page="3">3</button>
    `

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.PAGE_NUMBERS)
  })

  it('should detect class-based pagination', () => {
    const html = `
      <a class="page-link" href="/1">1</a>
      <a class="page-link" href="/2">2</a>
    `

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.PAGE_NUMBERS)
  })

  it('should detect "Show More" button', () => {
    const html = '<button>Show More</button>'

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.LOAD_MORE)
  })

  it('should detect lazyload indicator', () => {
    const html = '<div class="lazyload"></div>'

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.INFINITE_SCROLL)
  })

  it('should prioritize page numbers over next/prev', () => {
    const html = `
      <a href="/page/1">1</a>
      <a href="/page/2">2</a>
      <a href="/next">Next</a>
    `

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.PAGE_NUMBERS)
  })
})

describe('edge cases', () => {
  it('should handle malformed URLs gracefully', () => {
    const html = '<a href="javascript:void(0)">1</a>'

    const result = detectPagination(html, 'https://example.com')
    // Should not crash
    expect(result.type).toBeDefined()
  })

  it('should handle relative URLs', () => {
    const html = '<a href="page/2">Next</a>'

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.NEXT_PREV)
    expect(result.nextUrl).toBe('https://example.com/page/2')
  })

  it('should detect page numbers even with hash-only links', () => {
    const html = '<a href="#">1</a><a href="#">2</a>'

    const result = detectPagination(html, 'https://example.com')
    // Should detect pagination structure even without valid URLs
    expect(result.type).toBe(PaginationType.PAGE_NUMBERS)
    expect(result.pageUrls?.length).toBe(0) // No valid URLs
  })

  it('should handle empty HTML', () => {
    const result = detectPagination('', 'https://example.com')
    expect(result.type).toBe(PaginationType.NONE)
  })

  it('should deduplicate page URLs', () => {
    const html = `
      <a href="/page/2">2</a>
      <a href="/page/2">2</a>
      <a href="/page/2">2</a>
    `

    const result = detectPagination(html, 'https://example.com')
    expect(result.type).toBe(PaginationType.PAGE_NUMBERS)
    expect(result.pageUrls?.length).toBe(1)
  })
})
