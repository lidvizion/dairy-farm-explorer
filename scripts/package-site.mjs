import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), output = new URL('../site-dist/', import.meta.url);
// Rebuild only the fixed output directory, including after assets are removed
// or renamed. Otherwise stale media or development files can survive packaging.
const rootPath = resolve(fileURLToPath(root));
const outputPath = resolve(fileURLToPath(output));
if (dirname(outputPath) !== rootPath || basename(outputPath) !== 'site-dist') {
  throw new Error('Refusing to clear an unexpected packaging directory.');
}
await rm(outputPath, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// Only deploy runtime files, never developer tools, tests, or workspace data.
for (const path of ['index.html', 'assets', 'css', 'js', 'vendor']) await cp(new URL(path, root), new URL(path, output), { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
console.log('Static site packaged in site-dist/.');
