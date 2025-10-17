/**
 * Video platform detection and metadata extraction
 */

import type { OpenGraphBasic, VideoMetadata } from '../types'

/**
 * Extract video metadata from URL
 */
export function extractVideoMetadata(videoUrl: string, og?: OpenGraphBasic): VideoMetadata | undefined {
  if (!videoUrl)
    return undefined

  const result: VideoMetadata = {
    url: videoUrl,
  }

  // YouTube detection
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const youtubeMatch = videoUrl.match(youtubeRegex)
  if (youtubeMatch) {
    result.platform = 'youtube'
    result.videoId = youtubeMatch[1]
    result.thumbnail = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
  }

  // Vimeo detection
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i
  const vimeoMatch = videoUrl.match(vimeoRegex)
  if (vimeoMatch) {
    result.platform = 'vimeo'
    result.videoId = vimeoMatch[1]
  }

  // Dailymotion detection
  const dailymotionRegex = /dailymotion\.com\/video\/([^_]+)/i
  const dailymotionMatch = videoUrl.match(dailymotionRegex)
  if (dailymotionMatch) {
    result.platform = 'dailymotion'
    result.videoId = dailymotionMatch[1]
  }

  // Get dimensions from OG data if available
  if (og?.video && typeof og.video === 'object' && !Array.isArray(og.video)) {
    result.width = og.video.width
    result.height = og.video.height
  }

  return result
}
