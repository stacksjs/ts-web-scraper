# Export Formats

Export scraped data to multiple formats with automatic formatting.

## Supported Formats

Export to six different formats:

- JSON
- CSV
- XML
- YAML
- Markdown
- HTML

## Save to File

Export and save to file (format inferred from extension):

```typescript
import { createScraper, saveExport } from 'ts-web-scraper'

const scraper = createScraper()

const result = await scraper.scrape('https://example.com', {
  extract: (doc) => ({
    title: doc.querySelector('title')?.textContent,
    headings: Array.from(doc.querySelectorAll('h2')).map(h => h.textContent),
  }),
})

// Save to different formats
await saveExport(result.data, 'output.json')
await saveExport(result.data, 'output.csv')
await saveExport(result.data, 'output.xml')
await saveExport(result.data, 'output.yaml')
await saveExport(result.data, 'output.md')
await saveExport(result.data, 'output.html')
```

## JSON Export

Export as JSON:

```typescript
import { exportData } from 'ts-web-scraper'

const data = {
  products: [
    { name: 'Product 1', price: 99.99 },
    { name: 'Product 2', price: 149.99 },
  ],
}

// Compact JSON
const json = exportData(data, { format: 'json' })

// Pretty-printed JSON
const prettyJson = exportData(data, {
  format: 'json',
  pretty: true,
})

console.log(prettyJson)
// {
//   "products": [
//     { "name": "Product 1", "price": 99.99 },
//     { "name": "Product 2", "price": 149.99 }
//   ]
// }
```

## CSV Export

Export as CSV:

```typescript
const products = [
  { name: 'Product 1', price: 99.99, inStock: true },
  { name: 'Product 2', price: 149.99, inStock: false },
  { name: 'Product 3', price: 79.99, inStock: true },
]

const csv = exportData(products, { format: 'csv' })

console.log(csv)
// name,price,inStock
// Product 1,99.99,true
// Product 2,149.99,false
// Product 3,79.99,true

await saveExport(products, 'products.csv')
```

## XML Export

Export as XML:

```typescript
const data = {
  products: [
    { name: 'Product 1', price: 99.99 },
    { name: 'Product 2', price: 149.99 },
  ],
}

const xml = exportData(data, { format: 'xml' })

console.log(xml)
// <?xml version="1.0" encoding="UTF-8"?>
// <root>
//   <products>
//     <item>
//       <name>Product 1</name>
//       <price>99.99</price>
//     </item>
//     <item>
//       <name>Product 2</name>
//       <price>149.99</price>
//     </item>
//   </products>
// </root>

await saveExport(data, 'products.xml')
```

## YAML Export

Export as YAML:

```typescript
const data = {
  config: {
    rateLimit: 2,
    timeout: 30000,
  },
  urls: [
    'https://example.com/1',
    'https://example.com/2',
  ],
}

const yaml = exportData(data, { format: 'yaml' })

console.log(yaml)
// config:
//   rateLimit: 2
//   timeout: 30000
// urls:
//   - https://example.com/1
//   - https://example.com/2

await saveExport(data, 'config.yaml')
```

## Markdown Export

Export as Markdown table:

```typescript
const products = [
  { name: 'Product 1', price: 99.99, rating: 4.5 },
  { name: 'Product 2', price: 149.99, rating: 4.8 },
  { name: 'Product 3', price: 79.99, rating: 4.2 },
]

const markdown = exportData(products, { format: 'markdown' })

console.log(markdown)
// | name | price | rating |
// |------|-------|--------|
// | Product 1 | 99.99 | 4.5 |
// | Product 2 | 149.99 | 4.8 |
// | Product 3 | 79.99 | 4.2 |

await saveExport(products, 'products.md')
```

## HTML Export

Export as HTML table:

```typescript
const products = [
  { name: 'Product 1', price: 99.99 },
  { name: 'Product 2', price: 149.99 },
]

const html = exportData(products, { format: 'html' })

console.log(html)
// <table>
//   <thead>
//     <tr><th>name</th><th>price</th></tr>
//   </thead>
//   <tbody>
//     <tr><td>Product 1</td><td>99.99</td></tr>
//     <tr><td>Product 2</td><td>149.99</td></tr>
//   </tbody>
// </table>

await saveExport(products, 'products.html')
```

## Export Options

Customize export formatting:

```typescript
// Pretty-print JSON
await saveExport(data, 'output.json', { pretty: true })

// Compact CSV
await saveExport(data, 'output.csv', { pretty: false })

// Pretty-print XML
await saveExport(data, 'output.xml', { pretty: true })
```

## Batch Export

Export multiple scraping results:

```typescript
const scraper = createScraper()

const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
]

const results = await scraper.scrapeMany(urls, {
  extract: (doc) => ({
    title: doc.querySelector('h1')?.textContent,
    content: doc.querySelector('.content')?.textContent,
  }),
})

// Combine all results
const allData = results
  .filter(r => r.success)
  .map(r => r.data)

// Export to different formats
await saveExport(allData, 'all-pages.json', { pretty: true })
await saveExport(allData, 'all-pages.csv')
await saveExport(allData, 'all-pages.md')
```

## Pipeline Export

Export pipeline results:

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
  .sort('by-price', (a, b) => a.price - b.price)

const result = await scraper.scrape('https://example.com', {
  extract: async (doc) => {
    const pipelineResult = await extractProducts.execute(doc)
    return pipelineResult.data
  },
})

await saveExport(result.data, 'products.csv')
```

## Format Detection

Format is automatically detected from file extension:

```typescript
// These all work automatically
await saveExport(data, 'output.json')  // JSON
await saveExport(data, 'output.csv')   // CSV
await saveExport(data, 'output.xml')   // XML
await saveExport(data, 'output.yaml')  // YAML
await saveExport(data, 'output.yml')   // YAML
await saveExport(data, 'output.md')    // Markdown
await saveExport(data, 'output.html')  // HTML
```

## Best Practices

1. Use JSON for structured data and API integration
2. Use CSV for spreadsheet import and data analysis
3. Use XML for legacy system integration
4. Use YAML for human-readable configuration
5. Use Markdown for documentation and reports
6. Use HTML for visual presentation
7. Enable pretty printing for human consumption
8. Use compact format for data transfer

```typescript
// For humans
await saveExport(data, 'report.json', { pretty: true })
await saveExport(data, 'report.md')

// For machines
await saveExport(data, 'api-data.json')
await saveExport(data, 'bulk-data.csv')
```

## Next Steps

- Learn about [Data Extraction](/features/extraction)
- Explore [Validation](/features/validation)
- Check the [API Reference](/api/)
