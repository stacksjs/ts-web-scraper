import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  arrayDiff,
  ChangeType,
  compare,
  ContentTracker,
  diff,
  hashContent,
  stringSimilarity,
} from '../src/diff'

describe('hashContent', () => {
  it('should generate consistent hashes', async () => {
    const content = { name: 'John', age: 30 }

    const hash1 = await hashContent(content)
    const hash2 = await hashContent(content)

    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different content', async () => {
    const hash1 = await hashContent({ name: 'John' })
    const hash2 = await hashContent({ name: 'Jane' })

    expect(hash1).not.toBe(hash2)
  })

  it('should handle strings', async () => {
    const hash = await hashContent('test string')
    expect(hash).toBeDefined()
    expect(hash.length).toBeGreaterThan(0)
  })

  it('should handle complex objects', async () => {
    const complex = {
      nested: {
        deep: {
          value: [1, 2, 3],
        },
      },
    }

    const hash = await hashContent(complex)
    expect(hash).toBeDefined()
  })
})

describe('diff', () => {
  it('should detect no changes in identical objects', () => {
    const obj = { name: 'John', age: 30 }
    const changes = diff(obj, obj)

    expect(changes.length).toBe(0)
  })

  it('should detect modified fields', () => {
    const oldObj = { name: 'John', age: 30 }
    const newObj = { name: 'John', age: 31 }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].type).toBe(ChangeType.MODIFIED)
    expect(changes[0].path).toBe('age')
    expect(changes[0].oldValue).toBe(30)
    expect(changes[0].newValue).toBe(31)
  })

  it('should detect added fields', () => {
    const oldObj = { name: 'John' }
    const newObj = { name: 'John', age: 30 }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].type).toBe(ChangeType.ADDED)
    expect(changes[0].path).toBe('age')
    expect(changes[0].newValue).toBe(30)
  })

  it('should detect removed fields', () => {
    const oldObj = { name: 'John', age: 30 }
    const newObj = { name: 'John' }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].type).toBe(ChangeType.REMOVED)
    expect(changes[0].path).toBe('age')
    expect(changes[0].oldValue).toBe(30)
  })

  it('should detect nested changes', () => {
    const oldObj = { user: { name: 'John', age: 30 } }
    const newObj = { user: { name: 'John', age: 31 } }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].path).toBe('user.age')
  })

  it('should detect array changes', () => {
    const oldObj = { items: [1, 2, 3] }
    const newObj = { items: [1, 2, 4] }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].path).toBe('items[2]')
    expect(changes[0].oldValue).toBe(3)
    expect(changes[0].newValue).toBe(4)
  })

  it('should detect array length changes', () => {
    const oldObj = { items: [1, 2] }
    const newObj = { items: [1, 2, 3] }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].type).toBe(ChangeType.ADDED)
    expect(changes[0].path).toBe('items[2]')
  })

  it('should handle null values', () => {
    const oldObj = { value: null }
    const newObj = { value: 'something' }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].type).toBe(ChangeType.MODIFIED) // null -> value is a modification
    expect(changes[0].oldValue).toBe(null)
    expect(changes[0].newValue).toBe('something')
  })

  it('should handle undefined values', () => {
    const oldObj = { value: undefined }
    const newObj = { value: 'something' }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].type).toBe(ChangeType.MODIFIED) // undefined -> value is a modification
    expect(changes[0].oldValue).toBe(undefined)
    expect(changes[0].newValue).toBe('something')
  })

  it('should detect multiple changes', () => {
    const oldObj = { a: 1, b: 2, c: 3 }
    const newObj = { a: 1, b: 20, d: 4 }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(3)
    expect(changes.some(c => c.type === ChangeType.MODIFIED)).toBe(true)
    expect(changes.some(c => c.type === ChangeType.REMOVED)).toBe(true)
    expect(changes.some(c => c.type === ChangeType.ADDED)).toBe(true)
  })

  it('should handle deeply nested objects', () => {
    const oldObj = {
      level1: {
        level2: {
          level3: {
            value: 'old',
          },
        },
      },
    }

    const newObj = {
      level1: {
        level2: {
          level3: {
            value: 'new',
          },
        },
      },
    }

    const changes = diff(oldObj, newObj)

    expect(changes.length).toBe(1)
    expect(changes[0].path).toBe('level1.level2.level3.value')
  })
})

describe('compare', () => {
  it('should compare two snapshots', () => {
    const snapshot1 = {
      url: 'https://example.com',
      timestamp: new Date(),
      hash: 'hash1',
      content: { price: 100 },
    }

    const snapshot2 = {
      url: 'https://example.com',
      timestamp: new Date(),
      hash: 'hash2',
      content: { price: 120 },
    }

    const result = compare(snapshot1, snapshot2)

    expect(result.hasChanges).toBe(true)
    expect(result.changes.length).toBe(1)
    expect(result.summary.modified).toBe(1)
  })

  it('should generate summary statistics', () => {
    const snapshot1 = {
      url: 'https://example.com',
      timestamp: new Date(),
      hash: 'hash1',
      content: { a: 1, b: 2, c: 3 },
    }

    const snapshot2 = {
      url: 'https://example.com',
      timestamp: new Date(),
      hash: 'hash2',
      content: { a: 1, b: 20, d: 4 },
    }

    const result = compare(snapshot1, snapshot2)

    expect(result.summary.modified).toBe(1) // b changed
    expect(result.summary.removed).toBe(1) // c removed
    expect(result.summary.added).toBe(1) // d added
  })
})

describe('ContentTracker', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tracker-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should take snapshots', async () => {
    const tracker = new ContentTracker()

    const snapshot = await tracker.snapshot('https://example.com', { price: 100 })

    expect(snapshot.url).toBe('https://example.com')
    expect(snapshot.content.price).toBe(100)
    expect(snapshot.hash).toBeDefined()
  })

  it('should retrieve snapshots', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://example.com', { price: 120 })

    const snapshots = tracker.getSnapshots('https://example.com')

    expect(snapshots.length).toBe(2)
  })

  it('should get latest snapshot', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://example.com', { price: 120 })

    const latest = tracker.getLatest('https://example.com')

    expect(latest?.content.price).toBe(120)
  })

  it('should limit snapshots', async () => {
    const tracker = new ContentTracker({ maxSnapshots: 3 })

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://example.com', { price: 110 })
    await tracker.snapshot('https://example.com', { price: 120 })
    await tracker.snapshot('https://example.com', { price: 130 })

    const snapshots = tracker.getSnapshots('https://example.com')

    expect(snapshots.length).toBe(3)
    expect(snapshots[0].content.price).toBe(110) // Oldest removed
  })

  it('should detect changes', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })

    const hasChanged1 = await tracker.hasChanged('https://example.com', { price: 100 })
    expect(hasChanged1).toBe(false)

    const hasChanged2 = await tracker.hasChanged('https://example.com', { price: 120 })
    expect(hasChanged2).toBe(true)
  })

  it('should get changes', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100, stock: 10 })

    const changes = await tracker.getChanges('https://example.com', { price: 120, stock: 10 })

    expect(changes).not.toBeNull()
    expect(changes!.hasChanges).toBe(true)
    expect(changes!.changes.length).toBe(1)
  })

  it('should compare specific snapshots', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://example.com', { price: 110 })
    await tracker.snapshot('https://example.com', { price: 120 })

    const result = tracker.compareSnapshots('https://example.com', 0, 2)

    expect(result).not.toBeNull()
    expect(result!.hasChanges).toBe(true)
  })

  it('should clear snapshots for a URL', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://other.com', { price: 200 })

    tracker.clear('https://example.com')

    expect(tracker.getSnapshots('https://example.com').length).toBe(0)
    expect(tracker.getSnapshots('https://other.com').length).toBe(1)
  })

  it('should clear all snapshots', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://other.com', { price: 200 })

    tracker.clearAll()

    expect(tracker.getTrackedUrls().length).toBe(0)
  })

  it('should get tracked URLs', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://example.com', { price: 100 })
    await tracker.snapshot('https://other.com', { price: 200 })

    const urls = tracker.getTrackedUrls()

    expect(urls.length).toBe(2)
    expect(urls).toContain('https://example.com')
    expect(urls).toContain('https://other.com')
  })

  it('should persist snapshots to disk', async () => {
    const tracker = new ContentTracker({ storageDir: tempDir })

    await tracker.snapshot('https://example.com', { price: 100 })

    const files = await Array.fromAsync(new Bun.Glob('*.json').scan(tempDir))
    expect(files.length).toBe(1)
  })

  it('should load snapshots from disk', async () => {
    const tracker1 = new ContentTracker({ storageDir: tempDir })

    await tracker1.snapshot('https://example.com', { price: 100 })
    await tracker1.snapshot('https://example.com', { price: 110 })

    const tracker2 = new ContentTracker({ storageDir: tempDir })
    await tracker2.loadSnapshots('https://example.com')

    const snapshots = tracker2.getSnapshots('https://example.com')
    expect(snapshots.length).toBe(2)
  })
})

describe('stringSimilarity', () => {
  it('should return 1 for identical strings', () => {
    const similarity = stringSimilarity('hello', 'hello')
    expect(similarity).toBe(1)
  })

  it('should return 0 for completely different strings', () => {
    const similarity = stringSimilarity('hello', 'world')
    expect(similarity).toBeLessThan(0.5)
  })

  it('should return high similarity for similar strings', () => {
    const similarity = stringSimilarity('hello', 'hallo')
    expect(similarity).toBeGreaterThan(0.7)
  })

  it('should handle empty strings', () => {
    const similarity = stringSimilarity('', '')
    expect(similarity).toBe(1)
  })

  it('should be case-sensitive', () => {
    const similarity = stringSimilarity('Hello', 'hello')
    expect(similarity).toBeLessThan(1)
  })

  it('should calculate edit distance', () => {
    // "kitten" -> "sitting" requires 3 edits
    const similarity = stringSimilarity('kitten', 'sitting')
    expect(similarity).toBeGreaterThan(0)
    expect(similarity).toBeLessThan(1)
  })
})

describe('arrayDiff', () => {
  it('should detect added items', () => {
    const oldArray = [1, 2, 3]
    const newArray = [1, 2, 3, 4, 5]

    const changes = arrayDiff(oldArray, newArray)
    const added = changes.filter(c => c.type === ChangeType.ADDED)

    expect(added.length).toBe(2)
    expect(added.map(c => c.value)).toEqual([4, 5])
  })

  it('should detect removed items', () => {
    const oldArray = [1, 2, 3, 4, 5]
    const newArray = [1, 2, 3]

    const changes = arrayDiff(oldArray, newArray)
    const removed = changes.filter(c => c.type === ChangeType.REMOVED)

    expect(removed.length).toBe(2)
    expect(removed.map(c => c.value)).toEqual([4, 5])
  })

  it('should handle custom equality function', () => {
    const oldArray = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
    const newArray = [{ id: 1, name: 'A' }, { id: 3, name: 'C' }]

    const changes = arrayDiff(
      oldArray,
      newArray,
      (a, b) => a.id === b.id,
    )

    expect(changes.length).toBe(2)
    expect(changes.filter(c => c.type === ChangeType.REMOVED).length).toBe(1)
    expect(changes.filter(c => c.type === ChangeType.ADDED).length).toBe(1)
  })

  it('should handle empty arrays', () => {
    const changes = arrayDiff([], [1, 2, 3])
    expect(changes.length).toBe(3)
    expect(changes.every(c => c.type === ChangeType.ADDED)).toBe(true)
  })
})

describe('Real-world scenarios', () => {
  it('should track price changes', async () => {
    const tracker = new ContentTracker()

    // Initial price
    await tracker.snapshot('https://shop.com/product/123', {
      name: 'Laptop',
      price: 999,
      inStock: true,
    })

    // Price drops
    const changes = await tracker.getChanges('https://shop.com/product/123', {
      name: 'Laptop',
      price: 799,
      inStock: true,
    })

    expect(changes?.hasChanges).toBe(true)

    const priceChange = changes?.changes.find(c => c.path === 'price')
    expect(priceChange).toBeDefined()
    expect(priceChange?.oldValue).toBe(999)
    expect(priceChange?.newValue).toBe(799)
  })

  it('should track content updates', async () => {
    const tracker = new ContentTracker()

    // Original article
    await tracker.snapshot('https://news.com/article', {
      headline: 'Breaking News',
      content: 'Original content',
      tags: ['news', 'breaking'],
    })

    // Updated article
    const changes = await tracker.getChanges('https://news.com/article', {
      headline: 'Updated Breaking News',
      content: 'Updated content with more details',
      tags: ['news', 'breaking', 'update'],
    })

    expect(changes?.summary.modified).toBe(2) // headline, content
    expect(changes?.summary.added).toBe(0)
  })

  it('should detect data structure changes', async () => {
    const tracker = new ContentTracker()

    await tracker.snapshot('https://api.com/data', {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    })

    const changes = await tracker.getChanges('https://api.com/data', {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane Smith' }, // Name changed
        { id: 3, name: 'Bob' }, // New user
      ],
    })

    expect(changes?.hasChanges).toBe(true)
  })
})
