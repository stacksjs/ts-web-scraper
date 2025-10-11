# Installation

Installing ts-web-scraper is easy. Simply pull it in via your package manager of choice.

## Package Managers

Choose your package manager:

::: code-group

```sh [bun]
bun add ts-web-scraper

# or, install as a dev dependency
bun add --dev ts-web-scraper
```

```sh [npm]
npm install ts-web-scraper

# or, install as a dev dependency
npm install --save-dev ts-web-scraper
```

```sh [pnpm]
pnpm add ts-web-scraper

# or, install as a dev dependency
pnpm add --save-dev ts-web-scraper
```

```sh [yarn]
yarn add ts-web-scraper

# or, install as a dev dependency
yarn add --dev ts-web-scraper
```

:::

## Requirements

- **Bun** v1.0.0 or higher (recommended)
- **Node.js** v18.0.0 or higher (also supported)
- **TypeScript** v5.0.0 or higher (for TypeScript users)

## Verify Installation

After installation, verify it's working:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper()
console.log('ts-web-scraper installed successfully!')
```

## CLI Installation

ts-web-scraper also comes with a CLI tool:

```bash
# Install globally
bun add --global ts-web-scraper

# Or use with bunx without installing
bunx ts-web-scraper --help
```

## Next Steps

Now that you have ts-web-scraper installed, head over to the [Quick Start](/quick-start) guide to start scraping!
