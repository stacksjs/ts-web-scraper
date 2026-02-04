---
layout: home

hero:
  name: "ts-web-scraper"
  text: "Web Scraping Library"
  tagline: "A powerful, type-safe web scraping library for TypeScript and Bun with zero dependencies"
  image: /images/logo-white.png
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/stacksjs/ts-web-scraper

features:
  - title: "Zero Dependencies"
    icon: "package"
    details: "Built entirely on Bun native APIs for maximum performance and minimal footprint."
  - title: "Client-Side Rendering"
    icon: "browser"
    details: "Full support for JavaScript-heavy sites including React, Vue, and Next.js applications."
  - title: "Content Extraction"
    icon: "file-text"
    details: "Readability-style main content extraction with metadata, contact info, and structured data."
  - title: "Ethical Scraping"
    icon: "shield"
    details: "Built-in robots.txt support, rate limiting, and user-agent management."
---

## Overview

ts-web-scraper is a comprehensive web scraping library built for TypeScript and Bun. It handles everything from simple static pages to complex JavaScript-rendered applications with built-in caching, rate limiting, and data extraction pipelines.

## Quick Start

```bash
bun add ts-web-scraper
```

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper({
  rateLimit: { requestsPerSecond: 2 },
  cache: { enabled: true, ttl: 60000 },
})

const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('title')?.textContent,
    headings: Array.from(doc.querySelectorAll('h1')).map(h => h.textContent),
  }),
})

console.log(result.data)
```

## Key Features

| Feature | Description |
|---------|-------------|
| Static Scraping | Fast HTML fetching and parsing |
| SPA Support | Handle JavaScript-rendered content |
| Rate Limiting | Token bucket with burst support |
| Caching | LRU cache with TTL and persistence |
| Pipelines | Extract and transform data |
| Validation | Schema-based data validation |
| Export | JSON, CSV, XML, YAML, Markdown |

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `createScraper(options)` | Create configured scraper instance |
| `fetchHTML(url, options?)` | Fetch and parse HTML |
| `parseHTML(html)` | Parse HTML string to document |
| `extractText(element, selector)` | Extract text content |
| `extractLinks(doc, options?)` | Extract all links |
| `extractMeta(doc)` | Extract metadata |
| `extractStructuredData(doc)` | Extract JSON-LD data |

### SPA Support

| Function | Description |
|----------|-------------|
| `scrapeClientSide(url, options)` | Scrape JS-rendered pages |
| `createBrowser(options?)` | Create headless browser |
| `isClientSideRendered(url)` | Detect SPA content |

### Analysis

| Function | Description |
|----------|-------------|
| `analyzeSEO(doc)` | SEO analysis |
| `analyzeAccessibility(doc)` | WCAG compliance check |
| `extractMainContent(doc)` | Main content extraction |
| `detectLanguage(text)` | Language detection |
