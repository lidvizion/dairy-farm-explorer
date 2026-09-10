# Slow-runner verification

Run the normal suite with `npm.cmd run test:browser`. To repeat the complete
desktop/mobile suite with Chromium CPU throttling in PowerShell:

```powershell
$env:BROWSER_CPU_THROTTLE = '4'
npm.cmd run test:browser -- --workers=1
Remove-Item Env:BROWSER_CPU_THROTTLE
```

The test-only fixture applies CDP CPU throttling before navigation. It does not
change graphics quality, viewport, game timing, assertions, or runtime code.
CPU throttling approximates contention; it is not an exact GitHub runner model.

`goToScene` uses the existing synchronous `go()` contract: capture scene identity
and render counter in the navigation task, then require the requested state,
the same scene, and a newer rendered frame before interacting. A previous
scene's draw-call statistics cannot satisfy readiness. Render waits have bounded
30-second deadlines; the global 90-second test budget and retries are unchanged.

Sign circuits, world demonstrations, and high-quality scene checks are separate
cases per destination so their work does not accumulate against one timeout.
Every sign circuit retains all 12 viewpoints, exact transform comparisons,
non-sprite assertions, and screenshots. One subsequent render exercises each
new viewpoint. Collision reaches the actual facade contact plane and holds W
for five more frames, checking contact again and retaining `z >= 2.55`.

September 10 verification: 30 unit tests passed; all 64 browser cases passed
normally and with 4x CPU throttling (12.5 minutes, one worker, no retries).
The throttled desktop sign circuits took 38–50 seconds each, compared with
24–28 seconds normally. The normal Windows run needed its owned static server
stopped after all tests passed to finish teardown; both commands exited zero.
Vendor byte verification and site packaging verification also passed.
GitHub Actions itself still needs the user's commit and push.
