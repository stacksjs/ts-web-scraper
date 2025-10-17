/**
 * Content Extraction Module
 *
 * Advanced content extraction including:
 * - Main article content (Readability-style)
 * - Contact information
 */

// Contact information
export { extractContactInfo } from './contact'
export type {
  ContactEmail,
  ContactForm,
  ContactInformation,
  ContactPhone,
} from './contact'

// Main content extraction
export { extractMainContent } from './content'
export type { ExtractedContent } from './content'
