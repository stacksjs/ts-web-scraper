# Configuration

Configure ts-web-scraper to meet your specific scraping needs with a comprehensive set of options.

## Basic Configuration

Create a scraper with custom configuration:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  timeout: 30000,
  userAgent: 'MyBot/1.0',
  respectRobotsTxt: true,
})
```

## Complete Configuration

Here's a comprehensive configuration example with all available options:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  // Request settings
  timeout: 30000,  // Request timeout in milliseconds (default: 30000)
  userAgent: 'MyBot/1.0 (+https://example.com/bot)',  // Custom user agent
  followRedirects: true,  // Follow HTTP redirects (default: true)

  // Rate limiting
  rateLimit: {
    requestsPerSecond: 2,  // Max requests per second (default: no limit)
    burstSize: 5,          // Allow burst of N requests (default: 1)
    perDomain: true,       // Rate limit per domain (default: false)
  },

  // Caching
  cache: {
    enabled: true,      // Enable caching (default: false)
    ttl: 60000,        // Cache TTL in milliseconds (default: 300000)
    maxSize: 100,      // Max cached items (default: 100)
  },

  // Retry logic
  retry: {
    maxRetries: 3,           // Max retry attempts (default: 0)
    initialDelay: 1000,      // Initial delay in ms (default: 1000)
    backoff: 'exponential',  // 'fixed' | 'linear' | 'exponential' (default: 'exponential')
    maxDelay: 30000,         // Max delay between retries (default: 30000)
  },

  // Robots.txt
  respectRobotsTxt: true,  // Respect robots.txt rules (default: true)

  // Session & cookies
  cookies: {
    enabled: true,                   // Enable cookie handling (default: false)
    persistPath: './session.json',  // Persist cookies to file
    autoSave: true,                 // Auto-save cookies (default: false)
  },

  // Monitoring
  monitor: true,  // Enable performance monitoring (default: false)

  // Change tracking
  trackChanges: true,     // Track content changes (default: false)
  maxSnapshots: 10,       // Max snapshots per URL (default: 5)

  // Headers
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  },
})
```

## Configuration Options Reference

### Request Settings

#### `timeout`
- **Type**: `number`
- **Default**: `30000`
- **Description**: Request timeout in milliseconds

#### `userAgent`
- **Type**: `string`
- **Default**: `'BunScraper/1.0'`
- **Description**: User agent string for requests

#### `followRedirects`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to follow HTTP redirects

#### `headers`
- **Type**: `Record<string, string>`
- **Default**: `{}`
- **Description**: Custom headers to include in all requests

### Rate Limiting

#### `rateLimit.requestsPerSecond`
- **Type**: `number`
- **Default**: No limit
- **Description**: Maximum requests per second

#### `rateLimit.burstSize`
- **Type**: `number`
- **Default**: `1`
- **Description**: Number of requests allowed in a burst

#### `rateLimit.perDomain`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Apply rate limit per domain instead of globally

### Caching

#### `cache.enabled`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable response caching

#### `cache.ttl`
- **Type**: `number`
- **Default**: `300000` (5 minutes)
- **Description**: Cache time-to-live in milliseconds

#### `cache.maxSize`
- **Type**: `number`
- **Default**: `100`
- **Description**: Maximum number of cached responses

### Retry Logic

#### `retry.maxRetries`
- **Type**: `number`
- **Default**: `0`
- **Description**: Maximum number of retry attempts

#### `retry.initialDelay`
- **Type**: `number`
- **Default**: `1000`
- **Description**: Initial delay between retries in milliseconds

#### `retry.backoff`
- **Type**: `'fixed' | 'linear' | 'exponential'`
- **Default**: `'exponential'`
- **Description**: Backoff strategy for retries

#### `retry.maxDelay`
- **Type**: `number`
- **Default**: `30000`
- **Description**: Maximum delay between retries in milliseconds

### Ethics & Compliance

#### `respectRobotsTxt`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to respect robots.txt rules

### Cookies & Sessions

#### `cookies.enabled`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable cookie handling

#### `cookies.persistPath`
- **Type**: `string`
- **Default**: `undefined`
- **Description**: File path to persist cookies

#### `cookies.autoSave`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Automatically save cookies to disk

### Monitoring

#### `monitor`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable performance monitoring and statistics

### Change Tracking

#### `trackChanges`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Track content changes between scrapes

#### `maxSnapshots`
- **Type**: `number`
- **Default**: `5`
- **Description**: Maximum number of snapshots to keep per URL

## Configuration Examples

### Production Configuration

Optimized for production use:

```typescript
const scraper = createScraper({
  timeout: 30000,
  userAgent: 'ProductionBot/1.0 (+https://example.com)',
  respectRobotsTxt: true,

  rateLimit: {
    requestsPerSecond: 1,
    burstSize: 3,
    perDomain: true,
  },

  cache: {
    enabled: true,
    ttl: 300000,  // 5 minutes
    maxSize: 200,
  },

  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoff: 'exponential',
  },

  monitor: true,
})
```

### Development Configuration

Optimized for development and testing:

```typescript
const scraper = createScraper({
  timeout: 10000,
  respectRobotsTxt: false,  // For testing only!

  cache: {
    enabled: true,
    ttl: 60000,  // 1 minute
  },

  monitor: true,
})
```

### High-Volume Configuration

For scraping many URLs:

```typescript
const scraper = createScraper({
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
    perDomain: true,
  },

  cache: {
    enabled: true,
    ttl: 600000,  // 10 minutes
    maxSize: 1000,
  },

  retry: {
    maxRetries: 2,
    initialDelay: 500,
    backoff: 'fixed',
  },

  monitor: true,
})
```

### Authenticated Scraping

With session management:

```typescript
const scraper = createScraper({
  cookies: {
    enabled: true,
    persistPath: './auth-session.json',
    autoSave: true,
  },

  headers: {
    'Authorization': 'Bearer your-token',
  },

  cache: {
    enabled: false,  // Disable for authenticated content
  },
})
```

## Dynamic Configuration

Update configuration at runtime:

```typescript
const scraper = createScraper({
  timeout: 30000,
})

// Configuration is set at creation time
// Create a new scraper instance for different configuration
const fastScraper = createScraper({
  timeout: 5000,
  cache: { enabled: true },
})
```

## Best Practices

1. **Always set a timeout** to prevent hanging requests
2. **Use rate limiting** to be respectful to servers
3. **Enable caching** for repeated requests
4. **Configure retries** for production reliability
5. **Respect robots.txt** for ethical scraping
6. **Use monitoring** to track performance
7. **Set a descriptive user agent** to identify your bot

```typescript
const scraper = createScraper({
  timeout: 30000,
  userAgent: 'MyBot/1.0 (+https://mysite.com/bot-info)',
  respectRobotsTxt: true,

  rateLimit: {
    requestsPerSecond: 2,
    perDomain: true,
  },

  cache: {
    enabled: true,
    ttl: 300000,
  },

  retry: {
    maxRetries: 3,
    backoff: 'exponential',
  },

  monitor: true,
})
```

## Next Steps

- Learn about [Features](/features/scraping)
- Explore [Rate Limiting](/features/rate-limiting)
- Check out [Caching](/features/caching)
