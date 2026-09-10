# Working on the California dairy journey

This is a static, native ES-module Three.js educational game for phones and
desktop browsers, hosted on GitHub Pages. Read README.md, LEARNING-QA.md and
SHOWCASE-NOTES.md for architecture, factual sources and current tradeoffs.

## Working agreement

- Preserve the user's existing changes. Do not run git commands unless the
  user explicitly authorizes them; the showcase workflow leaves review and
  commits to Ameya.
- Human decisions go in QUESTIONS-FOR-AMEYA.md for noninteractive runs.
  Continue on reversible defaults; do not purchase assets or introduce secrets.
- No remote telemetry, runtime API keys, or external CDN dependency.
- Keep the nine lessons, quiz answer identities, reward deduplication,
  certificate and non-WebGL path working. Optional demonstrations award no
  points and are not prerequisites.

## Build and verify

`npm ci`, `npm run vendor`, `npm test`, `npm run test:browser`,
`npm run package:site`. On Windows with restricted PowerShell script execution,
use `npm.cmd`. Browser tests need the Playwright Chromium browser installed.
CI also checks the vendor tree against the repository; never hand-edit vendor.
`node scripts/verify-vendor.mjs` checks byte equality to installed upstream
without invoking git. It does not replace CI's repository comparison.

The deploy workflow publishes only site-dist/, produced from index.html,
assets/, css/, js/ and vendor/. New runtime directories require packaging updates.
No game framework or bundler is currently needed.

## Change boundaries

- `js/app.js`: navigation, renderer lifecycle, player input and scene assembly.
- `js/config/content.js`: existing lesson/quiz data and score values.
- `js/config/world-labs.js`: optional demonstration copy and pure state rules.
- `js/scenes/world-lab.js`: replaceable 3D demonstration models and accessible UI.
- `js/scenes/batch-scenery.js`: immutable scenery only; never batch interactive
  or animated descendants. Explicitly dispose instance buffers on scene exit.
- `js/core/progress.js`: reward/persistence contract. Keep old saves valid.
- `css/world.css`: demonstration and movement-guide styling.

## Review priorities

1. Test touch portrait and short landscape, keyboard, reduced motion and
   WebGL context loss. A screenshot is not evidence of real-device frame rate.
2. Keep mobile auto quality at a conservative pixel ratio and without realtime
   shadows. Measure draw calls, triangles and resource growth through
   `window.__game.renderInfo()`. These debug values never leave the device.
3. Repeated scenery should use instancing. Models must fit an explicit download,
   texture and triangle budget; never ship raw generation-service exports.
4. Audio needs a user gesture, an effective mute and interruption cleanup.
   Essential information must also be visible as text.
5. Any new factual dairy claim needs a primary source in LEARNING-QA.md.
   These scenes are illustrative, not claims about a particular real facility.

This file follows the repository instruction convention documented in
[OpenAI's AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md/).
