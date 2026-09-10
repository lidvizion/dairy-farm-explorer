import {test,expect} from '@playwright/test';

test('physical signs hold their transform through a full circuit in all destinations',async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();
  for(const state of ['FARM','PROCESSOR','MARKET']) {
    await page.evaluate(state=>window.__game.go(window.__game.GAME_STATES[state]),state);
    const initial=await page.evaluate(()=>window.__game.beacons().map(b=>({rotation:b.rotation.toArray(),faces:b.userData.label.children.map(f=>f.rotation.toArray())})));
    for(let step=0;step<12;step++) {
      await page.evaluate(step=>{
        const g=window.__game,b=g.beacons()[0],a=step*Math.PI/6;
        g.setPlayerPos(b.position.x+3*Math.sin(a),b.position.z+3*Math.cos(a));g.player.yaw=a;g.player.pitch=0;
      },step);
      const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
      await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().frame)).toBeGreaterThan(frame+1);
      expect(await page.evaluate(()=>window.__game.beacons().map(b=>({rotation:b.rotation.toArray(),faces:b.userData.label.children.map(f=>f.rotation.toArray())})))).toEqual(initial);
      expect(await page.evaluate(()=>window.__game.beacons().every(b=>!b.userData.label.children.some(f=>f.isSprite)))).toBe(true);
      if(step%3===0)await page.screenshot({path:`test-results/sign-${state}-${step}-${test.info().project.name}.png`});
    }
  }
});

test('walking into the processor wall stops outside its front face',async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();
  await page.evaluate(()=>{const g=window.__game;g.go(g.GAME_STATES.PROCESSOR);g.setPlayerPos(5,3.4);g.player.yaw=0;});
  await page.locator('#worldCanvas').focus();await page.keyboard.down('w');
  await expect.poll(()=>page.evaluate(()=>window.__game.player.z)).toBeLessThan(3);
  const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
  await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().frame)).toBeGreaterThan(frame+30);
  await page.keyboard.up('w');
  expect(await page.evaluate(()=>window.__game.player.z)).toBeGreaterThanOrEqual(2.55);
});
