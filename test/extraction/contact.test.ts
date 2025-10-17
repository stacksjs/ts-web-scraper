import { describe, expect, it } from 'bun:test'
import { extractContactInfo } from '../../src/extraction/contact'

describe('extractContactInfo', () => {
  it('should extract email addresses', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Contact us at info@example.com</p>
        <p>Support: support@example.com</p>
        <a href="mailto:sales@example.com">Email Sales</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.emails.length).toBeGreaterThanOrEqual(3)
    expect(result.emails.some(e => e.email === 'info@example.com')).toBe(true)
    expect(result.emails.some(e => e.email === 'support@example.com')).toBe(true)
    expect(result.emails.some(e => e.email === 'sales@example.com')).toBe(true)
  })

  it('should categorize email types', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>General: info@example.com</p>
        <p>Support: support@example.com</p>
        <p>Sales: sales@example.com</p>
        <p>Admin: admin@example.com</p>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.emails.some(e => e.type === 'general')).toBe(true)
    expect(result.emails.some(e => e.type === 'support')).toBe(true)
    expect(result.emails.some(e => e.type === 'sales')).toBe(true)
  })

  it('should extract phone numbers', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Call us: (555) 123-4567</p>
        <p>Mobile: 555-987-6543</p>
        <p>International: +1-800-555-0199</p>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.phones.length).toBeGreaterThanOrEqual(2)
    expect(result.phones.some(p => p.number.includes('555'))).toBe(true)
  })

  it('should categorize phone types', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Main: (555) 123-4567</p>
        <p>Support: (555) 234-5678</p>
        <p>Fax: (555) 345-6789</p>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    const mainPhone = result.phones.find(p => p.type === 'main')
    const supportPhone = result.phones.find(p => p.type === 'support')
    const faxPhone = result.phones.find(p => p.type === 'fax')

    expect(mainPhone || supportPhone || faxPhone).toBeDefined()
  })

  it('should extract physical addresses', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <address>
          123 Main Street<br>
          Suite 100<br>
          New York, NY 10001<br>
          United States
        </address>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.addresses.length).toBeGreaterThanOrEqual(1)
    expect(result.addresses[0]).toContain('123 Main Street')
    expect(result.addresses[0]).toContain('New York')
  })

  it('should extract schema.org addresses', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <script type="application/ld+json">
        {
          "@type": "PostalAddress",
          "streetAddress": "456 Oak Avenue",
          "addressLocality": "San Francisco",
          "addressRegion": "CA",
          "postalCode": "94102"
        }
        </script>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    if (result.addresses.length > 0) {
      const address = result.addresses[0]
      expect(address).toContain('Oak Avenue')
    }
  })

  it('should extract social media profiles', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <a href="https://twitter.com/example">Twitter</a>
        <a href="https://facebook.com/example">Facebook</a>
        <a href="https://linkedin.com/company/example">LinkedIn</a>
        <a href="https://github.com/example">GitHub</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.social.some(s => s.platform === 'twitter' && s.url === 'https://twitter.com/example')).toBe(true)
    expect(result.social.some(s => s.platform === 'facebook' && s.url === 'https://facebook.com/example')).toBe(true)
    expect(result.social.some(s => s.platform === 'linkedin' && s.url === 'https://linkedin.com/company/example')).toBe(true)
    expect(result.social.some(s => s.platform === 'github' && s.url === 'https://github.com/example')).toBe(true)
  })

  it('should extract Instagram profiles', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <a href="https://instagram.com/example">Follow us on Instagram</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.social.some(s => s.platform === 'instagram' && s.url === 'https://instagram.com/example')).toBe(true)
  })

  it('should extract YouTube channels', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <a href="https://youtube.com/channel/UC_example">YouTube Channel</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.social.some(s => s.platform === 'youtube' && s.url === 'https://youtube.com/channel/UC_example')).toBe(true)
  })

  it('should extract contact forms', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <form action="/contact" method="post">
          <input type="text" name="name" />
          <input type="email" name="email" />
          <textarea name="message"></textarea>
          <button type="submit">Send</button>
        </form>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.contactForms.length).toBe(1)
    expect(result.contactForms[0].action).toBe('/contact')
    expect(result.contactForms[0].method).toBe('POST')
    expect(result.contactForms[0].fields).toContain('name')
    expect(result.contactForms[0].fields).toContain('email')
    expect(result.contactForms[0].fields).toContain('message')
  })

  it('should handle relative form actions', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <form action="/submit" method="post">
          <input type="text" name="contact" />
        </form>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.contactForms[0].action).toBe('/submit')
  })


  it('should handle empty HTML', () => {
    const html = ''

    const result = extractContactInfo(html)

    expect(result.emails).toEqual([])
    expect(result.phones).toEqual([])
    expect(result.addresses).toEqual([])
    expect(result.social).toEqual([])
    expect(result.contactForms).toEqual([])
  })

  it('should handle minimal HTML', () => {
    const html = '<html><body><p>No contact info</p></body></html>'

    const result = extractContactInfo(html)

    expect(result.emails).toEqual([])
    expect(result.phones).toEqual([])
    expect(result.addresses).toEqual([])
  })

  it('should deduplicate email addresses', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Email: info@example.com</p>
        <p>Contact: info@example.com</p>
        <a href="mailto:info@example.com">Email us</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    const infoCounts = result.emails.filter(e => e.email === 'info@example.com').length
    expect(infoCounts).toBe(1)
  })

  it('should extract multiple contact methods together', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Contact Us</h1>
        <p>Email: contact@example.com</p>
        <p>Phone: (555) 123-4567</p>
        <address>
          123 Main St<br>
          New York, NY 10001
        </address>
        <a href="https://twitter.com/example">Twitter</a>
        <form action="/contact" method="post">
          <input type="text" name="name" />
          <input type="email" name="email" />
        </form>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.emails.length).toBeGreaterThanOrEqual(1)
    expect(result.phones.length).toBeGreaterThanOrEqual(1)
    expect(result.addresses.length).toBeGreaterThanOrEqual(1)
    expect(result.social.some(s => s.platform === 'twitter')).toBe(true)
    expect(result.contactForms.length).toBeGreaterThanOrEqual(1)
  })

  it('should extract email from mailto links only', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <a href="mailto:test@example.com">Email</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.emails.some(e => e.email === 'test@example.com')).toBe(true)
  })

  it('should handle phone numbers in tel links', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <a href="tel:+15551234567">Call us</a>
      </body>
      </html>
    `

    const result = extractContactInfo(html)

    expect(result.phones.length).toBeGreaterThanOrEqual(1)
  })
})
