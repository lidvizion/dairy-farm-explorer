# Dairy Farm Explorer — UX and Game Improvement Plan

## Product diagnosis

The original build already contains a complete, accessible educational journey: three locations, nine activities, quizzes, persistent progress, mobile controls, a no-WebGL fallback, and real dairy photography. Its weakest point is the seam between those parts. A cinematic Google Earth arrival and documentary lesson photos lead into saturated low-poly scenes, emoji beacons, giant virtual controls, and arcade reward effects. The world feels like a navigation wrapper around modal worksheets instead of one believable dairy journey.

Several implementation defects also break the intended flow: movement stops being camera-relative after turning, the intro timeout uses the wrong unit, map pins can stop responding after a drag, processor objectives sit inside collision geometry, the unlocked quiz hint can throw, and graphics quality changes do not affect the active renderer.

## Shipped direction: a working California dairy journey

The redesign treats the experience as a short interactive field visit. Realistic environmental backplates, physically based foreground props, quieter wayfinding, location ambience, and an editorial field-log interface connect the farm, processor, and market into one refrigerated route.

The core rhythm remains easy to understand:

1. Arrive in a working environment.
2. Follow a numbered inspection point or open the Field Guide.
3. Read a concise real-world observation.
4. Make a decision or complete a process.
5. Receive a restrained confirmation and advance the journey log.

This release preserves the approved nine-lesson and three-quiz structure, content qualifiers, local-only progress, direct navigation, accessibility behavior, and non-WebGL path. It avoids new statistics, health claims, named facilities, or environmental performance claims.

## Release priorities

### 1. Trust and atmosphere

- Use full-bleed documentary farm imagery for arrival.
- Give each 3D location a purpose-built realistic environment backplate.
- Switch scene props to physically based materials, ACES tone mapping, softer light, grounded colors, and location-specific fog.
- Replace the most mascot-like cow geometry with a realistic billboard asset.
- Add subtle procedural ambience for farm, processing, and market chapters.

### 2. Clear, restrained interface

- Replace the four emoji score pills with a compact Journey Log.
- Convert the title card into an editorial arrival panel with a visible three-stop route.
- Replace giant glowing emoji pillars with numbered physical inspection markers.
- Add a small current-chapter panel and center reticle on desktop.
- Show virtual sticks and the large action button only on touch devices.
- Restyle lessons as warm-paper field notes with strong typography and quieter motion.

### 3. Reliable exploration

- Correct camera-relative movement and reduce field of view, speed, and head bob.
- Move every objective outside collision geometry.
- Fix the quiz proximity exception and the intro fallback.
- Apply graphics quality choices immediately.
- Cancel scene timers, clear input state on blur, and dispose background textures.
- Prevent replayed quizzes from farming score.

### 4. Safer shipping

- Add static validation before GitHub Pages deployment.
- Add deployment concurrency so stale jobs cannot race newer releases.
- Correct repository and live-site documentation.
- Keep the placeholder-brand warning explicit until client approval is recorded.

## Next horizon

A future content-approved release can integrate assessment into the world itself: activate farm cooling equipment, approve a processor receiving panel, run a visible packaging line, stock a cold case, and route a foodservice order. Those decisions should trigger machinery, package, and vehicle animation so the environment responds to learning. Licensed glTF equipment, audited photo provenance, field-recorded spatial audio, and an approved shareable certificate would take the experience beyond this lightweight single-file production build.
