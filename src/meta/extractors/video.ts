/**
 * Video platform detection and metadata extraction
 */

import type { OpenGraphBasic, VideoMetadata } from '../types'

/**
 * Extract video metadata from URL
 */
export function extractVideoMetadata(_videoUrl: string, _og?: OpenGraphBasic): VideoMetadata | undefined {
  if (!_videoUrl)
    return undefined

  const result: VideoMetadata = {
    url: _videoUrl,
  }

  // YouTube detection
  // eslint-disable-next-line quotes
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const youtubeMatch = _videoUrl.match(youtubeRegex)
  if (youtubeMatch) {
    result.platform = 'youtube'
    result.videoId = youtubeMatch[1]
    result.thumbnail = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
  }

  // Vimeo detection
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i
  const vimeoMatch = _videoUrl.match(vimeoRegex)
  if (vimeoMatch) {
    result.platform = 'vimeo'
    result.videoId = vimeoMatch[1]
  }

  // Dailymotion detection
  const dailymotionRegex = /dailymotion\.com\/video\/([^_]+)/i
  const dailymotionMatch = _videoUrl.match(dailymotionRegex)
  if (dailymotionMatch) {
    result.platform = 'dailymotion'
    result.videoId = dailymotionMatch[1]
  }

  // Get dimensions from OG data if available
  if (_og?.video && typeof _og.video === 'object' && !Array.isArray(_og.video)) {
    result.width = _og.video.width
    result.height = _og.video.height
  }

  return result
}
