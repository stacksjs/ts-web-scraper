/**
 * Contact information extraction
 */

export interface ContactInformation {
  /**
   * Email addresses found
   */
  emails: ContactEmail[]

  /**
   * Phone numbers found
   */
  phones: ContactPhone[]

  /**
   * Physical addresses found
   */
  addresses: string[]

  /**
   * Social media profiles
   */
  social: {
    platform: string
    url: string
    handle?: string
  }[]

  /**
   * Contact forms detected
   */
  contactForms: ContactForm[]
}

export interface ContactEmail {
  email: string
  type?: 'general' | 'support' | 'sales' | 'info' | 'press'
  context?: string // Surrounding text
}

export interface ContactPhone {
  number: string
  type?: 'mobile' | 'landline' | 'fax' | 'toll-free'
  country?: string
  formatted?: string
}

export interface ContactForm {
  action?: string
  method: string
  fields: string[]
}

/**
 * Extract all contact information from HTML
 */
export function extractContactInfo(html: string): ContactInformation {
  const emails = extractEmails(html)
  const phones = extractPhones(html)
  const addresses = extractAddresses(html)
  const social = extractSocialProfiles(html)
  const contactForms = extractContactForms(html)

  return {
    emails,
    phones,
    addresses,
    social,
    contactForms,
  }
}

/**
 * Extract email addresses with context
 */
function extractEmails(html: string): ContactEmail[] {
  const emails: ContactEmail[] = []
  const seen = new Set<string>()

  // Remove scripts and styles
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Find email addresses
  const emailRegex = /\b[\w.%+-]+@[A-Z0-9.-]+\.[A-Z|]{2,}\b/gi
  const matches = cleaned.matchAll(emailRegex)

  for (const match of matches) {
    const email = match[0].toLowerCase()
    if (seen.has(email))
      continue

    seen.add(email)

    // Determine type based on prefix
    let type: ContactEmail['type']
    if (email.startsWith('support@') || email.includes('support'))
      type = 'support'
    else if (email.startsWith('sales@') || email.includes('sales'))
      type = 'sales'
    else if (email.startsWith('info@'))
      type = 'info'
    else if (email.startsWith('press@') || email.includes('press'))
      type = 'press'
    else
      type = 'general'

    // Get surrounding context
    const index = match.index || 0
    const context = cleaned.substring(Math.max(0, index - 50), index + 50)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    emails.push({ email, type, context })
  }

  return emails
}

/**
 * Extract phone numbers
 */
function extractPhones(html: string): ContactPhone[] {
  const phones: ContactPhone[] = []
  const seen = new Set<string>()

  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Various phone number patterns
  const patterns = [
    // US/Canada: +1 (555) 123-4567
    /\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    // International: +44 20 1234 5678
    /\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,4}/g,
    // Simple: 555-123-4567
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ]

  for (const pattern of patterns) {
    const matches = cleaned.matchAll(pattern)
    for (const match of matches) {
      const number = match[0]
      const normalized = number.replace(/\D/g, '')

      if (normalized.length < 7 || seen.has(normalized))
        continue

      seen.add(normalized)

      // Determine type
      let type: ContactPhone['type']
      if (number.includes('800') || number.includes('888') || number.includes('877'))
        type = 'toll-free'
      else if (number.startsWith('+'))
        type = 'landline'
      else
        type = 'landline'

      phones.push({
        number,
        type,
        formatted: number,
      })
    }
  }

  return phones
}

/**
 * Extract physical addresses
 */
function extractAddresses(html: string): string[] {
  const addresses: string[] = []

  // Look for schema.org PostalAddress
  const schemaRegex = /"@type"\s*:\s*"PostalAddress"[\s\S]*?"streetAddress"\s*:\s*"([^"]+)"[\s\S]*?"addressLocality"\s*:\s*"([^"]+)"[\s\S]*?"addressRegion"\s*:\s*"([^"]+)"[\s\S]*?"postalCode"\s*:\s*"([^"]+)"/g

  let match = schemaRegex.exec(html)
  while (match) {
    const [, street, city, region, postal] = match
    addresses.push(`${street}, ${city}, ${region} ${postal}`)
    match = schemaRegex.exec(html)
  }

  // Look for address elements
  const addressRegex = /<address[^>]*>([\s\S]*?)<\/address>/gi
  let addressMatch = addressRegex.exec(html)
  while (addressMatch) {
    const content = addressMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (content.length > 10) {
      addresses.push(content)
    }
    addressMatch = addressRegex.exec(html)
  }

  return addresses
}

/**
 * Extract social media profiles
 */
function extractSocialProfiles(html: string): ContactInformation['social'] {
  const profiles: ContactInformation['social'] = []
  const seen = new Set<string>()

  const patterns = [
    { platform: 'twitter', regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/(\w+)/gi },
    { platform: 'facebook', regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([\w.]+)/gi },
    { platform: 'instagram', regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([\w.]+)/gi },
    { platform: 'linkedin', regex: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-z0-9-]+)/gi },
    { platform: 'youtube', regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/)?([\w-]+)/gi },
    { platform: 'github', regex: /(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+)/gi },
  ]

  for (const { platform, regex } of patterns) {
    const matches = html.matchAll(regex)
    for (const match of matches) {
      const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`
      if (seen.has(url))
        continue

      seen.add(url)
      profiles.push({
        platform,
        url,
        handle: match[1],
      })
    }
  }

  return profiles
}

/**
 * Extract contact forms
 */
function extractContactForms(html: string): ContactForm[] {
  const forms: ContactForm[] = []

  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi
  let match = formRegex.exec(html)

  while (match) {
    const formHtml = match[0]
    const formContent = match[1]

    // Extract action
    const actionMatch = formHtml.match(/action=["']([^"']+)["']/)
    const action = actionMatch ? actionMatch[1] : undefined

    // Extract method
    const methodMatch = formHtml.match(/method=["']([^"']+)["']/)
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET'

    // Extract field names
    const fields: string[] = []
    const inputRegex = /<input[^>]+name=["']([^"']+)["']/gi
    let inputMatch = inputRegex.exec(formContent)
    while (inputMatch) {
      fields.push(inputMatch[1])
      inputMatch = inputRegex.exec(formContent)
    }

    const textareaRegex = /<textarea[^>]+name=["']([^"']+)["']/gi
    let textareaMatch = textareaRegex.exec(formContent)
    while (textareaMatch) {
      fields.push(textareaMatch[1])
      textareaMatch = textareaRegex.exec(formContent)
    }

    // Only include forms that look like contact forms
    if (
      fields.some(f => /email|contact|message|subject|name/i.test(f))
      || action?.includes('contact')
    ) {
      forms.push({ action, method, fields })
    }

    match = formRegex.exec(html)
  }

  return forms
}
