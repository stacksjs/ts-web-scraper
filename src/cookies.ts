/**
 * Cookie and Session Management
 *
 * Handle cookies for authenticated scraping
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export interface Cookie {
  name: string
  value: string
  domain?: string
  path?: string
  expires?: Date
  maxAge?: number
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export interface CookieJarOptions {
  /**
   * File path for persisting cookies
   */
  persistPath?: string

  /**
   * Automatically save cookies to disk
   * @default false
   */
  autoSave?: boolean
}

/**
 * Cookie Jar for managing cookies across requests
 */
export class CookieJar {
  private cookies: Map<string, Cookie> = new Map()

  constructor(private options: CookieJarOptions = {}) {}

  /**
   * Set a cookie
   */
  setCookie(cookie: Cookie | string, url?: string): void {
    const parsed = typeof cookie === 'string' ? this.parseCookie(cookie, url) : cookie

    if (!parsed) {
      return
    }

    const key = this.getCookieKey(parsed)
    this.cookies.set(key, parsed)

    if (this.options.autoSave && this.options.persistPath) {
      this.saveToDisk(this.options.persistPath).catch(console.error)
    }
  }

  /**
   * Get cookies for a URL
   */
  getCookies(url: string): Cookie[] {
    const parsed = new URL(url)
    const now = new Date()
    const cookies: Cookie[] = []

    for (const cookie of this.cookies.values()) {
      // Check if expired
      if (cookie.expires && cookie.expires < now) {
        continue
      }

      // Check domain
      if (cookie.domain && !this.domainMatches(parsed.hostname, cookie.domain)) {
        continue
      }

      // Check path
      if (cookie.path && !this.pathMatches(parsed.pathname, cookie.path)) {
        continue
      }

      // Check secure
      if (cookie.secure && parsed.protocol !== 'https:') {
        continue
      }

      cookies.push(cookie)
    }

    return cookies
  }

  /**
   * Get cookies as Cookie header string
   */
  getCookieString(url: string): string {
    const cookies = this.getCookies(url)
    return cookies.map(c => `${c.name}=${c.value}`).join('; ')
  }

  /**
   * Get all cookies
   */
  getAllCookies(): Cookie[] {
    return Array.from(this.cookies.values())
  }

  /**
   * Delete a cookie
   */
  deleteCookie(name: string, domain?: string): boolean {
    const key = domain ? `${domain}:${name}` : name
    return this.cookies.delete(key)
  }

  /**
   * Clear all cookies
   */
  clearCookies(): void {
    this.cookies.clear()
  }

  /**
   * Clear expired cookies
   */
  clearExpired(): number {
    const now = new Date()
    let cleared = 0

    for (const [key, cookie] of this.cookies.entries()) {
      if (cookie.expires && cookie.expires < now) {
        this.cookies.delete(key)
        cleared++
      }
    }

    return cleared
  }

  /**
   * Save cookies to disk
   */
  async saveToDisk(path: string): Promise<void> {
    try {
      const data = JSON.stringify(Array.from(this.cookies.entries()), null, 2)
      await Bun.write(path, data)
    }
    catch (error) {
      throw new Error(`Failed to save cookies: ${error}`)
    }
  }

  /**
   * Load cookies from disk
   */
  async loadFromDisk(path: string): Promise<void> {
    try {
      const file = Bun.file(path)
      const content = await file.text()
      const entries = JSON.parse(content) as Array<[string, Cookie]>

      this.cookies.clear()
      for (const [key, cookie] of entries) {
        // Convert date strings back to Date objects
        if (cookie.expires) {
          cookie.expires = new Date(cookie.expires)
        }
        this.cookies.set(key, cookie)
      }
    }
    catch (error) {
      throw new Error(`Failed to load cookies: ${error}`)
    }
  }

  /**
   * Get cookie count
   */
  size(): number {
    return this.cookies.size
  }

  /**
   * Check if a cookie exists
   */
  has(key: string): boolean {
    return this.cookies.has(key)
  }

  /**
   * Get all cookie keys
   */
  keys(): string[] {
    return Array.from(this.cookies.keys())
  }

  // Private methods

  private parseCookie(cookieString: string, url?: string): Cookie | null {
    const parts = cookieString.split(';').map(p => p.trim())
    const [nameValue, ...attributes] = parts

    if (!nameValue || !nameValue.includes('=')) {
      return null
    }

    const [name, ...valueParts] = nameValue.split('=')
    const value = valueParts.join('=')

    const cookie: Cookie = {
      name: name.trim(),
      value: value.trim(),
    }

    // Parse attributes
    for (const attr of attributes) {
      const [key, ...attrValueParts] = attr.split('=')
      const attrKey = key.trim().toLowerCase()
      const attrValue = attrValueParts.join('=').trim()

      switch (attrKey) {
        case 'domain':
          cookie.domain = attrValue
          break
        case 'path':
          cookie.path = attrValue
          break
        case 'expires':
          cookie.expires = new Date(attrValue)
          break
        case 'max-age':
          cookie.maxAge = Number.parseInt(attrValue, 10)
          if (cookie.maxAge) {
            cookie.expires = new Date(Date.now() + cookie.maxAge * 1000)
          }
          break
        case 'secure':
          cookie.secure = true
          break
        case 'httponly':
          cookie.httpOnly = true
          break
        case 'samesite':
          cookie.sameSite = attrValue as 'Strict' | 'Lax' | 'None'
          break
      }
    }

    // Set domain from URL if not specified
    if (!cookie.domain && url) {
      const parsed = new URL(url)
      cookie.domain = parsed.hostname
    }

    // Set default path
    if (!cookie.path) {
      cookie.path = '/'
    }

    return cookie
  }

  private getCookieKey(cookie: Cookie): string {
    return cookie.domain ? `${cookie.domain}:${cookie.name}` : cookie.name
  }

  private domainMatches(hostname: string, cookieDomain: string): boolean {
    // Exact match
    if (hostname === cookieDomain) {
      return true
    }

    // Subdomain match (cookie domain starts with .)
    if (cookieDomain.startsWith('.')) {
      return hostname.endsWith(cookieDomain.slice(1)) || hostname === cookieDomain.slice(1)
    }

    // Subdomain match (implicit)
    return hostname.endsWith(`.${cookieDomain}`)
  }

  private pathMatches(pathname: string, cookiePath: string): boolean {
    // Exact match
    if (pathname === cookiePath) {
      return true
    }

    // Path prefix match
    if (pathname.startsWith(cookiePath)) {
      // Must be followed by / or be at end
      return cookiePath.endsWith('/') || pathname[cookiePath.length] === '/'
    }

    return false
  }
}

/**
 * Session Manager
 */
export class SessionManager {
  private cookieJar: CookieJar

  constructor(
    private options: {
      cookieJar?: CookieJar
      persistPath?: string
    } = {},
  ) {
    this.cookieJar = options.cookieJar || new CookieJar({
      persistPath: options.persistPath,
      autoSave: !!options.persistPath,
    })
  }

  /**
   * Get cookie jar
   */
  getCookieJar(): CookieJar {
    return this.cookieJar
  }

  /**
   * Make request with session cookies
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Add cookies to request
    const cookieString = this.cookieJar.getCookieString(url)
    const headers = new Headers(options.headers)

    if (cookieString) {
      headers.set('Cookie', cookieString)
    }

    // Make request
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Store cookies from response
    const setCookies = response.headers.getSetCookie()
    for (const cookie of setCookies) {
      this.cookieJar.setCookie(cookie, url)
    }

    return response
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.cookieJar.clearCookies()
  }

  /**
   * Save session to disk
   */
  async saveSession(path?: string): Promise<void> {
    const savePath = path || this.options.persistPath
    if (!savePath) {
      throw new Error('No persist path specified')
    }
    await this.cookieJar.saveToDisk(savePath)
  }

  /**
   * Load session from disk
   */
  async loadSession(path?: string): Promise<void> {
    const loadPath = path || this.options.persistPath
    if (!loadPath) {
      throw new Error('No persist path specified')
    }
    await this.cookieJar.loadFromDisk(loadPath)
  }

  /**
   * Extract CSRF token from HTML
   */
  extractCSRFToken(html: string): string | null {
    // Common CSRF token patterns
    const patterns = [
      /<input[^>]+name=["']csrf[_-]?token["'][^>]+value=["']([^"']+)["']/i,
      /<input[^>]+value=["']([^"']+)["'][^>]+name=["']csrf[_-]?token["']/i,
      /<meta[^>]+name=["']csrf[_-]?token["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']csrf[_-]?token["']/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }
}
