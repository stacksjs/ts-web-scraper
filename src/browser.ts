/**
 * Browser-based Scraper using Chrome DevTools Protocol
 *
 * Zero-dependency headless browser automation using only Bun native APIs.
 * Communicates directly with Chrome/Chromium via CDP over WebSocket.
 */

import type { Document } from './web-scraper'
import { parseHTML } from './web-scraper'

export interface BrowserOptions {
  /** Path to Chrome/Chromium executable */
  executablePath?: string
  /** Run in headless mode */
  headless?: boolean
  /** Additional Chrome arguments */
  args?: string[]
  /** Default timeout in milliseconds */
  timeout?: number
  /** User agent string */
  userAgent?: string
  /** Viewport width */
  viewportWidth?: number
  /** Viewport height */
  viewportHeight?: number
}

export interface PageOptions {
  /** Wait for this selector before returning */
  waitForSelector?: string
  /** Wait for network to be idle */
  waitForNetworkIdle?: boolean
  /** Maximum wait time in milliseconds */
  timeout?: number
  /** Delay after page load in milliseconds */
  delay?: number
  /** Wait until this event */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
}

export interface BrowserScrapeResult<T = any> {
  success: boolean
  url: string
  html: string
  document: Document
  data?: T
  error?: string
}

interface CDPMessage {
  id: number
  method?: string
  params?: Record<string, any>
  result?: any
  error?: { code: number, message: string }
}

/**
 * Lightweight browser controller using Chrome DevTools Protocol
 */
export class Browser {
  private process: ReturnType<typeof Bun.spawn> | null = null
  private ws: WebSocket | null = null
  private messageId = 0
  private pendingMessages = new Map<number, { resolve: (value: any) => void, reject: (error: Error) => void }>()
  private options: Required<BrowserOptions>
  private debuggerUrl: string | null = null

  constructor(options: BrowserOptions = {}) {
    this.options = {
      executablePath: options.executablePath || this.findChrome(),
      headless: options.headless ?? true,
      args: options.args || [],
      timeout: options.timeout ?? 30000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewportWidth: options.viewportWidth ?? 1920,
      viewportHeight: options.viewportHeight ?? 1080,
    }
  }

  /**
   * Find Chrome/Chromium executable path
   */
  private findChrome(): string {
    const paths = [
      // macOS Chrome/Chromium
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      // macOS Arc (Chromium-based)
      '/Applications/Arc.app/Contents/MacOS/Arc',
      // macOS Brave (Chromium-based)
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      // macOS Edge (Chromium-based)
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      // Linux
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
      // Windows (common paths)
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ]

    for (const path of paths) {
      try {
        // Use Bun.spawnSync to check if file exists and is executable
        const result = Bun.spawnSync(['test', '-x', path])
        if (result.exitCode === 0) {
          return path
        }
      }
      catch {
        // Continue searching
      }
    }

    // Try 'which' command on Unix-like systems
    try {
      const result = Bun.spawnSync(['which', 'google-chrome'])
      if (result.exitCode === 0) {
        return result.stdout.toString().trim()
      }
    }
    catch {
      // Ignore
    }

    try {
      const result = Bun.spawnSync(['which', 'chromium'])
      if (result.exitCode === 0) {
        return result.stdout.toString().trim()
      }
    }
    catch {
      // Ignore
    }

    throw new Error('Chrome/Chromium not found. Please install Chrome or specify executablePath.')
  }

  /**
   * Launch browser and connect via CDP
   */
  async launch(): Promise<void> {
    const args = [
      this.options.headless ? '--headless=new' : '',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--remote-debugging-port=0', // Random port
      `--window-size=${this.options.viewportWidth},${this.options.viewportHeight}`,
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--password-store=basic',
      '--use-mock-keychain',
      '--export-tagged-pdf',
      '--hide-scrollbars',
      '--mute-audio',
      ...this.options.args,
    ].filter(Boolean)

    // Launch Chrome
    this.process = Bun.spawn([this.options.executablePath, ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    // Wait for DevTools URL from stderr
    if (!this.process.stderr || typeof this.process.stderr === 'number') {
      throw new Error('Failed to capture browser stderr')
    }
    const reader = this.process.stderr.getReader()
    const decoder = new TextDecoder()
    let output = ''
    const startTime = Date.now()

    while (Date.now() - startTime < this.options.timeout) {
      const { value, done } = await reader.read()
      if (done)
        break

      output += decoder.decode(value)

      // Look for WebSocket debugger URL
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (match) {
        this.debuggerUrl = match[1]
        break
      }
    }

    reader.releaseLock()

    if (!this.debuggerUrl) {
      await this.close()
      throw new Error('Failed to get Chrome DevTools URL')
    }

    // Get the page target.
    //
    // The JSON endpoints live at the origin, so the base has to be built
    // from the host rather than by rewriting a path segment. Chrome's
    // debugger URL is `ws://host:port/devtools/browser/<uuid>`, and
    // substituting `/devtools/browser/` for `/json/list` leaves the uuid
    // stranded on the end — `/json/list<uuid>` — which 404s with an HTML
    // body and surfaces as "Failed to parse JSON" a long way from the
    // cause. Launching a browser never worked.
    const { host } = new URL(this.debuggerUrl.replace(/^ws:/, 'http:'))
    const httpBase = `http://${host}`

    // Wait a moment for targets to be available
    await new Promise(r => setTimeout(r, 500))

    const response = await fetch(`${httpBase}/json/list`)
    const targets = await response.json() as Array<{ type: string, webSocketDebuggerUrl: string }>

    const pageTarget = targets.find(t => t.type === 'page')
    if (!pageTarget) {
      // `/json/new` requires PUT; Chrome has rejected GET on it since 111.
      const newPageResponse = await fetch(`${httpBase}/json/new`, { method: 'PUT' })
      const newPage = await newPageResponse.json() as { webSocketDebuggerUrl: string }
      this.debuggerUrl = newPage.webSocketDebuggerUrl
    }
    else {
      this.debuggerUrl = pageTarget.webSocketDebuggerUrl
    }

    // Connect WebSocket
    await this.connect()

    // Set user agent
    await this.send('Network.setUserAgentOverride', {
      userAgent: this.options.userAgent,
    })

    // Enable necessary domains
    await this.send('Page.enable')
    await this.send('Network.enable')
    await this.send('Runtime.enable')

    // Set viewport
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: this.options.viewportWidth,
      height: this.options.viewportHeight,
      deviceScaleFactor: 1,
      mobile: false,
    })
  }

  /**
   * Connect to CDP WebSocket
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.debuggerUrl) {
        reject(new Error('No debugger URL'))
        return
      }

      this.ws = new WebSocket(this.debuggerUrl)

      this.ws.onopen = () => resolve()
      this.ws.onerror = (e) => reject(new Error(`WebSocket error: ${e}`))
      this.ws.onclose = () => {
        this.ws = null
      }

      this.ws.onmessage = (event) => {
        try {
          const message: CDPMessage = JSON.parse(String(event.data))
          if (message.id !== undefined) {
            const pending = this.pendingMessages.get(message.id)
            if (pending) {
              this.pendingMessages.delete(message.id)
              if (message.error) {
                pending.reject(new Error(message.error.message))
              }
              else {
                pending.resolve(message.result)
              }
            }
          }
        }
        catch {
          // Ignore parse errors
        }
      }
    })
  }

  /**
   * Send CDP command
   */
  private async send(method: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.ws) {
      throw new Error('Not connected to browser')
    }

    const id = ++this.messageId

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(id)
        reject(new Error(`CDP command timed out: ${method}`))
      }, this.options.timeout)

      this.pendingMessages.set(id, {
        resolve: (value) => {
          clearTimeout(timeout)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })

      this.ws!.send(JSON.stringify({ id, method, params }))
    })
  }

  /**
   * Navigate to URL and get rendered HTML
   */
  async goto(url: string, options: PageOptions = {}): Promise<string> {
    const timeout = options.timeout ?? this.options.timeout
    const waitUntil = options.waitUntil ?? 'load'

    // Navigate
    const loadPromise = new Promise<void>((resolve) => {
      const checkLoad = async () => {
        // Wait for the appropriate event
        if (waitUntil === 'domcontentloaded' || waitUntil === 'load') {
          // Just wait a bit for initial load
          await new Promise(r => setTimeout(r, 1000))
          resolve()
        }
        else if (waitUntil === 'networkidle0' || waitUntil === 'networkidle2') {
          // Wait for network to be mostly idle
          await new Promise(r => setTimeout(r, 2000))
          resolve()
        }
        else {
          await new Promise(r => setTimeout(r, 1000))
          resolve()
        }
      }
      checkLoad()
    })

    await this.send('Page.navigate', { url })

    // Wait for page load
    await Promise.race([
      loadPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Navigation timeout')), timeout),
      ),
    ])

    // Optional: wait for selector
    if (options.waitForSelector) {
      await this.waitForSelector(options.waitForSelector, timeout)
    }

    // Optional: additional delay
    if (options.delay) {
      await new Promise(r => setTimeout(r, options.delay))
    }

    // Wait for network idle if requested
    if (options.waitForNetworkIdle) {
      await new Promise(r => setTimeout(r, 2000))
    }

    // Get page content
    const result = await this.send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    })

    return result.result.value
  }

  /**
   * Wait for a selector to appear
   */
  async waitForSelector(selector: string, timeout: number = 30000): Promise<void> {
    const startTime = Date.now()
    // eslint-disable-next-line quotes
    const escapedSelector = selector.replace(/'/g, "\\'")

    while (Date.now() - startTime < timeout) {
      const result = await this.send('Runtime.evaluate', {
        expression: `document.querySelector('${escapedSelector}') !== null`,
        returnByValue: true,
      })

      if (result.result.value === true) {
        return
      }

      await new Promise(r => setTimeout(r, 100))
    }

    throw new Error(`Timeout waiting for selector: ${selector}`)
  }

  /**
   * Execute JavaScript in the page context
   */
  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'Evaluation failed')
    }

    return result.result.value
  }

  /**
   * Scrape a page with JavaScript rendering
   */
  async scrape<T = any>(
    url: string,
    options: PageOptions & {
      extract?: (doc: Document) => T | Promise<T>
    } = {},
  ): Promise<BrowserScrapeResult<T>> {
    try {
      const html = await this.goto(url, options)
      const document = parseHTML(html)

      let data: T | undefined
      if (options.extract) {
        data = await options.extract(document)
      }

      return {
        success: true,
        url,
        html,
        document,
        data,
      }
    }
    catch (error) {
      return {
        success: false,
        url,
        html: '',
        document: parseHTML(''),
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    // Clear pending messages
    for (const [id, pending] of this.pendingMessages) {
      pending.reject(new Error('Browser closed'))
      this.pendingMessages.delete(id)
    }

    // Close WebSocket
    if (this.ws) {
      try {
        await this.send('Browser.close')
      }
      catch {
        // Ignore close errors
      }
      this.ws.close()
      this.ws = null
    }

    // Kill process
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }
}

/**
 * Create a browser scraper with automatic launch/close
 */
export async function createBrowser(options?: BrowserOptions): Promise<Browser> {
  const browser = new Browser(options)
  await browser.launch()
  return browser
}

/**
 * Scrape a single page with browser rendering
 */
export async function scrapeBrowser<T = any>(
  url: string,
  options: BrowserOptions & PageOptions & {
    extract?: (doc: Document) => T | Promise<T>
  } = {},
): Promise<BrowserScrapeResult<T>> {
  const browser = await createBrowser(options)
  try {
    return await browser.scrape(url, options)
  }
  finally {
    await browser.close()
  }
}
