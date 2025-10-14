# Pipelines

Build composable data extraction and transformation pipelines for complex scraping workflows.

## Basic Pipeline

Create a simple extraction pipeline:

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

// Execute pipeline on a document
const scraper = createScraper()
const result = await scraper.scrape('https://example.com/products')

const pipelineResult = await extractProducts.execute(result.document)

if (pipelineResult.success) {
  console.log('Products:', pipelineResult.data)
}
```

## Built-in Extractors

Use pre-built extractors:

```typescript
import { extractors } from 'ts-web-scraper'

// Extract text
const textExtractor = extractors.text('p')
const paragraphs = textExtractor.execute(document)

// Extract attributes
const linkExtractor = extractors.attr('a', 'href')
const urls = linkExtractor.execute(document)

// Extract links
const links = extractors.links().execute(document)
// Returns: ['https://...', 'https://...']

// Extract images
const images = extractors.images().execute(document)
// Returns: [{ src: '...', alt: '...', title: '...' }]

// Extract structured data
const products = extractors.structured('.product', {
  name: '.name',
  price: '.price',
  image: 'img',
}).execute(document)

// Extract JSON-LD
const jsonLd = extractors.jsonLd().execute(document)
```

## Pipeline Steps

Add multiple transformation steps:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractPrices = pipeline()
  // 1. Extract prices
  .step(extractors.text('.price'))

  // 2. Parse to numbers
  .map('parse', price =>
    Number.parseFloat(price.replace(/[^0-9.]/g, '')))

  // 3. Filter valid prices
  .filter('valid', prices =>
    prices.every(p => !Number.isNaN(p) && p > 0))

  // 4. Sort by price
  .sort('ascending', (a, b) => a - b)

  // 5. Limit results
  .limit('top-10', 10)

const result = await extractPrices.execute(document)
console.log('Top 10 prices:', result.data)
```

## Map Transformation

Transform data with map:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    price: '.price',
  }))
  .map('parse-price', product => ({
    ...product,
    price: Number.parseFloat(product.price.replace(/[$,]/g, '')),
  }))
  .map('add-currency', product => ({
    ...product,
    currency: 'USD',
  }))

const result = await extractProducts.execute(document)
```

## Filter Step

Filter data based on conditions:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractHighRated = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    rating: '.rating',
  }))
  .map('parse-rating', p => ({
    ...p,
    rating: Number.parseFloat(p.rating),
  }))
  .filter('high-rated', products =>
    products.every(p => p.rating >= 4.0))

const result = await extractHighRated.execute(document)
console.log('High-rated products:', result.data)
```

## Validation Step

Validate data in pipeline:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractValidProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    price: '.price',
    sku: '.sku',
  }))
  .validate('check-fields', {
    name: { type: 'string', required: true, minLength: 1 },
    price: { type: 'string', required: true },
    sku: { type: 'string', required: true, pattern: /^[A-Z0-9-]+$/ },
  })
  .map('parse-price', product => ({
    ...product,
    price: Number.parseFloat(product.price.replace(/[^0-9.]/g, '')),
  }))

const result = await extractValidProducts.execute(document)
```

## Sanitization Step

Sanitize extracted data:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractSafeContent = pipeline()
  .step(extractors.text('.content'))
  .sanitize('clean-html', {
    allowTags: [], // Strip all HTML
    trimWhitespace: true, // Trim extra spaces
    maxLength: 1000, // Limit length
  })

const result = await extractSafeContent.execute(document)
```

## Sort Step

Sort extracted data:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractSortedProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    price: '.price',
    rating: '.rating',
  }))
  .map('parse', p => ({
    ...p,
    price: Number.parseFloat(p.price.replace(/[^0-9.]/g, '')),
    rating: Number.parseFloat(p.rating),
  }))
  .sort('by-rating', (a, b) => b.rating - a.rating) // Descending
  .sort('by-price', (a, b) => a.price - b.price) // Then by price

const result = await extractSortedProducts.execute(document)
```

## GroupBy Step

Group data by a key:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractByCategory = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    category: '.category',
    price: '.price',
  }))
  .groupBy('by-category', product => product.category)

const result = await extractByCategory.execute(document)
// Returns: { electronics: [...], clothing: [...], ... }
```

## Unique Step

Remove duplicates:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractUniqueLinks = pipeline()
  .step(extractors.links())
  .unique('dedupe')

const result = await extractUniqueLinks.execute(document)

// With custom key function
const extractUniqueProducts = pipeline()
  .step(extractors.structured('.product', {
    id: '.id',
    name: '.name',
  }))
  .unique('by-id', product => product.id)

const result2 = await extractUniqueProducts.execute(document)
```

## FlatMap Step

Flatten nested arrays:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractAllTags = pipeline()
  .step(extractors.structured('.article', {
    title: '.title',
    tags: '.tag',
  }))
  .map('split-tags', article =>
    article.tags.split(',').map(t => t.trim()))
  .flatMap('flatten', tags => tags)
  .unique('dedupe')

const result = await extractAllTags.execute(document)
// Returns: ['tag1', 'tag2', 'tag3', ...]
```

## Custom Steps

Create custom pipeline steps:

```typescript
import { pipeline } from 'ts-web-scraper'

const customStep = {
  name: 'custom-transformation',
  execute: (input: any[]) => {
    // Custom logic
    return input.map(item => ({
      ...item,
      processed: true,
      timestamp: new Date(),
    }))
  },
  onError: (error, input) => {
    console.error('Step failed:', error)
    return input // Return original on error
  },
}

const extractWithCustom = pipeline()
  .step(extractors.text('.item'))
  .step(customStep)

const result = await extractWithCustom.execute(document)
```

## Error Handling

Handle pipeline errors:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractWithErrors = pipeline({
  continueOnError: true, // Continue even if steps fail
  timeout: 10000, // 10 second timeout per step
})
  .step(extractors.text('.content'))
  .map('risky-transform', (text) => {
    if (!text) {
      throw new Error('No text found')
    }
    return text.toUpperCase()
  })

const result = await extractWithErrors.execute(document)

if (result.errors.length > 0) {
  console.error('Pipeline errors:')
  result.errors.forEach((err) => {
    console.error(`  ${err.step}: ${err.error.message}`)
  })
}

console.log('Data:', result.data)
console.log('Duration:', result.metadata.duration, 'ms')
```

## Pipeline Context

Use context for stateful operations:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

const extractWithContext = pipeline()
  .step(extractors.text('.item'))
  .transform('with-context', (items, context) => {
    // Access context metadata
    if (context?.url) {
      return items.map(item => ({
        text: item,
        source: context.url,
      }))
    }
    return items
  })

const result = await extractWithContext.execute(document, {
  url: 'https://example.com',
  metadata: { source: 'api' },
})
```

## Reusable Pipelines

Build and reuse pipelines:

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

// Create reusable pipeline
const productPipeline = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    price: '.price',
    rating: '.rating',
  }))
  .map('parse', p => ({
    ...p,
    price: Number.parseFloat(p.price.replace(/[^0-9.]/g, '')),
    rating: Number.parseFloat(p.rating),
  }))
  .filter('valid', products =>
    products.every(p => p.price > 0 && p.rating > 0))
  .sort('by-rating', (a, b) => b.rating - a.rating)

// Build a function from pipeline
const extractProducts = productPipeline.build()

// Use multiple times
const result1 = await extractProducts(document1)
const result2 = await extractProducts(document2)
```

## Complex Pipeline Example

Full-featured pipeline:

```typescript
import { createScraper, extractors, pipeline } from 'ts-web-scraper'

const productExtractor = pipeline()
  // 1. Extract product data
  .step(extractors.structured('.product-card', {
    id: '[data-product-id]',
    name: '.product-title',
    price: '.price',
    originalPrice: '.original-price',
    rating: '.rating',
    reviews: '.review-count',
    inStock: '.in-stock',
    image: 'img',
  }))

  // 2. Parse numeric values
  .map('parse-numbers', product => ({
    ...product,
    price: Number.parseFloat(product.price.replace(/[^0-9.]/g, '')),
    originalPrice: product.originalPrice
      ? Number.parseFloat(product.originalPrice.replace(/[^0-9.]/g, ''))
      : null,
    rating: Number.parseFloat(product.rating),
    reviews: Number.parseInt(product.reviews.replace(/\D/g, ''), 10),
    inStock: product.inStock?.toLowerCase() === 'in stock',
  }))

  // 3. Calculate discount
  .map('add-discount', product => ({
    ...product,
    discount: product.originalPrice
      ? ((product.originalPrice - product.price) / product.originalPrice) * 100
      : 0,
  }))

  // 4. Validate
  .validate('ensure-valid', {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true, minLength: 1 },
    price: { type: 'number', required: true, min: 0 },
    rating: { type: 'number', min: 0, max: 5 },
  })

  // 5. Filter
  .filter('in-stock-only', products =>
    products.every(p => p.inStock))

  .filter('high-rated', products =>
    products.every(p => p.rating >= 4.0))

  // 6. Remove duplicates
  .unique('by-id', product => product.id)

  // 7. Sort by rating then price
  .sort('by-rating', (a, b) => b.rating - a.rating)
  .sort('by-price', (a, b) => a.price - b.price)

  // 8. Limit results
  .limit('top-20', 20)

// Use the pipeline
const scraper = createScraper()
const result = await scraper.scrape('https://example.com/products')

const pipelineResult = await productExtractor.execute(result.document, {
  url: result.url,
})

if (pipelineResult.success) {
  console.log(`Extracted ${pipelineResult.data.length} products`)
  console.log(`Duration: ${pipelineResult.metadata.duration}ms`)
  console.log(`Steps executed: ${pipelineResult.metadata.stepsExecuted}`)

  pipelineResult.data.forEach((product) => {
    console.log(`- ${product.name}: $${product.price} (${product.rating}★)`)
  })
}
else {
  console.error('Pipeline failed with errors:')
  pipelineResult.errors.forEach((err) => {
    console.error(`  ${err.step}: ${err.error.message}`)
  })
}
```

## Best Practices

1. Break complex extractions into small steps
2. Use descriptive step names for debugging
3. Add validation early in the pipeline
4. Handle errors gracefully with onError handlers
5. Reuse pipelines for consistency
6. Use context for metadata
7. Monitor pipeline performance

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

// Good: Small, focused steps with clear names
const goodPipeline = pipeline()
  .step(extractors.structured('.item', { name: '.name', price: '.price' }))
  .map('parse-price', item => ({
    ...item,
    price: Number.parseFloat(item.price.replace(/[^0-9.]/g, '')),
  }))
  .validate('check-required', {
    name: { type: 'string', required: true },
    price: { type: 'number', min: 0, required: true },
  })
  .filter('valid-items', items => items.every(i => i.price > 0))

// Bad: Large, complex steps
const badPipeline = pipeline()
  .transform('do-everything', (doc) => {
    const items = doc.querySelectorAll('.item')
    return items.map((item) => {
      const name = item.querySelector('.name')?.textContent
      const price = Number.parseFloat(item.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0')
      if (!name || price <= 0)
        return null
      return { name, price }
    }).filter(Boolean)
  })
```

## Next Steps

- Learn about [Data Extraction](/features/extraction)
- Explore [Validation](/features/validation)
- Check the [API Reference](/api/)
