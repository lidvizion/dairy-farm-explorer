import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

test('packaging removes stale output while preserving sources and excludes development files', async () => {
  const temporaryRoot = resolve(tmpdir());
  const fixture = await mkdtemp(join(temporaryRoot, 'dairy-package-'));
  try {
    await mkdir(join(fixture, 'scripts'));
    await cp(new URL('../scripts/package-site.mjs', import.meta.url), join(fixture, 'scripts/package-site.mjs'));
    for (const directory of ['assets', 'css', 'js', 'vendor', 'docs', 'site-dist/assets']) {
      await mkdir(join(fixture, directory), { recursive: true });
    }
    await writeFile(join(fixture, 'index.html'), 'current entry');
    await writeFile(join(fixture, 'assets/current.txt'), 'current media');
    await writeFile(join(fixture, 'docs/private.txt'), 'development only');
    await writeFile(join(fixture, 'site-dist/assets/removed.txt'), 'stale media');
    await writeFile(join(fixture, 'site-dist/private.txt'), 'stale development file');
    const build = () => execFileSync(process.execPath, [join(fixture, 'scripts/package-site.mjs')]);
    build();
    assert.deepEqual((await readdir(join(fixture, 'site-dist'))).sort(), ['.nojekyll', 'assets', 'css', 'index.html', 'js', 'vendor']);
    assert.deepEqual(await readdir(join(fixture, 'site-dist/assets')), ['current.txt']);
    assert.equal(await readFile(join(fixture, 'docs/private.txt'), 'utf8'), 'development only');
    await rm(join(fixture, 'assets/current.txt'));
    build();
    assert.deepEqual(await readdir(join(fixture, 'site-dist/assets')), []);
    assert.equal(await readFile(join(fixture, 'index.html'), 'utf8'), 'current entry');
  } finally {
    if (dirname(resolve(fixture)) !== temporaryRoot) throw new Error('Unexpected test directory');
    await rm(fixture, { recursive: true, force: true });
  }
});
