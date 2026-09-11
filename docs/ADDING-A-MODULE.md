# Adding a learning module

A module is a local ES-module content pack plus media. The shared application owns navigation, input, lessons, quiz evaluation, progress, the map and the certificate. There is no bundler, runtime API, model loader or new dependency. One pack is selected for a deployment; there is no learner-facing module picker.

## Files and selection

1. Create `js/modules/<topic>/pack.js`. It must default-export the pack object described below. Optional sibling files can hold lesson copy, visual briefs and demonstration definitions. Use `js/modules/dairy/` as the full production example.
2. Put approved images, film, posters and logos in `assets/modules/<topic>/`. Paths are relative to the site root, for example `assets/modules/library/shelves.webp`, without a leading slash. This preserves GitHub Pages project-prefix hosting.
3. Change only the content selector `js/config/module.js` to `export { default } from '../modules/<topic>/pack.js';`. This is deployment configuration, not an engine fork. Existing packs can remain for other deployments. No changes to app, scene, progress, quiz or UI logic are needed.
4. Run validation and the browser journey for that pack. The test-only reference is `tests/fixtures/library/pack.js`: two destinations, three lessons, a generic demonstration, scored questions, standalone facts and an attached fact. Its SVG and pack are supplied by Playwright HTTP interception. They are outside the runtime directories, absent from the UI, and excluded from `site-dist/`.

Sound, quality and movement-guide preferences remain shared across modules on the same origin.

The dairy compatibility exports at `js/config/content.js`, `learning-experience.js` and `world-labs.js` now read the selected pack. Edit dairy educational copy in `js/modules/dairy/content.js` and visual briefs in `learning.js`, rather than those compatibility files.

## Pack schema

The pack is trusted, locally reviewed content, not untrusted user input. Several copy fields allow HTML. Keep markup simple and do not put scripts, internal information or personal names in it.

| Field | Meaning |
|---|---|
| `id` | Stable module identifier. |
| `storageKey`, `leaderboardKey` | Distinct, versioned local-storage keys per module. Never reuse another module's keys. Dairy retains `rcm_journey_v1` and `rcm_leaderboard_v1`. |
| `LOCATIONS` | Nonempty ordered destination array; sequential unlock follows this array. |
| `SCORING` | Nonnegative integers: `lesson`, `quizFirst`, `quizLater`, `collectible`, `location`. |
| `BRAND_ASSETS` | Local `logo` and `seal` asset paths. |
| `EXTERNAL_LINKS`, `ctas` | Optional `products` and `foodservice` URLs and corresponding button labels. These are two legacy CTA slots; labels can describe another topic. Empty objects hide them. Optional `fallbackCtas` supplies shorter labels for the text-version completion panel. |
| `COPY` | `title`, `intro: {line1,line2}`, `map: {header,status,disclaimer}`. |
| `learning` | Optional shared visual briefs keyed by lesson ID; use `{}` when lessons have inline `experience` objects. |
| `film` | `src`, `poster`, `label`, `status`. Empty `src` supports entering without a film. Playback remains skippable. |
| `logoAlt`, `sealAlt` | Accessible descriptions of the branding images. |
| `mapHeading`, `mapCredit` | Header HTML and attribution text. Do not retain dairy/map imagery credit when it does not apply. |
| `help`, `helpGoal`, `mapReturn`, `dropHelp`, `dropLabel` | Topic-specific help, map name and optional collectible copy. |
| `fallbackTitle`, `completed`, `resume` | Fallback title, completion sentence, returning-player button label. |
| `shell` | Copy for the established intro/certificate layout, using the six selectors listed below. |
| `theme` | Optional CSS-variable overrides, for example `{'--green':'#43647a','--green-dk':'#243e50'}`. |

The `shell` copy slots are `#title .eyebrow`, `#title h1`, `#title .subtitle`, `#completeTitle`, `#completeTitle + p` (certificate subtitle), and `#completeSeal + p` (certificate description). They are a fixed layout contract, not a page builder. Totals, badge chips and points are computed automatically. Generic control labels remain shared English UI.

## Destinations and routes

```js
{
  id: 'courtyard', order: 1,
  title: 'A PLACE TO READ', stage: 'Chapter 1 - Courtyard',
  intro: 'Begin at the library courtyard.', color: 0x43647a,
  card: { title: 'Library courtyard', image: 'assets/modules/library/courtyard.webp',
          topic: 'Find a place to read.', duration: 'Signs and shelves' },
  badge: { emoji: 'Book', name: 'Shelf Finder' },
  stationPos: [[-6, 1]], quizPos: [0, -8], drops: [],
  lessons: [/* lesson objects */], quiz: [/* question/fact objects */],
  completeMsg: 'The reading room is ready to visit.',
  environment: { template: 'kit', landscape: 'plaza', buildings: [], props: [] }
}
```

IDs use lowercase letters, digits and hyphens, beginning with a letter. IDs must be unique; `map`, `completion` and other application state names are reserved. Routes default to `<id>Scene`; an optional unique `route` can override this. There is no three-destination requirement. Each lesson needs one `[x,z]` station position. The quiz sign uses the actual lesson count; its atlas grows with that count. Avoid crowding a destination with dozens of signs.

The first destination is unlocked. Each subsequent destination requires the preceding destination's badge. Quiz entry requires that destination's lessons. Any number of destinations can be authored, but each still uses the established explorable space: spawn `(0,8)`, bounds x `-24..24`, z `-26..22`, with the optional demonstration around `(0,17)`. Place required stations in reachable space. Solid scenery automatically participates in clearance before batching. Optional `drops` are `[x,z]` pairs; their stable save identities are `<destination>.drop<index>`. Do not reorder them after release. The shared collectible geometry is a golden droplet; the label is configurable, but a new collectible shape needs code.

## Environment kit and its limits

`template: 'kit'` is the generic composition. It places the declared buildings and props on the shared ground, visitor paths and vegetation. Optional environment fields:

- `ground` and `flecks`: noise-texture colors; default muted green ground. Texture is generated locally.
- `pathColor`, `pathWidth`: station paths; defaults retain the shipped geometry.
- `treeCount`: perimeter trees, default 36, instanced into three meshes.
- `landscape`: `fields` for cultivated rows and an arrival gate, or `plaza` for paving, planters and lamps. The field preset's `gate` sets its sign text. These presets retain their established layout and dimensions.
- `fence: true`: the existing rear perimeter fence; use a fence prop for a custom position/length.
- `flowerColor`, `contacts`: flower color and optional contact ellipses `[x,z,width,depth]`.
- `buildings`, `props`: arrays of scene-kit pieces. Both arrays use the same vocabulary.

Each piece accepts `position: [x,y,z]`, `rotation` (radians around vertical), `color` (hex integer), and where applicable `size: [width,height,depth]`. Sizes and positions are world units. An optional `obstacle` adds a conservative circular movement exclusion.

| Piece `kind` | Parameters and use |
|---|---|
| `building` | Solid exterior box; optional `roof: {color,size,position}`. No accessible interior. |
| `shelter` | Open posts and roof. Required `roof`; optional `postsX`, `postsZ`, `postColor`, `postRadius`, `postBottomRadius`; `roof.tilt` is radians. |
| `box` | Low-cost crates, benches, equipment blocks or display plinths. |
| `fence` | `size`, positive integer `segments`; posts and two rails. |
| `sign` | `text`, optional `scale`; fixed readable board. |
| `tree` | Simple trunk and crown; `size` and `color`. For many trees use the instanced perimeter, not hundreds of individual props. |
| `platform` | Demonstration base; `radius`, `baseRadius`, `color`, `edgeColor`. |

Example shelter:

```js
{ kind:'shelter', size:[6,3,5], position:[-14,0,-5],
  postColor:0x71604a, roof:{color:0x43647a} }
```

The dairy pack selects three compatibility templates: `farmyard`, `facility`, and `storefronts`. Their principal shelter/building shells now use the same kit as a new module, and their sign text is pack data. Ground, station paths, landscaping, perimeter trees, signs and demonstration platform are also shared. The detailed facades, tanker, feeding equipment, herd arrangement, chef and other dairy-specific arrangements remain procedural compatibility code. They are **not** arbitrary configurable facilities. Choosing these templates means accepting those shapes; a different topic should normally use `kit`.

The kit is intentionally small. It cannot create arbitrary architecture, custom animated machinery or an authored character through data. Such requests still need a developer. The cow factory and its procedural geometry were retained unchanged. No per-module heavy 3D assets are required.

## Lessons and media

A lesson has `id`, `title`, `icon`, `intro`, `game` and preferably inline `experience`:

```js
experience: {
  image:'assets/modules/library/shelves.webp', alt:'Illustrated bookshelves',
  caption:'An illustrative library', role:'Library visitor',
  mission:'Read the shelf signs.', takeaway:'Use the signs to find a shelf.',
  feedback:['The sign points to that shelf.', 'Try the shelf named on the sign.']
}
```

Inline briefs allow the same lesson ID in different destinations. Legacy shared briefs in `learning` require module-wide unique lookup keys. Questions can provide their own `experience` to override the linked lesson's image and answer feedback. Feedback positions always correspond to the original answer array, not the shuffled display.

Supported `game.type` values:

- `card`: `prompt`, optional local `video`, `success`. Read/watch and choose Finish lesson. Video has native playback/mute controls, needs a player gesture, and pauses when the lesson closes. Important information belongs in visible text too.
- `multiselect`: `prompt`, `need`, `options: [{t,ic,ok}]`, `success`.
- `match`: `left: [{id,t,ic}]`, `right: [{id,t}]`, `prompt`, `success`. Multiple left items can match one right ID.
- `sequence`: `steps: [{t,ic}]`, `prompt`, `success`, optional `routeLabel`. With no `cool` object, Check order completes the lesson. The optional legacy `cool` configuration powers the existing cooling animation; it is a specialized visual, not a universal simulation.
- `branch`: `products: [{name,ic,steps:[text]}]`, `prompt`, `comparison`, `success`. Requires comparing two paths.
- `seal`: `packages: [{name,ic,seal}]`, `prompt`, `plainLabel`, `success`. Uses the pack's seal asset as a visible label-recognition task.

New mechanics or a different page layout need development. New copy, images, film and answer choices within these mechanics do not.

## Questions and fun facts

```js
{
  id:'shelf', mode:'quiz', from:'signs',
  q:'Which shelf does the blue sign mark?',
  a:['Stories','Maps'], correct:0,
  fact:'In this example, the blue sign marks stories.',
  source:{label:'Approved source',url:'https://example.org/source'}
}
```

Change **only `mode`** between `'quiz'` and `'fact'`. Quiz mode shows shuffled answer buttons and awards the configured first/retry reward once. Fact mode shows a labeled card using `q` and `fact`, with no answer controls and no question points. Keep `a`, `correct`, `from`, source and answer feedback in the item even when it is a fact so it remains ready to switch back. Fact cards are not lessons and do not award lesson points; the destination completion reward still applies when the field-check flow finishes.

For a fact that must not reveal a question's answer early, add `attachedTo: 'other-question-id'` to the fact item. In fact mode it is omitted from the standalone flow and revealed after that question's **correct** answer. An incorrect attempt does not reveal it. In quiz mode it becomes its own scored question; `attachedTo` is ignored. If the target is switched into a fact, its attached facts automatically become standalone cards too. No extra edit is required. Validation catches missing targets and self-attachments.

The worked dairy example is the first farm quiz item in `js/modules/dairy/content.js`. It remains `mode:'quiz'`, preserving the shipped flow, score and answer identity. Its alternate `fact` repeats the existing cow-care takeaway; no new factual claim was added. The older unapproved `funFacts` arrays remain inert historical content and are not displayed by this capability.

Question IDs are stable within a destination and must never be regenerated from display order. Dairy keeps string IDs `'0'`, `'1'`, `'2'` to preserve existing reward ledgers. The ledger retains an earned item's identity across a mode change; fact-mode items cannot earn quiz rewards. Mode changes do not retroactively subtract already-earned points. A completed destination cannot be farmed by changing modes or replaying.

## Optional demonstrations

Each destination may set `spawn: { x, z, yaw }` for its arrival and Reset
position. Omitted spawns retain the shared `{ x: 0, z: 8, yaw: 0 }` default.
Keep the starting point clear of scenery; the rear boundary extends four
units behind farther-back arrivals. The dairy pack uses z=28/32/36 for its
farm/processor/market overview views, with the same eye height and field of view.

Omit `lab` entirely for a destination with no demonstration. Generic demonstrations use:

The launch button reads `Optional: <launchLabel or title>`. Supply a short,
topic-specific `launchLabel` when the title is long; the demonstration belongs
to the destination and may differ from the next lesson in the objective card.

```js
lab: {
  model:'steps', rule:'sequence', lesson:'signs',
  title:'Arrange a reading visit', kicker:'THE READING TABLE',
  intro:'Choose a book, then find a seat.',
  actions:['Choose a book','Find a seat'], labels:['BOOK','SEAT'],
  notes:['Book selected.','Seat found.'],
  retry:'Choose a book first.', finish:'Ready to read.'
}
```

`steps` lights a labeled row of blocks on the shared platform. It supports `sequence` (ordered actions) or `toggle` (discover all actions in any order), with 1-12 actions; use a small count for readable phone layouts. Actions and notes have equal lengths. `platform` can override the kit base's colors and radii. This is a simple visual teaching aid, not bespoke simulation. All demonstrations remain optional, replayable, unscored and outside completion prerequisites.

Specialized existing models are `comfort` (three toggle actions), `line` (three sequence actions), and `delivery` (two sequence actions). Their visual geometry is still topic-shaped. Copy, labels, related lesson, retry and completion text live in the pack. A materially new model needs developer work.

## Verification and effort

The existing dairy content/acceptance tests intentionally assert its nine lessons, copy and answer choices. Run those regressions with the default dairy selector. Add a new pack-specific acceptance scenario using the library harness (HTTP content selection), and run it alongside the dairy tests. Changing the deployment selector does not rewrite those content assertions automatically; test authoring is part of module assembly and does not require engine edits.

Run `npm.cmd test`, `npm.cmd run test:browser`, then `$env:BROWSER_CPU_THROTTLE='4'; npx.cmd playwright test --workers=1` in PowerShell. Clear that environment variable afterwards. Use `node scripts/verify-vendor.mjs`, `npm.cmd run package:site`, `node scripts/verify-site.mjs` and `node scripts/smoke-package.mjs` for packaging checks. The package smoke script currently asserts the dairy journey and must be adapted in tests for a new deployment. With the local server on port 4175, `node scripts/smoke-module-video.mjs` checks optional lesson-video interruption cleanup, and `node scripts/measure-modules.mjs` records the dairy/library rendering workload. No git command is required by this guide.

The library browser fixture actually boots the shared app, renders both destinations, uses the generic demonstration, completes all its lessons/quizzes, unlocks sequentially, shows the certificate, reloads and checks reward deduplication. A second case flips one field and completes through the non-WebGL path. Desktop and touch projects exercise both cases. Unit checks also validate 1, 4 and 7 destinations, reserved routes and malformed fact references. This proves reuse for the supplied mechanics, not every conceivable content combination.

Record draw calls, triangles and repeated-visit resources with `window.__game.renderInfo()`. Keep mobile Auto conservative, no realtime shadows, and static scenery batched. Establish an explicit media budget before importing assets: use resized/compressed images, a short compressed film, no raw 3D exports. There is no guarantee that an arbitrarily large content pack or video remains within current download/GPU costs. Browser CPU throttling is not physical-phone frame-rate certification.

For a comparable second module with approved copy and usable media, allow roughly **1-2 developer days (8-16 hours)** for pack assembly, media preparation, scene placement, automated acceptance and phone-layout review, plus **0.5-1 day** of content/educator review. A smaller text/image pack can take less. Research, sourcing/licensing, new artwork, film production, accessibility review on real hardware and stakeholder revision cycles are additional. New mechanics, interiors or custom 3D demonstrations can add multiple days and should be scoped separately.

The reduced cost is realistic for content replacement using the kit; it is not a commitment to custom 3D work within a content-only budget.
