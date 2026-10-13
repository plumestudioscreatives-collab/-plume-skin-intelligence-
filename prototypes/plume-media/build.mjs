// Builds the single-file prototype: bundles src/ (with React) using esbuild and inlines CSS
// and JS into dist/plume-media.html.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const result = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2019',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.webp': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"' },
  minify: true,
  legalComments: 'none',
  charset: 'utf8',
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('src/styles.css', 'utf8');
const tpl = readFileSync('src/index.template.html', 'utf8');
const html = tpl.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/plume-media.html', html);
console.log(`dist/plume-media.html  ${(html.length / 1024).toFixed(0)} KB`);
