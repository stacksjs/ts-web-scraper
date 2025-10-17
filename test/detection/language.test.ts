import { describe, expect, it } from 'bun:test'
import { detectLanguage } from '../../src/detection/language'

describe('detectLanguage', () => {
  it('should detect English language', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>English Page</title>
      </head>
      <body>
        <p>This is an English page with English content.</p>
        <p>More English text to help with detection.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('en')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should detect language from lang attribute', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <body>
        <p>Contenido en español</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('es')
  })

  it('should detect language from Content-Language meta tag', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Language" content="fr" />
      </head>
      <body>
        <p>Contenu en français</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('fr')
  })

  it('should extract alternate language versions', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <link rel="alternate" hreflang="es" href="https://example.com/es" />
        <link rel="alternate" hreflang="fr" href="https://example.com/fr" />
        <link rel="alternate" hreflang="de" href="https://example.com/de" />
      </head>
      <body>
        <p>English content</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.alternateVersions.length).toBeGreaterThanOrEqual(3)
    expect(result.alternateVersions.some(a => a.lang === 'es')).toBe(true)
    expect(result.alternateVersions.some(a => a.lang === 'fr')).toBe(true)
    expect(result.alternateVersions.some(a => a.lang === 'de')).toBe(true)
  })

  it('should detect multilingual content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <link rel="alternate" hreflang="es" href="/es" />
        <link rel="alternate" hreflang="fr" href="/fr" />
      </head>
      <body>
        <p>English content</p>
        <div lang="es">Contenido en español</div>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    // Multiple alternatives means multilingual
    expect(result.alternatives.length).toBeGreaterThan(1)
  })

  it('should assess i18n readiness', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <link rel="alternate" hreflang="es" href="/es" />
        <link rel="alternate" hreflang="fr" href="/fr" />
      </head>
      <body>
        <p>Content</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.i18n.multilingualReady).toBe(true)
    expect(result.i18n.hasHreflang).toBe(true)
  })

  it('should detect non-i18n ready pages', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Content without lang attribute or alternates</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.i18n.multilingualReady).toBe(false)
  })

  it('should detect writing direction from dir attribute', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <body>
        <p>محتوى عربي</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.direction).toBe('rtl')
  })

  it('should default to ltr direction', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <p>English content</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.direction).toBe('ltr')
  })

  it('should handle Spanish content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <body>
        <h1>Título en Español</h1>
        <p>Este es un párrafo en español con palabras comunes como está, también, y más.</p>
        <p>Otro párrafo con contenido en español.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('es')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should handle French content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body>
        <h1>Titre en Français</h1>
        <p>Ceci est un paragraphe en français avec des mots comme être, avoir, et faire.</p>
        <p>Un autre paragraphe avec du contenu français.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('fr')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should handle German content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="de">
      <body>
        <h1>Deutsche Überschrift</h1>
        <p>Dies ist ein Absatz auf Deutsch mit Wörtern wie der, die, das, und.</p>
        <p>Ein weiterer Absatz mit deutschem Inhalt.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('de')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should extract alternate URLs', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <link rel="alternate" hreflang="es" href="https://example.com/es/page" />
        <link rel="alternate" hreflang="fr" href="https://example.com/fr/page" />
      </head>
      <body>
        <p>Content</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    const esAlt = result.alternateVersions.find(a => a.lang === 'es')
    const frAlt = result.alternateVersions.find(a => a.lang === 'fr')

    expect(esAlt?.href).toBe('https://example.com/es/page')
    expect(frAlt?.href).toBe('https://example.com/fr/page')
  })

  it('should handle x-default hreflang', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <link rel="alternate" hreflang="x-default" href="https://example.com/" />
        <link rel="alternate" hreflang="en" href="https://example.com/en" />
        <link rel="alternate" hreflang="es" href="https://example.com/es" />
      </head>
      <body>
        <p>Content</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.alternateVersions.some(a => a.lang === 'x-default')).toBe(true)
  })

  it('should handle empty HTML', () => {
    const html = ''

    const result = detectLanguage(html)

    expect(result.primary).toBe('en')
    expect(result.confidence).toBe(50)
    expect(result.alternateVersions).toEqual([])
  })

  it('should handle minimal HTML', () => {
    const html = '<html><body><p>Text</p></body></html>'

    const result = detectLanguage(html)

    expect(result.primary).toBe('en')
    expect(result.alternateVersions).toEqual([])
  })

  it('should detect region-specific language codes', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en-US">
      <head>
        <link rel="alternate" hreflang="en-GB" href="https://example.com/uk" />
        <link rel="alternate" hreflang="en-AU" href="https://example.com/au" />
      </head>
      <body>
        <p>Content</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('en')
    expect(result.alternateVersions.some(a => a.lang === 'en-GB')).toBe(true)
    expect(result.alternateVersions.some(a => a.lang === 'en-AU')).toBe(true)
  })

  it('should handle multiple lang attributes in content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <p lang="en">English paragraph</p>
        <p lang="es">Párrafo en español</p>
        <p lang="fr">Paragraphe en français</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.alternatives.length).toBeGreaterThan(1)
  })

  it('should provide confidence scores', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <p>This is definitely English content with many English words.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should detect Portuguese content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <body>
        <p>Conteúdo em português com palavras comuns.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('pt')
  })

  it('should detect Italian content', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <body>
        <p>Contenuto in italiano con parole comuni.</p>
      </body>
      </html>
    `

    const result = detectLanguage(html)

    expect(result.primary).toBe('it')
  })
})
