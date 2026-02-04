import type { BunpressConfig } from 'bunpress'

const config: BunpressConfig = {
  name: 'ts-web-scraper',
  description: 'A powerful, type-safe web scraping library for TypeScript and Bun',
  url: 'https://ts-web-scraper.netlify.app',

  theme: {
    primaryColor: '#059669',
  },

  sidebar: [
    { text: 'Introduction', link: '/' },
    {
      text: 'Guide',
      items: [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Static Pages', link: '/guide/static' },
        { text: 'JavaScript-Rendered Pages', link: '/guide/spa' },
        { text: 'CSS Selectors', link: '/guide/selectors' },
      ],
    },
    {
      text: 'Features',
      items: [
        { text: 'Content Extraction', link: '/features/content-extraction' },
        { text: 'Metadata', link: '/features/metadata' },
        { text: 'Pagination', link: '/features/pagination' },
        { text: 'Rate Limiting', link: '/features/rate-limiting' },
        { text: 'Caching', link: '/features/caching' },
        { text: 'Change Detection', link: '/features/change-detection' },
        { text: 'Export Formats', link: '/features/export' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'Pipelines', link: '/advanced/pipelines' },
        { text: 'Validation', link: '/advanced/validation' },
        { text: 'GraphQL', link: '/advanced/graphql' },
        { text: 'Cookies & Sessions', link: '/advanced/cookies' },
        { text: 'Performance', link: '/advanced/performance' },
      ],
    },
    {
      text: 'Analysis',
      items: [
        { text: 'SEO Analysis', link: '/analysis/seo' },
        { text: 'Accessibility', link: '/analysis/accessibility' },
        { text: 'Language Detection', link: '/analysis/language' },
      ],
    },
    { text: 'Configuration', link: '/config' },
  ],

  navbar: [
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'API', link: '/api/scraper' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/ts-web-scraper' },
  ],

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:title', content: 'ts-web-scraper' }],
    ['meta', { name: 'og:description', content: 'A powerful web scraping library for TypeScript' }],
  ],
}

export default config
