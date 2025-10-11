import { dts } from 'bun-plugin-dtsx'

// Build library
await Bun.build({
  entrypoints: ['src/index.ts'],
  target: 'bun',
  splitting: false,
  minify: true,
  outdir: './dist',
  naming: 'index.js',
  plugins: [dts()],
})

// Build CLI
await Bun.build({
  entrypoints: ['bin/cli.ts'],
  target: 'bun',
  splitting: false,
  minify: true,
  outdir: './dist/bin',
  naming: 'cli.js',
})
