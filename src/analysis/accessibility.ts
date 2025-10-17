/**
 * Accessibility analysis utilities
 */

export interface AccessibilityAnalysis {
  /**
   * Overall accessibility score (0-100)
   */
  score: number

  /**
   * Issues found
   */
  issues: AccessibilityIssue[]

  /**
   * Accessibility features detected
   */
  features: string[]

  /**
   * ARIA landmarks found
   */
  landmarks: {
    header: number
    nav: number
    main: number
    aside: number
    footer: number
    search: number
  }

  /**
   * Image accessibility
   */
  images: {
    total: number
    withAlt: number
    withoutAlt: number
    decorative: number
  }

  /**
   * Form accessibility
   */
  forms: {
    total: number
    withLabels: number
    withoutLabels: number
  }

  /**
   * Heading hierarchy
   */
  headingHierarchy: {
    valid: boolean
    issues: string[]
  }
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info'
  category: 'images' | 'forms' | 'navigation' | 'structure' | 'aria' | 'contrast'
  message: string
  count?: number
}

/**
 * Analyze accessibility of HTML content
 */
export function analyzeAccessibility(html: string): AccessibilityAnalysis {
  const issues: AccessibilityIssue[] = []
  const features: string[] = []
  let score = 100

  // Analyze landmarks
  const landmarks = {
    header: (html.match(/<header/gi) || []).length,
    nav: (html.match(/<nav/gi) || []).length,
    main: (html.match(/<main/gi) || []).length,
    aside: (html.match(/<aside/gi) || []).length,
    footer: (html.match(/<footer/gi) || []).length,
    search: (html.match(/role=["']search["']/gi) || []).length,
  }

  // Check for semantic HTML
  if (landmarks.header > 0)
    features.push('Semantic header')
  if (landmarks.nav > 0)
    features.push('Semantic navigation')
  if (landmarks.main > 0)
    features.push('Main content area')
  if (landmarks.footer > 0)
    features.push('Semantic footer')

  if (landmarks.main === 0) {
    issues.push({
      type: 'warning',
      category: 'structure',
      message: 'Missing <main> landmark for main content',
    })
    score -= 10
  }

  // Analyze images
  const imgTags = html.match(/<img[^>]*>/gi) || []
  const imagesWithAlt = imgTags.filter(img => /alt=["'][^"']*["']/.test(img)).length
  const imagesWithEmptyAlt = imgTags.filter(img => /alt=["']["']/.test(img)).length
  const imagesWithoutAlt = imgTags.length - imagesWithAlt

  const images = {
    total: imgTags.length,
    withAlt: imagesWithAlt,
    withoutAlt: imagesWithoutAlt,
    decorative: imagesWithEmptyAlt,
  }

  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'error',
      category: 'images',
      message: `${imagesWithoutAlt} image(s) missing alt text`,
      count: imagesWithoutAlt,
    })
    score -= Math.min(imagesWithoutAlt * 5, 20)
  }
  else if (imgTags.length > 0) {
    features.push('All images have alt text')
  }

  // Analyze forms
  const inputTags = html.match(/<input(?![^>]*type=["'](?:hidden|submit|button)["'])[^>]*>/gi) || []
  const labelsCount = (html.match(/<label/gi) || []).length
  const inputsWithAriaLabel = inputTags.filter(input => /aria-label=["'][^"']+["']/.test(input)).length
  const inputsWithLabel = Math.min(labelsCount + inputsWithAriaLabel, inputTags.length)
  const inputsWithoutLabel = Math.max(0, inputTags.length - inputsWithLabel)

  const forms = {
    total: inputTags.length,
    withLabels: inputsWithLabel,
    withoutLabels: inputsWithoutLabel,
  }

  if (inputsWithoutLabel > 0) {
    issues.push({
      type: 'error',
      category: 'forms',
      message: `${inputsWithoutLabel} form input(s) missing labels`,
      count: inputsWithoutLabel,
    })
    score -= Math.min(inputsWithoutLabel * 5, 15)
  }
  else if (inputTags.length > 0) {
    features.push('All form inputs have labels')
  }

  // Analyze heading hierarchy
  const headingHierarchy = analyzeHeadingHierarchy(html)
  if (!headingHierarchy.valid) {
    for (const issue of headingHierarchy.issues) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: issue,
      })
    }
    score -= 10
  }
  else {
    features.push('Valid heading hierarchy')
  }

  // Check for ARIA attributes
  if (html.includes('aria-')) {
    features.push('ARIA attributes used')
  }

  // Check for skip links
  if (html.match(/skip to (main )?content|skip navigation/i)) {
    features.push('Skip navigation link')
  }

  // Check for language attribute
  if (html.match(/<html[^>]+lang=/i)) {
    features.push('Language attribute set')
  }
  else {
    issues.push({
      type: 'warning',
      category: 'structure',
      message: 'Missing lang attribute on <html>',
    })
    score -= 10
  }

  // Check for viewport meta tag (responsive design)
  if (html.match(/<meta[^>]+name=["']viewport["']/i)) {
    features.push('Viewport meta tag (responsive)')
  }

  // Check for focus indicators (via CSS)
  if (html.match(/:focus/)) {
    features.push('Focus styles defined')
  }

  return {
    score: Math.max(0, score),
    issues,
    features,
    landmarks,
    images,
    forms,
    headingHierarchy,
  }
}

/**
 * Analyze heading hierarchy
 */
function analyzeHeadingHierarchy(html: string): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const headings: number[] = []

  // Extract heading levels
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>`, 'gi')
    const matches = html.match(regex) || []
    for (let j = 0; j < matches.length; j++) {
      headings.push(i)
    }
  }

  if (headings.length === 0) {
    issues.push('No headings found')
    return { valid: false, issues }
  }

  // Check if starts with h1
  if (headings[0] !== 1) {
    issues.push(`First heading is h${headings[0]}, should be h1`)
  }

  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    const diff = headings[i] - headings[i - 1]
    if (diff > 1) {
      issues.push(`Heading level skipped: h${headings[i - 1]} to h${headings[i]}`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
