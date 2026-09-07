---
name: "Working California Dairy"
version: "1.0"
tags:
  - documentary
  - grounded realism
  - agricultural
  - cinematic web game
author: "Dairy Farm Explorer team"
source_url: "https://github.com/lidvizion/dairy-farm-explorer"
created: "2026-09-05"

style_prompt_short: >
  A grounded, cinematic field journey through working California dairy environments.
  Documentary photography, honest materials, restrained interface chrome, and warm natural light replace toy-like geometry and arcade decoration.

style_prompt_full: >
  Create a contemporary California dairy field journey with the credibility of documentary location photography and the clarity of a premium interactive museum exhibit. Use deep field green #123C2B, near-black #101A16, warm paper #F4F0E6, sun-washed amber #D59B36, galvanized steel #AEB8B5, dusty earth #8A725A, cool refrigeration blue #8DB9C5, and white #FFFFFF. Place photoreal working environments behind restrained physically based 3D props. Materials should read as compacted soil, concrete, brushed steel, glass, painted metal, wood, and living plants. Use Georgia for evocative display moments and a clean system sans serif for interface text. Build hierarchy with small uppercase field labels, large sentence-case chapter titles, thin rules, squared cards with modest 8–14px corners, and generous negative space. Interface panels may use translucent charcoal or warm paper with subtle borders and soft depth. Motion is measured: slow fades, short camera eases, quiet waypoint pulses, moving fans, drifting dust, and restrained machinery response. Audio uses subtle location ambience and tactile confirmations. Preserve legibility, keyboard access, reduced-motion behavior, large touch targets, and the direct Field Guide path. Avoid emoji as primary navigation, candy gradients, giant glowing pillars, toy proportions, saturated grass, bubbly pill overload, constant confetti, cartoon characters, exaggerated bounce, fantasy machinery, and unverified brand or operational claims.

colors:
  primary:
    - name: "Field Green"
      hex: "#123C2B"
      role: "brand anchor, navigation, active route, environmental trim"
    - name: "Night Soil"
      hex: "#101A16"
      role: "cinematic overlays, primary text, HUD glass"
    - name: "Warm Paper"
      hex: "#F4F0E6"
      role: "lesson surfaces, readable cards, certificate ground"
  accent:
    - name: "California Amber"
      hex: "#D59B36"
      role: "current objective, calls to action, earned progress"
    - name: "Cold Chain Blue"
      hex: "#8DB9C5"
      role: "cooling, refrigeration, processing details"
  neutral:
    - name: "Galvanized Steel"
      hex: "#AEB8B5"
      role: "equipment, borders, muted interface elements"
    - name: "Dusty Earth"
      hex: "#8A725A"
      role: "farm ground, supporting warmth"
    - name: "Mist"
      hex: "#DDE3DE"
      role: "subtle dividers, inactive progress, atmospheric haze"

typography:
  display:
    family: "Georgia, Times New Roman, serif"
    weight: "bold"
    style: "sentence case, compact leading, editorial rather than decorative"
  body:
    family: "Segoe UI, system-ui, sans-serif"
    weight: "regular"
    style: "sentence case, generous line height, clear at small sizes"
  caption:
    family: "Segoe UI, system-ui, sans-serif"
    weight: "bold"
    style: "small uppercase labels with 0.12em tracking"
  rules:
    - "Use serif display type only for arrival, chapter, and completion moments."
    - "Keep controls and activity text in the sans serif family."
    - "Use uppercase for short metadata labels, never for long body copy."

layout:
  grid: "8px base unit with a 12-column desktop composition and single-column mobile cards"
  alignment: "flush left for editorial content; centered only for completion and compact status"
  aspect_ratio: "16:9 primary, fluid portrait fallback"
  notes:
    - "Let the environment occupy most of the viewport; UI should frame it rather than cover it."
    - "Keep one primary action per surface and show secondary controls with quieter contrast."
    - "At touch sizes, controls stay inside thumb zones without obscuring the current objective."

motion:
  transitions:
    - "250–450ms opacity and translate fades"
    - "slow 800–1400ms camera and chapter eases"
    - "subtle 2–3 second waypoint breathing pulse"
  animation_style: >
    Movement should feel physical and observational. Prefer slow machinery, drifting atmosphere,
    light shifts, and confident fades. Reward moments use a brief stamp or glow rather than bouncing UI.
  pacing: "calm exploration punctuated by concise decisions and visible environmental responses"
  audio_cues:
    - "low farm wind and ventilation bed"
    - "cooling and compressor hum at processing"
    - "soft market room tone and kitchen ventilation"
    - "short muted confirmations; fanfare reserved for chapter completion"

mood:
  keywords:
    - "credible"
    - "warm"
    - "tactile"
    - "observational"
    - "quietly cinematic"
  era: "contemporary"
  cultural_reference: "California agricultural documentary photography and premium science-museum interactives"
  avoid:
    - "emoji as the main navigation language"
    - "toy-like rounded geometry"
    - "neon or candy color"
    - "arcade HUD clutter"
    - "constant celebration effects"
    - "unverified statistics or facility claims"

assets:
  reference_images: []
  gsep_elements: []
  html_snippets: []
  color_palette_image:
    url: ""
---

## Design Principles

The environment carries the story. Every screen should feel like part of one refrigerated journey from farm to processor to customer. Photography establishes credibility; 3D objects add agency; the interface explains only what the player needs at that moment.

Use the same interaction rhythm throughout: observe a real working context, make one informed decision, and see the environment respond. Progress reads as a field log with three chapter stamps. Accessibility shortcuts remain first-class and are presented as a Field Guide rather than a way to bypass the game.

Realism comes from proportion, light, material, sound, and restraint. Small physical responses are more convincing than extra decoration.

## HTML Application Notes

Map the palette directly to CSS custom properties. Use translucent Night Soil for HUD and contextual prompts, Warm Paper for lesson content, and California Amber only for the current task or primary action. Apply the display serif to title and chapter headers. Preserve the system sans stack for controls and educational copy.

In Three.js, use sRGB textures, ACES filmic tone mapping, calibrated exposure, MeshStandardMaterial, soft shadows, location-specific fog, and low-cost ambient motion. Keep reduced-motion and performance modes visually complete.

## Asset Notes

Environment backplates and the Holstein billboard are AI-generated production assets created for this repository. Existing lesson photography and client brand assets remain separate and should retain documented approval and provenance.
