import { readdir, readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url), output = new URL('../site-dist/', import.meta.url);
const runtime = ['index.html', 'assets', 'css', 'js', 'vendor'];
assert.deepEqual((await readdir(output)).sort(), [...runtime, '.nojekyll'].sort(), 'Unexpected files in deploy output');
let count = 0, bytes = 0;
async function verify(path) {
  const source = new URL(path, root), target = new URL(path, output);
  if ((await stat(source)).isDirectory()) {
    const children = await readdir(source);
    assert.deepEqual((await readdir(target)).sort(), children.sort(), `Directory differs: ${path}`);
    for (const name of children) await verify(`${path}/${name}`);
  } else {
    const a = await readFile(source), b = await readFile(target);
    assert.ok(a.equals(b), `Packaged file differs: ${path}`);
    count++; bytes += b.length;
  }
}
for (const path of runtime) await verify(path);
console.log(`Deploy output verified: ${count} runtime files, ${bytes} bytes. No development files included.`);
