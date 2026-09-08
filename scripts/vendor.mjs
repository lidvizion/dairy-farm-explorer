// Reproducible copies of upstream distributions, not a game build step.
// Keep Three.js available on the same origin as the game (school networks may
// block third-party CDNs). Preserve the upstream license alongside the files.
import { mkdir, copyFile, readFile } from 'node:fs/promises';
const packageInfo = JSON.parse(await readFile(new URL('../node_modules/three/package.json', import.meta.url)));
if (packageInfo.version !== '0.160.0') throw Error('Review the import map and rendering tests before upgrading Three.js.');
const destination = new URL('../vendor/three/', import.meta.url);
await mkdir(new URL('addons/geometries/', destination), { recursive: true });
for (const [from, to] of [
  ['build/three.module.min.js', 'three.module.min.js'],
  ['examples/jsm/geometries/RoundedBoxGeometry.js', 'addons/geometries/RoundedBoxGeometry.js'],
  ['LICENSE', 'LICENSE']
]) await copyFile(new URL('../node_modules/three/' + from, import.meta.url), new URL(to, destination));
console.log('Vendored Three.js 0.160.0 with its MIT license.');
