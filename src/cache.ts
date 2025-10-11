/**
 * Response Caching Layer
 *
 * Provides in-memory and disk-based caching with LRU eviction
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export interface CacheOptions {
  /**
   * Enable caching
   * @default true
   */
  enabled?: boolean

  /**
   * Time to live in milliseconds
   * @default 3600000 (1 hour)
   */
  ttl?: number

  /**
   * Maximum number of cache entries
   * @default 1000
   */
  maxSize?: number

  /**
   * Storage type
   * @default 'memory'
   */
  storage?: 'memory' | 'disk'

  /**
   * Directory for disk cache
   * @default '.cache/scraper'
   */
  cacheDir?: string

  /**
   * Custom key generator
   */
  keyGenerator?: (url: string, options?: any) => string

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

export interface CachedData<T = any> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
  lastModified?: string
  url: string
  headers?: Record<string, string>
}

export interface CacheStats {
  size: number
  hits: number
  misses: number
  evictions: number
  hitRate: number
}

/**
 * LRU Cache Node
 */
class CacheNode<T> {
  constructor(
    public key: string,
    public value: CachedData<T>,
    public prev: CacheNode<T> | null = null,
    public next: CacheNode<T> | null = null,
  ) {}
}

/**
 * In-Memory Cache with LRU Eviction
 */
export class ScraperCache {
  private cache = new Map<string, CacheNode<any>>()
  private head: CacheNode<any> | null = null
  private tail: CacheNode<any> | null = null
  private hits = 0
  private misses = 0
  private evictions = 0

  constructor(private options: Required<CacheOptions>) {}

  /**
   * Get cached data
   */
  async get<T = any>(key: string): Promise<CachedData<T> | null> {
    if (!this.options.enabled) {
      return null
    }

    // Try memory cache first
    const node = this.cache.get(key)

    if (node) {
      // Check if expired
      const age = Date.now() - node.value.timestamp
      if (age > node.value.ttl) {
        if (this.options.debug) {
          console.log(`[Cache] Expired: ${key}`)
        }
        this.delete(key)
        this.misses++
        return null
      }

      // Move to front (most recently used)
      this.moveToFront(node)
      this.hits++

      if (this.options.debug) {
        console.log(`[Cache] Hit: ${key}`)
      }

      return node.value
    }

    // Try disk cache if enabled
    if (this.options.storage === 'disk') {
      const diskData = await this.getFromDisk<T>(key)
      if (diskData) {
        // Load into memory cache
        await this.set(key, diskData.data, diskData.ttl, {
          etag: diskData.etag,
          lastModified: diskData.lastModified,
        })
        this.hits++
        return diskData
      }
    }

    this.misses++
    if (this.options.debug) {
      console.log(`[Cache] Miss: ${key}`)
    }

    return null
  }

  /**
   * Set cached data
   */
  async set<T = any>(
    key: string,
    data: T,
    ttl?: number,
    options: {
      etag?: string
      lastModified?: string
      url?: string
      headers?: Record<string, string>
    } = {},
  ): Promise<void> {
    if (!this.options.enabled) {
      return
    }

    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      etag: options.etag,
      lastModified: options.lastModified,
      url: options.url || key,
      headers: options.headers,
    }

    // Check if key exists
    const existingNode = this.cache.get(key)
    if (existingNode) {
      existingNode.value = cachedData
      this.moveToFront(existingNode)
    }
    else {
      // Evict if at max size
      if (this.cache.size >= this.options.maxSize) {
        this.evictLRU()
      }

      // Add new node
      const node = new CacheNode(key, cachedData)
      this.cache.set(key, node)
      this.addToFront(node)
    }

    // Save to disk if enabled
    if (this.options.storage === 'disk') {
      await this.saveToDisk(key, cachedData)
    }

    if (this.options.debug) {
      console.log(`[Cache] Set: ${key}`)
    }
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    this.removeNode(node)
    this.cache.delete(key)

    if (this.options.debug) {
      console.log(`[Cache] Deleted: ${key}`)
    }

    return true
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.head = null
    this.tail = null
    this.hits = 0
    this.misses = 0
    this.evictions = 0

    // Clear disk cache
    if (this.options.storage === 'disk') {
      try {
        const fs = await import('node:fs/promises')
        await fs.rm(this.options.cacheDir, { recursive: true, force: true })
        await fs.mkdir(this.options.cacheDir, { recursive: true })
      }
      catch (error) {
        console.error('[Cache] Failed to clear disk cache:', error)
      }
    }

    if (this.options.debug) {
      console.log('[Cache] Cleared')
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 0,
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    const age = Date.now() - node.value.timestamp
    return age <= node.value.ttl
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Private methods

  private moveToFront(node: CacheNode<any>): void {
    this.removeNode(node)
    this.addToFront(node)
  }

  private addToFront(node: CacheNode<any>): void {
    node.next = this.head
    node.prev = null

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  private removeNode(node: CacheNode<any>): void {
    if (node.prev) {
      node.prev.next = node.next
    }
    else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    }
    else {
      this.tail = node.prev
    }
  }

  private evictLRU(): void {
    if (!this.tail) {
      return
    }

    const key = this.tail.key
    this.removeNode(this.tail)
    this.cache.delete(key)
    this.evictions++

    if (this.options.debug) {
      console.log(`[Cache] Evicted: ${key}`)
    }
  }

  private async getFromDisk<T>(key: string): Promise<CachedData<T> | null> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const filePath = path.join(this.options.cacheDir, `${this.hashKey(key)}.json`)

      const content = await fs.readFile(filePath, 'utf-8')
      const cached: CachedData<T> = JSON.parse(content)

      // Check if expired
      const age = Date.now() - cached.timestamp
      if (age > cached.ttl) {
        await fs.unlink(filePath).catch(() => {})
        return null
      }

      return cached
    }
    catch {
      return null
    }
  }

  private async saveToDisk<T>(key: string, data: CachedData<T>): Promise<void> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')

      await fs.mkdir(this.options.cacheDir, { recursive: true })

      const filePath = path.join(this.options.cacheDir, `${this.hashKey(key)}.json`)
      await fs.writeFile(filePath, JSON.stringify(data), 'utf-8')
    }
    catch (error) {
      console.error('[Cache] Failed to save to disk:', error)
    }
  }

  private hashKey(key: string): string {
    // Simple hash function for filename
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  enabled: true,
  ttl: 3600000, // 1 hour
  maxSize: 1000,
  storage: 'memory',
  cacheDir: '.cache/scraper',
  keyGenerator: (url: string) => url,
  debug: false,
}

/**
 * Global cache instance
 */
let globalCache: ScraperCache | null = null

export function getGlobalCache(options?: CacheOptions): ScraperCache {
  if (!globalCache || options) {
    const mergedOptions = { ...DEFAULT_CACHE_OPTIONS, ...options }
    globalCache = new ScraperCache(mergedOptions)
  }
  return globalCache
}

export function resetGlobalCache(): void {
  globalCache = null
}

/**
 * Generate cache key from URL and options
 */
export function generateCacheKey(url: string, options?: Record<string, any>): string {
  if (!options || Object.keys(options).length === 0) {
    return url
  }

  // Sort options for consistent keys
  const sortedOptions = Object.keys(options)
    .sort()
    .reduce((acc, key) => {
      acc[key] = options[key]
      return acc
    }, {} as Record<string, any>)

  return `${url}:${JSON.stringify(sortedOptions)}`
}
