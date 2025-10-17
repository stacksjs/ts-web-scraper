/**
 * Content Detection Module
 *
 * Smart detection and classification tools including:
 * - Content type classification
 * - Paywall and newsletter detection
 * - Social media extraction
 * - Security indicators
 * - Advanced language detection
 */

// Content type classification
export { classifyContentType } from './content-type'
export type { ContentClassification } from './content-type'

// Language detection
export { detectLanguage } from './language'
export type { AlternateLanguage, LanguageDetection } from './language'

// Paywall detection
export { detectNewsletterPrompt, detectPaywall } from './paywall'
export type { PaywallDetection } from './paywall'

// Security indicators
export { detectSecurityIndicators } from './security'
export type { SecurityIndicators } from './security'

// Social media
export { extractSocialMedia } from './social'
export type { SocialMediaLinks } from './social'
