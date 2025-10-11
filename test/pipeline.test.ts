import { describe, expect, it } from 'bun:test'
import { ExtractionPipeline, extractors, pipeline } from '../src/pipeline'
import { parseHTML } from '../src/web-scraper'

describe('ExtractionPipeline', () => {
  it('should execute a simple pipeline', async () => {
    const pipe = new ExtractionPipeline()
      .transform('double', (n: number) => n * 2)
      .transform('add-ten', (n: number) => n + 10)

    const result = await pipe.execute(5)
    expect(result.success).toBe(true)
    expect(result.data).toBe(20) // (5 * 2) + 10
  })

  it('should track step results', async () => {
    const pipe = new ExtractionPipeline()
      .transform('step1', (n: number) => n + 1)
      .transform('step2', (n: number) => n * 2)

    const result = await pipe.execute(5)
    expect(result.metadata.stepsExecuted).toBe(2)
    expect(result.metadata.stepResults.length).toBe(2)
    expect(result.metadata.stepResults[0].step).toBe('step1')
    expect(result.metadata.stepResults[1].step).toBe('step2')
  })

  it('should handle errors', async () => {
    const pipe = new ExtractionPipeline()
      .transform('will-fail', () => {
        throw new Error('Test error')
      })

    const result = await pipe.execute(5)
    expect(result.success).toBe(false)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0].error.message).toBe('Test error')
  })

  it('should continue on error when configured', async () => {
    const pipe = new ExtractionPipeline({ continueOnError: true })
      .transform('will-fail', () => {
        throw new Error('Test error')
      })
      .transform('will-succeed', (n: number) => n * 2)

    const result = await pipe.execute(5)
    expect(result.errors.length).toBe(1)
    expect(result.metadata.stepsExecuted).toBe(1)
  })

  it('should use error recovery', async () => {
    const pipe = new ExtractionPipeline()
      .step({
        name: 'fallback',
        execute: () => {
          throw new Error('Primary failed')
        },
        onError: () => 'recovered',
      })

    const result = await pipe.execute(null)
    expect(result.success).toBe(true)
    expect(result.data).toBe('recovered')
  })

  it('should handle timeout', async () => {
    const pipe = new ExtractionPipeline({ timeout: 100 })
      .transform('slow', async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return 'done'
      })

    const result = await pipe.execute(null)
    expect(result.success).toBe(false)
    expect(result.errors[0].error.message).toBe('Step timeout')
  })
})

describe('Pipeline transformations', () => {
  it('should filter data', async () => {
    const pipe = pipeline<number[], number[]>()
      .filter('positive-only', (nums: number[]) => nums.every(n => n > 0))

    const result1 = await pipe.execute([1, 2, 3])
    expect(result1.success).toBe(true)

    const result2 = await pipe.execute([1, -2, 3])
    expect(result2.success).toBe(false)
  })

  it('should validate data', async () => {
    const pipe = pipeline()
      .validate('check-user', {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 18 },
      })

    const valid = await pipe.execute({ name: 'John', age: 25 })
    expect(valid.success).toBe(true)

    const invalid = await pipe.execute({ name: 'Jane', age: 15 })
    expect(invalid.success).toBe(false)
  })

  it('should sanitize data', async () => {
    const pipe = pipeline()
      .sanitize('clean', { trim: true, removeEmpty: true })

    const result = await pipe.execute({
      items: ['  text  ', '', '  data  ', '', 'end'],
    })

    expect(result.data.items).toEqual(['text', 'data', 'end'])
  })

  it('should map arrays', async () => {
    const pipe = pipeline<number[], string[]>()
      .map('to-string', (n: number) => n.toString())

    const result = await pipe.execute([1, 2, 3])
    expect(result.data).toEqual(['1', '2', '3'])
  })

  it('should flat map arrays', async () => {
    const pipe = pipeline<number[], number[]>()
      .flatMap('duplicate', (n: number) => [n, n])

    const result = await pipe.execute([1, 2, 3])
    expect(result.data).toEqual([1, 1, 2, 2, 3, 3])
  })

  it('should group by key', async () => {
    const pipe = pipeline<Array<{ type: string }>, Record<string, any>>()
      .groupBy('by-type', (item: { type: string }) => item.type)

    const result = await pipe.execute([
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ])

    expect(result.data.a.length).toBe(2)
    expect(result.data.b.length).toBe(1)
  })

  it('should deduplicate arrays', async () => {
    const pipe = pipeline<number[], number[]>()
      .unique('dedupe')

    const result = await pipe.execute([1, 2, 2, 3, 3, 3, 4])
    expect(result.data).toEqual([1, 2, 3, 4])
  })

  it('should deduplicate with key function', async () => {
    const pipe = pipeline<Array<{ id: number }>, Array<{ id: number }>>()
      .unique('dedupe-by-id', item => item.id.toString())

    const result = await pipe.execute([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ])

    expect(result.data.length).toBe(2)
    expect(result.data[0].name).toBe('a')
  })

  it('should sort arrays', async () => {
    const pipe = pipeline<number[], number[]>()
      .sort('ascending', (a, b) => a - b)

    const result = await pipe.execute([3, 1, 4, 1, 5, 9, 2, 6])
    expect(result.data).toEqual([1, 1, 2, 3, 4, 5, 6, 9])
  })

  it('should limit arrays', async () => {
    const pipe = pipeline<number[], number[]>()
      .limit('top-3', 3)

    const result = await pipe.execute([1, 2, 3, 4, 5])
    expect(result.data).toEqual([1, 2, 3])
  })
})

describe('Pipeline chaining', () => {
  it('should chain multiple transformations', async () => {
    const pipe = pipeline<number[], number[]>()
      .map('double', (n: number) => n * 2)
      .filter('positive', (nums: number[]) => nums.every(n => n > 0))
      .sort('ascending', (a, b) => a - b)
      .limit('top-5', 5)

    const result = await pipe.execute([3, -1, 2, 5, 1])
    expect(result.success).toBe(false) // -1 fails filter
  })

  it('should build reusable pipeline', async () => {
    const extractNumbers = pipeline<number[], number>()
      .filter('valid', (nums: number[]) => nums.length > 0)
      .sort('ascending', (a, b) => a - b)
      .transform('sum', (nums: number[]) => nums.reduce((a, b) => a + b, 0))

    const execute = extractNumbers.build()

    const result1 = await execute([5, 2, 8, 1])
    expect(result1.data).toBe(16)

    const result2 = await execute([10, 20, 30])
    expect(result2.data).toBe(60)
  })
})

describe('Extractors', () => {
  it('should extract text from elements', () => {
    const html = '<div><p>First</p><p>Second</p></div>'
    const doc = parseHTML(html)

    const extractor = extractors.text('p')
    const result = extractor.execute(doc)

    expect(result).toEqual(['First', 'Second'])
  })

  it('should extract attributes', () => {
    const html = '<div><a href="/page1">Link 1</a><a href="/page2">Link 2</a></div>'
    const doc = parseHTML(html)

    const extractor = extractors.attr('a', 'href')
    const result = extractor.execute(doc)

    expect(result).toEqual(['/page1', '/page2'])
  })

  it('should extract links', () => {
    const html = '<div><a href="/page1">Link</a><a href="/page2">Link</a></div>'
    const doc = parseHTML(html)

    const extractor = extractors.links()
    const result = extractor.execute(doc)

    expect(result.length).toBe(2)
    expect(result).toContain('/page1')
  })

  it('should extract images', () => {
    const html = '<div><img src="/img1.jpg" alt="Image 1"><img src="/img2.jpg" alt="Image 2"></div>'
    const doc = parseHTML(html)

    const extractor = extractors.images()
    const result = extractor.execute(doc)

    expect(result.length).toBe(2)
    expect(result[0].src).toBe('/img1.jpg')
    expect(result[0].alt).toBe('Image 1')
  })

  it('should extract structured data', () => {
    const html = `
      <div class="product">
        <h2 class="name">Product 1</h2>
        <span class="price">$10</span>
      </div>
      <div class="product">
        <h2 class="name">Product 2</h2>
        <span class="price">$20</span>
      </div>
    `
    const doc = parseHTML(html)

    const extractor = extractors.structured('.product', {
      name: '.name',
      price: '.price',
    })

    const result = extractor.execute(doc)

    expect(result.length).toBe(2)
    expect(result[0].name).toBe('Product 1')
    expect(result[0].price).toBe('$10')
  })

  it('should extract JSON-LD', () => {
    const html = `
      <script type="application/ld+json">
      { "name": "Product", "price": 99 }
      </script>
      <script type="application/ld+json">
      { "author": "John Doe" }
      </script>
    `
    const doc = parseHTML(html)

    const extractor = extractors.jsonLd()
    const result = extractor.execute(doc)

    expect(result.length).toBe(2)
    expect(result[0].name).toBe('Product')
    expect(result[1].author).toBe('John Doe')
  })

  it('should handle invalid JSON-LD gracefully', () => {
    const html = `
      <script type="application/ld+json">
      { invalid json }
      </script>
    `
    const doc = parseHTML(html)

    const extractor = extractors.jsonLd()
    const result = extractor.execute(doc)

    expect(result.length).toBe(0)
  })
})

describe('Pipeline context', () => {
  it('should use context in steps', async () => {
    const pipe = new ExtractionPipeline()
      .step({
        name: 'use-context',
        execute: (input: number, context) => {
          return input + (context?.metadata?.offset || 0)
        },
      })

    const result = await pipe.execute(5, {
      metadata: { offset: 10 },
    })

    expect(result.data).toBe(15)
  })

  it('should use cache in context', async () => {
    let executionCount = 0

    const pipe = new ExtractionPipeline()
      .step({
        name: 'cached-step',
        execute: (input: string, context) => {
          const cache = context?.cache
          if (cache?.has(input)) {
            return cache.get(input)
          }

          executionCount++
          const result = `processed-${input}`
          cache?.set(input, result)
          return result
        },
      })

    const cache = new Map()

    await pipe.execute('test', { cache })
    await pipe.execute('test', { cache })
    await pipe.execute('test', { cache })

    expect(executionCount).toBe(1) // Only executed once, cached after
  })
})

describe('Error handling', () => {
  it('should handle array validation errors', async () => {
    const pipe = pipeline()
      .map('process', (n: number) => n * 2)

    const result = await pipe.execute('not an array')
    expect(result.success).toBe(false)
    expect(result.errors[0].error.message).toContain('array')
  })

  it('should handle transformation errors', async () => {
    const pipe = pipeline<number[], number[]>()
      .transform('will-throw', () => {
        throw new Error('Transformation failed')
      })

    const result = await pipe.execute([1, 2, 3])
    expect(result.success).toBe(false)
    expect(result.errors[0].error.message).toBe('Transformation failed')
  })

  it('should collect multiple errors with continueOnError', async () => {
    const pipe = new ExtractionPipeline({ continueOnError: true })
      .transform('fail1', () => {
        throw new Error('Error 1')
      })
      .transform('fail2', () => {
        throw new Error('Error 2')
      })
      .transform('fail3', () => {
        throw new Error('Error 3')
      })

    const result = await pipe.execute(null)
    expect(result.errors.length).toBe(3)
  })
})

describe('Complex pipelines', () => {
  it('should handle e-commerce product extraction', async () => {
    const html = `
      <div class="products">
        <div class="product">
          <h2 class="name">  Laptop  </h2>
          <span class="price">$999</span>
          <span class="rating">4.5</span>
        </div>
        <div class="product">
          <h2 class="name">  Mouse  </h2>
          <span class="price">$29</span>
          <span class="rating">4.8</span>
        </div>
        <div class="product">
          <h2 class="name">  Keyboard  </h2>
          <span class="price">$79</span>
          <span class="rating">4.2</span>
        </div>
      </div>
    `
    const doc = parseHTML(html)

    const extractProducts = pipeline()
      .step(extractors.structured('.product', {
        name: '.name',
        price: '.price',
        rating: '.rating',
      }))
      .sanitize('clean', { trim: true })
      .map('parse-numbers', (p: any) => ({
        name: p.name,
        price: Number.parseFloat(p.price.replace(/[^0-9.]/g, '')),
        rating: Number.parseFloat(p.rating),
      }))
      .filter('quality', (products: any[]) => products.every(p => p.rating >= 4.0))
      .sort('by-price', (a: any, b: any) => a.price - b.price)
      .validate('schema', {
        name: { type: 'string', required: true },
        price: { type: 'number', min: 0 },
        rating: { type: 'number', min: 0, max: 5 },
      })

    const result = await extractProducts.execute(doc)

    expect(result.success).toBe(true)
    expect(result.data.length).toBe(3)
    expect(result.data[0].name).toBe('Mouse') // Cheapest first
    expect(result.data[0].price).toBe(29)
  })

  it('should handle blog post extraction with pagination', async () => {
    const html = `
      <div class="blog">
        <article>
          <h2 class="title">Post 1</h2>
          <time class="date">2024-01-01</time>
          <div class="excerpt">Excerpt 1</div>
        </article>
        <article>
          <h2 class="title">Post 2</h2>
          <time class="date">2024-01-02</time>
          <div class="excerpt">Excerpt 2</div>
        </article>
      </div>
    `
    const doc = parseHTML(html)

    const extractPosts = pipeline()
      .step(extractors.structured('article', {
        title: '.title',
        date: '.date',
        excerpt: '.excerpt',
      }))
      .map('parse-dates', (p: any) => ({
        ...p,
        date: new Date(p.date),
      }))
      .sort('by-date', (a: any, b: any) => b.date.getTime() - a.date.getTime())
      .limit('recent', 10)

    const result = await extractPosts.execute(doc)

    expect(result.success).toBe(true)
    expect(result.data.length).toBe(2)
    expect(result.data[0].title).toBe('Post 2') // Newest first
  })
})
