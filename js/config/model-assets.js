// Only delivered, inspected models belong here. Paths are relative to site root.
// `url` is the High graphics tier (4096px WebP PBR maps), `lite` the
// Performance/mobile tier (1024px maps, fewer triangles). `size` is the
// longest side in metres. Prompts, Meshy task ids and credits are recorded in
// assets/models/PROVENANCE.md; regenerate deliverables with
// `npm run models:optimize`.
const model = (id, size, extra = {}) => ({ url: `assets/models/${id}.glb`, lite: `assets/models/${id}-lite.glb`, size, ...extra });
export const MODEL_ASSETS = {
  'holstein-cow': model('holstein-cow', 2.4),
  'milk-tank': model('milk-tank', 3.8),
  // Meshy builds the tanker along X with the cab at -X; placements expect the
  // primitive's cab-forward +Z.
  'milk-tanker': model('milk-tanker', 7.5, { orientation: Math.PI / 2 }),
  'dairy-display': model('dairy-display', .95),
  // Galvanized roof reads as ice under the sky reflection at full metalness.
  'dairy-barn': model('dairy-barn', 15, { metalness: .55 }),
  // Foliage cards are single planes, so leaves need both faces.
  'valley-oak': model('valley-oak', 10, { doubleSided: true }),
  'hay-bale': model('hay-bale', 1.2),
  'milk-house': model('milk-house', 6),
  'solar-array': model('solar-array', 8),
  'biogas-digester': model('biogas-digester', 4.5),
  'feed-bunk': model('feed-bunk', 6),
  'water-trough': model('water-trough', 3.5),
  'processing-plant': model('processing-plant', 24),
  'cheese-line': model('cheese-line', 5),
  'pallet-boxes': model('pallet-boxes', 1.6),
  'grocery-storefront': model('grocery-storefront', 12),
  'restaurant-storefront': model('restaurant-storefront', 12),
  'bistro-set': model('bistro-set', 2.6),
  'produce-crate': model('produce-crate', 1.2),
  'chef': model('chef', 1.8),
  'walk-in-cooler': model('walk-in-cooler', 6),
  'dairy-case': model('dairy-case', 3)
};
