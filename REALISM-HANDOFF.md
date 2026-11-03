# Dairy game realism — implementation and resume ledger

Updated: 2026-11-02. Workspace: `/Users/shawn/Documents/ChatGPT/3d-dairy`.

## User objective and authorization

Use Meshy to create high-poly, 4K textured realistic assets, integrate each into this game, make the animated cow the main character (walking, dancing, jumping), and make travel through the world feel spatial and alive. User explicitly requests a deep task breakdown and durable handoff before implementation; be efficient. No deployment requested. No fixed credit budget specified. Do not claim perfection, photorealism, 4K texture dimensions, successful rigging, or performance without verification.

## Inspection findings

- Static browser ES modules, Three.js **0.160.0** self-hosted in `vendor/three`; no build step. `npm start` serves port 4174. `npm run package:site` copies runtime files into ignored `site-dist/`.
- Initial git worktree clean. No applicable project AGENTS.md found. Existing lessons, quizzes, progress, mobile controls and reduced-motion behavior must remain functional.
- `js/app.js`: engine setup ~220; disposal ~273; first-person controller ~347; location construction ~520; animation loop ~890. `window.__game` provides QA hooks.
- `js/scenes/location-environments.js`: farm, processor, market primitive builders. Four primitive farm cows with head/tail motion; no main character. Existing geometry is toy-like, no GLTF loader. Processor equipment is behind a solid building and needs visible placement.
- `js/scenes/environment-detail.js`: instanced primitive trees, flat paths, gradient sky, distant hills. No PBR reflection environment.
- `js/scenes/animation.js`: head/tail motion only. `js/scenes/quality.js`: high/performance auto policy.
- Current shell Node is 20.19, but Node **22.16.0** is already installed at `/Users/shawn/.nvm/versions/node/v22.16.0/bin`; use this PATH for Meshy. No global meshy executable found.

## Execution sequence and acceptance

1. **Asset production and provenance**: use Meshy CLI 0.4.0 via npm exec, verify auth and balance, dry-run price estimate. Save every accepted task ID immediately, owning resource, project path, prompt, stage, actual credits. Submit once with `--async`; use resource `wait`, never resubmit after timeout. Keep raw task metadata in ignored `.meshy/`; put delivered GLBs under `assets/models/` and a safe public provenance manifest beside them. Inspect rendered previews and actual GLB triangle/image data.
2. **Hero cow**: anatomically realistic Holstein, four separated legs, neutral stance, clean PBR 4096 textures. Meshy automatic rigging is humanoid-only; do NOT send a quadruped to it. Evaluate downloaded geometry, orient and ground correctly, then implement a local quadruped rig/deformation with explicit limitations if topology prevents clean joints. Walk/run, idle breathing/head/tail, one-shot grounded jump, dance. Visible cow companion/main character in every destination, desktop and touch actions. Keep camera collision and station access. Never present whole-object bouncing as full skeletal rigging.
3. **Supporting assets**: prioritize reusable objects visible close to camera: modern dairy barn (farm), refrigerated tanker (farm + processor), stainless dairy tank (processor + farm), mature oak (all destinations), hay bale (farm), artisan dairy display (market). One generation per asset, 4K PBR refinement. Inspect each before integrating, no paid rerolls without new authorization. Fit world metre scale; safe colliders; no generated brand logos or text. Reuse meshes/materials for repeated props.
4. **Asset integration**: vendor GLTFLoader and its local dependencies matching pinned Three. Async destination-local loads, working fallback while pending/failed, no stale attachments on navigation, dispose late results. Preserve PBR color spaces/normal/roughness/metalness, configure anisotropy, real scale and contact shadows. Manifest records what is actually available, never broken speculative paths.
5. **World rendering and movement**: natural light and reflection environment, textured ground/paths, vegetation depth and wind, realistic exposed equipment layouts. Smooth human-height camera travel and visible cow locomotion. Native 3840×2160 rendering verification distinct from 4096 textures. High quality for desktop, affordable performance option/mobile. Respect reduced motion and lesson-modal pause.
6. **QA**: `npm test`, `npm run test:browser`; add meaningful lifecycle/animation tests. Check actual assets load without 404/console errors; walking/jumping/dancing, scene transitions during download, repeated scene visits/disposal, controls, lessons and mobile. Capture and inspect farm/processor/market and close cow screenshots, including a 3840×2160 frame. Record triangle counts, texture sizes, draw calls, evidence and remaining limitations. Package site only after checks.
7. **Handoff**: keep this ledger updated at every material stage; include exact resume commands/IDs, costs, generated files, tested changes, next unfinished action. Never start a second paid task simply because context or model changed.

## Current status (2026-11-03, cloud session)

- [x] Meshy access verified with Shawn's API key (env var only, never committed). Balance 49,831 before, 49,151 after: **680 credits** used.
- [x] 22 assets generated (preview + 4K PBR refine): the 7 original briefs plus 15 batch-2 briefs (milk house, solar array, biogas digester, feed bunk, water trough, processing plant, cheese line, pallets, grocery and restaurant storefronts, bistro set, produce crate, chef, walk-in cooler, dairy case). Hay bale preview regenerated once. Task IDs: `assets/models/PROVENANCE.md`.
- [x] Deliverables built by `npm run models:optimize` (meshopt + WebP): High tier 4096px maps for the cow, 2048px for everything else (4K everywhere needed ~1 GB VRAM per scene and stalled the page); Lite tier 1024px and 4k–16k triangles.
- [x] Cow: procedural seven-bone quadruped rig (`js/scenes/cow-rig.js`) drives the existing walk/run, jump, dance, head and tail code. Hero plus the four farm cows. Automatic weights, not artist-painted: good for strides and small motions, not extreme poses.
- [x] Every primitive building/prop that has a model is hidden only after its model loads (failed download keeps the old scene).
- [x] Performance tier gets a cheap gradient reflection environment (`createSoftEnvironment`) so PBR models don't read as crumpled foil without the sky PMREM.
- [x] CPU-only WebGL (SwiftShader/llvmpipe, e.g. machines with GPU acceleration off) keeps the primitive scene: the models drop it from ~5 fps to under 2. Auto graphics also picks Performance there. `?models=1` forces models on for QA; the new browser test uses it.
- [x] `npm test` and `npm run test:browser` (desktop + mobile) pass; results in the PR.
- [ ] Hardware performance check on a real phone and a mid-range laptop (only software-rendered Chromium was available).
- [ ] Remaining primitives: ground/paths, hills, the distant tree ring (a decimated Meshy oak looked worse than the stylized trees), fences, lesson beacons and labels, small processor details inside the building.
- [ ] Known model flaws: walk-in cooler has a small generated logo mark; barn roof corrugation is soft after decimation.

## Meshy operational instructions

Skill: `/Users/shawn/.codex/plugins/cache/openai-curated-remote/meshy-openai-plugin/0.6.0/skills/meshy-3d-generation/SKILL.md` and `references/{setup,pipelines,delivery,troubleshooting}.md`.

Runner prefix: `PATH=/Users/shawn/.nvm/versions/node/v22.16.0/bin:$PATH npm exec --yes --package=meshy-cli@0.4.0 -- meshy`.
Business flags: `--output-schema v1 --format json --no-update-check`. Auth JSON is bare.
Workspace is this repository. Project root `.meshy/`. Never commit credentials or signed task URLs.

No paid tasks submitted yet. No credits consumed by this work yet.

## Prepared implementation (before Meshy sign-in)

- Seven complete geometry/texture prompts and per-asset acceptance checks are saved in `scripts/asset-briefs.json`. CLI `make --dry-run` reports 20 preview + 10 refine = estimated 30 credits/model, 210 for seven; balance still unknown. Explicitly pass `--texture-resolution 4k --enable-pbr true --remove-lighting true` to refine.
- CLI doctor succeeds using existing Node 22.16.0; official Meshy endpoints confirmed. Auth initially absent. Device login **terminated with exit 8 / oauth_timeout without approval**. No running login and no paid task IDs. A fresh login is required on resume; old displayed user code is expired.
- `js/config/model-assets.js` is intentionally empty until models exist and are inspected. It must not be described as a delivered asset pack.
- `js/scenes/model-assets.js`: destination-owned GLTF loader, per-scene deduplicated downloads, PBR texture anisotropy, grounded size normalization, delayed placeholder replacement, stale-result disposal. `js/scenes/asset-placements.js`: all six supporting assets have placements; missing manifest entries are skipped without 404s. Cow integration still requires actual mesh/rig inspection.
- Existing primitive cow is now the controllable placeholder main character in every location. Articulated leg pivots, walk/run gait, jump/landing, dance/cancel-on-walk, follow/first-person views, desktop Space/F/V and touch controls. This is NOT a generated realistic cow and NOT proof of Meshy quadruped skinning.
- High mode: procedural atmospheric sky + PMREM reflections, PBR primitive materials, maximum native 3840×2160 framebuffer. Expensive reflections deliberately excluded from engine startup and Performance mode. No 4K texture claims until downloaded GLB textures are measured.
- Vendored GLTFLoader, BufferGeometryUtils and Sky from pinned Three 0.160.0. `npm run vendor` reproduces them. Unused RoomEnvironment removed.
- 18 unit tests pass, including animation, camera collision, pixel budget, late model completion and reuse. All four new character browser tests pass across desktop/mobile (actions, camera switching, all three destinations, reduced motion). They first exposed transient polling and expensive startup; corrected tests track jump peaks in-page and use Performance like existing suite. All existing 16 browser regression checks passed in 9.7 minutes: all lessons/quizzes, retries, persistence/reset, graphics switching, fallback, media/storage failures and keyboard focus on desktop/mobile. Mobile hint/action overlap found in screenshots and corrected; final layout spot check recorded below.
- Preliminary screenshots saved in `.cache/realism-qa/realism-{farm,processor,market}-{desktop,mobile}.png`. Farm, processor, market desktop and farm mobile inspected. They clearly remain primitive/toy-like; not photorealistic. Final visual acceptance remains OPEN.

## Exact next steps once authenticated

1. Run fresh device login and await it in the active turn as the skill describes. Verify `auth status` then `balance` using runner above. If insufficient, no paid create; report budget gap. Do not repeat authentication if verified.
2. Read `scripts/asset-briefs.json`. First paid operation is cow text-to-3d preview. Use brief prompt verbatim, `--target-formats glb --async --operation-id dairy-holstein-preview-20261102` and normal business flags. No `--project` on first create.
3. Immediately record returned `result.submission.task_id` and `text-to-3d` here. `project init --root "$PWD/.meshy" --name holstein-cow --task-id ID --task-type text-to-3d --workspace "$PWD"` then read project path. `text-to-3d wait ID --timeout 600 --project PROJECT --stage preview --workspace "$PWD"`.
4. Preview succeeded: refine same preview ID with brief texture prompt, PBR true, 4k, remove-lighting true, GLB, async, recorded project/stage/workspace. Wait on new ID. Inspect thumbnail; download GLB via CLI to `assets/models/holstein-cow.glb`. Record consumed credits per completed task, not an inferred price.
5. Inspect GLB and orientation with Three/Blender. Blender is already installed at `/Applications/Blender.app`. Need custom quadruped skeleton and verified weights; don't use Meshy humanoid rigging for a four-legged cow. Keep leg/head/tail mappings compatible with animation module or use mixers with explicit clips. Save source + rig script locally for reproducibility. GLTF session currently clones static meshes only; rigged cloning needs SkeletonUtils or a single owned hero model. Fix that before putting skinned assets through generic clones.
6. Generate each remaining brief once and integrate its available entry in model-assets manifest (`url`, longest-side `size` in metres, optional `orientation` radians) after preview check. Existing placement module loads and replaces tagged barn/tanker fallbacks. Inspect and correct placements/colliders/geometry alignment using screenshots.
7. Complete texture/topology/animation/desktop/mobile/4K checks; update status and remaining limitations rather than declaring perfection.

## Final local validation and stop point

- `npm test`: **18/18 passed**, including final post-fix rerun.
- `npm run test:browser -- --grep 'cow actions|reduced motion keeps'`: **4/4 passed** across desktop/mobile.
- `npm run test:browser -- tests/browser/journey.spec.js`: **16/16 passed** across desktop/mobile (9.7 minutes in this environment). This is functional validation, not a realtime performance certification.
- Final additional desktop/mobile browser spot checks passed: hint and cow controls do not overlap, Space on the focused Dance button activates Dance, and entering fallback hides cow controls. Final screenshots: `.cache/realism-qa/controls-final-{desktop,mobile}.png`.
- `npm run vendor`, `npm run package:site`, `node --check js/app.js`, and `git diff --check` passed. All seven brief prompts and texture prompts verified within Meshy's 600-character limit.
- Local development preview running at `http://localhost:4174`; packaged runtime in `site-dist/`. Nothing deployed or committed. Source changes and this ledger remain in the working tree.
- **Blocking dependency:** Meshy OAuth device flow expired without user approval. No generation submitted, no generated models/textures downloaded, zero generation credits spent. Old login code is expired. Resume with fresh login, then the exact asset sequence above.
- **Not finished:** all seven Meshy assets, real quadruped skinning of generated cow, actual texture/triangle audit, final realistic terrain/material pass, native 4K visual verification, and hardware performance checks. Current game art remains placeholder geometry. Do not characterize this iteration as hyperrealistic or perfect.
