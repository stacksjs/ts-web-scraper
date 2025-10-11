/**
 * Content Change Detection
 *
 * Track and detect changes in scraped content over time
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  UNCHANGED = 'unchanged',
}

export interface Change {
  type: ChangeType
  path: string
  oldValue?: any
  newValue?: any
}

export interface DiffResult {
  hasChanges: boolean
  changes: Change[]
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
}

export interface ContentSnapshot {
  url: string
  timestamp: Date
  hash: string
  content: any
  metadata?: Record<string, any>
}

/**
 * Generate a hash for content
 */
export async function hashContent(content: any): Promise<string> {
  const str = typeof content === 'string' ? content : JSON.stringify(content)
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Deep diff between two objects
 */
export function diff(oldObj: any, newObj: any, path: string = ''): Change[] {
  const changes: Change[] = []

  // Handle cases where one is null/undefined and the other is not
  const oldIsNullish = oldObj === null || oldObj === undefined
  const newIsNullish = newObj === null || newObj === undefined

  // Both are nullish - no change
  if (oldIsNullish && newIsNullish) {
    return changes
  }

  // Only old is nullish - new value was added
  if (oldIsNullish && !newIsNullish) {
    changes.push({
      type: ChangeType.ADDED,
      path: path || '(root)',
      newValue: newObj,
    })
    return changes
  }

  // Only new is nullish - value was removed
  if (!oldIsNullish && newIsNullish) {
    changes.push({
      type: ChangeType.REMOVED,
      path: path || '(root)',
      oldValue: oldObj,
    })
    return changes
  }

  // Handle arrays
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    const maxLength = Math.max(oldObj.length, newObj.length)

    for (let i = 0; i < maxLength; i++) {
      const itemPath = `${path}[${i}]`

      if (i >= oldObj.length) {
        changes.push({
          type: ChangeType.ADDED,
          path: itemPath,
          newValue: newObj[i],
        })
      }
      else if (i >= newObj.length) {
        changes.push({
          type: ChangeType.REMOVED,
          path: itemPath,
          oldValue: oldObj[i],
        })
      }
      else {
        changes.push(...diff(oldObj[i], newObj[i], itemPath))
      }
    }

    return changes
  }

  // Handle objects
  if (typeof oldObj === 'object' && typeof newObj === 'object' && !Array.isArray(oldObj) && !Array.isArray(newObj)) {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      const fieldPath = path ? `${path}.${key}` : key
      const oldValue = oldObj[key]
      const newValue = newObj[key]

      if (!(key in oldObj)) {
        changes.push({
          type: ChangeType.ADDED,
          path: fieldPath,
          newValue,
        })
      }
      else if (!(key in newObj)) {
        changes.push({
          type: ChangeType.REMOVED,
          path: fieldPath,
          oldValue,
        })
      }
      else if (typeof oldValue === 'object' && typeof newValue === 'object') {
        changes.push(...diff(oldValue, newValue, fieldPath))
      }
      else if (oldValue !== newValue) {
        changes.push({
          type: ChangeType.MODIFIED,
          path: fieldPath,
          oldValue,
          newValue,
        })
      }
    }

    return changes
  }

  // Handle primitives
  if (oldObj !== newObj) {
    changes.push({
      type: ChangeType.MODIFIED,
      path: path || '(root)',
      oldValue: oldObj,
      newValue: newObj,
    })
  }

  return changes
}

/**
 * Compare two content snapshots
 */
export function compare(oldSnapshot: ContentSnapshot, newSnapshot: ContentSnapshot): DiffResult {
  const changes = diff(oldSnapshot.content, newSnapshot.content)

  const summary = {
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
  }

  for (const change of changes) {
    if (change.type === ChangeType.ADDED) {
      summary.added++
    }
    else if (change.type === ChangeType.REMOVED) {
      summary.removed++
    }
    else if (change.type === ChangeType.MODIFIED) {
      summary.modified++
    }
    else {
      summary.unchanged++
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    summary,
  }
}

/**
 * Content tracker for monitoring changes
 */
export class ContentTracker {
  private snapshots: Map<string, ContentSnapshot[]> = new Map()

  constructor(private options: {
    maxSnapshots?: number
    storageDir?: string
  } = {}) {}

  /**
   * Take a snapshot of content
   */
  async snapshot(url: string, content: any, metadata?: Record<string, any>): Promise<ContentSnapshot> {
    const hash = await hashContent(content)

    const snapshot: ContentSnapshot = {
      url,
      timestamp: new Date(),
      hash,
      content,
      metadata,
    }

    const snapshots = this.snapshots.get(url) || []
    snapshots.push(snapshot)

    // Limit snapshots
    if (this.options.maxSnapshots && snapshots.length > this.options.maxSnapshots) {
      snapshots.shift()
    }

    this.snapshots.set(url, snapshots)

    // Persist if storage directory configured
    if (this.options.storageDir) {
      await this.saveSnapshot(snapshot)
    }

    return snapshot
  }

  /**
   * Get all snapshots for a URL
   */
  getSnapshots(url: string): ContentSnapshot[] {
    return this.snapshots.get(url) || []
  }

  /**
   * Get latest snapshot for a URL
   */
  getLatest(url: string): ContentSnapshot | null {
    const snapshots = this.snapshots.get(url)
    return snapshots && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
  }

  /**
   * Check if content has changed
   */
  async hasChanged(url: string, newContent: any): Promise<boolean> {
    const latest = this.getLatest(url)
    if (!latest) {
      return true
    }

    const newHash = await hashContent(newContent)
    return newHash !== latest.hash
  }

  /**
   * Get changes since last snapshot
   */
  async getChanges(url: string, newContent: any): Promise<DiffResult | null> {
    const latest = this.getLatest(url)
    if (!latest) {
      return null
    }

    const newSnapshot = await this.snapshot(url, newContent)
    return compare(latest, newSnapshot)
  }

  /**
   * Compare two specific snapshots
   */
  compareSnapshots(url: string, fromIndex: number, toIndex: number): DiffResult | null {
    const snapshots = this.snapshots.get(url)
    if (!snapshots || fromIndex >= snapshots.length || toIndex >= snapshots.length) {
      return null
    }

    return compare(snapshots[fromIndex], snapshots[toIndex])
  }

  /**
   * Clear snapshots for a URL
   */
  clear(url: string): void {
    this.snapshots.delete(url)
  }

  /**
   * Clear all snapshots
   */
  clearAll(): void {
    this.snapshots.clear()
  }

  /**
   * Get all tracked URLs
   */
  getTrackedUrls(): string[] {
    return Array.from(this.snapshots.keys())
  }

  /**
   * Save snapshot to disk
   */
  private async saveSnapshot(snapshot: ContentSnapshot): Promise<void> {
    if (!this.options.storageDir) {
      return
    }

    const filename = `${encodeURIComponent(snapshot.url)}-${snapshot.timestamp.getTime()}.json`
    const filepath = `${this.options.storageDir}/${filename}`

    await Bun.write(filepath, JSON.stringify(snapshot, null, 2))
  }

  /**
   * Load snapshots from disk
   */
  async loadSnapshots(url: string): Promise<void> {
    if (!this.options.storageDir) {
      return
    }

    const encodedUrl = encodeURIComponent(url)
    const files = await Array.fromAsync(
      new Bun.Glob(`${encodedUrl}-*.json`).scan(this.options.storageDir),
    )

    const snapshots: ContentSnapshot[] = []

    for (const file of files) {
      const filepath = `${this.options.storageDir}/${file}`
      const content = await Bun.file(filepath).text()
      const snapshot = JSON.parse(content)
      snapshot.timestamp = new Date(snapshot.timestamp)
      snapshots.push(snapshot)
    }

    // Sort by timestamp
    snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    this.snapshots.set(url, snapshots)
  }
}

/**
 * Calculate similarity between two strings (0-1)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) {
    return 1
  }

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1
  }

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      }
      else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Find differences in arrays using LCS algorithm
 */
export function arrayDiff<T>(
  oldArray: T[],
  newArray: T[],
  equals: (a: T, b: T) => boolean = (a, b) => a === b,
): Array<{ type: ChangeType, value: T, index?: number }> {
  const changes: Array<{ type: ChangeType, value: T, index?: number }> = []

  // Simple approach: check which items exist in both
  const oldSet = new Set(oldArray)
  const newSet = new Set(newArray)

  // Find removed items
  for (let i = 0; i < oldArray.length; i++) {
    const item = oldArray[i]
    let found = false
    for (const newItem of newArray) {
      if (equals(item, newItem)) {
        found = true
        break
      }
    }
    if (!found) {
      changes.push({ type: ChangeType.REMOVED, value: item, index: i })
    }
  }

  // Find added items
  for (let i = 0; i < newArray.length; i++) {
    const item = newArray[i]
    let found = false
    for (const oldItem of oldArray) {
      if (equals(item, oldItem)) {
        found = true
        break
      }
    }
    if (!found) {
      changes.push({ type: ChangeType.ADDED, value: item, index: i })
    }
  }

  return changes
}
