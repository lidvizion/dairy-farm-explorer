# Open decisions

## Shared leaderboard follow-up

The leaderboard remains device-local after checking hosted options. Details,
sources and the owner actions are in [docs/LEADERBOARD.md](docs/LEADERBOARD.md).
The recommended future route is an owner-created free Supabase project, only
if its documented non-secret publishable key is explicitly permitted. No
account, key, hosted board or remote score submission was created. Public
client scores remain spoofable even with an account and database-side rules.
The arcade presentation, blank-name cow aliases and validation improvements
are complete locally; they do not depend on this decision.

## Presentation release candidate: current priorities

Freeze feature scope for tomorrow. Keep the procedural cow and content-pack
refactor, including the subsequent route-confirmation and brand-palette work.
Current-run evidence and the publication/device gate are recorded in
`docs/RELEASE-CHECKLIST.md` and `IMPLEMENTATION-NOTES.md`.

Highest-value human action: test the actual candidate on an iPhone/Safari and
a mid-range Android. Record the URL/build and device results; the currently
published build may not contain the local candidate. Emulator screenshots and
draw-call counts do not establish phone frame rate or Safari audio behavior.

Chase the missing client question attachment, film distribution rights (the
Google Earth watermark remains intact), existing brand/photo rights and the
module/maintenance scope before the proposal is final. If film rights cannot
be established, use a verified film-free package or an approved replacement;
skipping playback is not removal from the downloadable site. Do not silently
change the current film while that decision is pending.

The purchased cow is retired following the maintainer's licence decision.
The candidate uses an original authored vertex mesh: 414 triangles per cow,
with separate rigid head and tail sections for idle motion. The converted GLB
is kept only under ignored `cow assets/retired/`, outside the deployed assets.
The independent module fixture proves the reuse seam, not completed client
content for module two.

Optional infrastructure review is requested in `AGENT-REQUESTS.md`. It does not
block local testing and does not authorize agent publishing or git operations.


## September 10 client feedback / tomorrow's presentation

The website palette is now applied; see `docs/BRAND-REFERENCE.md` for fetched
CSS evidence and `docs/CLIENT-HANDOFF.md` for the complete response to feedback.
Final brand/font approval remains open. The procedural cow and reusable module
work remain local and uncommitted; the maintainer owns review and publishing.

Chase the missing client question attachment before writing new questions or
facts. The pack supports both modes already. The account lead should reconcile the $3k
package with ~$1k per module, specify how many are additional, and define the
$100/month maintenance scope. $3k plus twelve monthly payments is $4,200;
four $1k modules plus those payments is $5,200, before any other charges.

Defer inverted look until client greenlight. Confirm vertical-only versus
both axes if resumed; a handedness swap is a separate preference. Keep mobile
Auto without realtime shadows. Physical Android/iPhone checks remain open.
No external agent dispatch is required for this feedback pass.

September 9, 2026. None of these blocked the implementation. No credentials,
paid services, git commands, publishing or external messages were used.

## 1. Is the illustrated field-guide direction the right brand fit?

**Options:** keep the warm procedural miniature world; commission a cohesive
stylized asset set; pursue a photorealistic branded farm tour.

**Recommendation:** keep the field-guide direction and commission a small,
consistent set of hero assets. Photorealism would need a larger asset and mobile
performance production effort than this game warrants.

**Meanwhile:** kept the existing brand assets and lesson photography, added
grounded trail signs, cultivated fields, planted plazas and hands-on models.
The scenes remain explicitly illustrative. No claim of client approval.

## 2. Should the hands-on demonstrations become part of scored progression?

**Options:** optional exploration; replace one lesson per destination; require
the demonstrations as additional activities.

**Recommendation:** keep optional for this demo, then observe five first-time
players before deciding whether they should replace existing activities.

**Meanwhile:** added three replayable demonstrations, with explanatory text,
wrong-choice feedback, keyboard controls and direct links to related lessons.
They do not award points or alter saved progress. If approved as replacements,
the pure state rules can signal lesson completion through the existing reward
API; do not add a second points system.

## 3. May we use Meshy for a small hero-asset pack?

**Options:** procedural assets only; one approved cow; cow plus a coordinated
prop pack (milk tank, tanker cab and market packaging).

**Recommendation:** start with one gentle-looking Holstein cow, with a readable
silhouette, separate head/tail nodes if practical, and a matching stylized milk
tank. This is where authored modeling would most improve the showcase.

**Requested budget:** target a cow at 3–6k triangles, one 512px base-color atlas,
and 250–500 KB delivered GLB; tank/props together 4–8k triangles and 300–600 KB.
Aim for less than 1 MB of incremental download for the first pack, lazy-loaded
on destination entry. These are acceptance targets, not measured Meshy export
sizes or a pricing quote. Raw generated exports need optimization. A 512px
RGBA texture costs about 1.33 MiB with mipmaps, independent of compressed
download size; avoid separate 2K maps on every prop.

**Meanwhile:** shipped procedural models; the demonstration factory returns a
root group plus `sync`/`update`, and the farm cow has a shared `makeCow` factory.
These are the replacement seams. No model loader or empty network requests
were added before there is an approved asset. A future implementation needs a
same-origin, lazy glTF loader, procedural fallback and late-load disposal guard;
the interaction/lesson state does not need a rewrite. Credentials must stay
outside this repository and the shipped site. No Meshy credits were spent.

## 4. Who signs off the educational simplifications and asset rights?

**Options:** internal demo only; client educator/brand review before public
promotion; expanded formal curriculum review.

**Recommendation:** client educator and brand review. Confirm the target age
range, copy tone, logo/photography rights and certificate wording. In particular,
review the simplified receiving → heating → cooling/packaging demonstration.

**Meanwhile:** retained cited quiz answers, documented sources for new claims
in LEARNING-QA.md, and avoided temperatures, nutrition promises, environmental
statistics or a claim that every dairy facility is configured this way.

## 5. What is the real Digi Dash embedding contract?

**Options:** link to the standalone game; embed an iframe with device-local
progress; add a host-controlled completion/progress bridge.

**Recommendation:** iframe first, then define allowed origins, versioned
messages, completion semantics, save ownership and audio/visibility behavior.

**Meanwhile:** kept the deployable standalone static site, local-only progress,
existing leaderboard semantics and no cross-origin messaging or analytics.
No framework/build migration was needed for this pass.

## 6. Which actual phones are the release floor?

**Options:** a named three-year-old Android and an iPhone/Safari pair; a broader
device lab; browser emulation only.

**Recommendation:** physical mid-range Android plus iPhone/Safari, including a
ten-minute session, repeated destination visits, rotation, background/foreground,
mute and context recovery. Browser emulation cannot certify GPU speed or Safari
audio behavior. Also run a short screen-reader and first-time learner session.

**Meanwhile:** retained conservative mobile quality, batched immutable scenery,
added deterministic draw-call/resource regression checks and responsive demos.
The test suite's “mobile” project is touch Chromium, not real iOS Safari.


## September 10 asset research handoff (supplied by Terra)

These are leads, not approved or integrated assets. Terra reported CC0,
commercial use allowed and no attribution requirement:

- [Quaternius Farm Animal Pack](https://quaternius.com/packs/farmanimal.html):
  CC0 1.0, seven animated animals including a cow; FBX/OBJ/Blend, requiring a
  Blender GLB export. Triangle counts, texture sizes, breed/colour, file weight
  and rig structure are unpublished and must be inspected.
- [Quaternius Farm Buildings Pack](https://quaternius.com/packs/farmbuildings.html):
  CC0, 13 untextured buildings; a promising style match for barns, fences and shelters.
- Quaternius Sushi Restaurant Kit: CC0, native glTF. Consider selected generic
  props only, not the entire restaurant kit.

Rejected leads: the Sketchfab CC-BY-SA cow (copyleft unacceptable for this brand
project), the 13.3k-triangle CC-BY cow turret (wrong subject), and Kenney cows
(the researched assets were 2D).

**Human next step:** download and preserve licence evidence, convert selected
assets in Blender, decimate, and inspect the result (or arrange a Meshy job).
No conversion pipeline is available here. Cow acceptance ceiling: 6k triangles,
no texture above 1K; selected lazy-loaded GLBs together below 1 MB Brotli.
These are gates, not estimates of what an uninspected pack will weigh.

**Integration seam:** retain `makeCow(scale, spotted)` and its procedural fallback;
normalize an approved cow to the same ground origin, +X forward and dimensions.
Only attach the existing head/tail animation adapter when those nodes are verified.
Keep `createLabVisual` root/sync/update and educational state independent of models.
A future asset manifest should record local path, author/licence evidence, measured
triangles, texture sizes, bounds, rig mapping and raw/Brotli bytes. Add a same-origin
lazy loader with scene-exit cancellation/disposal only once real approved files exist.
No assets, loader, placeholder URL, network request or new dependency was added.

**Next review:** a Sol adversarial movement/placement audit would be useful after
this patch, especially close approaches at storefront corners and sign rear faces.
Physical Android and iPhone/Safari testing remains more valuable than more asset
research until the cow conversion pipeline has an owner.

## September 10 procedural cow follow-up

The procedural rebuild is complete in `js/scenes/cow.js`, shared by the herd
and demonstration through the existing `makeCow` interface. It uses three
draw calls and fewer than 2,800 triangles per animal, with no textures. See
IMPLEMENTATION-NOTES.md for matched before/after scene measurements.

An authored cow remains a separate future decision. The current recommendation
is to use the improved procedural version for this game's normal viewing range;
evaluate an authored model only if close-up presentation or richer animation
becomes a requirement. No download, conversion, purchase or loader was added.
