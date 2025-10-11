#!/usr/bin/env bun

import process from 'node:process'
import { CLI } from '@stacksjs/clapp'
import { version } from '../package.json'
import { config, defaultConfig } from '../src/config'
import {
  extractData,
  extractLinks,
  extractMeta,
  extractStructuredData,
  extractText,
  isClientSideRendered,
  scrapeClientSide,
} from '../src/index'

const cli = new CLI('scraper')

interface ScrapeOptions {
  timeout?: number
  userAgent?: string
  maxJsFiles?: number
  analyzeJs?: boolean
  findData?: boolean
  reconstructApi?: boolean
  output?: string
  format?: 'json' | 'text'
  verbose?: boolean
}

interface DetectOptions {
  timeout?: number
  verbose?: boolean
}

interface ExtractOptions {
  timeout?: number
  type?: 'text' | 'links' | 'meta' | 'structured' | 'all'
  baseUrl?: string
  output?: string
  verbose?: boolean
}

interface BatchOptions {
  concurrency?: number
  timeout?: number
  output?: string
  verbose?: boolean
}

/**
 * Scrape command - Full client-side scraping with JS analysis
 */
cli
  .command('scrape <url>', 'Scrape a website (static or client-side rendered)')
  .option('--timeout <timeout>', 'Request timeout in milliseconds', { default: config.timeout })
  .option('--user-agent <userAgent>', 'Custom user agent', { default: config.userAgent })
  .option('--max-js-files <maxJsFiles>', 'Maximum JS files to analyze', { default: config.maxJSFiles })
  .option('--no-analyze-js', 'Disable JavaScript analysis')
  .option('--no-find-data', 'Disable embedded data extraction')
  .option('--no-reconstruct-api', 'Disable API reconstruction')
  .option('--output <output>', 'Output file path (defaults to stdout)')
  .option('--format <format>', 'Output format: json or text', { default: 'json' })
  .option('--verbose', 'Enable verbose logging', { default: config.verbose })
  .example('scraper scrape https://example.com')
  .example('scraper scrape https://pkgx.dev/pkgs/nodejs.org/ --max-js-files 2')
  .example('scraper scrape https://example.com --output result.json')
  .action(async (url: string, options?: ScrapeOptions) => {
    try {
      if (options?.verbose)
        console.log(`Scraping ${url}...`)

      const result = await scrapeClientSide(url, {
        timeout: options?.timeout,
        userAgent: options?.userAgent,
        maxJSFiles: options?.maxJsFiles,
        analyzeJavaScript: options?.analyzeJs !== false,
        findEmbeddedData: options?.findData !== false,
        reconstructAPI: options?.reconstructApi !== false,
      })

      if (options?.format === 'text') {
        console.log(`Title: ${result.meta.title || 'N/A'}`)
        console.log(`Description: ${result.meta.description || 'N/A'}`)
        console.log(`Scripts: ${result.scriptUrls.length}`)
        console.log(`API Endpoints: ${result.apiEndpoints.length}`)
        console.log(`API Responses: ${result.apiResponses.size}`)

        if (options?.verbose) {
          console.log('\nAPI Endpoints:')
          result.apiEndpoints.slice(0, 10).forEach((ep, i) => {
            console.log(`  ${i + 1}. ${ep}`)
          })
        }
      }
      else {
        const output = {
          url,
          meta: result.meta,
          scriptUrls: result.scriptUrls,
          apiEndpoints: result.apiEndpoints,
          embeddedData: result.embeddedData,
          apiResponses: Array.from(result.apiResponses.entries()).map(([endpoint, data]) => ({
            endpoint,
            data,
          })),
        }

        const json = JSON.stringify(output, null, 2)

        if (options?.output) {
          await Bun.write(options.output, json)
          if (options?.verbose)
            console.log(`Results saved to ${options.output}`)
        }
        else {
          console.log(json)
        }
      }
    }
    catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * Detect command - Check if site is client-side rendered
 */
cli
  .command('detect <url>', 'Detect if a website is client-side rendered')
  .option('--timeout <timeout>', 'Request timeout in milliseconds', { default: config.timeout })
  .option('--verbose', 'Enable verbose logging', { default: config.verbose })
  .example('scraper detect https://pkgx.dev')
  .example('scraper detect https://example.com')
  .action(async (url: string, options?: DetectOptions) => {
    try {
      if (options?.verbose)
        console.log(`Detecting rendering type for ${url}...`)

      const isCSR = await isClientSideRendered(url)

      console.log(`${url}`)
      console.log(`  Rendering: ${isCSR ? 'Client-side (React/Vue/Next.js)' : 'Static HTML'}`)

      process.exit(isCSR ? 0 : 1)
    }
    catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
      process.exit(2)
    }
  })

/**
 * Extract command - Extract specific data from a page
 */
cli
  .command('extract <url>', 'Extract data from a website')
  .option('--timeout <timeout>', 'Request timeout in milliseconds', { default: config.timeout })
  .option('--type <type>', 'Type to extract: text, links, meta, structured, all', { default: 'all' })
  .option('--base-url <baseUrl>', 'Base URL for resolving relative links')
  .option('--output <output>', 'Output file path (defaults to stdout)')
  .option('--verbose', 'Enable verbose logging', { default: config.verbose })
  .example('scraper extract https://example.com --type text')
  .example('scraper extract https://example.com --type links --base-url https://example.com')
  .example('scraper extract https://example.com --type meta')
  .action(async (url: string, options?: ExtractOptions) => {
    try {
      if (options?.verbose)
        console.log(`Extracting ${options?.type || 'all'} from ${url}...`)

      const response = await fetch(url)
      const html = await response.text()

      let result: any

      switch (options?.type) {
        case 'text':
          result = extractText(html)
          break
        case 'links':
          result = extractLinks(html, options?.baseUrl || url)
          break
        case 'meta':
          result = extractMeta(html)
          break
        case 'structured':
          result = extractStructuredData(html)
          break
        case 'all':
        default:
          result = {
            text: `${extractText(html).slice(0, 500)}...`,
            links: extractLinks(html, options?.baseUrl || url),
            meta: extractMeta(html),
            structured: extractStructuredData(html),
          }
      }

      const output = typeof result === 'string' ? result : JSON.stringify(result, null, 2)

      if (options?.output) {
        await Bun.write(options.output, output)
        if (options?.verbose)
          console.log(`Results saved to ${options.output}`)
      }
      else {
        console.log(output)
      }
    }
    catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * Data command - Automatically extract data from client-side rendered pages
 */
cli
  .command('data <url>', 'Automatically extract data from a page')
  .option('--timeout <timeout>', 'Request timeout in milliseconds', { default: config.timeout })
  .option('--output <output>', 'Output file path (defaults to stdout)')
  .option('--verbose', 'Enable verbose logging', { default: config.verbose })
  .example('scraper data https://pkgx.dev/pkgs/nodejs.org/')
  .example('scraper data https://example.com --output data.json')
  .action(async (url: string, options?: ScrapeOptions) => {
    try {
      if (options?.verbose)
        console.log(`Extracting data from ${url}...`)

      const data = await extractData(url, {
        timeout: options?.timeout,
      })

      const json = JSON.stringify(data, null, 2)

      if (options?.output) {
        await Bun.write(options.output, json)
        if (options?.verbose)
          console.log(`Data saved to ${options.output}`)
      }
      else {
        console.log(json)
      }
    }
    catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * Batch command - Scrape multiple URLs from a file
 */
cli
  .command('batch <file>', 'Scrape multiple URLs from a file (one URL per line)')
  .option('--concurrency <concurrency>', 'Number of concurrent requests', { default: 3 })
  .option('--timeout <timeout>', 'Request timeout in milliseconds', { default: config.timeout })
  .option('--output <output>', 'Output directory for results', { default: './scraped' })
  .option('--verbose', 'Enable verbose logging', { default: config.verbose })
  .example('scraper batch urls.txt')
  .example('scraper batch urls.txt --concurrency 5 --output ./results')
  .action(async (file: string, options?: BatchOptions) => {
    try {
      // Read URLs from file
      const content = await Bun.file(file).text()
      const urls = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))

      if (urls.length === 0) {
        console.error('No URLs found in file')
        process.exit(1)
      }

      if (options?.verbose)
        console.log(`Scraping ${urls.length} URLs with concurrency ${options?.concurrency}...`)

      // Create output directory
      const outputDir = options?.output || './scraped'
      await Bun.write(`${outputDir}/.gitkeep`, '')

      // Process URLs in batches
      const concurrency = options?.concurrency || 3
      const results: any[] = []

      for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency)
        const batchPromises = batch.map(async (url, idx) => {
          try {
            if (options?.verbose)
              console.log(`[${i + idx + 1}/${urls.length}] Scraping ${url}...`)

            const data = await extractData(url, {
              timeout: options?.timeout,
            })

            const filename = `${outputDir}/${i + idx + 1}.json`
            await Bun.write(filename, JSON.stringify({ url, data }, null, 2))

            return { url, success: true, data }
          }
          catch (error) {
            console.error(`Failed to scrape ${url}:`, error)
            return { url, success: false, error: error instanceof Error ? error.message : String(error) }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      // Save summary
      const summary = {
        total: urls.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }

      await Bun.write(`${outputDir}/summary.json`, JSON.stringify(summary, null, 2))

      console.log(`\nCompleted: ${summary.successful}/${summary.total} successful`)
      console.log(`Results saved to ${outputDir}`)
    }
    catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * Config command - Show configuration
 */
cli
  .command('config', 'Show current configuration')
  .example('scraper config')
  .action(() => {
    console.log('Current Configuration:')
    console.log(JSON.stringify(config, null, 2))
    console.log('\nDefault Configuration:')
    console.log(JSON.stringify(defaultConfig, null, 2))
  })

/**
 * Version command
 */
cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(`v${version}`)
})

cli.version(version)
cli.help()
cli.parse()
