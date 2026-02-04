# CSS Selectors

CSS selectors are the primary way to locate and extract elements from HTML documents. ts-web-scraper supports all standard CSS selectors.

## Basic Selectors

### Element Selector

```typescript
// Select all paragraphs
const paragraphs = document.querySelectorAll('p')

// Select all divs
const divs = document.querySelectorAll('div')

// Select all links
const links = document.querySelectorAll('a')
```

### Class Selector

```typescript
// Select by class
const items = document.querySelectorAll('.item')

// Multiple classes (AND)
const specialItems = document.querySelectorAll('.item.featured')

// Either class (OR)
const mixedItems = document.querySelectorAll('.item, .product')
```

### ID Selector

```typescript
// Select by ID
const header = document.querySelector('#header')

// ID with element type
const nav = document.querySelector('nav#main-nav')
```

### Attribute Selectors

```typescript
// Has attribute
const withTitle = document.querySelectorAll('[title]')

// Exact match
const externalLinks = document.querySelectorAll('[target="_blank"]')

// Contains value
const productLinks = document.querySelectorAll('[href*="product"]')

// Starts with
const absoluteLinks = document.querySelectorAll('[href^="https://"]')

// Ends with
const pdfLinks = document.querySelectorAll('[href$=".pdf"]')

// Space-separated list contains
const highlightedRows = document.querySelectorAll('[class~="highlight"]')
```

## Combinators

### Descendant Selector

```typescript
// Any descendant
const navLinks = document.querySelectorAll('nav a')

// Deeply nested
const articleParagraphs = document.querySelectorAll('article .content p')
```

### Child Selector

```typescript
// Direct children only
const menuItems = document.querySelectorAll('ul.menu > li')

// Not grandchildren
const directChildren = document.querySelectorAll('div.container > p')
```

### Adjacent Sibling

```typescript
// Immediately following sibling
const afterHeading = document.querySelectorAll('h2 + p')
```

### General Sibling

```typescript
// Any following sibling
const afterHeadingAll = document.querySelectorAll('h2 ~ p')
```

## Pseudo-Classes

### Position-Based

```typescript
// First child
const firstItem = document.querySelector('ul li:first-child')

// Last child
const lastItem = document.querySelector('ul li:last-child')

// Nth child
const thirdItem = document.querySelector('ul li:nth-child(3)')

// Every other item
const evenItems = document.querySelectorAll('tr:nth-child(even)')
const oddItems = document.querySelectorAll('tr:nth-child(odd)')

// Every 3rd item
const everyThird = document.querySelectorAll('li:nth-child(3n)')

// First 3 items
const firstThree = document.querySelectorAll('li:nth-child(-n+3)')
```

### State-Based

```typescript
// Empty elements
const emptyDivs = document.querySelectorAll('div:empty')

// Not matching
const notHighlighted = document.querySelectorAll('tr:not(.highlight)')

// Enabled/disabled inputs
const enabledInputs = document.querySelectorAll('input:enabled')
const disabledInputs = document.querySelectorAll('input:disabled')
```

### Type-Based

```typescript
// First of type
const firstHeading = document.querySelector('h2:first-of-type')

// Last of type
const lastParagraph = document.querySelector('p:last-of-type')

// Nth of type
const secondImage = document.querySelector('img:nth-of-type(2)')
```

## Common Patterns

### Extract Product Cards

```typescript
const products = document.querySelectorAll('.product-card')

products.forEach(product => {
  const name = product.querySelector('.product-name')?.textContent
  const price = product.querySelector('.price')?.textContent
  const image = product.querySelector('img')?.getAttribute('src')
  const link = product.querySelector('a')?.getAttribute('href')
})
```

### Extract Tables

```typescript
const rows = document.querySelectorAll('table tbody tr')

const data = Array.from(rows).map(row => {
  const cells = row.querySelectorAll('td')
  return {
    column1: cells[0]?.textContent,
    column2: cells[1]?.textContent,
    column3: cells[2]?.textContent,
  }
})
```

### Extract Navigation

```typescript
const navItems = document.querySelectorAll('nav > ul > li > a')

const navigation = Array.from(navItems).map(link => ({
  text: link.textContent,
  href: link.getAttribute('href'),
  isActive: link.classList.contains('active'),
}))
```

### Extract Article Content

```typescript
const article = document.querySelector('article')

const content = {
  title: article?.querySelector('h1')?.textContent,
  author: article?.querySelector('.author')?.textContent,
  date: article?.querySelector('time')?.getAttribute('datetime'),
  body: article?.querySelector('.content')?.innerHTML,
  tags: Array.from(article?.querySelectorAll('.tag') || [])
    .map(tag => tag.textContent),
}
```

## Extraction Helpers

### Using extractors

```typescript
import { extractors, pipeline } from 'ts-web-scraper'

// Structured extraction
const productPipeline = pipeline()
  .step(extractors.structured('.product', {
    name: '.product-name',
    price: '.price',
    description: '.description',
    inStock: { selector: '.stock-status', attr: 'data-available' },
  }))
```

### Text Extraction

```typescript
// Get text content
const text = document.querySelector('.content')?.textContent

// Get trimmed text
const trimmedText = document.querySelector('.title')?.textContent?.trim()

// Get inner HTML
const html = document.querySelector('.rich-text')?.innerHTML

// Get outer HTML
const fullHtml = document.querySelector('.card')?.outerHTML
```

### Attribute Extraction

```typescript
// Get single attribute
const href = document.querySelector('a')?.getAttribute('href')

// Get data attributes
const productId = document.querySelector('.product')?.dataset?.id

// Get all attributes
const element = document.querySelector('.item')
const attrs = {
  id: element?.getAttribute('id'),
  class: element?.getAttribute('class'),
  dataId: element?.getAttribute('data-id'),
}
```

## Best Practices

### Use Specific Selectors

```typescript
// Less specific (fragile)
const items = document.querySelectorAll('div div div')

// More specific (robust)
const items = document.querySelectorAll('.product-list .product-item')
```

### Use Data Attributes

```typescript
// Prefer data attributes when available
const product = document.querySelector('[data-product-id="123"]')
const price = document.querySelector('[data-testid="price"]')
```

### Handle Missing Elements

```typescript
// Always check for null
const title = document.querySelector('h1')?.textContent || 'Untitled'

// Use optional chaining
const price = document.querySelector('.price')?.textContent?.trim()

// Provide defaults
const items = document.querySelectorAll('.item') || []
```

### Use querySelectorAll for Lists

```typescript
// Single element
const header = document.querySelector('header')

// Multiple elements
const links = Array.from(document.querySelectorAll('a'))
```

## Debugging Selectors

Test selectors in browser console:

```javascript
// Check if selector matches
document.querySelectorAll('.my-selector').length

// Highlight matched elements
document.querySelectorAll('.my-selector').forEach(el => {
  el.style.outline = '2px solid red'
})
```

## API Reference

### Selector Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `querySelector(selector)` | `Element \| null` | First matching element |
| `querySelectorAll(selector)` | `NodeList` | All matching elements |
| `matches(selector)` | `boolean` | Check if element matches |
| `closest(selector)` | `Element \| null` | Nearest ancestor matching |
