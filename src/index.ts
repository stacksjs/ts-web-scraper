// Client-side rendered scraping
export {
  extractData,
  isClientSideRendered,
  scrapeClientSide,
} from './client-side-scraper'

export type {
  ClientSideScraperOptions,
  ScrapedData,
} from './client-side-scraper'

export * from './config'

export * from './types'

// Static HTML scraping
export {
  extractLinks,
  extractMeta,
  extractStructuredData,
  extractText,
  fetchHTML,
  fetchMultiple,
  parseHTML,
  waitFor,
} from './web-scraper'
// Types
export type {
  Document,
  FetchHTMLOptions,
  HTMLElement,
} from './web-scraper'
