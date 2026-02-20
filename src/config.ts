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

// Lazy-loaded config to avoid top-level await (enables bun --compile)
let _config: ScraperConfig | null = null

export async function getConfig(): Promise<ScraperConfig> {
  if (!_config) {
    _config = await loadConfig({
  name: 'scraper',
  alias: 'web-scraper',
  defaultConfig,
})
  }
  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: ScraperConfig = defaultConfig

/**
 * Get configuration value with fallback to default
 */
export function getConfigValue<K extends keyof ScraperConfig>(
  key: K,
  override?: ScraperConfig[K],
): ScraperConfig[K] {
  if (override !== undefined)
    return override
  return config[key] ?? defaultConfig[key]
}
