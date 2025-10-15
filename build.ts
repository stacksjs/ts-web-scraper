import { dts } from 'bun-plugin-dtsx'

// Build library
await Bun.build({
  entrypoints: ['src/index.ts', 'bin/cli.ts'],
  target: 'bun',
  splitting: true,
  minify: true,
  outdir: './dist',
  plugins: [dts()],
})
