/**
 * Custom Extraction Pipelines
 *
 * Composable data extraction and transformation pipelines
 * Uses ONLY Bun native APIs - no external dependencies!
 */

import type { Schema } from './validation'
import type { Document, HTMLElement } from './web-scraper'
import { sanitize, validate } from './validation'

export interface PipelineStep<TIn = any, TOut = any> {
  name: string
  execute: (input: TIn, context?: PipelineContext) => Promise<TOut> | TOut
  onError?: (error: Error, input: TIn) => TOut | Promise<TOut>
}

export interface PipelineContext {
  url?: string
  metadata?: Record<string, any>
  cache?: Map<string, any>
}

export interface PipelineResult<T = any> {
  success: boolean
  data?: T
  errors: Array<{
    step: string
    error: Error
    recoverable: boolean
  }>
  metadata: {
    duration: number
    stepsExecuted: number
    stepResults: Array<{ step: string, duration: number }>
  }
}

/**
 * Pipeline for composing extraction steps
 */
export class ExtractionPipeline<TIn = any, TOut = any> {
  private steps: Array<PipelineStep<any, any>> = []

  constructor(private options: {
    continueOnError?: boolean
    timeout?: number
  } = {}) {}

  /**
   * Add a step to the pipeline
   */
  step<TStepOut>(step: PipelineStep<TOut, TStepOut>): ExtractionPipeline<TIn, TStepOut> {
    this.steps.push(step)
    return this as any
  }

  /**
   * Add a transformation step
   */
  transform<TStepOut>(
    name: string,
    fn: (input: TOut) => TStepOut | Promise<TStepOut>,
  ): ExtractionPipeline<TIn, TStepOut> {
    return this.step({
      name,
      execute: fn,
    })
  }

  /**
   * Add a filter step
   */
  filter(
    name: string,
    predicate: (input: TOut) => boolean | Promise<boolean>,
  ): ExtractionPipeline<TIn, TOut> {
    return this.step({
      name,
      execute: async (input: TOut) => {
        const shouldKeep = await predicate(input)
        if (!shouldKeep) {
          throw new Error('Filtered out by predicate')
        }
        return input
      },
    })
  }

  /**
   * Add a validation step
   */
  validate(name: string, schema: Schema): ExtractionPipeline<TIn, TOut> {
    return this.step({
      name,
      execute: (input: any) => {
        const result = validate(input, schema)
        if (!result.valid) {
          const messages = result.errors.map(e => e.message).join('; ')
          throw new Error(`Validation failed: ${messages}`)
        }
        return result.data
      },
    })
  }

  /**
   * Add a sanitization step
   */
  sanitize(
    name: string,
    options?: Parameters<typeof sanitize>[1],
  ): ExtractionPipeline<TIn, TOut> {
    return this.step({
      name,
      execute: (input: any) => sanitize(input, options),
    })
  }

  /**
   * Add a mapping step for arrays
   */
  map<TItem, TItemOut>(
    name: string,
    fn: (item: TItem, index: number) => TItemOut | Promise<TItemOut>,
  ): ExtractionPipeline<TIn, TItemOut[]> {
    return this.step({
      name,
      execute: async (input: TItem[]) => {
        if (!Array.isArray(input)) {
          throw new TypeError('Input must be an array')
        }
        return Promise.all(input.map((item, index) => fn(item, index)))
      },
    }) as any
  }

  /**
   * Add a flat map step
   */
  flatMap<TItem, TItemOut>(
    name: string,
    fn: (item: TItem, index: number) => TItemOut[] | Promise<TItemOut[]>,
  ): ExtractionPipeline<TIn, TItemOut[]> {
    return this.step({
      name,
      execute: async (input: TItem[]) => {
        if (!Array.isArray(input)) {
          throw new TypeError('Input must be an array')
        }
        const results = await Promise.all(input.map((item, index) => fn(item, index)))
        return results.flat()
      },
    }) as any
  }

  /**
   * Add a grouping step
   */
  groupBy<TItem>(
    name: string,
    keyFn: (item: TItem) => string,
  ): ExtractionPipeline<TIn, Record<string, TItem[]>> {
    return this.step({
      name,
      execute: (input: TItem[]) => {
        if (!Array.isArray(input)) {
          throw new TypeError('Input must be an array')
        }

        const groups: Record<string, TItem[]> = {}
        for (const item of input) {
          const key = keyFn(item)
          if (!groups[key]) {
            groups[key] = []
          }
          groups[key].push(item)
        }
        return groups
      },
    }) as any
  }

  /**
   * Add a deduplication step
   */
  unique<TItem>(
    name: string,
    keyFn?: (item: TItem) => string,
  ): ExtractionPipeline<TIn, TItem[]> {
    return this.step({
      name,
      execute: (input: TItem[]) => {
        if (!Array.isArray(input)) {
          throw new TypeError('Input must be an array')
        }

        if (keyFn) {
          const seen = new Set<string>()
          return input.filter((item) => {
            const key = keyFn(item)
            if (seen.has(key)) {
              return false
            }
            seen.add(key)
            return true
          })
        }

        return Array.from(new Set(input))
      },
    }) as any
  }

  /**
   * Add a sorting step
   */
  sort<TItem>(
    name: string,
    compareFn: (a: TItem, b: TItem) => number,
  ): ExtractionPipeline<TIn, TItem[]> {
    return this.step({
      name,
      execute: (input: TItem[]) => {
        if (!Array.isArray(input)) {
          throw new TypeError('Input must be an array')
        }
        return [...input].sort(compareFn)
      },
    }) as any
  }

  /**
   * Add a limiting step
   */
  limit(name: string, count: number): ExtractionPipeline<TIn, TOut> {
    return this.step({
      name,
      execute: (input: any[]) => {
        if (!Array.isArray(input)) {
          throw new TypeError('Input must be an array')
        }
        return input.slice(0, count)
      },
    })
  }

  /**
   * Execute the pipeline
   */
  async execute(input: TIn, context?: PipelineContext): Promise<PipelineResult<TOut>> {
    const startTime = performance.now()
    const errors: PipelineResult['errors'] = []
    const stepResults: Array<{ step: string, duration: number }> = []

    let currentValue: any = input
    let stepsExecuted = 0

    const pipelineContext = {
      ...context,
      cache: context?.cache || new Map(),
    }

    for (const step of this.steps) {
      const stepStartTime = performance.now()

      try {
        // Apply timeout if configured
        if (this.options.timeout) {
          currentValue = await Promise.race([
            step.execute(currentValue, pipelineContext),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Step timeout')), this.options.timeout),
            ),
          ])
        }
        else {
          currentValue = await step.execute(currentValue, pipelineContext)
        }

        stepsExecuted++
        stepResults.push({
          step: step.name,
          duration: performance.now() - stepStartTime,
        })
      }
      catch (error) {
        const err = error as Error

        // Try error handler if available
        if (step.onError) {
          try {
            currentValue = await step.onError(err, currentValue)
            stepsExecuted++
            stepResults.push({
              step: `${step.name} (error recovery)`,
              duration: performance.now() - stepStartTime,
            })
            continue
          }
          catch (recoveryError) {
            // Error handler failed
          }
        }

        errors.push({
          step: step.name,
          error: err,
          recoverable: !!step.onError,
        })

        if (!this.options.continueOnError) {
          return {
            success: false,
            errors,
            metadata: {
              duration: performance.now() - startTime,
              stepsExecuted,
              stepResults,
            },
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      data: currentValue as TOut,
      errors,
      metadata: {
        duration: performance.now() - startTime,
        stepsExecuted,
        stepResults,
      },
    }
  }

  /**
   * Create a reusable pipeline function
   */
  build(): (input: TIn, context?: PipelineContext) => Promise<PipelineResult<TOut>> {
    return (input, context) => this.execute(input, context)
  }
}

/**
 * Built-in extractors for common patterns
 */
export const extractors = {
  /**
   * Extract text from elements
   */
  text: (selector: string) => ({
    name: `extract-text:${selector}`,
    execute: (doc: Document) => {
      const elements = doc.querySelectorAll(selector)
      return elements.map(el => el.textContent?.trim() || '')
    },
  }),

  /**
   * Extract attributes from elements
   */
  attr: (selector: string, attribute: string) => ({
    name: `extract-attr:${selector}@${attribute}`,
    execute: (doc: Document) => {
      const elements = doc.querySelectorAll(selector)
      return elements.map(el => el.getAttribute(attribute) || '')
    },
  }),

  /**
   * Extract links
   */
  links: (selector: string = 'a[href]') => ({
    name: `extract-links:${selector}`,
    execute: (doc: Document) => {
      const elements = doc.querySelectorAll(selector) as HTMLElement[]
      return elements
        .map(el => el.getAttribute('href'))
        .filter(Boolean) as string[]
    },
  }),

  /**
   * Extract images
   */
  images: (selector: string = 'img[src]') => ({
    name: `extract-images:${selector}`,
    execute: (doc: Document) => {
      const elements = doc.querySelectorAll(selector) as HTMLElement[]
      return elements.map((el) => {
        const src = el.getAttribute('src')
        const alt = el.getAttribute('alt')
        const title = el.getAttribute('title')
        return { src, alt, title }
      })
    },
  }),

  /**
   * Extract structured data
   */
  structured: (selector: string, schema: Record<string, string>) => ({
    name: `extract-structured:${selector}`,
    execute: (doc: Document) => {
      const elements = doc.querySelectorAll(selector)
      return elements.map((el) => {
        const result: Record<string, any> = {}
        for (const [key, subSelector] of Object.entries(schema)) {
          const subEl = el.querySelector(subSelector)
          result[key] = subEl?.textContent?.trim() || null
        }
        return result
      }).filter((result) => {
        // Filter out results where all values are null/undefined/empty
        // This handles parser bugs and genuinely empty elements
        return Object.values(result).some(value => value !== null && value !== undefined && value !== '')
      })
    },
  }),

  /**
   * Extract JSON-LD structured data
   */
  jsonLd: () => ({
    name: 'extract-json-ld',
    execute: (doc: Document) => {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
      return scripts.map((script) => {
        try {
          return JSON.parse(script.textContent || '{}')
        }
        catch {
          return null
        }
      }).filter(Boolean)
    },
  }),
}

/**
 * Quick helper to create a pipeline
 */
export function pipeline<TIn = any, TOut = any>(
  options?: ConstructorParameters<typeof ExtractionPipeline>[0],
): ExtractionPipeline<TIn, TOut> {
  return new ExtractionPipeline<TIn, TOut>(options)
}
