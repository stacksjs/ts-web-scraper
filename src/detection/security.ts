/**
 * Security indicators detection
 */

export interface SecurityIndicators {
  /**
   * HTTPS usage
   */
  https: boolean

  /**
   * Security headers detected
   */
  securityHeaders: string[]

  /**
   * Privacy policy link found
   */
  privacyPolicy: boolean

  /**
   * Terms of service link found
   */
  termsOfService: boolean

  /**
   * Cookie consent detected
   */
  cookieConsent: boolean

  /**
   * GDPR compliance indicators
   */
  gdprCompliant: boolean

  /**
   * Security badges/certifications
   */
  badges: string[]
}

/**
 * Detect security and privacy indicators
 */
export function detectSecurityIndicators(html: string, url?: string): SecurityIndicators {
  const securityHeaders: string[] = []
  const badges: string[] = []

  // Check HTTPS
  const https = url ? url.startsWith('https://') : false

  // Check for privacy policy
  const privacyPolicy = /privacy[-\s]?policy|privacy[-\s]?statement/i.test(html)

  // Check for terms of service
  const termsOfService = /terms[-\s]?of[-\s]?(?:service|use)|terms[-\s]?and[-\s]?conditions/i.test(html)

  // Check for cookie consent
  const cookieConsent = /cookie[-\s]?consent|cookie[-\s]?notice|cookie[-\s]?policy|accept[-\s]?cookies/i.test(html)

  // Check for GDPR compliance
  const gdprCompliant = /gdpr|general[-\s]?data[-\s]?protection|data[-\s]?protection[-\s]?regulation/i.test(html)

  // Check for security badges
  if (/ssl[-\s]?secured|secure[-\s]?checkout/i.test(html))
    badges.push('SSL')
  if (/norton[-\s]?secured/i.test(html))
    badges.push('Norton')
  if (/mcafee[-\s]?secure/i.test(html))
    badges.push('McAfee')
  if (/truste|trustwave/i.test(html))
    badges.push('TrustE')
  if (/pci[-\s]?compliant|pci[-\s]?dss/i.test(html))
    badges.push('PCI DSS')

  return {
    https,
    securityHeaders,
    privacyPolicy,
    termsOfService,
    cookieConsent,
    gdprCompliant,
    badges,
  }
}
