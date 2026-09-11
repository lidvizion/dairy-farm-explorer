# September 10, 2026: arcade leaderboard and hosted-storage review

The board remains device-local under the explicitly authorised fallback. No
hosted option verified in this review met every free/no-account/no-key rule.
No account or remote leaderboard was created. Research, security limits and
owner actions are in [docs/LEADERBOARD.md](docs/LEADERBOARD.md).

The UI displays a top-five high-score herd, padded ranks, a highlighted player,
personal-best confirmation and a clear device-only label. Blank names use a
visible cow-name suggestion; a reroll button chooses another. The curated
128-name pool avoids occupied local names and has a numeric fallback. Saved
names remain stable as progress improves. No fake scores ship with the game.

The existing async adapter contract, save key, best-score deduplication and
tab-only storage fallback remain. Name validation now catches diacritic and
additional leetspeak variants and rejects invisible controls before whitespace
normalisation. Stored rows are revalidated and deduplicated; impossible total
scores are rejected against the active module's scoring ceiling. Names are
still rendered through textContent. These guards do not authenticate gameplay
or provide comprehensive moderation for a future public board.

Reviewed entry and saved states in mobile portrait and short landscape.
Fixed the empty-state message inheriting the narrow rank grid. Score buttons
change hover colours immediately so a colour transition cannot briefly obscure
their label. Captures: `artifacts/leaderboard-review/`.

Mobile Performance workload remains 74 calls / 33,600 triangles at farm arrival
and 111 / 35,646 at the completed comfort corner. Measurement JSON:
`artifacts/cow-review/leaderboard.json`. No 3D content was changed.

No dependency, credential, remote telemetry, vendor edit, git command or
publication was introduced. Shared integration is the only deferred feature;
it requires an owner-created account and a decision about public client keys.

Verification:

- `npm.cmd test`: 44 passed, including generated-name collisions, validation
  bypasses, impossible totals and duplicate untrusted rows.
- `npm.cmd run test:browser -- --workers=1`: 76 passed, exit 0, 9.1 minutes.
  Includes new blank-name, reroll, top-five and reload checks on both projects;
  existing markup-inertness, profanity and denied-storage checks still pass.
- `BROWSER_CPU_THROTTLE=4 npx.cmd playwright test --workers=1`: 76 passed,
  exit 0, 14.4 minutes. No test timeout or rendering-budget increases.
- Upstream vendor byte equality, packaging, package equality and the packaged
  project-prefix smoke passed. 65 runtime files, 10,395,836 bytes.
- Normal and throttled logs: `artifacts/leaderboard-review/`.

---

# September 10, 2026: authored low-poly cow

Supersedes the earlier cow implementation and purchased-model status below.
`js/scenes/cow-mesh.js` contains original literal vertices and polygon indices.
The body surface continues into the shoulders, thighs, hocks, hooves and udder;
it is not assembled from primitive geometries. The separate authored head
and tail surfaces retain the existing rigid idle animation and factory API.
Flat shading, texture-free coat patches, seeded frame/coat variation and the
smaller brown Jersey remain. Each cow is 414 triangles and three draws.
The geometry data and factory total 7,834 bytes of JavaScript before HTTP
compression, with no model or texture payload.

Visual reference study used the public previews of these models, without
copying or downloading their geometry or textures:

- [Low Poly Cow Neutral Pose](https://sketchfab.com/3d-models/low-poly-cow-neutral-pose-aea6aec8741a424385ca378389feb73b)
- [Low Poly Cow](https://sketchfab.com/3d-models/low-poly-cow-e23bec26ac0d4c95a484fbc0e64ed14b)

Reviewed the actual desktop farm screenshot, portrait comfort demonstration,
and fixed-camera herd views from the front quarter, side and rear. Iteration
adjusted coat variation, Jersey nose colour and a front-leg face winding.
Assessment: recognisable angular cows with continuous silhouettes, fitting
the flat-shaded scenery. Facial detail is intentionally sparse and largely
disappears at the distant arrival camera. Captures and workload JSON are in
`artifacts/cow-review/authored-final*`; reference previews are local-only.

Mobile portrait Performance workload (calls / triangles):

| View | Previous procedural cow | Authored mesh |
|---|---:|---:|
| Farm arrival | 74 / 41,810 | 74 / 33,600 |
| Completed comfort demonstration | 111 / 45,988 | 111 / 35,646 |
| Isolated four-cow herd | 12 / 9,866 | 12 / 1,656 |

These measurements use pixel ratio 1 and no realtime shadows. They measure
rendering workload, not physical-phone frame rate.
Short-landscape farm arrival is 136 calls / 36,954 triangles, down from
45,164 triangles at the same draw count. Processor and market are unchanged.

Removed the unused `fab-cow.js`. Moved the purchased GLB from runtime assets
to ignored `cow assets/retired/`; it is not part of the deploy package.
Retained the byte-identical upstream GLTFLoader utilities already vendored;
the game does not import them. No cow model or texture is fetched at runtime.
No new dependency, vendor edit, git operation or publication was performed.

Verification for this mesh:

- `npm.cmd test`: 41 passed. Cow checks enforce a 600-triangle ceiling,
  three meshes, finite noncollapsed faces, deterministic coat/frame variation,
  planted hooves and construction without primitives or model loaders.
- `npm.cmd run test:browser -- --workers=1`: 74 passed, exit 0, 7.6 minutes.
  Repeat visits retain the same draw, triangle, geometry and texture counts.
- `BROWSER_CPU_THROTTLE=4 npx.cmd playwright test --workers=1`: 74 passed,
  exit 0, 11.0 minutes. No retries, timeout increases or budget increases.
- Vendor byte equality, site packaging, package equality and the packaged
  project-prefix smoke passed. Package: 64 runtime files, 10,392,100 bytes.
  Confirmed the retired GLB and integration module are absent from site-dist.
- Logs: `artifacts/authored-cow/`; mobile views and counts:
  `artifacts/arrival-review/authored-cow.json`.

---

# September 10, 2026: destination arrivals and processor packaging sign

This pass addresses only the arrival views and cut-off processor sign.
The previous local start was x=0/z=8 in every destination; the processor's
front wall is z=2. The processor's own Consumer + Foodservice board was
3.6 units wide, centered at x=13, and intersected the x=12 wall by 0.8 units.
It was not a market sign leaking into another scene.

The dairy pack now sets individual starts: farm z=28, processor z=32 and
market z=36, all x=0/yaw=0. Reset uses the same configured arrival. Camera eye
height and field of view are unchanged. The rear navigation limit extends
four units past each arrival, preventing the first update from clamping the
player forward. Existing packs without this field retain z=8. Module
validation rejects nonfinite or out-of-range spawn data.

The processor packaging board is centered at x=14.3: its left edge is x=12.5,
leaving 0.5 units of clearance. Text, dimensions, depth testing and two-sided
faces are retained. No sign was removed or made visible through the wall.

Before/after captures in `artifacts/arrival-review/` cover all three scenes
in portrait, short landscape and desktop. The processor close-approach capture
shows the complete text. The existing objective panel still covers part of the
world on small screens; no HUD redesign was included. Farther arrivals show
more scenery and therefore cost more draws than the old close-up views.

Mobile portrait Performance workload (calls / triangles):

| Destination | Old arrival | New arrival |
|---|---:|---:|
| Farm | 41 / 32,856 | 74 / 41,810 |
| Processor | 43 / 28,114 | 70 / 32,140 |
| Market | 49 / 28,228 | 94 / 36,090 |

Short landscape after: farm 136 / 45,164; processor 89 / 33,844;
market 96 / 36,342. Pixel ratio remains 1 without realtime shadows in these
Performance samples. Existing rendering budgets are unchanged. These are
workload counts, not real-device frame-rate measurements.

Continuity finding, left outside this two-item scope: `fab-cow.js` and the
GLB exist, but source search finds no caller of `loadFarmCow`; the environment
builder still calls the procedural factory. Do not treat these measurements
as evidence that the GLB is integrated. The maintainer should reconcile this
with the previously reported cow verification before publication.

Verification:

- `npm.cmd test`: 40 passed.
- `npm.cmd run test:browser -- --workers=1`: 74 passed, exit 0, 8.2 minutes.
  Includes new arrival/reset and sign-clearance checks on desktop and touch.
- `BROWSER_CPU_THROTTLE=4 npx.cmd playwright test --workers=1`: 74 passed,
  exit 0, 11.2 minutes. Log: `artifacts/arrival-throttled.log`.
  No retries, timeout increases or rendering-budget increases were used.
- Vendor byte verification, static packaging, package verification and the
  packaged project-prefix smoke passed. 65 runtime files, 10,993,302 bytes.
- Repeat visits matched calls, triangles, geometry and texture counts exactly.
  Workload JSON: `artifacts/arrival-review/workloads.json`; normal test log:
  `artifacts/arrival-browser.log`.
- No git command, vendor edit, dependency change or publication was performed.
  Residual personal-name references in handoff/brand notes were replaced with
  role labels. Existing cow files and release-infrastructure work were untouched.

---

# September 10, 2026: client and teammate feedback

Built on the uncommitted cow and content-pack changes. No git commands,
publication, dependency changes or vendor edits were performed.

The milk-route renderer now marks the correctly ordered connected prefix,
announces each placement and briefly animates only the newly connected tile.
Wrong connections receive immediate retry feedback; later tiles cannot appear
connected across a wrong step. Undo/Clear remove the corresponding state.
Reduced motion disables placement animation. The separate cooling action,
pause, interruption cleanup and final reward contract are retained.
Browser journey coverage checks intermediate confirmations, wrong order,
undo and absence of an early Continue/reward. The local review script also
checks a correct/wrong/later-step combination, Clear and reduced motion.

World launch labels now explicitly name the destination's optional demo.
`launchLabel` belongs to pack data and falls back to its demo title, so the
independent library fixture remains supported. No resource-cycle demonstration
was invented or added as a prerequisite.

Fetched the actual client homepage and stylesheet. Replaced placeholder and
later overriding theme tokens with its yellow, charcoal, neutral and teal
palette; applied them to primary controls and major interface surfaces.
See `docs/BRAND-REFERENCE.md` for URLs, observed CSS usage and contrast.
No remote fonts/stylesheets were added and the seal remains unaltered.
System fonts, semantic feedback colors and natural scenery remain.

Fresh `window.__game.renderInfo()` measurements, iPhone 13 touch Chromium,
Performance quality, reduced motion and matched spawn/completed-demo views:

| View | Draw calls | Triangles |
|---|---:|---:|
| Farm spawn | 41 | 32,856 |
| Farm completed demo | 111 | 45,988 |
| Processor spawn | 43 | 28,114 |
| Processor completed demo | 109 | 34,012 |
| Market spawn | 49 | 28,228 |
| Market completed demo | 121 | 35,330 |

All counts match the prior refactor. Second visits match draw, triangle,
geometry and texture counts exactly. Spawn geometry/texture counts are
37/3, 40/4 and 45/3; completed demos are 101/6, 99/8 and 110/7.
The library fixture also retains its prior counts. Pixel ratio is 1 and
shadows are disabled in these mobile Performance samples. High quality still
uses real-time cast shadows. This is workload evidence, not physical-phone FPS.

Evidence is in `artifacts/feedback-review/` (checks, screenshots and workload
JSON), `artifacts/feedback-browser.log` and the throttled log recorded below.
`node scripts/review-feedback.mjs` checks portrait, short landscape, reduced
motion, wrong-prefix behavior, Clear and no early reward. Screenshots of the
route, objective button and short-landscape demo were visually inspected.
`node scripts/measure-modules.mjs` reproduces the workload samples.
Both scripts use the normal local server on port 4175.

Deliberate deferrals and Slack-ready answers are in `docs/CLIENT-HANDOFF.md`.
Inverted look waits for client greenlight; actual client questions await
the missing email. Pricing/module counts and maintenance coverage need the account lead's
decision. No final proposal, deployment, new module content or new 3D asset
was created. Physical Android/iPhone/Safari validation and client approval
remain outstanding. No external-agent dispatch was necessary.

Verification completed:

- `npm.cmd test`: **39 passed**.
- `npm.cmd run test:browser -- --workers=1`: **70 passed**, exit 0,
  reported 9.1 minutes including local server teardown delay.
- `$env:BROWSER_CPU_THROTTLE='4'; npx.cmd playwright test --workers=1`:
  **70 passed**, exit 0, 10.6 minutes. Log: `artifacts/feedback-throttled.log`.
- Focused feedback review passed with and without reduced motion, including
  wrong-prefix/Clear checks, no premature reward and short-landscape launch.
- Vendor byte comparison, static packaging, package verification and the
  packaged project-prefix smoke passed. **61 runtime files, 10,251,687 bytes**.
  No research snapshot, test fixture or review artifact is packaged.

The initial browser run was stopped after three new label assertions failed:
PowerShell had converted the expected arrow to a question mark. The source
was corrected, but the running Playwright process had cached the old expected
string. Traces confirmed correct application text. The complete clean rerun
above uses the corrected expectation; no assertion, budget or timeout was
weakened. Initial log: `artifacts/feedback-browser-initial.log`.

After all 70 normal tests passed, Windows test-server teardown stalled. The
test-owned server was identified on port 4175 and stopped; Playwright then
reported its summary and exited 0. The throttled run reused a separately
started local server and exited normally. No CI/configuration workaround was
added to the repository. Both runs kept one worker and no retries.

---

# September 10, 2026: reusable content packs and fun facts

The active deployment now selects a pack in `js/config/module.js`. The dairy
pack is in `js/modules/dairy/`; the familiar config exports remain adapters.
Routes, sequential unlocks, destination/lesson totals, badges, branding,
intro/map/help/certificate copy, lesson visuals, quiz identities, scoring,
local progress keys and leaderboard keys all follow the selected pack.
Dairy retains its original save keys, nine lessons and nine answer identities.
The procedural cow factory and rig were not edited.

The scene kit in `js/scenes/scene-kit.js` provides solid buildings, open
shelters, fences, signs, simple trees, box props and the demonstration base.
All three dairy destinations now use its principal building/shelter pieces.
Their ground, paths and instanced landscaping are selected/configured through
the pack; environment sign labels have moved into it too. Immutable pieces
still pass through the existing scenery batching and clearance collection.

This is a partial geometry abstraction, not an arbitrary environment editor.
The `farmyard`, `facility` and `storefronts` compatibility templates retain
specialized facades, tanker/equipment, cow arrangement, chef and other
procedural props. New modules normally use the generic `kit` template and
piece arrays. The field and plaza landscaping presets retain their fixed
layouts; navigation bounds and the demonstration camera layout remain shared.
A new mechanic or a materially different animated demonstration needs code.
Generic UI labels remain English, and the certificate has the existing layout.

Demonstrations are optional pack entries. Their model, rule, labels, actions,
feedback and related lesson are data. The generic `steps` model supports
ordered or unordered discoveries on the shared platform. Existing comfort,
line and delivery visuals remain specialized, with their current behavior.
No demonstration awards points or gates completion.

Questions have stable IDs and `mode: 'quiz' | 'fact'`. A fact has card text and
no question points. An `attachedTo` fact is revealed only after a correct
answer; it is absent before an answer and after an incorrect attempt. If its
target becomes a fact, it becomes standalone automatically. Switching either
item needs only the mode field. Earned ledgers survive quiz/fact/quiz reloads.
The first dairy cow-care question remains scored and carries its existing
lesson takeaway as alternate fact text. No new dairy claim was added, and the
old unapproved `funFacts` arrays remain undisplayed.

`tests/fixtures/library/pack.js` is an independent, imaginary library topic:
two destinations, three media-led card lessons, its own images/copy/scoring,
a two-action generic demonstration, its own badges/certificate and saves.
Playwright serves its pack/assets at the HTTP boundary while running the same
application modules. It completes in real WebGL and in the text path; it also
checks mode switching, delayed fact reveal, unlocks, reloads, reward deduplication
and module-specific totals. The fixture is not selectable or packaged.
Unit checks cover malformed pack data, 1/4/7 destinations, attachment mode
changes, and retention of earned rewards across mode-change reloads.

## Measured workload

Matched iPhone 13 Chromium viewport, Performance quality, reduced motion,
fixed spawn and completed-demonstration views. Farm before measurements were
captured at the start of this refactor (including the existing cow rebuild).
Processor and market baselines below are the previously recorded matching
measurements in this file; this run confirms they are retained.

| View | Before calls | After calls | Before triangles | After triangles |
|---|---:|---:|---:|---:|
| Farm spawn | 41 | 41 | 32,856 | 32,856 |
| Farm completed demonstration | 111 | 111 | 45,988 | 45,988 |
| Processor spawn | 43 | 43 | 28,114 | 28,114 |
| Processor completed demonstration | 109 | 109 | 34,012 | 34,012 |
| Market spawn | 49 | 49 | 28,228 | 28,228 |
| Market completed demonstration | 121 | 121 | 35,330 | 35,330 |

The library courtyard uses 24 calls / 26,186 triangles; its completed generic
demonstration uses 44 / 26,920. The reading-room exterior uses 28 / 26,380.
All measured draw/triangle and uploaded geometry/texture counts match exactly
on the second visit. Dairy spawn geometry/texture counts are 37/3, 40/4 and
45/3; library counts are 22/3 and 26/3. Mobile pixel ratio remains 1 without
realtime shadows. These are workload measurements, not real-device FPS claims.

`node scripts/measure-modules.mjs` reproduces the final matched views with a
local server on port 4175. JSON and screenshots are in
`artifacts/module-review/`; the initial cow-compatible before/after samples
are in `artifacts/cow-review/module-before.json` and `module-after.json`.
The module screenshots were visually inspected, including the generic stage
and the unchanged dairy spawn composition.

The authoring guide is `docs/ADDING-A-MODULE.md`. With approved copy/media and
existing mechanics, the estimate is 8-16 developer hours for a comparable
second module, plus content review. New art, research, video production,
custom 3D or mechanics require a separate scope. There are no new runtime
dependencies, model downloads, loaders, runtime API keys or build step.
No git command was used.

## Verification of the content-pack refactor

- `npm.cmd test`: **39 passed**.
- `npm.cmd run test:browser -- --workers=1`: **70 passed**, 7.4 minutes,
  clean exit 0. Includes all 66 existing cases and four library cases.
- `BROWSER_CPU_THROTTLE=4 npx.cmd playwright test --workers=1`:
  **70 passed**, 10.5 minutes, clean exit 0. No retries, timeout increases,
  budget increases or weakened assertions were introduced.
- The first normal run also passed all 70 cases, but PowerShell's combined
  log redirection treated a Node color-environment warning as a shell error.
  Repeating with native log redirection produced the clean normal exit above.
- The library cases additionally verify its 2-badge/3-lesson leaderboard,
  no attached fact before or after an incorrect answer, and stable replay
  rewards. Pure progress tests retain earned IDs through quiz/fact/quiz loads.
- `node scripts/smoke-module-video.mjs`: native video controls/playback and
  pause on close, lesson replacement and page hiding passed.
- Vendor byte verification, static packaging, package verification and the
  packaged project-prefix smoke passed. Final package: **61 runtime files,
  10,250,149 bytes** (16,320 bytes above the preserved cow-build package).
  No test pack, fixture asset or development artifact is packaged.

Logs are in `artifacts/module-review/`. Automated Chromium testing is not
physical iPhone/Android or screen-reader certification. This task did not
publish a deployment, import external models or run a git command.

---

# September 10, 2026: procedural cow rebuild

The shared factory now lives in `js/scenes/cow.js`. It returns a grounded,
forward-+X group with optional head/tail rig references, used by both the herd
and comfort demonstration. This is the single replacement seam for a future
authored cow; there is no loader, external asset or new dependency.

The silhouette has a straight spine, tapered barrel, defined hip, lean neck
and dewlap, shaped forehead/bridge/muzzle, leaf ears, angled rear hocks, narrow
pasterns, split hooves, an attached udder and a hanging tail switch. All surfaces
are flat shaded. The Jersey has a smaller, narrower frame, finer face, fawn
coat and dark nose with a pale band. Breed reference links are in LEARNING-QA.md.

Coat boundaries are clipped into the body triangles and vertex coloured.
They follow the surface without extra patch meshes or texture seams. Seeded
patch size/position, varied scale and head pitch/yaw distinguish animals.
A staggered leg stance avoids perfect symmetry.
Body, head and tail each merge into one mesh and share one material per cow;
the rig remains outside immutable scenery batching. The previous canvas coat
generator is removed. Temporary assembly geometry is disposed immediately;
the three final geometries use existing destination disposal.

The initial three-blob coat layout looked too similar across the herd, so patch
widths now vary as well as position and outline. The old rounded-box face,
capsule body and tiny horns were rejected after the before/after visual review.
Separate moving ears and weight-shift animation were considered but not built:
they do not justify more rig work or sliding planted feet at this viewing size.
Only subtle head/tail motion runs in High quality; Performance (including mobile
Auto) and reduced motion retain distinct still poses. The demonstration cow is
still, preserving its fixed teaching composition.

Matched touch Chromium measurements, iPhone 13 viewport, Performance quality,
reduced motion, fixed spawn and completed-demonstration cameras:

| View | Before calls | After calls | Before triangles | After triangles |
|---|---:|---:|---:|---:|
| Farm spawn | 67 | 41 | 35,802 | 32,856 |
| Farm completed demonstration | 186 | 111 | 57,276 | 45,988 |
| Isolated four-cow review | 72 | 12 | 18,960 | 9,866 |

No view required a rendering-budget increase. The isolated herd uses 83% fewer
draws and 48% fewer triangles. Spawn uploaded resources fall from 63 geometries /
5 textures to 37 / 3; demonstration resources fall from 176 / 11 to 101 / 6.
These are measured GPU workloads, not physical-phone FPS claims. No real phone
is attached, and CPU-throttled Chromium does not emulate a phone GPU.

`node scripts/measure-cows.mjs after` reproduces the workload snapshots and
matched herd review with a local server on port 4175. Before/after JSON and
screenshots are in `artifacts/cow-review/`; they are not packaged for deployment.
Unit tests protect grounding, finite geometry, the three-draw/<2,800 triangle
per-cow budget, deterministic variation, breed scale and stable animation poses.
Browser coverage also checks frozen Performance/reduced-motion poses and High
quality motion.

Verification completed:

- `npm.cmd test`: **33 passed**.
- `npm.cmd run test:browser`: **64 existing cases passed** (6.6 minutes).
  The two subsequently added cow cases passed separately on desktop and touch
  Chromium (18.6 seconds). Their first draft tried to use the quality control
  without opening Help; the test interaction was corrected, without a runtime
  workaround. PowerShell's stderr redirection also returned a shell error on
  the initial all-pass run; subsequent runs used native command redirection.
- `BROWSER_CPU_THROTTLE=4 npm.cmd run test:browser -- --workers=1`:
  **all 66 expanded-suite cases passed**, exit 0, 10.7 minutes. No timeouts,
  retries or budget thresholds were relaxed. Touch resource counts matched
  exactly on repeat visits: farm 37 geometries / 3 textures.
- Vendor byte verification, packaging, package verification and project-prefix
  smoke all passed. The package has 53 runtime files, 10,233,829 bytes.
- Inspected matched before/after herd and mobile demonstration captures, plus
  side/rear views and the cow at normal desktop farm viewing distance.

No git command, external model/texture import, dependency or vendor edit was used.

Visual judgment: the cow now meets the game's deliberate low-poly style and is
good enough for this educational scene. An authored model remains a possible
future close-up/animation upgrade, rather than a prerequisite for this version.
The simpler background props remain consistent with the scene; this pass did
not introduce unrelated scenery changes.

---

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
are appended to OPEN-DECISIONS.md. The next useful steps are a Sol movement
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
separate check in CI.

## Remaining weak spots

The environments are still procedural and some storefronts remain exterior
facades. The demonstration stage is a miniature teaching area, not a fully
simulated working farm or processing plant. Real-world authenticity would
benefit from a small coordinated asset set and educator review. Ambient sound
is intentionally sparse and needs listening on phone speakers.

Physical mid-range Android/iOS testing, screen-reader testing, asset-rights and
brand signoff, learner observation and the actual Digi Dash embedding contract
remain outstanding. OPEN-DECISIONS.md gives options and recommendations;
no approval was inferred and no spending or publishing occurred.
