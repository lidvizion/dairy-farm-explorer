import { test, expect } from '@playwright/test';

test.beforeEach(async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));
});

async function enterFarm(page) {
  await page.goto('/');
  await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  await expect(page.locator('#cowControls')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.__game.character()?.visible)).toBe(true);
}

test('cow actions, camera modes and all three destinations remain usable', async ({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await enterFarm(page);
  const controls=await page.locator('#cowControls').boundingBox();
  const hint=await page.locator('#hint').boundingBox();
  expect(controls.y+controls.height<=hint.y || hint.y+hint.height<=controls.y).toBe(true);
  // Observe in the page's own frame loop so a short jump cannot fall between
  // automation polls on a busy software renderer.
  await page.evaluate(()=>{
    window.__jumpPeak=0;
    const observe=()=>{window.__jumpPeak=Math.max(window.__jumpPeak,window.__game.character()?.y||0);window.__jumpRAF=requestAnimationFrame(observe);};
    observe();
  });
  await page.locator('#cowJump').click();
  await expect.poll(()=>page.evaluate(()=>window.__jumpPeak)).toBeGreaterThan(.1);
  await expect.poll(()=>page.evaluate(()=>window.__game.character().y)).toBe(0);
  await page.evaluate(()=>cancelAnimationFrame(window.__jumpRAF));
  await page.locator('#cowDance').click();
  await expect.poll(()=>page.evaluate(()=>window.__game.character().action)).toBe('dance');
  await page.keyboard.down('w');
  await expect.poll(()=>page.evaluate(()=>window.__game.character().action)).toBe('idle');
  await page.keyboard.up('w');
  await page.locator('#cameraMode').click();
  await expect.poll(()=>page.evaluate(()=>window.__game.character().visible)).toBe(false);
  await page.locator('#cameraMode').click();
  await expect.poll(()=>page.evaluate(()=>window.__game.character().visible)).toBe(true);
  for(const destination of ['farm','processor','market']){
    await page.evaluate(id=>window.__game.go(window.__game.GAME_STATES[id.toUpperCase()]),destination);
    await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().calls)).toBeGreaterThan(0);
    await page.screenshot({path:`test-results/realism-${destination}-${test.info().project.name}.png`});
  }
  expect(errors).toEqual([]);
});

test('reduced motion keeps cow actions still and controls usable', async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await enterFarm(page);
  await expect(page.locator('#cowJump')).toBeDisabled();
  await expect(page.locator('#cowDance')).toBeDisabled();
  await page.keyboard.press('Space');
  expect(await page.evaluate(()=>window.__game.character().y)).toBe(0);
});
