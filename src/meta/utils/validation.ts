/**
 * Image and content validation utilities
 */

import type { ImageValidationResult } from '../types'

/**
 * Validate an image URL by checking accessibility and metadata
 */
export async function validateImage(
  imageUrl: string,
  options: {
    timeout?: number
    checkDimensions?: boolean
    expectedWidth?: number
    expectedHeight?: number
  } = {},
): Promise<ImageValidationResult> {
  const { timeout = 5000 } = options

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // HEAD request to check if image is accessible
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result: ImageValidationResult = {
        accessible: response.ok,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || undefined,
        fileSize: Number.parseInt(response.headers.get('content-length') || '0', 10) || undefined,
      }

      return result
    }
    finally {
      clearTimeout(timeoutId)
    }
  }
  catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
