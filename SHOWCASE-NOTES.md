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
