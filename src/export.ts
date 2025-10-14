/**
 * Multiple Export Formats
 *
 * Export scraped data to various formats
 * Uses ONLY Bun native APIs - no external dependencies!
 */

export type ExportFormat = 'json' | 'csv' | 'xml' | 'yaml' | 'markdown' | 'html'

export interface ExportOptions {
  format: ExportFormat
  pretty?: boolean
  includeMetadata?: boolean
  customTemplate?: string
}

/**
 * Export data to specified format
 */
export function exportData(data: any, options: ExportOptions): string {
  switch (options.format) {
    case 'json':
      return exportJSON(data, options)
    case 'csv':
      return exportCSV(data, options)
    case 'xml':
      return exportXML(data, options)
    case 'yaml':
      return exportYAML(data, options)
    case 'markdown':
      return exportMarkdown(data, options)
    case 'html':
      return exportHTML(data, options)
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }
}

/**
 * Export to JSON
 */
function exportJSON(data: any, options: ExportOptions): string {
  if (options.pretty) {
    return JSON.stringify(data, null, 2)
  }
  return JSON.stringify(data)
}

/**
 * Export to CSV
 */
function exportCSV(data: any, _options: ExportOptions): string {
  // Handle single object
  if (!Array.isArray(data)) {
    data = [data]
  }

  if (data.length === 0) {
    return ''
  }

  // Get all unique keys
  const keys: string[] = Array.from(
    new Set<string>(
      data.flatMap((item: any) => Object.keys(flattenObject(item))),
    ),
  )

  // Handle empty objects (no keys)
  if (keys.length === 0) {
    return ''
  }

  // Create header row
  const rows: string[] = [keys.map(escapeCSV).join(',')]

  // Create data rows
  for (const item of data) {
    const flat = flattenObject(item)
    const values = keys.map((key) => {
      const value = flat[key]
      // Handle null, undefined, or missing values as empty
      if (value === null || value === undefined) {
        return ''
      }
      return escapeCSV(String(value))
    })
    rows.push(values.join(','))
  }

  return rows.join('\n')
}

/**
 * Export to XML
 */
function exportXML(data: any, options: ExportOptions): string {
  const indent = options.pretty ? 2 : 0
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'

  function toXML(obj: any, name: string, level: number = 0): string {
    const spacing = ' '.repeat(level * indent)
    const _nextSpacing = ' '.repeat((level + 1) * indent)

    if (Array.isArray(obj)) {
      const items = obj.map(item => toXML(item, 'item', level + 1)).join('\n')
      return `${spacing}<${name}>\n${items}\n${spacing}</${name}>`
    }

    if (typeof obj === 'object' && obj !== null) {
      const properties = Object.entries(obj)
        .map(([key, value]) => toXML(value, key, level + 1))
        .join('\n')

      if (properties) {
        return `${spacing}<${name}>\n${properties}\n${spacing}</${name}>`
      }
      return `${spacing}<${name} />`
    }

    const escaped = escapeXML(String(obj))
    return `${spacing}<${name}>${escaped}</${name}>`
  }

  return declaration + toXML(data, 'root')
}

/**
 * Export to YAML
 */
function exportYAML(data: any, _options: ExportOptions): string {
  function toYAML(obj: any, level: number = 0): string {
    const indent = '  '.repeat(level)

    if (obj === null || obj === undefined) {
      return 'null'
    }

    if (typeof obj === 'string') {
      // Check if string needs quoting
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
        return `"${obj.replace(/"/g, '\\"')}"`
      }
      return obj
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj)
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return '[]'
      }

      return obj
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            const yaml = toYAML(item, level + 1)
            // Filter out empty lines from the split
            const lines = yaml.split('\n').filter(line => line.length > 0)
            if (lines.length === 0) {
              return `\n${indent}- {}`
            }
            // First line goes right after the dash, rest are indented with 2 spaces
            const first = lines[0].trim()
            if (lines.length === 1) {
              return `\n${indent}- ${first}`
            }
            const rest = lines.slice(1).map(line => `${indent}  ${line.trim()}`).join('\n')
            return `\n${indent}- ${first}\n${rest}`
          }
          return `\n${indent}- ${toYAML(item, level + 1)}`
        })
        .join('')
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj)
      if (entries.length === 0) {
        return '{}'
      }

      return entries
        .map(([key, value]) => {
          const yamlValue = toYAML(value, level + 1)
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `\n${indent}${key}:${yamlValue}`
          }
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            return `\n${indent}${key}:${yamlValue}`
          }
          return `\n${indent}${key}: ${yamlValue}`
        })
        .join('')
    }

    return String(obj)
  }

  const yaml = toYAML(data)
  return yaml.startsWith('\n') ? yaml.slice(1) : yaml
}

/**
 * Export to Markdown
 */
function exportMarkdown(data: any, _options: ExportOptions): string {
  // Handle single object
  if (!Array.isArray(data)) {
    data = [data]
  }

  if (data.length === 0) {
    return '# No Data\n'
  }

  // Get all unique keys
  const keys: string[] = Array.from(
    new Set<string>(
      data.flatMap((item: any) => Object.keys(flattenObject(item))),
    ),
  )

  // Create table header
  const header = `| ${keys.join(' | ')} |`
  const separator = `| ${keys.map(() => '---').join(' | ')} |`

  // Create table rows
  const rows = data.map((item: any) => {
    const flat = flattenObject(item)
    const values = keys.map((key) => {
      const value = flat[key]
      return value !== undefined ? escapeMarkdown(String(value)) : ''
    })
    return `| ${values.join(' | ')} |`
  })

  return `${header}\n${separator}\n${rows.join('\n')}\n`
}

/**
 * Export to HTML
 */
function exportHTML(data: any, _options: ExportOptions): string {
  // Handle single object
  if (!Array.isArray(data)) {
    data = [data]
  }

  if (data.length === 0) {
    return '<p>No data</p>'
  }

  // Get all unique keys
  const keys: string[] = Array.from(
    new Set<string>(
      data.flatMap((item: any) => Object.keys(flattenObject(item))),
    ),
  )

  // Create table
  const thead = `<thead><tr>${keys.map(k => `<th>${escapeHTML(k)}</th>`).join('')}</tr></thead>`

  const tbody = data.map((item: any) => {
    const flat = flattenObject(item)
    const cells = keys.map((key) => {
      const value = flat[key]
      return `<td>${value !== undefined ? escapeHTML(String(value)) : ''}</td>`
    })
    return `<tr>${cells.join('')}</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Data Export</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Data Export</h1>
  <table>
    ${thead}
    <tbody>${tbody}</tbody>
  </table>
</body>
</html>`
}

/**
 * Flatten nested object for tabular export
 */
function flattenObject(obj: any, prefix: string = ''): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey))
    }
    else if (Array.isArray(value)) {
      result[newKey] = value.join(', ')
    }
    else {
      result[newKey] = value
    }
  }

  return result
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Escape XML value
 */
function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Escape HTML value
 */
function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escape Markdown value
 */
function escapeMarkdown(value: string): string {
  return value
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br>')
}

/**
 * Save export to file
 */
export async function saveExport(
  data: any,
  filepath: string,
  options: Omit<ExportOptions, 'format'> & { format?: ExportFormat } = {},
): Promise<void> {
  // Infer format from file extension if not provided
  let format = options.format
  if (!format) {
    const ext = filepath.split('.').pop()?.toLowerCase()
    if (ext && ['json', 'csv', 'xml', 'yaml', 'yml', 'md', 'markdown', 'html'].includes(ext)) {
      format = ext === 'yml' ? 'yaml' : ext === 'md' ? 'markdown' : ext as ExportFormat
    }
    else {
      format = 'json'
    }
  }

  const content = exportData(data, { ...options, format })
  await Bun.write(filepath, content)
}

/**
 * Create an exporter function
 */
export function createExporter(defaultOptions: Partial<ExportOptions> = {}): (data: any, options?: Partial<ExportOptions>) => string {
  return (data: any, options?: Partial<ExportOptions>) => {
    const merged = { ...defaultOptions, ...options, format: options?.format || defaultOptions.format || 'json' }
    return exportData(data, merged as ExportOptions)
  }
}
