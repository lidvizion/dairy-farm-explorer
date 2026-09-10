# September 10, 2026: fixed signs and geometry clearance

## Changes and verified causes

- Station planks were already fixed, but their number and title were camera-facing
  sprites. Replaced both with text baked into one 1024 x 704 canvas atlas per
  destination. Each board has separate front/back text planes so the reverse is
  readable, not mirrored. Boards face the path from the arrival point (0, 8),
  retain their yaw throughout exploration and have a 0.85 collision footprint.
  Titles stay on the plank instead of appearing/disappearing overhead. Environment
  and demonstration labels are fixed text boards too; their visibility-controlled
  backing geometry stays out of static batching. Only the transient next-stop
  arrow remains a camera-facing sprite. Steps/objective controls remain the
  accessible alternative when a physical board is edge-on.
- **All three scenes:** the three visitor-path planes overlapped at y=.025.
  They now occupy .030/.042/.054 layers; the station overlay is at .085 with
  depth writes disabled. This removes coplanar path junctions and gives rings
  clearance above paving, paths and contact patches without logarithmic depth
  or arbitrary polygon offsets.
- **Processor and market:** rounded facade frames were corrupted by batching.
  The pinned RoundedBoxGeometry inherits type `BoxGeometry` and unit-box
  parameters, although its vertices contain the actual rounded dimensions.
  Treating it as an ordinary scalable cube replaced frames with protruding unit
  boxes. Only genuine BoxGeometry instances now take that conversion path;
  rounded meshes retain their vertices. This was a geometry-conversion bug,
  not evidence of stale culling bounds.
- **Processor:** a radius-12 circle at (0,-12) failed to cover a building spanning
  x=-12..12 and z=-14..2, allowing entry through the front and corners. Both farm
  and processor tanker radius-2.4 circles also missed their long ends. Added
  eye-height solid footprints from the original scenery, before batching, expanded
  by the player's .55 radius. These complement existing navigation circles.
  Cow footprints include head/tail extents with a small animation allowance.
  Clearance is conservative for rotated shapes; this is not a physics engine.
- **Camera:** kept near=.1 (already below the .55 player radius); reduced far
  from 2000 to 180, beyond the 145-unit full-fog distance. Closing the uncovered
  collision gaps is what prevents entering walls. No logarithmic depth buffer.
- **Farm:** the outdoor trough's water at .68 was hidden below its solid .7 top.
  Rebuilt it as a basin with side walls and inset water. The demonstration had
  the same solid-box water problem, a base below ground and hooves below its
  grass pad. Opened that basin, raised the stage base and seated the cow on the
  pad. The demo cow was not intersecting the trough, and the station boards were
  not reaching the shelter roof; those were checked rather than assumed.
- **Processor:** moved the consumer package off the building's side wall and
  seated both package stacks on the ground.
- **Market:** awning strips extended outside their 9.6-unit canopies (centres
  spanned 14.4 units); spaced them within the canopy and put them above its top.
  Moved door frames forward of the ribbon-window backing; separated grocery
  door glass from the coplanar ribbon glass and from its overlapping twin pane.
  Removed inaccessible dairy cases and kitchen counters that straddled opaque
  facade walls. Existing market/building exteriors remain illustrative facades.
- **Optional drops:** farm/market drops inside building collision zones and the
  farm tanker's footprint were moved into reachable visitor space. IDs and
  reward deduplication are unchanged.

## Culling, budgets and checks

Batch spheres already recomputed after setting instance matrices. A new unit
regression verifies every vertex of distant, rotated, scaled boxes lies inside
its batch sphere; another protects rounded facade geometry. Tree/hill instance
spheres now compute explicitly at assembly, rather than relying on the renderer's
lazy computation. No confirmed stale-bound regression was found.

The atlas adds no download and replaces eight station textures with one shared
texture per destination. Its uncompressed RGBA base level is 2.75 MiB (about
3.67 MiB with mipmaps). Keeping rounded geometry intact restores its actual
triangle cost; draw and resource checks must be read against the measurements
below, not the older corrupted-frame baseline.

New browser checks sample twelve viewpoints around the first sign in each scene,
assert fixed front/back transforms, capture cardinal views, and physically walk
into the processor front wall. This is an automated orbit/clearance check, not
physical-device playtesting. Existing tests cover all lessons, portrait and short
landscape, keyboard, reduced motion, context loss and repeat visits.

Final local verification: `npm.cmd test` **30 passed**; `npm.cmd run test:browser`
**52 passed** (desktop and touch Chromium). Vendor byte verification, static
packaging/verification and the packaged project-prefix smoke all passed. The
package contains 52 runtime files, 10,228,145 bytes. No development files ship.
Screenshots were inspected for sign front/rear/side views in all destinations,
mobile portrait and the farm demonstration; portrait/short-landscape layout
checks and screenshots also ran in the existing suite.

Measured touch Chromium Performance-mode workload:

| Destination | Spawn calls | Spawn triangles | Demo calls | Demo triangles | Repeat geometries/textures |
|---|---:|---:|---:|---:|---:|
| Farm | 67 | 35,802 | 186 | 57,276 | 63 / 5 |
| Processor | 43 | 28,114 | 109 | 34,012 | 40 / 4 |
| Market | 49 | 28,228 | 121 | 35,330 | 45 / 3 |

Geometry and texture counts matched on the second complete visit cycle. All
existing budgets passed without relaxing thresholds. Mobile auto quality remains
pixel ratio <=1 with no realtime shadows. These are workload measurements,
not real-device FPS or Safari certification.

The first complete browser run stalled during Windows server teardown after all
52 cases passed. Repeating the full suite against the existing local server
finished cleanly with exit code 0 (52 passed, 6.7 minutes); the owned server was
then stopped. No CI settings or test thresholds were changed.

No git commands, external network requests, asset imports, dependencies or vendor edits were used.
Terra's supplied asset leads, exact acceptance gates and future integration seam
are appended to QUESTIONS-FOR-AMEYA.md. The next useful steps are a Sol movement
and placement audit, actual phone testing, and human conversion/inspection of a
single candidate cow before considering any runtime loader.

---

# Showcase review — September 9, 2026

The direction is a playable California field guide: a warm, illustrative world
with small, understandable demonstrations. The central improvement is letting
the player cause something visible to happen in the world, with an explanation
of why it matters.

## What changed

- Three hands-on models: a cow comfort corner, a simplified drinking-milk line,
  and a grocery/restaurant delivery table. Native buttons control real scene
  objects; incorrect order/routes explain the mistake without punishment.
  Discoveries can be replayed and lead directly to the related lesson.
- A dedicated demonstration camera retains the surrounding destination and
  restores the previous exploration view on exit. Controls, focus, phone
  rotation, reduced motion and WebGL interruption are handled explicitly.
- Trail signs now stand on posts with cream caps; completed station rings turn
  gold. The objective panel has a chapter progress rule. Cultivated rows,
  planted plaza edges, paving, a farm gate, clustered clouds and contact shading
  give destinations more structure without external assets.
- First-use guidance advances when the player moves and looks. Opening an
  activity dismisses it; it never gates a lesson. Arrival toasts no longer stack
  over the phone viewport.
- Quiet synthesized birds, plant hum and market chimes distinguish the places.
  Short arrival motifs introduce each chapter. Audio is gesture-initialized,
  voices are disconnected when finished, mute stops active voices, and page
  hiding stops sound/render work. No audio downloads or remote service.
- Immutable scenery is batched into instanced meshes before interactive
  objects are added. Animated cows and station identities are preserved.
  Instance buffers are explicitly disposed on destination changes.
- Added behavioral tests for demonstrations, guidance, phone rotation, focus,
  context loss and repeat-visit rendering budgets. Added a vendor integrity
  script, repository agent instructions, factual references and decision notes.

## Research and its effect on the implementation

Three.js documentation was resolved through Context7 (`/mrdoob/three.js`) and
queried through its current `query_docs` tool, the available equivalent of the
brief's `get-library-docs`. The API details were used with the existing r160
dependency; the engine was not upgraded.

- [Three.js: optimizing many objects](https://threejs.org/manual/en/optimize-lots-of-objects.html)
  and [InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh):
  batch repeated immutable geometry, mark instance matrices dirty and compute
  bounds. Do not apply static batching to animated/interactive objects.
- [Three.js: responsive rendering](https://threejs.org/manual/en/responsive.html)
  and [MDN: WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices):
  retain conservative mobile resolution, avoid new postprocessing/shadow passes,
  dispose resources, and measure repeat visits. No universal iOS memory ceiling
  or desktop-to-phone FPS claim was assumed. Device limits vary.
- [MDN: Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices):
  retain gesture-based initialization and an effective sound control; handle
  rejected resume promises, page hiding and node cleanup. Real Safari remains
  a physical-device validation task.
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/):
  teach controls through actions, preserve bypass paths, avoid precision/timing
  requirements, pair visual changes with explanatory text, and respect reduced
  motion. This is not a formal accessibility conformance claim.
- [OpenAI's AGENTS.md documentation](https://developers.openai.com/codex/guides/agents-md/):
  a concise root instruction file is worthwhile here because the mobile,
  factual-content and vendor/deployment constraints are easy to accidentally
  lose between sessions. The OpenAI Docs skill informed this handoff addition.
- New dairy claims were checked against FDA and university extension sources;
  exact links and explanatory limits are in LEARNING-QA.md.

## Deliberate tradeoffs

No framework migration, new dependency, backend, telemetry, paid asset
generation or runtime external service was introduced. The existing Pages
packaging/deployment architecture is sufficient. New gameplay code and CSS are
small text files; this pass adds no binary downloads or texture files.

The demonstrations remain optional instead of extending the required journey.
They are explanatory models rather than realistic farm-management simulations.
The lesson/certificate flow and saved reward contract are unchanged. A learner
can still complete everything through the text-friendly path without WebGL;
the optional live models themselves require WebGL.

Mobile auto quality still uses pixel ratio at most 1, with realtime shadows
and antialiasing off. This trades crisp diagonal edges for GPU headroom. Contact
patches give mobile props grounding but are stylized ellipses rather than
physically accurate shadows. There is no SSAO, bloom, reflection pass, dynamic
weather or expensive foliage shader. The shared procedural cows remain a visual
weak point; an approved, optimized hero cow is a better next investment than a
framework rewrite.

## Verification

Final local results:

- `npm.cmd ci`: passed; four packages installed, zero reported vulnerabilities.
- `npm.cmd run vendor`: passed. `node scripts/verify-vendor.mjs` confirmed all
  three shipped upstream files are byte-identical to Three.js 0.160.0.
- `npm.cmd test`: **27 passed**.
- `npm.cmd run test:browser`: **48 passed**, desktop and touch
  Chromium. Includes all prior 38 regression cases and 10 new browser cases.
- `npm.cmd run package:site` and `node scripts/verify-site.mjs`: **passed**;
  50 runtime files, 10,224,574 bytes, byte-matching source, no development files.
  The package includes existing imagery and film; this is not incremental weight.
- `node scripts/smoke-package.mjs`: **passed** against the actual package under
  `/dairy-farm-explorer/`: entry → 3D → completed demonstration → lesson, with
  no page errors.

The new tests also found and fixed a stale `aria-pressed` value after reloading
with sound muted. Screenshots were inspected for desktop, portrait and short
landscape. Current screenshots are in ignored `test-results/`.

Measured mobile Performance-mode snapshots (touch Chromium, iPhone 13 viewport):

| Destination | Spawn draw calls | Spawn triangles | Demo draw calls | Demo triangles |
|---|---:|---:|---:|---:|
| Farm | 66 | 35,800 | 170 | 56,630 |
| Processor | 41 | 27,572 | 97 | 31,086 |
| Market | 48 | 27,204 | 111 | 32,510 |

Geometry/texture counts were unchanged on the second complete round of mobile
destination visits: farm 62/7, processor 38/5, market 45/4. These counts reflect
objects uploaded for those views, not every object allocated in JavaScript.
Viewport culling and animation can slightly change individual snapshots.
Static batching eliminates 54, 47 and 62 potential scenery draw submissions
respectively; actual visible savings depend on the camera. Automated bounds
are 230 calls for the tested spawn views and 260 for the mobile demonstrations.

These are rendering workload measurements, not physical-device FPS or VRAM
certification. Browser emulation is Chromium on both desktop and touch projects,
not physical iPhone Safari. The workflow has not been run remotely or deployed
during this task, and no git commands were used. `verify-vendor.mjs` compares
shipped files to installed upstream bytes; CI's repository diff remains a
separate check for Ameya/CI.

## Remaining weak spots

The environments are still procedural and some storefronts remain exterior
facades. The demonstration stage is a miniature teaching area, not a fully
simulated working farm or processing plant. Real-world authenticity would
benefit from a small coordinated asset set and educator review. Ambient sound
is intentionally sparse and needs listening on phone speakers.

Physical mid-range Android/iOS testing, screen-reader testing, asset-rights and
brand signoff, learner observation and the actual Digi Dash embedding contract
remain outstanding. QUESTIONS-FOR-AMEYA.md gives options and recommendations;
no approval was inferred and no spending or publishing occurred.
