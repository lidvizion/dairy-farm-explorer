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

---

## Run it locally

It’s a **single self-contained `index.html`** — no build step, no install. It
loads Three.js from a CDN (needs internet) and uses local placeholder assets in
`assets/`.

- **Local server (recommended):**
  ```bash
  python3 -m http.server 8431 --directory dairy-farm-explorer
  ```
  then open http://localhost:8431
- Or use the **`dairy-farm-explorer`** entry in `.claude/launch.json`.
- Opening the file directly (double-click) also works, but a local server is
  more reliable for ES-module import maps.

Works on desktop (WASD + mouse-drag look) and mobile (joystick + touch look +
big Interact button). If WebGL is unavailable, a **text-friendly fallback**
delivers the same lessons, quizzes, and certificate.

## Deploy on GitHub Pages

This project is 100% static and Pages-ready.

1. Commit `index.html`, `assets/`, and `README.md` to the repo
   (`shawnwilborne/dairy-farm-explorer`), branch `main`.
2. GitHub → **Settings → Pages** → Source: `main` / root. (Already configured
   for the existing site.)
3. Live URL: https://shawnwilborne.github.io/dairy-farm-explorer/
   Allow a minute for the CDN to refresh after a push.

No server, database, or build is required. The **Drive copy is canonical** — to
update the live site, push the updated `index.html` + `assets/` to the repo’s
`main` branch.

---

## Where to edit things (for non-developers)

Everything content-related lives in clearly labeled sections near the **top of
the `<script type="module">` block** in `index.html`:

| You want to change… | Edit this |
|---|---|
| Titles, intro lines, map header/disclaimer | `COPY` object (Section 2) |
| Location names, stages, intros, lesson text, mini-games | `LOCATIONS` array (Section 2) |
| **Quiz questions & answers** | each location’s `quiz:[ … ]` inside `LOCATIONS` |
| Badge names / emoji | `BADGES` object |
| Brand asset file paths | `BRAND_ASSETS` object |
| External CTA links | `EXTERNAL_LINKS` object |
| Scoring values | `SCORING` object |

Lesson text is **not** scattered through the 3D code — it all lives in
`LOCATIONS`. The mini-game *renderers* (Section 5) are generic and read from the
`game:{…}` object on each lesson, so you can revise wording without touching
rendering logic.

**Localization (future):** all player-facing strings are inside `COPY`,
`LOCATIONS`, and `BADGES`. To add Spanish later, wrap these in a language-keyed
lookup (e.g. `{ en:{…}, es:{…} }`) and select the active language — no scene
logic needs to change. English is the only language shipped now.

## Replacing brand assets

Placeholders live in `assets/`:

- `assets/real-california-milk-logo.svg`
- `assets/real-california-milk-seal.svg`

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
- The Earth intro “seen this session” flag uses `sessionStorage`
  (`rcm_introSeen`) so it won’t force-replay mid-session.
- **No login. No accounts. No personal information is collected or transmitted.**
  The optional name on the certificate is shown on-screen only and is never
  saved or sent.

### How to clear saved progress
- In-game: **Help (❓) → “Reset all progress”**, or the **Reset** control /
  “Play Again” (each asks for confirmation).
- Manually: browser DevTools → Application → Local Storage → remove
  `rcm_journey_v1` (or run `localStorage.removeItem('rcm_journey_v1')`).

## How to connect analytics later

A privacy-conscious **no-op analytics wrapper** is built in (`Analytics`,
Section 3). It already fires events: `intro_started`, `intro_completed`,
`intro_skipped`, `map_opened`, `location_started`, `lesson_started`,
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
- `prefers-reduced-motion` respected — the camera flight is replaced by simple
  crossfades, and non-essential animations are disabled.
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
- On the **map**, a row of large **destination buttons** at the bottom enters
  each stop, so you never have to tap a small 3D pin. Locked stops are greyed
  until you unlock them.

---

## Client approvals still required

Before public launch, Real California Milk should provide / approve:

1. **Official logo** → replace `assets/real-california-milk-logo.svg`.
2. **Official (current) seal** → replace `assets/real-california-milk-seal.svg`.
3. **Approved brand colors** → update the `:root` CSS `CLIENT:` values.
4. **Approved fonts / web-font files** → currently system fonts.
5. **Final educational copy** → `COPY` + `LOCATIONS` (kept general; no
   statistics, rankings, environmental goals, or nutrition/health claims are
   included pending approved sources).
6. **Final calls to action** and **approved links** → `EXTERNAL_LINKS`
   (currently realcaliforniamilk.com and realcaliforniamilkfoodservice.com).
7. **Any real farm / processor / retailer / restaurant names** — none are used;
   all locations are labeled illustrative.
