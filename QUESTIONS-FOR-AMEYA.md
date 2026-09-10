# Decisions for Ameya

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
