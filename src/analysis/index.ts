/**
 * Content Analysis Module
 *
 * Comprehensive analysis tools for web content including:
 * - SEO analysis with readability scores
 * - Accessibility auditing
 * - Performance metrics
 * - AI/ML-ready feature extraction
 * - Content quality scoring
 */

// Accessibility analysis
export { analyzeAccessibility } from './accessibility'

export type { AccessibilityAnalysis, AccessibilityIssue } from './accessibility'

// Content analysis
export { calculateReadingTime, generateExcerpt } from './content'
// ML-ready features
export { extractMLFeatures } from './ml-ready'

export type { ContentSection, MLFeatures } from './ml-ready'
// Performance metrics
export { extractPerformanceMetrics } from './performance'

export type { PerformanceMetrics } from './performance'
// Quality scoring
export { calculateQualityScore } from './quality'

// SEO analysis
export { analyzeSEO } from './seo'
export type { SEOAnalysis } from './seo'
