# Real California Milk: The Farm-to-Flavor Journey

An interactive 3D educational experience about the **California dairy supply
chain**. The player starts in space, flies down to California, then visits three
destinations to learn how milk moves from farms to processors to grocery and
restaurant kitchens.

> **Working title / concept — pending client review.** All brand assets,
> educational copy, links, and any facility/company names must be confirmed and
> approved by Real California Milk (CDFA / CMAB) before public launch. See
> **“Client approvals still required”** below.

The journey (Farm → Processor → Grocery/Foodservice):

- **Stage 1 · Dairy Farms / Producers** — *Where Milk Begins*
- **Stage 2 · Processors / Dairy Product Manufacturers** — *Where Milk Becomes Dairy Products*
- **Stage 3 · Grocery, Restaurant, Foodservice & Other Buyers** — *Where California Dairy Meets Its Customers*

Each location has **3 short lessons + a 3-question quiz + a badge**. Nine lessons
and three badges total. Target play time ≈ 7–10 minutes.

Each destination also has a **Try it in the world** demonstration: build a cow
comfort corner, follow a batch of drinking milk, or route packages to buyers.
These are optional, replayable and keyboard-accessible, with visible changes
to the 3D model and explanatory feedback. They add no mandatory steps or points.
See [IMPLEMENTATION-NOTES.md](IMPLEMENTATION-NOTES.md) for the latest implementation review
and [OPEN-DECISIONS.md](OPEN-DECISIONS.md) for human decisions.

---

## Run it locally

It’s a **static ES-module site** with no game build step. `index.html` is
the page shell; browser-native modules in `js/` use the pinned, self-hosted
Three.js distribution in `vendor/three/` and local assets in `assets/`.
No external CDN is required to load the experience.

- **Local server (recommended):**
  ```bash
  npm start
  ```
  then open http://localhost:4174. No dependency install is needed to serve.
- Set `PORT=4176 npm start` if that port is busy.
- Use HTTP, not `file://`. ES-module loading from a file URL varies between
  browsers and can fail. The file view now explains how to open the server.
- The opening film plays on each visit. Pause, skip, and enter controls are
  always available. Reduced-motion users choose whether to play it.

Works on desktop (WASD + mouse-drag look) and mobile (joystick + touch look +
big Interact button). If WebGL is unavailable, a **text-friendly fallback**
delivers the same lessons, quizzes, and certificate.

## Deploy on GitHub Pages

This project is 100% static and Pages-ready.

The workflow in `.github/workflows/deploy-pages.yml` runs unit and browser
tests for PRs targeting `staging` or `main`. Branch pushes deploy only after
the tests pass: `staging` to `/staging/`, `main` to the production root.
The configured repository is `lidvizion/dairy-farm-explorer`.

`npm run package:site` copies only runtime files to `site-dist/`; development
dependencies and test artifacts are not published. `npm run vendor`
reproduces the checked-in Three.js files from the exact dependency version
and preserves the upstream MIT license. Review rendering tests before any
engine upgrade. No database or application server is required.

For a local package audit, run `node scripts/verify-site.mjs` after packaging.
`node scripts/smoke-package.mjs` exercises the actual package under the
`/dairy-farm-explorer/` project prefix using Playwright Chromium. Neither script
publishes anything. `node scripts/verify-vendor.mjs` checks upstream byte equality
without using git; CI still performs its checked-in vendor comparison.

---

## Where to edit things (for non-developers)

Core content lives in [js/config/content.js](js/config/content.js). Visual
briefs, photos, and per-answer explanations live in
[js/config/learning-experience.js](js/config/learning-experience.js):

| You want to change… | Edit this |
|---|---|
| Titles, intro lines, map header/disclaimer | `COPY` object |
| Location names, stages, intros, lesson text, mini-games | `LOCATIONS` array |
| **Quiz questions & answers** | each location’s `quiz:[ … ]` inside `LOCATIONS` |
| Badge names / emoji | `BADGES` object |
| Brand asset file paths | `BRAND_ASSETS` object |
| External CTA links | `EXTERNAL_LINKS` object |
| Scoring values | `SCORING` object |
| Photos, activity missions, takeaways, answer explanations | `LEARNING_EXPERIENCES` |

Lesson text is **not** scattered through the 3D code — it all lives in
`LOCATIONS`. The mini-game *renderers* (Section 5) are generic and read from the
`game:{…}` object on each lesson, so you can revise wording without touching
rendering logic.

### Module map

| Responsibility | Module |
|---|---|
| Page entry point and game orchestration | `js/app.js` |
| Content, locations, scoring, links | `js/config/content.js` |
| Local progress and analytics adapter | `js/core/progress.js` |
| Synthesized game audio | `js/core/audio.js` |
| Shared DOM helpers | `js/ui/dom.js` |
| Lesson and quiz renderers | `js/lessons/renderer.js` |
| Lesson-content validation | `js/lessons/validate-content.js` |
| Graphics-quality policy | `js/scenes/quality.js` |
| Film lifecycle, independent of WebGL | `js/ui/intro.js` |
| Accessible photographic chapter selector | `js/ui/journey-map.js` |
| Photo/task layouts and option shuffling | `js/lessons/presentation.js` |
| Undoable route and pausable cooling demonstration | `js/lessons/milk-route.js` |
| Farm, processing, and market environment builders | `js/scenes/location-environments.js` |
| Instanced trees, paths, atmosphere | `js/scenes/environment-detail.js` |
| Rig-aware prop animation | `js/scenes/animation.js` |
| Demonstration copy and pure interaction state | `js/config/world-labs.js` |
| Live 3D demonstration models, camera and accessible controls | `js/scenes/world-lab.js` |
| Fields, planted plazas, contact shading and clouds | `js/scenes/place-details.js` |
| Immutable scenery draw-call batching | `js/scenes/batch-scenery.js` |
| Action-driven first-use movement guidance | `js/ui/trail-guide.js` |

**Localization (future):** educational copy is separated from rendering.
Generic control labels still need extraction to a shared locale dictionary.
English is the only language shipped now.

## Replacing brand assets

The opening, seal activity, and certificate use the existing
`assets/real-california-milk-logo-official.webp` at its native aspect ratio.
The old placeholder SVG is retained on disk but is no longer used by the UI.

- `assets/real-california-milk-logo-official.webp`

Drop the **client-approved files in at the same paths/filenames** and they
appear automatically (title screen, packages, seal-spotter, certificate).

**Brand rules enforced in this build:**
- Use the **current Real California Milk seal** only. The retired *Real
  California Cheese* seal is never used.
- The seal is displayed **unaltered** — square/native aspect, never stretched,
  recolored, cropped, animated, or turned into a collectible.
- Collectibles are original **golden milk drops**, not the seal.
- Colors/fonts are California-forward placeholders; see the `:root` CSS block —
  every brand value is commented `CLIENT:` for approval.

## How progress is stored

- Saved locally with **`localStorage`** under the key **`rcm_journey_v1`**
  (points, lessons, locations, badges, optional collectibles, first-try count).
- Sound preference: `rcm_sound`. Graphics quality: `rcm_quality`.
- Quiz rewards have a per-question ledger and cannot be farmed by replaying.
  Completed older saves are protected even when they lack that ledger.
- The film is shown on every fresh page load; it is not skipped by a session flag.
- If storage is denied, the game remains usable but progress lasts only for
  the current page session.
- **No login. No accounts. No personal information is collected or transmitted.**
  The optional name on the certificate is shown on-screen only and is never
  saved or sent.

### How to clear saved progress
- In-game: **Help (❓) → “Reset all progress”**, or “Play Again” on the
  certificate (both ask for confirmation). The HUD Reset control only resets
  your position.
- Manually: browser DevTools → Application → Local Storage → remove
  `rcm_journey_v1` (or run `localStorage.removeItem('rcm_journey_v1')`).

## How to connect analytics later

A privacy-conscious **no-op analytics wrapper** is built in
(`js/core/progress.js`). It already fires events: `intro_started`, `intro_completed`,
`map_opened`, `location_started`, `lesson_started`,
`lesson_completed`, `quiz_started`, `quiz_answered`, `location_completed`,
`game_completed`, `external_cta_clicked`. **No personal data is included.**

To forward events to the client’s platform, call once at startup:

```js
Analytics.connect(payload => {
  // e.g. window.gtag('event', payload.event, payload);
});
```

By default events go nowhere (optionally `console.debug` when
`window.__RCM_DEBUG = true`).

---

## Accessibility & UX

- Keyboard-accessible menus, visible focus rings, high-contrast text.
- Reduced motion pauses the opening film until requested and bypasses the
  animated cooling wait. Decorative UI motion and camera bob are disabled.
- Dialog focus is contained and restored; background controls are inert.
- The 3D world pauses while reading or answering a lesson.
- Captions / aria-live regions for narration and important text.
- Persistent **Map**, **Help**, **Sound**, and **Reset** controls.
- Non-WebGL fallback contains the full educational journey.
- Quality options: **Auto / High / Performance** (mobile detection, pixel-ratio
  and shadow limits). Destination scenes are built lazily and disposed on exit
  (geometry, materials, textures) so only one scene and one animation loop run
  at a time.

## Controls

**Desktop:** `W A S D` / arrows to move · mouse-drag to look · `E` or click to
interact · `Shift` to move faster · `Esc` or the Map button to leave a scene.

**Mobile — dual on-screen thumb sticks (Roblox-style):** the **left stick
moves**, the **right stick looks** around. The big **Interact** button turns gold
and reads **OPEN** when you’re beside a station.

**Easy navigation (all platforms):**
- **📋 Steps** (top-right, inside a location) opens a menu to jump straight to
  any lesson or the quiz — no walking required.
- The **Next lesson** panel starts the next incomplete activity directly.
- The chapter selector uses large photo cards with explicit unlock conditions.

## Verify changes

```bash
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

Browser tests run the real self-hosted engine on desktop and a touch/mobile
Chromium viewport. They cover all nine activities, every incorrect quiz
option, correct answers, retries, score deduplication, reloads, completion,
reset, movement, quality switching, fallback, film playback, interrupted
cooling, unavailable media/storage, and keyboard focus. Screenshots and
failure traces are written to `test-results/` (ignored by Git).

This is not physical-device certification. Safari/iOS, real school hardware,
screen-reader testing, and client content/asset approval remain release checks.
See [LEARNING-QA.md](LEARNING-QA.md) for the question-by-question review.

---

## Client approvals still required

Before public launch, Real California Milk should provide / approve:

1. **Official logo** → replace `assets/real-california-milk-logo-official.webp`.
2. **Current seal** → confirm usage rights and the existing WebP asset.
3. **Approved brand colors** → update the `:root` CSS `CLIENT:` values.
4. **Approved fonts / web-font files** → currently system fonts.
5. **Final educational copy** → `LOCATIONS` + `LEARNING_EXPERIENCES`.
   Activities are simplified, not food-production instructions. Legacy
   off-topic nutrition/comparison `funFacts` remain in the source pending
   review but are not displayed in the revised quiz results.
6. **Final calls to action** and **approved links** → `EXTERNAL_LINKS`
   (currently realcaliforniamilk.com and realcaliforniamilkfoodservice.com).
7. **Any real farm / processor / retailer / restaurant names** — none are used;
   all locations are labeled illustrative.
