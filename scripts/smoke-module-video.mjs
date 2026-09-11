// Local-only smoke for configurable card video playback and interruption cleanup.
// Start the normal server on port 4175 first. Reuses existing media only for testing.
import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({reducedMotion:'reduce'});
  await page.route('**/js/config/module.js',r=>r.fulfill({contentType:'text/javascript',body:`import pack from '/tests/fixtures/library/pack.js';pack.LOCATIONS[0].lessons[0].game.video='assets/california-intro.mp4';export default pack;`}));
  for(const [file,type] of [['pack.js','text/javascript'],['assets/library.svg','image/svg+xml']])
    await page.route(`**/tests/fixtures/library/${file}`,async r=>r.fulfill({contentType:type,body:await readFile(`tests/fixtures/library/${file}`,'utf8')}));
  await page.goto('http://127.0.0.1:4175');await page.locator('#beginBtn').click();
  await page.locator('[data-location="courtyard"] button').click();await page.locator('#nextLesson').click();
  async function play() {
    await page.locator('.game-host video').evaluate(async v=>{window.reviewVideo=v;v.muted=true;await v.play();});
    await expect.poll(()=>page.evaluate(()=>window.reviewVideo.currentTime)).toBeGreaterThan(0);
    expect(await page.evaluate(()=>window.reviewVideo.controls)).toBe(true);
  }
  await play();await page.locator('#modalClose').click();
  expect(await page.evaluate(()=>window.reviewVideo.paused)).toBe(true);
  await page.locator('#nextLesson').click();await play();
  await page.evaluate(()=>window.__game.startLesson('courtyard','signs'));
  expect(await page.evaluate(()=>window.reviewVideo.paused)).toBe(true);
  await play();await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  expect(await page.evaluate(()=>window.reviewVideo.paused)).toBe(true);
  console.log('Card video smoke passed: native controls, playback, close, replacement and page-hide pause.');
} finally {await browser.close();}
