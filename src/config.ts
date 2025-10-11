import type { ScraperConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: ScraperConfig = {
  verbose: true,
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (compatible; BunScraper/1.0)',
  maxJSFiles: 10,
  analyzeJavaScript: true,
  findEmbeddedData: true,
  reconstructAPI: true,
  headers: {},
  rateLimit: 0,
  retries: 0,
  followRedirects: true,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: ScraperConfig = await loadConfig({
  name: 'scraper',
  alias: 'web-scraper',
  defaultConfig,
})

/**
 * Get configuration value with fallback to default
 */
export function getConfig<K extends keyof ScraperConfig>(
  key: K,
  override?: ScraperConfig[K],
): ScraperConfig[K] {
  if (override !== undefined)
    return override
  return config[key] ?? defaultConfig[key]
}
