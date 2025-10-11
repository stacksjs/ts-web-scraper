import { describe, expect, it } from 'bun:test'
import { createExporter, exportData, saveExport } from '../src/export'
import { parseHTML } from '../src/web-scraper'

describe('Export Formats', () => {
  const sampleData = {
    name: 'Product Name',
    price: 99.99,
    inStock: true,
    tags: ['electronics', 'gadgets'],
  }

  const sampleArray = [
    { id: 1, name: 'Item 1', price: 10 },
    { id: 2, name: 'Item 2', price: 20 },
    { id: 3, name: 'Item 3', price: 30 },
  ]

  describe('JSON Export', () => {
    it('should export to JSON', () => {
      const result = exportData(sampleData, { format: 'json' })
      const parsed = JSON.parse(result)

      expect(parsed.name).toBe('Product Name')
      expect(parsed.price).toBe(99.99)
      expect(parsed.inStock).toBe(true)
    })

    it('should export to pretty JSON', () => {
      const result = exportData(sampleData, { format: 'json', pretty: true })

      expect(result).toContain('\n')
      expect(result).toContain('  ')
      expect(JSON.parse(result).name).toBe('Product Name')
    })

    it('should export arrays', () => {
      const result = exportData(sampleArray, { format: 'json' })
      const parsed = JSON.parse(result)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(3)
      expect(parsed[0].name).toBe('Item 1')
    })

    it('should handle nested objects', () => {
      const nested = {
        user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
      }

      const result = exportData(nested, { format: 'json' })
      const parsed = JSON.parse(result)

      expect(parsed.user.address.city).toBe('NYC')
    })
  })

  describe('CSV Export', () => {
    it('should export to CSV', () => {
      const result = exportData(sampleArray, { format: 'csv' })
      const lines = result.split('\n')

      expect(lines[0]).toBe('id,name,price')
      expect(lines[1]).toBe('1,Item 1,10')
      expect(lines[2]).toBe('2,Item 2,20')
      expect(lines[3]).toBe('3,Item 3,30')
    })

    it('should handle single object as array', () => {
      const result = exportData(sampleData, { format: 'csv' })
      const lines = result.split('\n')

      expect(lines[0]).toContain('name')
      expect(lines[0]).toContain('price')
      expect(lines[1]).toContain('Product Name')
      expect(lines[1]).toContain('99.99')
    })

    it('should escape commas in values', () => {
      const data = [{ name: 'Item, with, commas', price: 10 }]
      const result = exportData(data, { format: 'csv' })

      expect(result).toContain('"Item, with, commas"')
    })

    it('should escape quotes in values', () => {
      const data = [{ name: 'Item "quoted"', price: 10 }]
      const result = exportData(data, { format: 'csv' })

      expect(result).toContain('Item ""quoted""')
    })

    it('should handle nested objects by flattening', () => {
      const nested = [
        { id: 1, user: { name: 'John', age: 30 } },
        { id: 2, user: { name: 'Jane', age: 25 } },
      ]

      const result = exportData(nested, { format: 'csv' })
      const lines = result.split('\n')

      expect(lines[0]).toContain('user.name')
      expect(lines[0]).toContain('user.age')
      expect(lines[1]).toContain('John')
      expect(lines[2]).toContain('Jane')
    })

    it('should handle arrays as comma-separated strings', () => {
      const data = [{ name: 'Item', tags: ['tag1', 'tag2', 'tag3'] }]
      const result = exportData(data, { format: 'csv' })

      expect(result).toContain('tag1, tag2, tag3')
    })

    it('should handle empty data', () => {
      const result = exportData([], { format: 'csv' })
      expect(result).toBe('')
    })

    it('should handle missing fields', () => {
      const data = [
        { id: 1, name: 'Item 1', price: 10 },
        { id: 2, name: 'Item 2' }, // Missing price
        { id: 3, price: 30 }, // Missing name
      ]

      const result = exportData(data, { format: 'csv' })
      const lines = result.split('\n')

      expect(lines[0]).toBe('id,name,price')
      expect(lines[1]).toBe('1,Item 1,10')
      expect(lines[2]).toBe('2,Item 2,')
      expect(lines[3]).toBe('3,,30')
    })
  })

  describe('XML Export', () => {
    it('should export to XML', () => {
      const result = exportData(sampleData, { format: 'xml' })

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(result).toContain('<root>')
      expect(result).toContain('<name>Product Name</name>')
      expect(result).toContain('<price>99.99</price>')
      expect(result).toContain('<inStock>true</inStock>')
      expect(result).toContain('</root>')
    })

    it('should export arrays', () => {
      const result = exportData(sampleArray, { format: 'xml' })

      expect(result).toContain('<root>')
      expect(result).toContain('<item>')
      expect(result).toContain('<id>1</id>')
      expect(result).toContain('<name>Item 1</name>')
      expect(result).toContain('<price>10</price>')
      expect(result).toContain('</item>')
    })

    it('should escape XML entities', () => {
      const data = { text: 'Text with <tags> & "quotes"' }
      const result = exportData(data, { format: 'xml' })

      expect(result).toContain('&lt;tags&gt;')
      expect(result).toContain('&amp;')
      expect(result).toContain('&quot;')
    })

    it('should handle nested objects', () => {
      const nested = {
        user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
      }

      const result = exportData(nested, { format: 'xml' })

      expect(result).toContain('<user>')
      expect(result).toContain('<name>John</name>')
      expect(result).toContain('<address>')
      expect(result).toContain('<city>NYC</city>')
      expect(result).toContain('</address>')
      expect(result).toContain('</user>')
    })

    it('should export pretty XML', () => {
      const result = exportData(sampleData, { format: 'xml', pretty: true })

      expect(result).toContain('\n')
      expect(result).toContain('  <name>')
    })
  })

  describe('YAML Export', () => {
    it('should export to YAML', () => {
      const result = exportData(sampleData, { format: 'yaml' })

      expect(result).toContain('name: Product Name')
      expect(result).toContain('price: 99.99')
      expect(result).toContain('inStock: true')
    })

    it('should export arrays', () => {
      const result = exportData(sampleArray, { format: 'yaml' })

      expect(result).toContain('- id: 1')
      expect(result).toContain('  name: Item 1')
      expect(result).toContain('  price: 10')
    })

    it('should handle nested objects', () => {
      const nested = {
        user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
      }

      const result = exportData(nested, { format: 'yaml' })

      expect(result).toContain('user:')
      expect(result).toContain('  name: John')
      expect(result).toContain('  address:')
      expect(result).toContain('    city: NYC')
    })

    it('should quote strings with special characters', () => {
      const data = { text: 'Text: with colon' }
      const result = exportData(data, { format: 'yaml' })

      expect(result).toContain('"Text: with colon"')
    })

    it('should handle string arrays', () => {
      const data = { tags: ['tag1', 'tag2', 'tag3'] }
      const result = exportData(data, { format: 'yaml' })

      expect(result).toContain('tags:')
      expect(result).toContain('  - tag1')
      expect(result).toContain('  - tag2')
      expect(result).toContain('  - tag3')
    })
  })

  describe('Markdown Export', () => {
    it('should export to Markdown table', () => {
      const result = exportData(sampleArray, { format: 'markdown' })

      expect(result).toContain('| id | name | price |')
      expect(result).toContain('| --- | --- | --- |')
      expect(result).toContain('| 1 | Item 1 | 10 |')
      expect(result).toContain('| 2 | Item 2 | 20 |')
      expect(result).toContain('| 3 | Item 3 | 30 |')
    })

    it('should handle single object as table', () => {
      const result = exportData(sampleData, { format: 'markdown' })
      const lines = result.split('\n')

      expect(lines[0]).toContain('| name |')
      expect(lines[0]).toContain('| price |')
      expect(lines[2]).toContain('| Product Name |')
      expect(lines[2]).toContain('| 99.99 |')
    })

    it('should escape pipe characters', () => {
      const data = [{ name: 'Item | with | pipes', price: 10 }]
      const result = exportData(data, { format: 'markdown' })

      expect(result).toContain('Item \\| with \\| pipes')
    })

    it('should handle nested objects by flattening', () => {
      const nested = [
        { id: 1, user: { name: 'John', age: 30 } },
        { id: 2, user: { name: 'Jane', age: 25 } },
      ]

      const result = exportData(nested, { format: 'markdown' })

      expect(result).toContain('| user.name |')
      expect(result).toContain('| John |')
      expect(result).toContain('| Jane |')
    })
  })

  describe('HTML Export', () => {
    it('should export to HTML table', () => {
      const result = exportData(sampleArray, { format: 'html' })

      expect(result).toContain('<table>')
      expect(result).toContain('<thead>')
      expect(result).toContain('<th>id</th>')
      expect(result).toContain('<th>name</th>')
      expect(result).toContain('<th>price</th>')
      expect(result).toContain('</thead>')
      expect(result).toContain('<tbody>')
      expect(result).toContain('<td>1</td>')
      expect(result).toContain('<td>Item 1</td>')
      expect(result).toContain('</tbody>')
      expect(result).toContain('</table>')
    })

    it('should handle single object as table', () => {
      const result = exportData(sampleData, { format: 'html' })

      expect(result).toContain('<th>name</th>')
      expect(result).toContain('<td>Product Name</td>')
      expect(result).toContain('<td>99.99</td>')
    })

    it('should escape HTML entities', () => {
      const data = [{ text: '<script>alert("XSS")</script>' }]
      const result = exportData(data, { format: 'html' })

      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&quot;')
      expect(result).not.toContain('<script>')
    })

    it('should handle nested objects by flattening', () => {
      const nested = [
        { id: 1, user: { name: 'John', age: 30 } },
        { id: 2, user: { name: 'Jane', age: 25 } },
      ]

      const result = exportData(nested, { format: 'html' })

      expect(result).toContain('<th>user.name</th>')
      expect(result).toContain('<td>John</td>')
      expect(result).toContain('<td>Jane</td>')
    })

    it('should export pretty HTML', () => {
      const result = exportData(sampleArray, { format: 'html', pretty: true })

      expect(result).toContain('\n')
      expect(result).toContain('  <thead>')
    })
  })
})

describe('Format Detection', () => {
  it('should detect JSON format from extension', async () => {
    const data = { test: 'value' }
    const tmpPath = `/tmp/test-${Date.now()}.json`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()
    const parsed = JSON.parse(content)

    expect(parsed.test).toBe('value')

    // Cleanup
    await Bun.write(tmpPath, '')
  })

  it('should detect CSV format from extension', async () => {
    const data = [{ id: 1, name: 'Test' }]
    const tmpPath = `/tmp/test-${Date.now()}.csv`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()

    expect(content).toContain('id,name')
    expect(content).toContain('1,Test')

    // Cleanup
    await Bun.write(tmpPath, '')
  })

  it('should detect XML format from extension', async () => {
    const data = { test: 'value' }
    const tmpPath = `/tmp/test-${Date.now()}.xml`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()

    expect(content).toContain('<?xml')
    expect(content).toContain('<test>value</test>')

    // Cleanup
    await Bun.write(tmpPath, '')
  })

  it('should detect YAML format from extension', async () => {
    const data = { test: 'value' }
    const tmpPath = `/tmp/test-${Date.now()}.yaml`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()

    expect(content).toContain('test: value')

    // Cleanup
    await Bun.write(tmpPath, '')
  })

  it('should detect Markdown format from extension', async () => {
    const data = [{ id: 1, name: 'Test' }]
    const tmpPath = `/tmp/test-${Date.now()}.md`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()

    expect(content).toContain('| id | name |')
    expect(content).toContain('| 1 | Test |')

    // Cleanup
    await Bun.write(tmpPath, '')
  })

  it('should detect HTML format from extension', async () => {
    const data = [{ id: 1, name: 'Test' }]
    const tmpPath = `/tmp/test-${Date.now()}.html`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()

    expect(content).toContain('<table>')
    expect(content).toContain('<th>id</th>')
    expect(content).toContain('<td>1</td>')

    // Cleanup
    await Bun.write(tmpPath, '')
  })

  it('should default to JSON for unknown extensions', async () => {
    const data = { test: 'value' }
    const tmpPath = `/tmp/test-${Date.now()}.txt`

    await saveExport(data, tmpPath)

    const content = await Bun.file(tmpPath).text()
    const parsed = JSON.parse(content)

    expect(parsed.test).toBe('value')

    // Cleanup
    await Bun.write(tmpPath, '')
  })
})

describe('Reusable Exporters', () => {
  it('should create reusable JSON exporter', () => {
    const exporter = createExporter({ format: 'json', pretty: true })

    const result1 = exporter({ id: 1, name: 'Test 1' })
    const result2 = exporter({ id: 2, name: 'Test 2' })

    expect(JSON.parse(result1).name).toBe('Test 1')
    expect(JSON.parse(result2).name).toBe('Test 2')
    expect(result1).toContain('\n')
  })

  it('should create reusable CSV exporter', () => {
    const exporter = createExporter({ format: 'csv' })

    const result1 = exporter([{ id: 1, name: 'Test 1' }])
    const result2 = exporter([{ id: 2, name: 'Test 2' }])

    expect(result1).toContain('id,name')
    expect(result1).toContain('1,Test 1')
    expect(result2).toContain('2,Test 2')
  })
})

describe('Complex Data Structures', () => {
  it('should handle deeply nested objects', () => {
    const nested = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    }

    const jsonResult = exportData(nested, { format: 'json' })
    const csvResult = exportData(nested, { format: 'csv' })

    expect(JSON.parse(jsonResult).level1.level2.level3.value).toBe('deep')
    expect(csvResult).toContain('level1.level2.level3.value')
    expect(csvResult).toContain('deep')
  })

  it('should handle mixed data types', () => {
    const mixed = [
      { id: 1, value: 'string', active: true, count: 42, price: 9.99 },
      { id: 2, value: 'another', active: false, count: 0, price: 0 },
    ]

    const jsonResult = exportData(mixed, { format: 'json' })
    const csvResult = exportData(mixed, { format: 'csv' })

    const parsed = JSON.parse(jsonResult)
    expect(parsed[0].active).toBe(true)
    expect(parsed[0].count).toBe(42)
    expect(csvResult).toContain('true')
    expect(csvResult).toContain('42')
    expect(csvResult).toContain('9.99')
  })

  it('should handle arrays of arrays', () => {
    const data = {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    }

    const jsonResult = exportData(data, { format: 'json' })
    const csvResult = exportData(data, { format: 'csv' })

    const parsed = JSON.parse(jsonResult)
    expect(parsed.matrix[0][0]).toBe(1)
    expect(csvResult).toContain('matrix')
  })

  it('should handle special characters in all formats', () => {
    const data = {
      text: 'Special: <>&"\',;|[]{}',
    }

    const jsonResult = exportData(data, { format: 'json' })
    const csvResult = exportData(data, { format: 'csv' })
    const xmlResult = exportData(data, { format: 'xml' })
    const htmlResult = exportData(data, { format: 'html' })

    expect(JSON.parse(jsonResult).text).toBe('Special: <>&"\',;|[]{}')
    expect(csvResult).toContain('"')
    expect(xmlResult).toContain('&lt;')
    expect(xmlResult).toContain('&gt;')
    expect(xmlResult).toContain('&amp;')
    expect(htmlResult).toContain('&lt;')
    expect(htmlResult).toContain('&gt;')
  })
})

describe('Edge Cases', () => {
  it('should handle empty objects', () => {
    const empty = {}

    const jsonResult = exportData(empty, { format: 'json' })
    const csvResult = exportData(empty, { format: 'csv' })

    expect(jsonResult).toBe('{}')
    expect(csvResult).toBe('')
  })

  it('should handle null values', () => {
    const data = [{ id: 1, value: null }]

    const jsonResult = exportData(data, { format: 'json' })
    const csvResult = exportData(data, { format: 'csv' })

    expect(JSON.parse(jsonResult)[0].value).toBe(null)
    expect(csvResult).toContain(',,') // Empty value for null
  })

  it('should handle undefined values', () => {
    const data = [{ id: 1, value: undefined }]

    const csvResult = exportData(data, { format: 'csv' })

    expect(csvResult).toContain('id,value')
  })

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000)
    const data = [{ text: longString }]

    const csvResult = exportData(data, { format: 'csv' })

    expect(csvResult).toContain(longString)
  })

  it('should handle numbers with many decimals', () => {
    const data = [{ value: 3.141592653589793 }]

    const jsonResult = exportData(data, { format: 'json' })
    const csvResult = exportData(data, { format: 'csv' })

    expect(JSON.parse(jsonResult)[0].value).toBe(3.141592653589793)
    expect(csvResult).toContain('3.141592653589793')
  })

  it('should handle boolean values', () => {
    const data = [{ active: true, disabled: false }]

    const jsonResult = exportData(data, { format: 'json' })
    const csvResult = exportData(data, { format: 'csv' })

    expect(JSON.parse(jsonResult)[0].active).toBe(true)
    expect(csvResult).toContain('true')
    expect(csvResult).toContain('false')
  })

  it('should handle Date objects', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const data = [{ timestamp: date }]

    const jsonResult = exportData(data, { format: 'json' })

    expect(jsonResult).toContain('2024-01-01')
  })
})

describe('Real-World Scenarios', () => {
  it('should export e-commerce product catalog', () => {
    const products = [
      {
        id: 'P001',
        name: 'Laptop Pro 15"',
        price: 1299.99,
        category: 'Electronics',
        specs: { ram: '16GB', storage: '512GB SSD', cpu: 'Intel i7' },
        inStock: true,
        tags: ['computers', 'productivity'],
      },
      {
        id: 'P002',
        name: 'Wireless Mouse',
        price: 29.99,
        category: 'Accessories',
        specs: { dpi: '1600', wireless: true },
        inStock: true,
        tags: ['peripherals', 'wireless'],
      },
    ]

    const csvResult = exportData(products, { format: 'csv' })
    const jsonResult = exportData(products, { format: 'json', pretty: true })
    const xmlResult = exportData(products, { format: 'xml', pretty: true })

    // CSV should flatten nested specs
    expect(csvResult).toContain('specs.ram')
    expect(csvResult).toContain('specs.storage')

    // JSON should preserve structure
    const parsed = JSON.parse(jsonResult)
    expect(parsed[0].specs.ram).toBe('16GB')

    // XML should handle nested objects
    expect(xmlResult).toContain('<specs>')
    expect(xmlResult).toContain('<ram>16GB</ram>')
  })

  it('should export blog post data with metadata', () => {
    const posts = [
      {
        title: 'Getting Started with Web Scraping',
        author: { name: 'John Doe', email: 'john@example.com' },
        publishDate: '2024-01-15',
        content: 'Web scraping is a powerful technique...',
        tags: ['tutorial', 'web-scraping', 'automation'],
        stats: { views: 1500, likes: 42, comments: 8 },
      },
      {
        title: 'Advanced Data Extraction Techniques',
        author: { name: 'Jane Smith', email: 'jane@example.com' },
        publishDate: '2024-02-01',
        content: 'In this advanced guide...',
        tags: ['advanced', 'data-extraction'],
        stats: { views: 890, likes: 31, comments: 5 },
      },
    ]

    const mdResult = exportData(posts, { format: 'markdown' })
    const htmlResult = exportData(posts, { format: 'html' })
    const yamlResult = exportData(posts, { format: 'yaml' })

    // Markdown should create readable tables
    expect(mdResult).toContain('| title |')
    expect(mdResult).toContain('| author.name |')
    expect(mdResult).toContain('| stats.views |')

    // HTML should be properly escaped
    expect(htmlResult).toContain('<table>')
    expect(htmlResult).toContain('Getting Started with Web Scraping')

    // YAML should preserve hierarchy
    expect(yamlResult).toContain('author:')
    expect(yamlResult).toContain('  name: John Doe')
  })

  it('should export API response data', () => {
    const apiData = {
      status: 'success',
      timestamp: '2024-01-01T12:00:00Z',
      data: [
        { userId: 1, username: 'user1', active: true },
        { userId: 2, username: 'user2', active: false },
      ],
      metadata: {
        total: 2,
        page: 1,
        perPage: 10,
      },
    }

    const jsonResult = exportData(apiData, { format: 'json', pretty: true })

    const parsed = JSON.parse(jsonResult)
    expect(parsed.status).toBe('success')
    expect(parsed.data.length).toBe(2)
    expect(parsed.metadata.total).toBe(2)
  })
})
