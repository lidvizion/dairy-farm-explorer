import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// A useful local check when a review explicitly prohibits git commands.
// CI's checked-in vendor diff remains the authoritative repository comparison.
for (const [source, target] of [
  ['build/three.module.min.js', 'three.module.min.js'],
  ['examples/jsm/geometries/RoundedBoxGeometry.js', 'addons/geometries/RoundedBoxGeometry.js'],
  ['LICENSE', 'LICENSE']
]) {
  const upstream = await readFile(new URL('../node_modules/three/' + source, import.meta.url));
  const shipped = await readFile(new URL('../vendor/three/' + target, import.meta.url));
  if (!upstream.equals(shipped)) throw Error(`Vendor differs from upstream: ${target}`);
  console.log(`${target}: identical (${createHash('sha256').update(shipped).digest('hex')})`);
}
