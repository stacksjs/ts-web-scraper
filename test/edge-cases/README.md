# Edge Case and Stress Tests

This directory contains comprehensive edge case and stress tests designed to break the logic of the web scraper and ensure robust error handling.

## Overview

These tests cover extreme scenarios, malicious inputs, and edge cases that real-world web scrapers may encounter. The goal is to ensure the scraper:
1. **Never crashes** on invalid input
2. **Returns sensible defaults** when data is missing
3. **Doesn't infinite loop** on circular or recursive structures
4. **Handles errors gracefully** without exposing sensitive information
5. **Sanitizes potentially dangerous input**
6. **Performs well** even under stress

## Test Files

### 1. `malformed-html.test.ts` (52 tests)

Tests the scraper's resilience to malformed and invalid HTML:

- **Unclosed Tags**: Missing closing tags, improperly nested elements
- **Invalid Nesting**: Block elements inside inline elements, orphaned list items
- **Missing Required Attributes**: Images without src, links without href
- **Corrupted HTML Entities**: Incomplete entities, invalid numeric entities
- **Mixed Encodings**: Content with different character sets
- **Invalid Doctype**: Missing, malformed, or multiple doctypes
- **Broken Comment Syntax**: Unclosed comments, nested comments
- **Invalid Attribute Syntax**: Unquoted attributes, mixed quotes, duplicates
- **Truncated HTML**: Documents cut off mid-tag or mid-attribute
- **Empty Elements**: Elements with no content or only whitespace
- **Invalid Self-Closing Tags**: Non-void elements self-closed
- **Malformed JSON-LD**: Invalid JSON in structured data
- **Ambiguous Tag Boundaries**: Tags with special characters in attributes
- **Dangerous Element Combinations**: Scripts in unusual contexts
- **Real-World Scenarios**: Legacy WordPress HTML, email-generated HTML, user content

### 2. `extreme-values.test.ts` (49 tests)

Tests the scraper's ability to handle extreme values and performance limits:

- **Empty Strings**: Completely empty or whitespace-only documents
- **Very Long Strings**: 100k+ character content, attributes, URLs
- **Deeply Nested Structures**: 100+ levels of nesting (divs, lists, tables)
- **Thousands of Elements**: 5000+ paragraphs, links, images, meta tags
- **Unicode Edge Cases**:
  - Emojis (🎉🎊🎈)
  - RTL text (Arabic, Hebrew)
  - Zero-width characters
  - Combining diacritics
  - Bidirectional text markers
  - Supplementary characters (beyond BMP)
- **Extreme Whitespace**: Excessive spaces, tabs, line breaks
- **Circular References**: Self-referencing URLs and links
- **Performance Stress**: 1MB+ documents, complex nested structures
- **Extreme Attributes**: Hundreds of attributes, thousands of classes
- **URL Variations**: Thousands of query parameters, very long fragments
- **Memory Stress**: Repeated parsing, large arrays of elements
- **Special Numbers**: Infinity, NaN, MAX_SAFE_INTEGER
- **Reading Time**: Extremely long content (100k+ words)

### 3. `injection-attacks.test.ts` (54 tests)

Tests the scraper's security against various injection attacks:

- **XSS (Cross-Site Scripting)**:
  - Basic script injection
  - Script in attributes (onclick, onerror)
  - Event handlers
  - JavaScript URLs
  - SVG-based XSS
  - Style attribute attacks
  - Obfuscated XSS
  - Meta refresh attacks
  - Data attributes
  - iframe srcdoc

- **SQL Injection**: Patterns in meta content, text, and URLs

- **Script Injection Contexts**:
  - Comments
  - JSON-LD
  - Protocol handlers (vbscript, data)
  - CSS
  - Unusual script attributes

- **HTML Comment Injection**: Malicious comments, conditional comments

- **CDATA Sections**: Malicious content in CDATA

- **Entity Encoding Attacks**: Double-encoded, mixed encoding

- **Template Injection**: Template syntax (Angular, Vue, React)

- **Command Injection**: Shell commands in content and meta tags

- **LDAP Injection**: LDAP filter patterns

- **XML Injection**: XML entities, external entity references

- **NoSQL Injection**: MongoDB query patterns

- **Path Traversal**: Directory traversal in URLs (../../etc/passwd)

- **SSRF (Server-Side Request Forgery)**: Internal IP addresses

- **Prototype Pollution**: __proto__ in attributes and JSON

- **ReDoS (Regular Expression DoS)**: Patterns that could cause regex hangs

- **Polyglot Payloads**: Multi-context injection attempts

- **CSP Bypass**: Attempts to bypass Content Security Policy

- **Dangling Markup**: Unclosed tags for attribute injection

- **Null Byte Injection**: Null characters in content and attributes

- **Format String Attacks**: Format string patterns

- **Billion Laughs**: Exponential entity expansion

- **Defense Verification**: Ensures scripts are stripped, no code execution

### 4. `encoding-issues.test.ts` (50 tests)

Tests the scraper's handling of character encoding issues:

- **Invalid UTF-8 Sequences**: Invalid start bytes, overlong encodings, truncated sequences

- **Byte Order Mark (BOM)**: UTF-8, UTF-16 BOMs in various positions

- **Mixed Character Sets**: Latin + Cyrillic, Asian scripts, RTL + LTR

- **Invalid HTML Entities**: Malformed numeric entities, unclosed entities

- **Control Characters**: ASCII control chars, Unicode control chars, invisible chars

- **Invalid Escape Sequences**: Bad backslash escapes, malformed Unicode escapes

- **Charset Conflicts**: Multiple conflicting charset declarations

- **Surrogate Pairs**: Valid pairs, unpaired surrogates, reversed surrogates

- **Normalization Issues**: Precomposed vs decomposed characters (NFD vs NFC)

- **Line Ending Variations**: LF, CRLF, CR, Unicode line separators

- **Homograph Attacks**: Confusable characters from different scripts

- **Invalid XML Characters**: Characters invalid in XML

- **Encoding in Attributes**: Special characters, URL encoding, non-ASCII

- **Base64 and Data URLs**: Invalid base64, malformed data URLs

- **Character Set Edge Cases**: Windows-1252, Latin-1 supplement

- **Mixed Encoding**: Documents with mixed encoding indicators

- **Error Recovery**: Graceful handling of encoding errors

- **Special Unicode Blocks**: Mathematical symbols, enclosed alphanumerics, ancient scripts

## Enhanced Test Coverage in Existing Files

### Added to `scraper.test.ts`

Added 9 new test suites with 30+ tests covering:

- **Error Recovery**: Malformed URLs, extraction errors, undefined returns, circular references, slow responses
- **Data Integrity**: Special character preservation, large objects, mixed data types
- **Caching Edge Cases**: Cache corruption, rapid invalidation
- **Rate Limiting**: Burst requests, mixed rate limits
- **Validation**: Complex nested schemas, optional fields, type mismatches
- **Memory and Performance**: Memory leak prevention, multiple URL handling
- **Cookies and Sessions**: Invalid cookies, session persistence
- **Pagination**: Infinite loops, duplicate URLs

### Added to `content.test.ts`

Added 11 new test suites with 50+ tests covering:

- **Malformed HTML**: Unclosed tags, broken structures, nested issues
- **Extreme Content Sizes**: Very long articles, thousands of paragraphs
- **Special Characters**: Unicode preservation, HTML entities, RTL/LTR mixing
- **Complex Structures**: Deep nesting, tables, lists
- **Script Removal**: Inline/external scripts, styles, navigation
- **Image Extraction**: Missing src, invalid URLs, data URLs
- **Author/Date Edge Cases**: Multiple authors, malformed dates
- **Title Extraction**: Multiple h1s, nested elements, fallbacks
- **Reading Time**: Short content, numbers only, mixed languages
- **Excerpt Generation**: Short/long content, HTML stripping
- **Content Density**: Semantic-less pages, density detection
- **Error Recovery**: Empty input, garbage input, deep structures

## Test Statistics

- **Total New Edge Case Tests**: 205+ tests
- **Total Assertions**: 1,200+ expect() calls
- **Code Coverage**: Comprehensive coverage of parsing, extraction, and error handling
- **Execution Time**: All tests complete in < 1 second (except performance tests)

## Running the Tests

Run all edge case tests:
```bash
bun test test/edge-cases/
```

Run individual test suites:
```bash
bun test test/edge-cases/malformed-html.test.ts
bun test test/edge-cases/extreme-values.test.ts
bun test test/edge-cases/injection-attacks.test.ts
bun test test/edge-cases/encoding-issues.test.ts
```

Run with coverage:
```bash
bun test --coverage test/edge-cases/
```

## Key Findings

These tests ensure that the web scraper:

1. **Robustness**: Handles all forms of malformed HTML without crashing
2. **Performance**: Processes very large documents (1MB+) efficiently
3. **Security**: Properly sanitizes script tags and prevents XSS
4. **Encoding**: Correctly handles Unicode, entities, and various character sets
5. **Memory**: No memory leaks with repeated parsing
6. **Error Handling**: Returns sensible defaults instead of throwing errors
7. **Compatibility**: Works with real-world HTML from various sources

## Best Practices Demonstrated

1. **Never crash**: All `expect(() => ...).not.toThrow()` tests pass
2. **Defensive programming**: Handles undefined, null, empty, and invalid values
3. **Sanitization**: Removes scripts and styles from extracted content
4. **Performance**: Completes within reasonable timeouts
5. **Unicode support**: Preserves emoji, RTL text, and special characters
6. **Fallbacks**: Uses intelligent fallbacks when primary data is missing

## Future Enhancements

Potential areas for additional edge case coverage:

1. WebSocket and streaming content
2. Binary content handling
3. Compressed content (gzip, brotli)
4. Content negotiation edge cases
5. Proxy and redirect handling
6. Rate limiting under concurrent load
7. Cache invalidation edge cases
8. Session expiration scenarios
9. Network timeout combinations
10. Client-side rendering edge cases

## Contributing

When adding new edge case tests:

1. Focus on **breaking the logic** - try to make it crash or behave unexpectedly
2. Test **real-world scenarios** - use actual malformed HTML found in the wild
3. Include **performance tests** - ensure tests complete within reasonable time
4. Add **descriptive test names** - clearly explain what edge case is being tested
5. Group **related tests** - use describe blocks to organize similar edge cases
6. Verify **error handling** - ensure graceful degradation, not crashes
7. Document **expected behavior** - explain what should happen with the edge case

## References

- OWASP XSS Prevention Cheat Sheet
- HTML5 Specification (Error Handling)
- Unicode Standard Annex #15 (Normalization)
- Web Security Testing Guide
- Regular Expression DoS (ReDoS) patterns
- Common Parser Vulnerabilities
