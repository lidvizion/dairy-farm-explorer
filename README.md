# 🐄 Sunny Meadows: 3D Dairy Farm Explorer

An immersive, gamified 3D educational game about dairy farming. Walk a fully
modeled farm in first person, visit 10 glowing learning stations, ace quizzes
to earn badges, and collect hidden milk bottles.

## Run it

It's a single self-contained file — no build step, no install.

- **Easiest:** double-click `index.html` (needs internet for the Three.js CDN), or
- **Local server:** `python3 -m http.server 8431 --directory dairy-farm-explorer`
  then open http://localhost:8431

Works on desktop (WASD + mouse drag) and mobile (virtual joystick + touch look).

## What's on the farm

Big red gambrel-roof barn, milking parlor with stalls and pipeline, milk house
with refrigerated bulk tank, twin feed silos, tractor, hay barn with bales,
fenced pasture with a wandering herd (click a cow — she moos), calf hutches,
anaerobic digester + compost (sustainability), milk tanker truck, farmhouse,
windmill, water trough, chickens, drifting clouds.

## Game systems

- **10 learning stations** — facts + multiple-choice quiz each
  (+50 first try, +20 second). Topics: milking tech, milk cooling/cold chain,
  feed & nutrition, machinery, forage, cow biology, calf care, renewable
  energy & nutrient recycling, food safety/transport, dairy's community and
  nutrition benefits.
- **Collectibles** — 10 hidden milk bottles (+10 each, click or walk over).
- **Badges + checklist + score HUD**, rotating fact tips, proximity prompts.
- **Completion certificate** with rank (Curious Calf → Master Dairy Farmer).
- Synthesized sound effects (moo, cluck, dings) — no audio assets needed.

Built with Three.js (CDN). All textures are generated at runtime on canvas.
