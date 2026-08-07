/**
 * Conditional requests — asking a server only for what changed.
 *
 * `ScraperCache` already stores an `etag` and a `lastModified` for every
 * entry, and nothing ever sent them back. That is the difference between
 * a poller that re-downloads an unchanged document every pass and one
 * that gets a 42-byte `304 Not Modified`, which on a fast cadence is the
 * single largest lever on both bandwidth and the chance of being rate
 * limited.
 *
 * The TTL and the validator answer different questions and both are kept.
 * A fresh TTL means "do not ask at all"; an expired TTL with a validator
 * means "ask, but cheaply". Collapsing them into one would either re-fetch
 * fresh documents or serve stale ones indefinitely.
 *
 * Zero dependencies — Bun's native `fetch` and `AbortSignal`.
 */

import type { ScraperCache } from './cache'

export interface ConditionalFetchOptions {
  /** Where validators are read from and written back to. */
  cache?: ScraperCache
  /** Extra request headers. Conditional headers are added on top. */
  headers?: Record<string, string>
  /** Abort after this many milliseconds. */
  timeout?: number
  /** Cache key. Defaults to the URL. */
  key?: string
  /** Entry lifetime in ms, passed through to the cache. */
  ttl?: number
  /**
   * Serve a TTL-fresh entry without any request at all.
   * @default true
   */
  useFresh?: boolean
  signal?: AbortSignal
}

export interface ConditionalFetchResult {
  /** The body, whether it came from the network or the cache. */
  body: string
  /** The response status. 304 is reported as-is rather than hidden. */
  status: number
  /** True when the server confirmed our copy is still current. */
  notModified: boolean
  /** True when no request was made, because the entry was still fresh. */
  fromCache: boolean
  etag?: string
  lastModified?: string
  headers?: Record<string, string>
}

function headerRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value
  })
  return out
}

/**
 * GET a URL, revalidating rather than re-downloading where possible.
 *
 * Throws on a transport failure, and on any status that is neither a
 * success nor a 304 — a 404 is a real answer and pretending it is an empty
 * document would let a moved endpoint look like a quiet one.
 */
export async function conditionalFetch(
  url: string,
  options: ConditionalFetchOptions = {},
): Promise<ConditionalFetchResult> {
  const { cache, timeout, ttl, signal } = options
  const key = options.key ?? url
  const useFresh = options.useFresh !== false

  const cached = cache ? await cache.get<string>(key) : null

  // A TTL-fresh entry needs no request at all. `cache.get` is responsible
  // for expiring stale entries, so anything it returns is within its TTL.
  if (cached && useFresh) {
    return {
      body: cached.data,
      status: 200,
      notModified: true,
      fromCache: true,
      etag: cached.etag,
      lastModified: cached.lastModified,
      headers: cached.headers,
    }
  }

  const headers: Record<string, string> = { ...options.headers }

  // Validators only help when we still hold the body they describe.
  if (cached?.etag)
    headers['If-None-Match'] = cached.etag
  if (cached?.lastModified)
    headers['If-Modified-Since'] = cached.lastModified

  const controller = new AbortController()
  const timer = timeout ? setTimeout(() => controller.abort(), timeout) : null

  // Honour a caller's abort as well as our own timeout. A signal that is
  // *already* aborted never fires the event, so it has to be checked
  // rather than only listened for — otherwise a cancelled caller still
  // sends the request.
  const onAbort = () => controller.abort()
  if (signal?.aborted)
    controller.abort()
  else
    signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const responseHeaders = headerRecord(response.headers)

    if (response.status === 304) {
      // The server kept its side of the bargain. Without a cached body
      // there is nothing to serve, which means we sent a validator for
      // an entry we no longer hold — a bug worth surfacing, not a 304.
      if (!cached)
        throw new Error(`304 for ${url} with no cached body to serve`)

      // Refresh the entry so the TTL restarts; the body is unchanged.
      await cache?.set(key, cached.data, ttl, {
        etag: responseHeaders.etag ?? cached.etag,
        lastModified: responseHeaders['last-modified'] ?? cached.lastModified,
        url,
        headers: responseHeaders,
      })

      return {
        body: cached.data,
        status: 304,
        notModified: true,
        fromCache: true,
        etag: responseHeaders.etag ?? cached.etag,
        lastModified: responseHeaders['last-modified'] ?? cached.lastModified,
        headers: responseHeaders,
      }
    }

    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const body = await response.text()

    await cache?.set(key, body, ttl, {
      etag: responseHeaders.etag,
      lastModified: responseHeaders['last-modified'],
      url,
      headers: responseHeaders,
    })

    return {
      body,
      status: response.status,
      notModified: false,
      fromCache: false,
      etag: responseHeaders.etag,
      lastModified: responseHeaders['last-modified'],
      headers: responseHeaders,
    }
  }
  finally {
    if (timer)
      clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
