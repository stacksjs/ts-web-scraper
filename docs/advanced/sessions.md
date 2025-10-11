# Session Management

Manage cookies and sessions for authenticated scraping with persistent session storage.

## Cookie Jar

Manage cookies across requests:

```typescript
import { CookieJar } from 'ts-web-scraper'

const jar = new CookieJar()

// Set a cookie
jar.setCookie({
  name: 'session_id',
  value: 'abc123',
  domain: 'example.com',
  path: '/',
  expires: new Date(Date.now() + 86400000), // 24 hours
})

// Get cookies for a URL
const cookies = jar.getCookies('https://example.com/api')
console.log('Cookies:', cookies)

// Get as header string
const cookieString = jar.getCookieString('https://example.com/api')
console.log('Cookie header:', cookieString)
```

## Session Manager

Manage authenticated sessions:

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager()

// Make authenticated requests
const response = await session.fetch('https://example.com/api/user')
const data = await response.json()

console.log('User data:', data)

// Cookies are automatically stored and sent with subsequent requests
const response2 = await session.fetch('https://example.com/api/profile')
```

## Persistent Sessions

Save and load sessions from disk:

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager({
  persistPath: './session.json', // Auto-save to file
})

// Make requests - cookies are automatically saved
await session.fetch('https://example.com/login', {
  method: 'POST',
  body: JSON.stringify({ username: 'user', password: 'pass' }),
  headers: { 'Content-Type': 'application/json' },
})

// Cookies persist across restarts
// Later, create new session manager with same path
const newSession = new SessionManager({
  persistPath: './session.json',
})

await newSession.loadSession()
// Now has all cookies from previous session
```

## Login Flow

Implement login with session management:

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager({
  persistPath: './auth-session.json',
})

async function login(username: string, password: string) {
  // Get login page to extract CSRF token
  const loginPage = await session.fetch('https://example.com/login')
  const html = await loginPage.text()

  // Extract CSRF token
  const csrfToken = session.extractCSRFToken(html)

  if (!csrfToken) {
    throw new Error('Could not find CSRF token')
  }

  // Submit login form
  const response = await session.fetch('https://example.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      password,
      csrf_token: csrfToken,
    }).toString(),
  })

  if (response.ok) {
    // Save session to disk
    await session.saveSession()
    console.log('Login successful, session saved')
    return true
  }

  return false
}

// Login
await login('myusername', 'mypassword')

// Now make authenticated requests
const dashboard = await session.fetch('https://example.com/dashboard')
```

## Cookie Management

Advanced cookie operations:

```typescript
import { CookieJar } from 'ts-web-scraper'

const jar = new CookieJar()

// Set cookie from Set-Cookie header string
jar.setCookie('session=abc123; Path=/; HttpOnly; Secure', 'https://example.com')

// Set cookie with options
jar.setCookie({
  name: 'user_pref',
  value: 'dark_mode',
  domain: '.example.com', // Works for all subdomains
  path: '/',
  maxAge: 86400, // 24 hours in seconds
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
})

// Get all cookies
const allCookies = jar.getAllCookies()
console.log(`Total cookies: ${allCookies.length}`)

// Delete a cookie
jar.deleteCookie('session', 'example.com')

// Clear expired cookies
const cleared = jar.clearExpired()
console.log(`Cleared ${cleared} expired cookies`)

// Clear all cookies
jar.clearCookies()
```

## Using with Scraper

Integrate with the main scraper:

```typescript
import { CookieJar, createScraper } from 'ts-web-scraper'

const jar = new CookieJar()

// Set authentication cookies
jar.setCookie({
  name: 'auth_token',
  value: 'your-token-here',
  domain: 'example.com',
  path: '/',
})

const scraper = createScraper({
  cookies: {
    enabled: true,
    jar, // Use our cookie jar
  },
})

// Requests will include cookies
const result = await scraper.scrape('https://example.com/protected', {
  extract: doc => ({
    content: doc.querySelector('.protected-content')?.textContent,
  }),
})
```

## Saving and Loading Sessions

Persist sessions between runs:

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager()

// Perform login
await session.fetch('https://example.com/login', {
  method: 'POST',
  body: JSON.stringify({ username: 'user', password: 'pass' }),
  headers: { 'Content-Type': 'application/json' },
})

// Save session
await session.saveSession('./my-session.json')

// Later, in another script or run:
const newSession = new SessionManager()
await newSession.loadSession('./my-session.json')

// Session is restored with all cookies
const profile = await newSession.fetch('https://example.com/profile')
```

## CSRF Token Extraction

Extract CSRF tokens from forms:

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager()

// Get page with form
const response = await session.fetch('https://example.com/form')
const html = await response.text()

// Extract CSRF token (supports common patterns)
const csrfToken = session.extractCSRFToken(html)

if (csrfToken) {
  // Use token in form submission
  await session.fetch('https://example.com/submit', {
    method: 'POST',
    body: JSON.stringify({
      data: 'value',
      csrf_token: csrfToken,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}
```

## Cookie Jar Persistence

Automatically save cookies:

```typescript
import { CookieJar } from 'ts-web-scraper'

const jar = new CookieJar({
  persistPath: './cookies.json',
  autoSave: true, // Auto-save on every change
})

// Load existing cookies
try {
  await jar.loadFromDisk('./cookies.json')
  console.log('Loaded existing session')
}
catch {
  console.log('No existing session')
}

// Set cookies - automatically saved to disk
jar.setCookie({
  name: 'preference',
  value: 'value',
  domain: 'example.com',
})

// Later, cookies are persisted
```

## Domain and Path Matching

Cookies are matched based on domain and path:

```typescript
import { CookieJar } from 'ts-web-scraper'

const jar = new CookieJar()

// Domain-specific cookie
jar.setCookie({
  name: 'site_cookie',
  value: 'value1',
  domain: 'example.com',
  path: '/',
})

// Subdomain cookie
jar.setCookie({
  name: 'sub_cookie',
  value: 'value2',
  domain: '.example.com', // Matches all subdomains
  path: '/',
})

// Get cookies for main domain
const mainCookies = jar.getCookies('https://example.com/page')
// Returns: both cookies

// Get cookies for subdomain
const subCookies = jar.getCookies('https://api.example.com/endpoint')
// Returns: only sub_cookie

// Path-specific cookie
jar.setCookie({
  name: 'api_cookie',
  value: 'value3',
  domain: 'example.com',
  path: '/api',
})

// Get cookies for /api path
const apiCookies = jar.getCookies('https://example.com/api/users')
// Returns: site_cookie, sub_cookie, api_cookie

// Get cookies for root
const rootCookies = jar.getCookies('https://example.com/')
// Returns: site_cookie, sub_cookie
```

## Secure Cookies

Handle secure and HttpOnly cookies:

```typescript
import { CookieJar } from 'ts-web-scraper'

const jar = new CookieJar()

// Secure cookie (HTTPS only)
jar.setCookie({
  name: 'secure_session',
  value: 'abc123',
  domain: 'example.com',
  secure: true, // Only sent over HTTPS
})

// HTTP request won't include secure cookie
const httpCookies = jar.getCookies('http://example.com')
// secure_session not included

// HTTPS request includes secure cookie
const httpsCookies = jar.getCookies('https://example.com')
// secure_session included

// HttpOnly cookie
jar.setCookie({
  name: 'http_only',
  value: 'xyz789',
  domain: 'example.com',
  httpOnly: true, // Not accessible to JavaScript
})
```

## Session Cleanup

Clean up sessions:

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager()

// Clear all cookies
session.clearSession()

// Clear expired cookies only
const jar = session.getCookieJar()
const cleared = jar.clearExpired()
console.log(`Cleared ${cleared} expired cookies`)

// Get cookie statistics
const allCookies = jar.getAllCookies()
console.log(`Total cookies: ${allCookies.length}`)
console.log('Cookie names:', jar.keys())
```

## Best Practices

1. Use persistent sessions to avoid re-authenticating
2. Extract and use CSRF tokens for form submissions
3. Clear expired cookies periodically
4. Use secure cookies for sensitive data
5. Save sessions to disk for long-running scrapers
6. Handle cookie expiration gracefully

```typescript
import { SessionManager } from 'ts-web-scraper'

const session = new SessionManager({
  persistPath: './session.json',
})

async function scrapeWithAuth() {
  try {
    // Try to load existing session
    await session.loadSession()
    console.log('Using existing session')
  }
  catch {
    // No session, login
    console.log('No session found, logging in...')
    const loginSuccess = await login('user', 'pass')

    if (!loginSuccess) {
      throw new Error('Login failed')
    }

    await session.saveSession()
  }

  // Clear expired cookies
  const jar = session.getCookieJar()
  jar.clearExpired()

  // Make authenticated requests
  const response = await session.fetch('https://example.com/api/data')
  const data = await response.json()

  return data
}

async function login(username: string, password: string) {
  const loginPage = await session.fetch('https://example.com/login')
  const html = await loginPage.text()
  const csrf = session.extractCSRFToken(html)

  const response = await session.fetch('https://example.com/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, csrf_token: csrf }),
  })

  return response.ok
}

const data = await scrapeWithAuth()
console.log(data)
```

## Next Steps

- Learn about [Robots.txt](/advanced/robots)
- Configure [Rate Limiting](/features/rate-limiting)
- Explore [Client-Side Rendering](/advanced/client-side)
