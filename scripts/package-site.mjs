import { cp, mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url), output = new URL('../site-dist/', import.meta.url);
await mkdir(output, { recursive: true });
// Only deploy runtime files, never developer tools, tests, or workspace data.
for (const path of ['index.html', 'assets', 'css', 'js', 'vendor']) await cp(new URL(path, root), new URL(path, output), { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
console.log('Static site packaged in site-dist/.');
