// Turns raw Meshy downloads (.meshy/raw/<id>.glb, never committed) into the
// browser deliverables under assets/models/. Each asset ships in two tiers:
//   <id>.glb     High graphics: up to 4096px WebP PBR maps, meshopt geometry.
//   <id>-lite.glb Performance/mobile: 1024px maps, fewer triangles.
//   <id>-far.glb  Optional: tiny tier for instanced distant copies (trees).
// Usage: node scripts/optimize-models.mjs [id ...]
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, resample, flatten, join } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
// 0.22 stays the encoder (three 0.160's decoder expects its stream format);
// the 1.x simplifier adds simplifySloppy for foliage made of many small pieces.
import { MeshoptSimplifier as SloppySimplifier } from 'meshoptimizer-sloppy';

const briefs = JSON.parse(await readFile(new URL('./asset-briefs.json', import.meta.url))).assets;
const wanted = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptSimplifier.ready; await SloppySimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await mkdir(new URL('../assets/models/', import.meta.url), { recursive: true });

const triangles = doc => doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

for (const brief of briefs) {
  if (wanted.length && !wanted.includes(brief.id)) continue;
  const raw = new URL(`../.meshy/raw/${brief.id}.glb`, import.meta.url);
  try { await stat(raw); } catch { console.log(`${brief.id}: no raw download, skipped`); continue; }
  const { high, lite, far } = brief.delivery || {};
  // `far` is an optional extra-light tier for instanced distant copies.
  for (const [suffix, tier] of [['', high], ['-lite', lite], ['-far', far]].filter(([, t]) => t)) {
    const doc = await io.read(raw.pathname);
    const before = triangles(doc);
    await doc.transform(dedup(), flatten(), join(), weld(), resample());
    const sloppy = async () => {
      // Topology-agnostic decimation: merges nearby leaves/strands/details into
      // a coarser surface instead of stopping at every disconnected piece.
      const current = triangles(doc);
      for (const prim of doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())) {
        const indices = prim.getIndices().getArray(), positions = prim.getAttribute('POSITION').getArray();
        const target = Math.floor(indices.length * tier.triangles / current / 3) * 3;
        const [result] = SloppySimplifier.simplifySloppy(new Uint32Array(indices), new Float32Array(positions), 3, null, target, 1);
        prim.getIndices().setArray(result);
      }
      await doc.transform(prune());
    };
    if (tier.sloppy && before > tier.triangles) await sloppy();
    else if (tier.triangles && before > tier.triangles) {
      // Error-bounded, so hard-surface buildings keep their shape even when
      // that means missing the triangle budget (sloppy crumples them).
      await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: tier.triangles / before, error: tier.error ?? (suffix ? .03 : .001), lockBorder: !suffix }));
    }
    await doc.transform(
      prune(),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [tier.texture, tier.texture], quality: tier.quality || 86 }),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' })
    );
    const out = new URL(`../assets/models/${brief.id}${suffix}.glb`, import.meta.url);
    await writeFile(out, await io.writeBinary(doc));
    const textures = doc.getRoot().listTextures().map(t => t.getSize()?.join('x'));
    console.log(`${brief.id}${suffix}: ${Math.round(before)} -> ${Math.round(triangles(doc))} tris, textures ${[...new Set(textures)].join(',')}, ${((await stat(out)).size / 1048576).toFixed(2)} MB`);
  }
}
