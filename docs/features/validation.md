# Validation

Validate extracted data against schemas to ensure data quality.

## Basic Validation

Validate extracted data:

```typescript
import { createScraper } from 'ts-web-scraper'

const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    title: doc.querySelector('.title')?.textContent,
    price: parseFloat(doc.querySelector('.price')?.textContent || '0'),
  }),
  validate: {
    title: { type: 'string', required: true },
    price: { type: 'number', required: true },
  },
})

if (!result.success) {
  console.error('Validation failed:', result.error)
}
```

## Schema Types

Support for multiple data types:

```typescript
const schema = {
  // String validation
  name: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[A-Za-z\s]+$/,
  },

  // Number validation
  price: {
    type: 'number',
    required: true,
    min: 0,
    max: 10000,
  },

  // Boolean validation
  inStock: {
    type: 'boolean',
    required: false,
  },

  // Array validation
  tags: {
    type: 'array',
    items: { type: 'string' },
    minLength: 1,
  },

  // Object validation
  metadata: {
    type: 'object',
    properties: {
      source: { type: 'string' },
      timestamp: { type: 'number' },
    },
  },
}
```

## String Validation

Validate string fields:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    email: doc.querySelector('.email')?.textContent,
    url: doc.querySelector('.website')?.textContent,
  }),
  validate: {
    email: {
      type: 'string',
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    url: {
      type: 'string',
      pattern: /^https?:\/\/.+/,
    },
  },
})
```

## Number Validation

Validate numeric fields:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    price: parseFloat(doc.querySelector('.price')?.textContent || '0'),
    quantity: parseInt(doc.querySelector('.qty')?.textContent || '0'),
    rating: parseFloat(doc.querySelector('.rating')?.textContent || '0'),
  }),
  validate: {
    price: {
      type: 'number',
      required: true,
      min: 0,
      max: 999999,
    },
    quantity: {
      type: 'number',
      min: 0,
    },
    rating: {
      type: 'number',
      min: 0,
      max: 5,
    },
  },
})
```

## Array Validation

Validate arrays and their items:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    tags: Array.from(doc.querySelectorAll('.tag')).map(t => t.textContent),
    prices: Array.from(doc.querySelectorAll('.price')).map(p => parseFloat(p.textContent || '0')),
  }),
  validate: {
    tags: {
      type: 'array',
      items: { type: 'string' },
      minLength: 1,
      maxLength: 10,
    },
    prices: {
      type: 'array',
      items: {
        type: 'number',
        min: 0,
      },
      required: true,
    },
  },
})
```

## Nested Object Validation

Validate nested structures:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    product: {
      name: doc.querySelector('.name')?.textContent,
      price: parseFloat(doc.querySelector('.price')?.textContent || '0'),
      seller: {
        name: doc.querySelector('.seller-name')?.textContent,
        rating: parseFloat(doc.querySelector('.seller-rating')?.textContent || '0'),
      },
    },
  }),
  validate: {
    product: {
      type: 'object',
      required: true,
      properties: {
        name: { type: 'string', required: true },
        price: { type: 'number', min: 0 },
        seller: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            rating: { type: 'number', min: 0, max: 5 },
          },
        },
      },
    },
  },
})
```

## Manual Validation

Use the validate function directly:

```typescript
import { validate } from 'ts-web-scraper'

const data = {
  name: 'Product Name',
  price: 99.99,
  tags: ['electronics', 'gadgets'],
}

const result = validate(data, {
  name: { type: 'string', required: true },
  price: { type: 'number', min: 0 },
  tags: { type: 'array', items: { type: 'string' } },
})

if (result.valid) {
  console.log('Valid data:', result.data)
} else {
  console.error('Validation errors:', result.errors)
}
```

## Validation Errors

Handle validation errors:

```typescript
const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    price: doc.querySelector('.price')?.textContent,  // might be null
  }),
  validate: {
    price: { type: 'number', required: true, min: 0 },
  },
})

if (!result.success) {
  // result.error contains validation error message
  console.error('Validation failed:', result.error)

  // Original extracted data might still be available
  console.log('Raw data:', result.data)
}
```

## Pipeline Validation

Validate data in pipelines:

```typescript
import { pipeline, extractors } from 'ts-web-scraper'

const extractProducts = pipeline()
  .step(extractors.structured('.product', {
    name: '.name',
    price: '.price',
  }))
  .map('parse', (product) => ({
    ...product,
    price: parseFloat(product.price.replace(/[^0-9.]/g, '')),
  }))
  .filter('valid', (products) =>
    products.every(p =>
      typeof p.name === 'string' &&
      typeof p.price === 'number' &&
      p.price > 0
    )
  )

const result = await extractProducts.execute(document)
```

## Best Practices

1. Always validate required fields
2. Use pattern matching for structured data (emails, URLs)
3. Set reasonable min/max bounds for numbers
4. Validate array lengths to prevent memory issues
5. Use nested validation for complex objects
6. Log validation errors for debugging

```typescript
const scraper = createScraper({
  monitor: true,
})

const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    name: doc.querySelector('.name')?.textContent,
    price: parseFloat(doc.querySelector('.price')?.textContent || '0'),
    email: doc.querySelector('.email')?.textContent,
    tags: Array.from(doc.querySelectorAll('.tag')).map(t => t.textContent),
  }),
  validate: {
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200,
    },
    price: {
      type: 'number',
      required: true,
      min: 0,
      max: 1000000,
    },
    email: {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      maxLength: 20,
    },
  },
})

if (!result.success) {
  console.error('Validation failed:', result.error)
  // Log to monitoring system
}
```

## Next Steps

- Learn about [Data Extraction](/features/extraction)
- Explore [Export Formats](/features/export)
- Check the [API Reference](/api/)
