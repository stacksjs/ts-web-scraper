import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CookieJar, SessionManager } from '../src/cookies'
import type { Cookie } from '../src/cookies'

describe('CookieJar', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cookie-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should set and get cookies', () => {
    const jar = new CookieJar()
    const cookie: Cookie = {
      name: 'session',
      value: 'abc123',
      domain: 'example.com',
      path: '/',
    }

    jar.setCookie(cookie)
    const cookies = jar.getCookies('https://example.com/')
    expect(cookies.length).toBe(1)
    expect(cookies[0].name).toBe('session')
    expect(cookies[0].value).toBe('abc123')
  })

  it('should parse cookie strings', () => {
    const jar = new CookieJar()
    jar.setCookie('session=abc123; Domain=example.com; Path=/', 'https://example.com')

    const cookies = jar.getCookies('https://example.com/')
    expect(cookies.length).toBe(1)
    expect(cookies[0].name).toBe('session')
    expect(cookies[0].value).toBe('abc123')
  })

  it('should handle domain matching - exact match', () => {
    const jar = new CookieJar()
    jar.setCookie({
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
    })

    expect(jar.getCookies('https://example.com/').length).toBe(1)
    expect(jar.getCookies('https://other.com/').length).toBe(0)
  })

  it('should handle domain matching - subdomain', () => {
    const jar = new CookieJar()
    jar.setCookie({
      name: 'test',
      value: 'value',
      domain: '.example.com',
      path: '/',
    })

    expect(jar.getCookies('https://example.com/').length).toBe(1)
    expect(jar.getCookies('https://sub.example.com/').length).toBe(1)
    expect(jar.getCookies('https://other.com/').length).toBe(0)
  })

  it('should handle domain matching - implicit subdomain', () => {
    const jar = new CookieJar()
    jar.setCookie({
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
    })

    expect(jar.getCookies('https://example.com/').length).toBe(1)
    expect(jar.getCookies('https://sub.example.com/').length).toBe(1)
  })

  it('should handle path matching', () => {
    const jar = new CookieJar()
    jar.setCookie({
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/admin',
    })

    expect(jar.getCookies('https://example.com/admin').length).toBe(1)
    expect(jar.getCookies('https://example.com/admin/users').length).toBe(1)
    expect(jar.getCookies('https://example.com/').length).toBe(0)
    expect(jar.getCookies('https://example.com/user').length).toBe(0)
  })

  it('should handle path matching with trailing slash', () => {
    const jar = new CookieJar()
    jar.setCookie({
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/admin/',
    })

    expect(jar.getCookies('https://example.com/admin/').length).toBe(1)
    expect(jar.getCookies('https://example.com/admin/users').length).toBe(1)
  })

  it('should respect secure flag', () => {
    const jar = new CookieJar()
    jar.setCookie({
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
      secure: true,
    })

    expect(jar.getCookies('https://example.com/').length).toBe(1)
    expect(jar.getCookies('http://example.com/').length).toBe(0)
  })

  it('should handle expired cookies', () => {
    const jar = new CookieJar()
    const pastDate = new Date(Date.now() - 1000)

    jar.setCookie({
      name: 'expired',
      value: 'value',
      domain: 'example.com',
      path: '/',
      expires: pastDate,
    })

    expect(jar.getCookies('https://example.com/').length).toBe(0)
  })

  it('should handle max-age', () => {
    const jar = new CookieJar()
    jar.setCookie('session=abc123; Max-Age=1; Domain=example.com', 'https://example.com')

    const cookies = jar.getCookies('https://example.com/')
    expect(cookies.length).toBe(1)
    expect(cookies[0].maxAge).toBe(1)
    expect(cookies[0].expires).toBeDefined()
  })

  it('should parse all cookie attributes', () => {
    const jar = new CookieJar()
    jar.setCookie(
      'session=abc123; Domain=example.com; Path=/admin; Secure; HttpOnly; SameSite=Strict',
      'https://example.com',
    )

    const cookies = jar.getCookies('https://example.com/admin')
    expect(cookies.length).toBe(1)
    expect(cookies[0].secure).toBe(true)
    expect(cookies[0].httpOnly).toBe(true)
    expect(cookies[0].sameSite).toBe('Strict')
  })

  it('should get cookie string', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'a', value: '1', domain: 'example.com', path: '/' })
    jar.setCookie({ name: 'b', value: '2', domain: 'example.com', path: '/' })

    const cookieString = jar.getCookieString('https://example.com/')
    expect(cookieString).toContain('a=1')
    expect(cookieString).toContain('b=2')
    expect(cookieString).toContain('; ')
  })

  it('should get all cookies', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'a', value: '1', domain: 'example.com', path: '/' })
    jar.setCookie({ name: 'b', value: '2', domain: 'other.com', path: '/' })

    const allCookies = jar.getAllCookies()
    expect(allCookies.length).toBe(2)
  })

  it('should delete cookies', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    expect(jar.deleteCookie('test', 'example.com')).toBe(true)
    expect(jar.getCookies('https://example.com/').length).toBe(0)
  })

  it('should clear all cookies', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'a', value: '1', domain: 'example.com', path: '/' })
    jar.setCookie({ name: 'b', value: '2', domain: 'example.com', path: '/' })

    jar.clearCookies()
    expect(jar.getAllCookies().length).toBe(0)
  })

  it('should clear expired cookies', () => {
    const jar = new CookieJar()
    const pastDate = new Date(Date.now() - 1000)
    const futureDate = new Date(Date.now() + 10000)

    jar.setCookie({
      name: 'expired',
      value: 'value',
      domain: 'example.com',
      path: '/',
      expires: pastDate,
    })
    jar.setCookie({
      name: 'valid',
      value: 'value',
      domain: 'example.com',
      path: '/',
      expires: futureDate,
    })

    const cleared = jar.clearExpired()
    expect(cleared).toBe(1)
    expect(jar.getAllCookies().length).toBe(1)
  })

  it('should save cookies to disk', async () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    const filePath = join(tempDir, 'cookies.json')
    await jar.saveToDisk(filePath)

    const file = Bun.file(filePath)
    const content = await file.text()
    expect(content).toContain('test')
    expect(content).toContain('value')
  })

  it('should load cookies from disk', async () => {
    const jar1 = new CookieJar()
    jar1.setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    const filePath = join(tempDir, 'cookies.json')
    await jar1.saveToDisk(filePath)

    const jar2 = new CookieJar()
    await jar2.loadFromDisk(filePath)

    const cookies = jar2.getCookies('https://example.com/')
    expect(cookies.length).toBe(1)
    expect(cookies[0].name).toBe('test')
    expect(cookies[0].value).toBe('value')
  })

  it('should handle Date deserialization when loading', async () => {
    const jar1 = new CookieJar()
    const futureDate = new Date(Date.now() + 10000)
    jar1.setCookie({
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
      expires: futureDate,
    })

    const filePath = join(tempDir, 'cookies.json')
    await jar1.saveToDisk(filePath)

    const jar2 = new CookieJar()
    await jar2.loadFromDisk(filePath)

    const cookies = jar2.getCookies('https://example.com/')
    expect(cookies[0].expires).toBeInstanceOf(Date)
  })

  it('should auto-save when configured', async () => {
    const filePath = join(tempDir, 'cookies.json')
    const jar = new CookieJar({
      persistPath: filePath,
      autoSave: true,
    })

    jar.setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    // Wait a bit for async save
    await new Promise(resolve => setTimeout(resolve, 100))

    const file = Bun.file(filePath)
    const exists = await file.exists()
    expect(exists).toBe(true)
  })

  it('should check if key exists', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    expect(jar.has('example.com:test')).toBe(true)
    expect(jar.has('example.com:other')).toBe(false)
  })

  it('should list all keys', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'a', value: '1', domain: 'example.com', path: '/' })
    jar.setCookie({ name: 'b', value: '2', domain: 'example.com', path: '/' })

    const keys = jar.keys()
    expect(keys.length).toBe(2)
    expect(keys).toContain('example.com:a')
    expect(keys).toContain('example.com:b')
  })

  it('should return size', () => {
    const jar = new CookieJar()
    expect(jar.size()).toBe(0)

    jar.setCookie({ name: 'a', value: '1', domain: 'example.com', path: '/' })
    expect(jar.size()).toBe(1)

    jar.setCookie({ name: 'b', value: '2', domain: 'example.com', path: '/' })
    expect(jar.size()).toBe(2)
  })

  it('should handle cookies with = in value', () => {
    const jar = new CookieJar()
    jar.setCookie('token=abc=def=ghi; Domain=example.com', 'https://example.com')

    const cookies = jar.getCookies('https://example.com/')
    expect(cookies[0].value).toBe('abc=def=ghi')
  })

  it('should set default path if not specified', () => {
    const jar = new CookieJar()
    jar.setCookie('test=value; Domain=example.com', 'https://example.com')

    const cookies = jar.getCookies('https://example.com/')
    expect(cookies[0].path).toBe('/')
  })
})

describe('SessionManager', () => {
  it('should create session with cookie jar', () => {
    const session = new SessionManager()
    const jar = session.getCookieJar()
    expect(jar).toBeDefined()
    expect(jar.size()).toBe(0)
  })

  it('should accept custom cookie jar', () => {
    const jar = new CookieJar()
    jar.setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    const session = new SessionManager({ cookieJar: jar })
    expect(session.getCookieJar().size()).toBe(1)
  })

  it('should clear session', () => {
    const session = new SessionManager()
    session.getCookieJar().setCookie({ name: 'test', value: 'value', domain: 'example.com', path: '/' })

    session.clearSession()
    expect(session.getCookieJar().size()).toBe(0)
  })

  it('should extract CSRF token from input field', () => {
    const session = new SessionManager()
    const html = '<form><input name="csrf_token" value="abc123" /></form>'

    const token = session.extractCSRFToken(html)
    expect(token).toBe('abc123')
  })

  it('should extract CSRF token from input field (reversed)', () => {
    const session = new SessionManager()
    const html = '<form><input value="abc123" name="csrf_token" /></form>'

    const token = session.extractCSRFToken(html)
    expect(token).toBe('abc123')
  })

  it('should extract CSRF token from meta tag', () => {
    const session = new SessionManager()
    const html = '<head><meta name="csrf-token" content="xyz789" /></head>'

    const token = session.extractCSRFToken(html)
    expect(token).toBe('xyz789')
  })

  it('should extract CSRF token from meta tag (reversed)', () => {
    const session = new SessionManager()
    const html = '<head><meta content="xyz789" name="csrf-token" /></head>'

    const token = session.extractCSRFToken(html)
    expect(token).toBe('xyz789')
  })

  it('should return null if no CSRF token found', () => {
    const session = new SessionManager()
    const html = '<form><input name="other" value="value" /></form>'

    const token = session.extractCSRFToken(html)
    expect(token).toBeNull()
  })

  it('should handle various CSRF token formats', () => {
    const session = new SessionManager()

    // Test csrf_token
    expect(session.extractCSRFToken('<input name="csrf_token" value="a" />')).toBe('a')

    // Test csrf-token
    expect(session.extractCSRFToken('<input name="csrf-token" value="b" />')).toBe('b')

    // Test csrftoken
    expect(session.extractCSRFToken('<input name="csrftoken" value="c" />')).toBe('c')
  })
})
