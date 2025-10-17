# Accessibility Analysis

Analyze the accessibility of web pages and identify WCAG compliance issues.

## Overview

The accessibility analyzer provides comprehensive WCAG (Web Content Accessibility Guidelines) compliance checking, scoring, and actionable recommendations to improve website accessibility.

## Basic Usage

```typescript
import { analyzeAccessibility } from 'ts-web-scraper'

const html = await fetch('https://example.com').then(r => r.text())
const analysis = analyzeAccessibility(html)

console.log(`Accessibility Score: ${analysis.score}/100`)
console.log(`Issues Found: ${analysis.issues.length}`)
console.log(`Features Detected: ${analysis.features.length}`)
```

## Analysis Results

### Score

The analyzer provides an accessibility score from 0-100 based on:

- Presence of semantic HTML landmarks
- Image alt text coverage
- Form label associations
- Proper heading hierarchy
- ARIA attributes usage
- Language attributes
- Skip navigation links

```typescript
// Perfect score
if (analysis.score === 100) {
  console.log('Excellent accessibility! 🎉')
}
// Good score
else if (analysis.score >= 80) {
  console.log('Good accessibility with minor issues')
}
// Needs improvement
else if (analysis.score >= 60) {
  console.log('Accessibility needs improvement')
}
// Poor accessibility
else {
  console.log('Significant accessibility issues found')
}
```

### Issues

Issues are categorized by type and severity:

```typescript
analysis.issues.forEach((issue) => {
  console.log(`[${issue.type}] ${issue.category}: ${issue.message}`)
  if (issue.count) {
    console.log(`  Occurrences: ${issue.count}`)
  }
})

// Example output:
// [error] images: 3 image(s) missing alt text
// [warning] structure: Missing lang attribute on <html>
// [warning] forms: 2 form input(s) missing labels
```

#### Issue Types

- **error**: Critical accessibility problems that prevent access
- **warning**: Issues that may hinder accessibility
- **info**: Suggestions for improved accessibility

#### Issue Categories

- **images**: Image accessibility (alt text, decorative images)
- **forms**: Form accessibility (labels, ARIA attributes)
- **navigation**: Navigation accessibility (skip links, landmarks)
- **structure**: Document structure (headings, language, semantics)
- **aria**: ARIA attributes and roles
- **contrast**: Color contrast (placeholder for future enhancement)

### Features

Detected accessibility features:

```typescript
console.log('Accessibility Features:')
analysis.features.forEach((feature) => {
  console.log(`✓ ${feature}`)
})

// Example output:
// ✓ Semantic header
// ✓ Semantic navigation
// ✓ Main content area
// ✓ All images have alt text
// ✓ All form inputs have labels
// ✓ Valid heading hierarchy
// ✓ Language attribute set
// ✓ ARIA attributes used
```

### Landmarks

Semantic HTML5 landmarks detected:

```typescript
console.log('Landmarks:')
console.log(`  <header>: ${analysis.landmarks.header}`)
console.log(`  <nav>: ${analysis.landmarks.nav}`)
console.log(`  <main>: ${analysis.landmarks.main}`)
console.log(`  <aside>: ${analysis.landmarks.aside}`)
console.log(`  <footer>: ${analysis.landmarks.footer}`)
console.log(`  [role="search"]: ${analysis.landmarks.search}`)
```

### Images

Image accessibility metrics:

```typescript
console.log('Images:')
console.log(`  Total: ${analysis.images.total}`)
console.log(`  With alt text: ${analysis.images.withAlt}`)
console.log(`  Without alt text: ${analysis.images.withoutAlt}`)
console.log(`  Decorative (empty alt): ${analysis.images.decorative}`)

const altCoverage = (analysis.images.withAlt / analysis.images.total) * 100
console.log(`  Coverage: ${altCoverage.toFixed(1)}%`)
```

### Forms

Form accessibility metrics:

```typescript
console.log('Forms:')
console.log(`  Total inputs: ${analysis.forms.total}`)
console.log(`  With labels: ${analysis.forms.withLabels}`)
console.log(`  Without labels: ${analysis.forms.withoutLabels}`)

const labelCoverage = (analysis.forms.withLabels / analysis.forms.total) * 100
console.log(`  Coverage: ${labelCoverage.toFixed(1)}%`)
```

### Heading Hierarchy

Heading structure analysis:

```typescript
console.log('Heading Hierarchy:')
console.log(`  Valid: ${analysis.headingHierarchy.valid}`)

if (!analysis.headingHierarchy.valid) {
  console.log('  Issues:')
  analysis.headingHierarchy.issues.forEach((issue) => {
    console.log(`    - ${issue}`)
  })
}
```

## Example: Generate Accessibility Report

```typescript
import { analyzeAccessibility } from 'ts-web-scraper'

function generateAccessibilityReport(html: string): string {
  const analysis = analyzeAccessibility(html)

  let report = `# Accessibility Report\n\n`
  report += `## Overall Score: ${analysis.score}/100\n\n`

  // Features
  report += `## ✓ Accessibility Features (${analysis.features.length})\n\n`
  analysis.features.forEach((feature) => {
    report += `- ${feature}\n`
  })
  report += `\n`

  // Issues
  if (analysis.issues.length > 0) {
    report += `## ⚠️ Issues Found (${analysis.issues.length})\n\n`

    const errors = analysis.issues.filter(i => i.type === 'error')
    const warnings = analysis.issues.filter(i => i.type === 'warning')

    if (errors.length > 0) {
      report += `### Errors (${errors.length})\n\n`
      errors.forEach((issue) => {
        report += `- **${issue.category}**: ${issue.message}\n`
      })
      report += `\n`
    }

    if (warnings.length > 0) {
      report += `### Warnings (${warnings.length})\n\n`
      warnings.forEach((issue) => {
        report += `- **${issue.category}**: ${issue.message}\n`
      })
      report += `\n`
    }
  }

  // Metrics
  report += `## 📊 Metrics\n\n`
  report += `### Images\n`
  report += `- Total: ${analysis.images.total}\n`
  report += `- With alt text: ${analysis.images.withAlt}\n`
  report += `- Missing alt text: ${analysis.images.withoutAlt}\n\n`

  report += `### Forms\n`
  report += `- Total inputs: ${analysis.forms.total}\n`
  report += `- With labels: ${analysis.forms.withLabels}\n`
  report += `- Missing labels: ${analysis.forms.withoutLabels}\n\n`

  return report
}

const html = await fetch('https://example.com').then(r => r.text())
const report = generateAccessibilityReport(html)
console.log(report)
```

## Best Practices

1. **Run Regular Audits**: Check accessibility regularly during development
2. **Fix Errors First**: Address errors before warnings for maximum impact
3. **Aim for 80+**: Scores above 80 indicate good accessibility
4. **Test with Tools**: Combine with manual testing and screen readers
5. **Document Exceptions**: Some low scores may be justified (e.g., legacy content)

## Limitations

- Does not check color contrast (visual analysis required)
- Cannot verify keyboard navigation (requires browser interaction)
- Does not test with actual assistive technologies
- Focus on automated checks only

For comprehensive accessibility testing, combine this with:

- Manual keyboard navigation testing
- Screen reader testing
- Color contrast analyzers
- WAVE or axe DevTools browser extensions

## TypeScript Types

```typescript
interface AccessibilityAnalysis {
  score: number
  issues: AccessibilityIssue[]
  features: string[]
  landmarks: {
    header: number
    nav: number
    main: number
    aside: number
    footer: number
    search: number
  }
  images: {
    total: number
    withAlt: number
    withoutAlt: number
    decorative: number
  }
  forms: {
    total: number
    withLabels: number
    withoutLabels: number
  }
  headingHierarchy: {
    valid: boolean
    issues: string[]
  }
}

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info'
  category: 'images' | 'forms' | 'navigation' | 'structure' | 'aria' | 'contrast'
  message: string
  count?: number
}
```
