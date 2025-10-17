# Contact Information Extraction

Extract contact information from web pages including emails, phone numbers, addresses, social media profiles, and contact forms.

## Overview

The contact extractor automatically identifies and categorizes all contact information on a web page. It extracts emails with type detection (support, sales, info), phone numbers with formatting, physical addresses, social media profiles across major platforms, and detects contact forms. Perfect for building contact databases, lead generation, and business intelligence.

## Basic Usage

```typescript
import { extractContactInfo } from 'ts-web-scraper'

const html = await fetch('https://example.com/contact').then(r => r.text())
const contact = extractContactInfo(html)

console.log(`Emails: ${contact.emails.length}`)
console.log(`Phones: ${contact.phones.length}`)
console.log(`Social Profiles: ${contact.social.length}`)
console.log(`Contact Forms: ${contact.contactForms.length}`)
```

## Email Extraction

### Email Addresses with Types

Extract emails with automatic categorization:

```typescript
const { emails } = contact

emails.forEach((email) => {
  console.log(`${email.email} (${email.type})`)
  if (email.context) {
    console.log(`  Context: ${email.context}`)
  }
})

// Example output:
// support@example.com (support)
//   Context: For technical support, contact support@example.com
// sales@example.com (sales)
// info@example.com (info)
```

Email types:
- **support**: Support and help desk emails
- **sales**: Sales and business inquiries
- **info**: General information emails
- **press**: Media and press inquiries
- **general**: Other emails

### Email Categorization

Categorize emails for different purposes:

```typescript
const supportEmails = contact.emails.filter(e => e.type === 'support')
const salesEmails = contact.emails.filter(e => e.type === 'sales')

console.log('Support Contacts:', supportEmails.map(e => e.email))
console.log('Sales Contacts:', salesEmails.map(e => e.email))
```

### Context Information

Each email includes surrounding text for context:

```typescript
contact.emails.forEach((email) => {
  console.log(`Email: ${email.email}`)
  console.log(`Type: ${email.type}`)
  console.log(`Context: ${email.context}`)
  console.log()
})
```

This helps understand:
- Purpose of the email address
- Department or person
- Hours of availability
- Preferred contact method

## Phone Number Extraction

### Phone Numbers with Formatting

Extract phone numbers in various formats:

```typescript
const { phones } = contact

phones.forEach((phone) => {
  console.log(`${phone.formatted} (${phone.type})`)
  if (phone.country) {
    console.log(`  Country: ${phone.country}`)
  }
})

// Example output:
// +1 (555) 123-4567 (landline)
// 1-800-555-0123 (toll-free)
// +44 20 1234 5678 (landline)
```

Phone types:
- **mobile**: Mobile phone numbers
- **landline**: Landline/office numbers
- **toll-free**: Toll-free numbers (800, 888, 877)
- **fax**: Fax numbers (if identifiable)

### Supported Formats

The extractor recognizes multiple phone number formats:

```typescript
// US/Canada formats:
// - +1 (555) 123-4567
// - (555) 123-4567
// - 555-123-4567
// - 555.123.4567
// - 1-800-555-0123

// International formats:
// - +44 20 1234 5678
// - +33 1 23 45 67 89
// - +49 30 12345678
```

### Toll-Free Detection

Automatically identifies toll-free numbers:

```typescript
const tollFree = contact.phones.filter(p => p.type === 'toll-free')

if (tollFree.length > 0) {
  console.log('Toll-Free Numbers:')
  tollFree.forEach((phone) => {
    console.log(`  ${phone.formatted}`)
  })
}
```

## Physical Address Extraction

### Address Detection

Extract physical addresses from multiple sources:

```typescript
const { addresses } = contact

if (addresses.length > 0) {
  console.log('Physical Addresses:')
  addresses.forEach((address, i) => {
    console.log(`${i + 1}. ${address}`)
  })
}

// Example output:
// 1. 123 Main Street, San Francisco, CA 94102
// 2. 456 Market St, Suite 100, San Francisco, CA 94105
```

Address sources:
- Schema.org PostalAddress structured data
- `<address>` HTML elements
- Pattern matching (future enhancement)

### Structured Address Data

When available, addresses include structured components:

```typescript
// From Schema.org PostalAddress:
// - Street address
// - City (locality)
// - State/region
// - Postal code
// - Country (if specified)
```

## Social Media Profiles

### Multi-Platform Detection

Automatically detect social media profiles:

```typescript
const { social } = contact

console.log('Social Media Profiles:')
social.forEach((profile) => {
  console.log(`${profile.platform}: ${profile.url}`)
  if (profile.handle) {
    console.log(`  Handle: @${profile.handle}`)
  }
})

// Example output:
// twitter: https://twitter.com/example
//   Handle: @example
// facebook: https://facebook.com/example
// linkedin: https://linkedin.com/company/example
// instagram: https://instagram.com/example
```

Supported platforms:
- **Twitter/X**: twitter.com or x.com URLs
- **Facebook**: Personal profiles and pages
- **Instagram**: User profiles
- **LinkedIn**: Personal profiles and company pages
- **YouTube**: Channels and users
- **GitHub**: User and organization profiles

### Platform Filtering

Filter profiles by platform:

```typescript
const twitter = contact.social.find(s => s.platform === 'twitter')
const linkedin = contact.social.find(s => s.platform === 'linkedin')

console.log('Twitter:', twitter?.url)
console.log('LinkedIn:', linkedin?.url)
```

### Handle Extraction

Get social media handles/usernames:

```typescript
const handles = contact.social
  .filter(s => s.handle)
  .map(s => `@${s.handle} (${s.platform})`)

console.log('Social Handles:', handles)
```

## Contact Form Detection

### Form Identification

Detect contact forms on the page:

```typescript
const { contactForms } = contact

if (contactForms.length > 0) {
  console.log(`Found ${contactForms.length} contact form(s)`)

  contactForms.forEach((form, i) => {
    console.log(`\nForm ${i + 1}:`)
    console.log(`  Action: ${form.action || 'Same page'}`)
    console.log(`  Method: ${form.method}`)
    console.log(`  Fields: ${form.fields.join(', ')}`)
  })
}
```

Form information:
- **action**: Where the form submits to
- **method**: HTTP method (GET/POST)
- **fields**: Array of input field names

### Form Field Analysis

Understand what information forms collect:

```typescript
contactForms.forEach((form) => {
  const hasEmail = form.fields.some(f => /email/i.test(f))
  const hasMessage = form.fields.some(f => /message|comment|inquiry/i.test(f))
  const hasName = form.fields.some(f => /name/i.test(f))

  console.log('Form Fields:')
  console.log(`  Email field: ${hasEmail ? '✓' : '✗'}`)
  console.log(`  Message field: ${hasMessage ? '✓' : '✗'}`)
  console.log(`  Name field: ${hasName ? '✓' : '✗'}`)
})
```

## Advanced Usage

### Complete Contact Card

Generate a structured contact card:

```typescript
interface ContactCard {
  businessName?: string
  emails: {
    general?: string
    support?: string
    sales?: string
  }
  phones: {
    main?: string
    tollFree?: string
  }
  address?: string
  social: Record<string, string>
  hasContactForm: boolean
  website: string
}

function generateContactCard(html: string, url: string): ContactCard {
  const contact = extractContactInfo(html)

  const card: ContactCard = {
    emails: {},
    phones: {},
    social: {},
    hasContactForm: contact.contactForms.length > 0,
    website: url,
  }

  // Extract business name from title or h1
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    card.businessName = titleMatch[1].split('|')[0].trim()
  }

  // Organize emails by type
  const generalEmail = contact.emails.find(e => e.type === 'general')
  const supportEmail = contact.emails.find(e => e.type === 'support')
  const salesEmail = contact.emails.find(e => e.type === 'sales')

  if (generalEmail)
    card.emails.general = generalEmail.email
  if (supportEmail)
    card.emails.support = supportEmail.email
  if (salesEmail)
    card.emails.sales = salesEmail.email

  // Main phone (first non-toll-free) and toll-free
  const mainPhone = contact.phones.find(p => p.type !== 'toll-free')
  const tollFree = contact.phones.find(p => p.type === 'toll-free')

  if (mainPhone)
    card.phones.main = mainPhone.formatted || mainPhone.number
  if (tollFree)
    card.phones.tollFree = tollFree.formatted || tollFree.number

  // First address
  if (contact.addresses.length > 0) {
    card.address = contact.addresses[0]
  }

  // Social profiles
  contact.social.forEach((profile) => {
    card.social[profile.platform] = profile.url
  })

  return card
}

const card = generateContactCard(html, 'https://example.com')
console.log(JSON.stringify(card, null, 2))
```

### Lead Generation Database

Build a lead database from multiple websites:

```typescript
interface Lead {
  id: string
  url: string
  company?: string
  emails: string[]
  phones: string[]
  address?: string
  socialProfiles: Array<{ platform: string, url: string }>
  hasContactForm: boolean
  extractedAt: string
}

async function extractLead(url: string): Promise<Lead> {
  const html = await fetch(url).then(r => r.text())
  const contact = extractContactInfo(html)

  // Try to extract company name
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const company = titleMatch
    ? titleMatch[1].split(/[-|]/)[0].trim()
    : new URL(url).hostname

  return {
    id: crypto.randomUUID(),
    url,
    company,
    emails: contact.emails.map(e => e.email),
    phones: contact.phones.map(p => p.formatted || p.number),
    address: contact.addresses[0],
    socialProfiles: contact.social,
    hasContactForm: contact.contactForms.length > 0,
    extractedAt: new Date().toISOString(),
  }
}

class LeadDatabase {
  private leads: Map<string, Lead> = new Map()

  async add(url: string) {
    const lead = await extractLead(url)
    this.leads.set(lead.id, lead)
    console.log(`Added lead: ${lead.company}`)
    return lead
  }

  findByEmail(email: string): Lead[] {
    return Array.from(this.leads.values()).filter(lead =>
      lead.emails.includes(email)
    )
  }

  findBySocialPlatform(platform: string): Lead[] {
    return Array.from(this.leads.values()).filter(lead =>
      lead.socialProfiles.some(p => p.platform === platform)
    )
  }

  exportCSV(): string {
    let csv = 'Company,URL,Emails,Phones,Address,Has Contact Form\n'

    this.leads.forEach((lead) => {
      csv += `"${lead.company}","${lead.url}","${lead.emails.join('; ')}","${lead.phones.join('; ')}","${lead.address || ''}",${lead.hasContactForm}\n`
    })

    return csv
  }
}

const db = new LeadDatabase()
await db.add('https://company1.com/contact')
await db.add('https://company2.com/about')

const csv = db.exportCSV()
console.log(csv)
```

### Contact Validation

Validate and verify contact information:

```typescript
interface ValidationResult {
  emails: {
    valid: string[]
    invalid: string[]
    disposable: string[]
  }
  phones: {
    valid: string[]
    invalid: string[]
  }
  completeness: number // 0-100
}

function validateContactInfo(
  contact: ReturnType<typeof extractContactInfo>
): ValidationResult {
  const result: ValidationResult = {
    emails: { valid: [], invalid: [], disposable: [] },
    phones: { valid: [], invalid: [] },
    completeness: 0,
  }

  // Basic email validation (simple regex)
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

  contact.emails.forEach(({ email }) => {
    if (emailRegex.test(email)) {
      // Check for disposable email domains
      const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com']
      const domain = email.split('@')[1]

      if (disposableDomains.includes(domain)) {
        result.emails.disposable.push(email)
      }
      else {
        result.emails.valid.push(email)
      }
    }
    else {
      result.emails.invalid.push(email)
    }
  })

  // Phone validation (basic length check)
  contact.phones.forEach((phone) => {
    const digits = phone.number.replace(/\D/g, '')
    if (digits.length >= 7 && digits.length <= 15) {
      result.phones.valid.push(phone.number)
    }
    else {
      result.phones.invalid.push(phone.number)
    }
  })

  // Calculate completeness score
  let score = 0
  if (result.emails.valid.length > 0)
    score += 30
  if (result.phones.valid.length > 0)
    score += 25
  if (contact.addresses.length > 0)
    score += 20
  if (contact.social.length > 0)
    score += 15
  if (contact.contactForms.length > 0)
    score += 10

  result.completeness = score

  return result
}

const validation = validateContactInfo(contact)
console.log(`Valid Emails: ${validation.emails.valid.length}`)
console.log(`Valid Phones: ${validation.phones.valid.length}`)
console.log(`Completeness: ${validation.completeness}%`)
```

### Contact Enrichment

Enrich contact data with additional information:

```typescript
interface EnrichedContact {
  basic: ReturnType<typeof extractContactInfo>
  enriched: {
    primaryEmail?: string
    primaryPhone?: string
    socialReach: number
    contactChannels: string[]
    businessType?: 'B2B' | 'B2C' | 'Unknown'
  }
}

function enrichContactInfo(
  contact: ReturnType<typeof extractContactInfo>,
  html: string
): EnrichedContact {
  // Determine primary contacts
  const primaryEmail = contact.emails.find(e => e.type === 'general')?.email
    || contact.emails[0]?.email

  const primaryPhone = contact.phones.find(p => p.type !== 'toll-free')?.number
    || contact.phones[0]?.number

  // Count social media followers indicators
  const socialReach = contact.social.length

  // List available contact channels
  const channels: string[] = []
  if (contact.emails.length > 0)
    channels.push('email')
  if (contact.phones.length > 0)
    channels.push('phone')
  if (contact.contactForms.length > 0)
    channels.push('web form')
  if (contact.social.length > 0)
    channels.push('social media')

  // Guess business type
  let businessType: 'B2B' | 'B2C' | 'Unknown' = 'Unknown'
  const hasEnterprise = /enterprise|business|corporate|b2b/i.test(html)
  const hasConsumer = /shop|store|buy now|cart|consumer/i.test(html)

  if (hasEnterprise && !hasConsumer)
    businessType = 'B2B'
  else if (hasConsumer && !hasEnterprise)
    businessType = 'B2C'

  return {
    basic: contact,
    enriched: {
      primaryEmail,
      primaryPhone,
      socialReach,
      contactChannels: channels,
      businessType,
    },
  }
}

const enriched = enrichContactInfo(contact, html)
console.log('Primary Email:', enriched.enriched.primaryEmail)
console.log('Contact Channels:', enriched.enriched.contactChannels.join(', '))
console.log('Business Type:', enriched.enriched.businessType)
```

## Real-World Use Cases

### 1. Business Directory Scraper

```typescript
interface DirectoryEntry {
  name: string
  url: string
  email?: string
  phone?: string
  address?: string
  social: string[]
  category?: string
}

async function scrapBusinessDirectory(urls: string[]): Promise<DirectoryEntry[]> {
  const entries: DirectoryEntry[] = []

  for (const url of urls) {
    try {
      const html = await fetch(url).then(r => r.text())
      const contact = extractContactInfo(html)

      // Extract business name
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const name = titleMatch
        ? titleMatch[1].split(/[-|]/)[0].trim()
        : new URL(url).hostname

      entries.push({
        name,
        url,
        email: contact.emails[0]?.email,
        phone: contact.phones[0]?.number,
        address: contact.addresses[0],
        social: contact.social.map(s => s.url),
      })

      console.log(`✓ ${name}`)
    }
    catch (error) {
      console.error(`✗ Failed to scrape ${url}`)
    }
  }

  return entries
}

const directory = await scrapBusinessDirectory([
  'https://business1.com',
  'https://business2.com',
  'https://business3.com',
])

console.log(`Scraped ${directory.length} businesses`)
```

### 2. Contact Form Finder

```typescript
interface FormContact {
  url: string
  hasForm: boolean
  formCount: number
  formFields: string[]
  alternativeContacts: {
    emails: string[]
    phones: string[]
  }
}

async function findContactForms(urls: string[]): Promise<FormContact[]> {
  const results: FormContact[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const contact = extractContactInfo(html)

    const allFields = contact.contactForms.flatMap(f => f.fields)
    const uniqueFields = [...new Set(allFields)]

    results.push({
      url,
      hasForm: contact.contactForms.length > 0,
      formCount: contact.contactForms.length,
      formFields: uniqueFields,
      alternativeContacts: {
        emails: contact.emails.map(e => e.email),
        phones: contact.phones.map(p => p.number),
      },
    })
  }

  // Filter to pages with forms
  const withForms = results.filter(r => r.hasForm)
  console.log(`${withForms.length}/${results.length} pages have contact forms`)

  return results
}

const formResults = await findContactForms([
  'https://example.com/contact',
  'https://example.com/support',
  'https://example.com/about',
])
```

### 3. Social Media Aggregator

```typescript
interface SocialPresence {
  url: string
  platforms: Array<{
    platform: string
    url: string
    handle: string
  }>
  score: number // Social presence score
}

async function analyzeSocialPresence(urls: string[]): Promise<SocialPresence[]> {
  const results: SocialPresence[] = []

  for (const url of urls) {
    const html = await fetch(url).then(r => r.text())
    const contact = extractContactInfo(html)

    const platforms = contact.social.map(s => ({
      platform: s.platform,
      url: s.url,
      handle: s.handle || '',
    }))

    // Score based on platform diversity and presence
    let score = contact.social.length * 10
    if (contact.social.some(s => s.platform === 'twitter'))
      score += 15
    if (contact.social.some(s => s.platform === 'linkedin'))
      score += 15
    if (contact.social.some(s => s.platform === 'facebook'))
      score += 10

    results.push({ url, platforms, score })
  }

  results.sort((a, b) => b.score - a.score)

  console.log('Social Presence Ranking:')
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.url} (Score: ${r.score})`)
    console.log(`   Platforms: ${r.platforms.map(p => p.platform).join(', ')}`)
  })

  return results
}

await analyzeSocialPresence([
  'https://company1.com',
  'https://company2.com',
])
```

## Best Practices

1. **Respect Privacy**: Only extract publicly available contact information
2. **Comply with GDPR**: Be aware of data protection regulations
3. **Validate Data**: Verify email addresses and phone numbers before use
4. **Remove Duplicates**: Filter out duplicate contacts
5. **Categorize Properly**: Use type information to route contacts correctly
6. **Handle Errors**: Some pages may have unusual structures
7. **Rate Limit**: Don't overwhelm servers when scraping multiple sites
8. **Cache Results**: Avoid re-extracting the same page repeatedly

## Limitations

- Email extraction may catch false positives (emails in scripts, examples)
- Phone number formats vary globally (US-focused patterns work best)
- Address extraction requires structured data or `<address>` tags
- Cannot extract:
  - Contact information from images
  - Obfuscated emails (e.g., "email [at] example [dot] com")
  - Phone numbers with complex formatting
  - Contact info behind CAPTCHA or forms
- Social media detection limited to major platforms
- Cannot verify if contacts are current or valid

For production use:
- Implement email validation services
- Use phone number validation libraries (libphonenumber)
- Verify addresses with geocoding APIs
- Check social media profile validity
- Consider OCR for image-based contact info
- Implement human verification for critical contacts

## TypeScript Types

```typescript
interface ContactInformation {
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
  social: Array<{
    platform: string
    url: string
    handle?: string
  }>

  /**
   * Contact forms detected
   */
  contactForms: ContactForm[]
}

interface ContactEmail {
  email: string
  type?: 'general' | 'support' | 'sales' | 'info' | 'press'
  context?: string
}

interface ContactPhone {
  number: string
  type?: 'mobile' | 'landline' | 'fax' | 'toll-free'
  country?: string
  formatted?: string
}

interface ContactForm {
  action?: string
  method: string
  fields: string[]
}
```
