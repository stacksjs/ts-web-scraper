/**
 * Enhanced social media detection and extraction
 */

export interface SocialMediaLinks {
  /**
   * Social media profiles found
   */
  profiles: {
    platform: string
    url: string
    handle?: string
  }[]

  /**
   * Share buttons detected
   */
  shareButtons: string[]

  /**
   * Social engagement indicators
   */
  engagement?: {
    likes?: number
    shares?: number
    comments?: number
  }
}

/**
 * Extract social media links and profiles
 */
export function extractSocialMedia(html: string): SocialMediaLinks {
  const profiles: SocialMediaLinks['profiles'] = []
  const shareButtons: string[] = []

  // Social media patterns
  const patterns = [
    {
      platform: 'twitter',
      regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/(\w+)/gi,
    },
    {
      platform: 'facebook',
      regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([\w.]+)/gi,
    },
    {
      platform: 'instagram',
      regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([\w.]+)/gi,
    },
    {
      platform: 'linkedin',
      regex: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-z0-9-]+)/gi,
    },
    {
      platform: 'youtube',
      regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/)?([\w-]+)/gi,
    },
    {
      platform: 'github',
      regex: /(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+)/gi,
    },
    {
      platform: 'tiktok',
      regex: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([\w.]+)/gi,
    },
    {
      platform: 'pinterest',
      regex: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/(\w+)/gi,
    },
  ]

  // Extract profiles
  for (const { platform, regex } of patterns) {
    const matches = [...html.matchAll(regex)]
    const seen = new Set<string>()

    for (const match of matches) {
      const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`
      if (!seen.has(url)) {
        seen.add(url)
        profiles.push({
          platform,
          url,
          handle: match[1],
        })
      }
    }
  }

  // Detect share buttons
  if (html.match(/share on twitter|tweet this/i))
    shareButtons.push('twitter')
  if (html.match(/share on facebook|share to facebook/i))
    shareButtons.push('facebook')
  if (html.match(/share on linkedin/i))
    shareButtons.push('linkedin')
  if (html.match(/pin it|pin this/i))
    shareButtons.push('pinterest')
  if (html.match(/share on whatsapp/i))
    shareButtons.push('whatsapp')
  if (html.match(/share via email|email this/i))
    shareButtons.push('email')

  return {
    profiles,
    shareButtons,
  }
}
