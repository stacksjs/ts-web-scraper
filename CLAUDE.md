# Claude Code Guidelines

## About

A type-safe web scraping library for TypeScript and Bun with zero external dependencies, built entirely on Bun's native APIs. It provides a pipeline-based architecture for data extraction and transformation, with support for client-side rendered pages, automatic pagination, rate limiting (token bucket), LRU caching with TTL, retry with exponential backoff, content validation, and change detection. It also includes extractors for metadata (Open Graph, Schema.org), contact info, accessibility analysis, and ML-ready features, with export to JSON, CSV, XML, YAML, and Markdown.

## Linting

- Use **pickier** for linting — never use eslint directly
- Run `bunx --bun pickier .` to lint, `bunx --bun pickier . --fix` to auto-fix
- When fixing unused variable warnings, prefer `// eslint-disable-next-line` comments over prefixing with `_`

## Frontend

- Use **stx** for templating — never write vanilla JS (`var`, `document.*`, `window.*`) in stx templates
- Use **crosswind** as the default CSS framework which enables standard Tailwind-like utility classes
- stx `<script>` tags should only contain stx-compatible code (signals, composables, directives)

## Dependencies

- **buddy-bot** handles dependency updates — not renovatebot
- **better-dx** provides shared dev tooling as peer dependencies — do not install its peers (e.g., `typescript`, `pickier`, `bun-plugin-dtsx`) separately if `better-dx` is already in `package.json`
- If `better-dx` is in `package.json`, ensure `bunfig.toml` includes `linker = "hoisted"`

## Commits

- Use conventional commit messages (e.g., `fix:`, `feat:`, `chore:`)
