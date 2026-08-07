import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { ScraperCache } from '../src/cache'
import { conditionalFetch } from '../src/conditional'

/**
 * Conditional requests, against a real server rather than a stubbed fetch.
 *
 * The whole point is the wire behaviour — which headers go out and what
 * comes back — so a mocked `fetch` would assert our own assumptions rather
 * than the protocol. This spins a Bun server that implements `ETag` and
 * `If-None-Match` properly and checks what actually crosses.
 */

let server: ReturnType<typeof Bun.serve>
let base: string

/** Bumped by a test to simulate the document changing. */
let version = 1
/** Every request's headers, for asserting what we sent. */
const seen: Array<Record<string, string>> = []

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value })
      seen.push(headers)

      const url = new URL(request.url)

      if (url.pathname === '/missing')
        return new Response('gone', { status: 404 })

      // A server that only speaks Last-Modified, which plenty do.
      if (url.pathname === '/dated') {
        const lastModified = 'Wed, 01 Jul 2026 00:00:00 GMT'
        if (headers['if-modified-since'] === lastModified)
          return new Response(null, { status: 304 })
        return new Response('dated body', { headers: { 'Last-Modified': lastModified } })
      }

      const etag = `"v${version}"`
      if (headers['if-none-match'] === etag)
        return new Response(null, { status: 304, headers: { ETag: etag } })

      return new Response(`body v${version}`, { headers: { ETag: etag } })
    },
  })
  base = `http://localhost:${server.port}`
})

afterAll(() => {
  server.stop(true)
})

function freshCache() {
  return new ScraperCache({ enabled: true, ttl: 60_000 })
}

describe('conditionalFetch', () => {
  it('fetches normally when nothing is cached', async () => {
    const result = await conditionalFetch(`${base}/doc`, { cache: freshCache() })

    expect(result.status).toBe(200)
    expect(result.body).toBe('body v1')
    expect(result.notModified).toBe(false)
    expect(result.fromCache).toBe(false)
    expect(result.etag).toBe('"v1"')
  })

  it('sends the stored validator and serves the cached body on 304', async () => {
    const cache = freshCache()
    seen.length = 0

    await conditionalFetch(`${base}/doc`, { cache })
    // Skip the TTL short-circuit so a real request goes out.
    const second = await conditionalFetch(`${base}/doc`, { cache, useFresh: false })

    expect(seen[1]!['if-none-match']).toBe('"v1"')
    expect(second.status).toBe(304)
    expect(second.notModified).toBe(true)
    // The body survives a 304, which carries none.
    expect(second.body).toBe('body v1')
  })

  it('picks up a changed document', async () => {
    const cache = freshCache()
    await conditionalFetch(`${base}/doc`, { cache })

    version = 2
    try {
      const changed = await conditionalFetch(`${base}/doc`, { cache, useFresh: false })
      expect(changed.status).toBe(200)
      expect(changed.body).toBe('body v2')
      expect(changed.notModified).toBe(false)
    }
    finally {
      version = 1
    }
  })

  it('skips the request entirely while the entry is TTL-fresh', async () => {
    const cache = freshCache()
    await conditionalFetch(`${base}/doc`, { cache })

    seen.length = 0
    const cached = await conditionalFetch(`${base}/doc`, { cache })

    // No request at all — the cheapest possible poll.
    expect(seen).toHaveLength(0)
    expect(cached.fromCache).toBe(true)
    expect(cached.body).toBe('body v1')
  })

  it('falls back to If-Modified-Since when that is all the server offers', async () => {
    const cache = freshCache()
    seen.length = 0

    await conditionalFetch(`${base}/dated`, { cache })
    const second = await conditionalFetch(`${base}/dated`, { cache, useFresh: false })

    expect(seen[1]!['if-modified-since']).toBe('Wed, 01 Jul 2026 00:00:00 GMT')
    expect(second.status).toBe(304)
    expect(second.body).toBe('dated body')
  })

  it('works with no cache at all', async () => {
    const result = await conditionalFetch(`${base}/doc`)
    expect(result.status).toBe(200)
    expect(result.fromCache).toBe(false)
  })

  it('throws on a real error status rather than returning an empty body', async () => {
    // A moved endpoint must not be able to look like a quiet one.
    await expect(conditionalFetch(`${base}/missing`, { cache: freshCache() })).rejects.toThrow('404')
  })

  it('routes through a proxy when one is given', async () => {
    // The proxy is a real server here, so this proves the option reaches
    // Bun's fetch rather than being silently dropped — a dropped proxy
    // would send the request direct, which for a geo-restricted service is
    // exactly the failure the option exists to prevent.
    let sawProxiedRequest = false

    const proxy = Bun.serve({
      port: 0,
      fetch() {
        sawProxiedRequest = true
        return new Response('via proxy', { headers: { ETag: '"p1"' } })
      },
    })

    try {
      const result = await conditionalFetch(`${base}/doc`, {
        proxy: `http://localhost:${proxy.port}`,
      })

      expect(sawProxiedRequest).toBe(true)
      expect(result.body).toBe('via proxy')
    }
    finally {
      proxy.stop(true)
    }
  })

  it('honours a caller abort', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(conditionalFetch(`${base}/doc`, { signal: controller.signal })).rejects.toThrow()
  })
})
