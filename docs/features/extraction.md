# Data Extraction

Powerful pipeline-based data extraction and transformation.

## Basic Extraction

Extract data using a custom function:

```typescript
import { createScraper } from 'ts-web-scraper'

const scraper = createScraper()

const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('title')?.textContent,
    headings: Array.from(doc.querySelectorAll('h2')).map(h => h.textContent),
    links: Array.from(doc.querySelectorAll('a')).map(a => a.href),
  }),
})
```

## Selector Extraction

Extract all elements matching a selector:

```typescript
const result = await scraper.scrape('https://example.com', {
  selector: '.product', // Extracts all .product elements
})

console.log(result.data) // Array of text content
```

## Pre-built Extractors

Use pre-built extractors for common patterns:

```typescript
import { extractors } from 'ts-web-scraper'

// Extract text content
const textExtractor = extractors.text('p')
const paragraphs = textExtractor.execute(document)

// Extract attributes
const linkExtractor = extractors.attr('a', 'href')
const urls = linkExtractor.execute(document)

// Extract all links
const allLinks = extractors.links().execute(document)

// Extract images
const images = extractors.images().execute(document)
// Returns: [{ src: string, alt: string }, ...]

// Extract structured data
const products = extractors.structured('.product', {
  name: '.product-name',
  price: '.product-price',
  image: 'img',
}).execute(document)

// Extract JSON-LD data
const jsonLd = extractors.jsonLd().execute(document)
```

## Data Pipelines

Create powerful extraction pipelines:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.product-name',
    price: '.product-price',
    rating: '.rating',
  }))
  .map('clean', product => ({
    ...product,
    price: Number.parseFloat(product.price.replace(/[^0-9.]/g, '')),
    rating: Number.parseFloat(product.rating),
  }))
  .filter('valid', products =>
    products.every(p => p.price > 0 && p.rating >= 0))
  .sort('by-price', (a, b) => a.price - b.price)

const result = await extractProducts.execute(document)
```

## Pipeline Steps

Pipelines support multiple transformation steps:

### Map

Transform data:

```typescript
const pipeline = pipeline()
  .step(extractors.text('.price'))
  .map('parse', prices => prices.map(p => Number.parseFloat(p.replace('$', ''))))
```

### Filter

Remove unwanted data:

```typescript
const pipeline = pipeline()
  .step(extractors.structured('.item', { id: '.id', active: '.status' }))
  .filter('active-only', items => items.filter(i => i.active === 'true'))
```

### Sort

Order results:

```typescript
const pipeline = pipeline()
  .step(extractors.structured('.product', { name: '.name', price: '.price' }))
  .sort('by-name', (a, b) => a.name.localeCompare(b.name))
```

## Extraction with Validation

Validate extracted data:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: doc => ({
    title: doc.querySelector('.title')?.textContent,
    price: Number.parseFloat(doc.querySelector('.price')?.textContent || '0'),
  }),
  validate: {
    title: { type: 'string', required: true, minLength: 1 },
    price: { type: 'number', required: true, min: 0 },
  },
})

if (!result.success) {
  console.error('Validation failed:', result.error)
}
```

## Complex Nested Extraction

Extract nested structures:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => {
    const categories = doc.querySelectorAll('.category')

    return Array.from(categories).map(category => ({
      name: category.querySelector('.category-name')?.textContent,
      products: Array.from(category.querySelectorAll('.product')).map(product => ({
        name: product.querySelector('.name')?.textContent,
        price: product.querySelector('.price')?.textContent,
        specs: Array.from(product.querySelectorAll('.spec')).map(spec => ({
          label: spec.querySelector('.label')?.textContent,
          value: spec.querySelector('.value')?.textContent,
        })),
      })),
    }))
  },
})
```

## Next Steps

- Learn about [Validation](/features/validation)
- Explore [Export Formats](/features/export)
- Check the [API Reference](/api/)
