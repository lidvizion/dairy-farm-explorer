import {test,expect,goToScene,waitForFrames} from './support.js';

for(const state of ['FARM','PROCESSOR','MARKET']) test(`physical signs hold their transform through a full circuit in ${state}`,async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();
  await goToScene(page,state);
  const initial=await page.evaluate(()=>window.__game.beacons().map(b=>({rotation:b.rotation.toArray(),faces:b.userData.label.children.map(f=>f.rotation.toArray())})));
  for(let step=0;step<12;step++) {
    await page.evaluate(step=>{
      const g=window.__game,b=g.beacons()[0],a=step*Math.PI/6;
      g.setPlayerPos(b.position.x+3*Math.sin(a),b.position.z+3*Math.cos(a));g.player.yaw=a;g.player.pitch=0;
    },step);
    await waitForFrames(page);
    expect(await page.evaluate(()=>window.__game.beacons().map(b=>({rotation:b.rotation.toArray(),faces:b.userData.label.children.map(f=>f.rotation.toArray())})))).toEqual(initial);
    expect(await page.evaluate(()=>window.__game.beacons().every(b=>!b.userData.label.children.some(f=>f.isSprite)))).toBe(true);
    if(step%3===0)await page.screenshot({path:`test-results/sign-${state}-${step}-${test.info().project.name}.png`});
  }
});

test('walking into the processor wall stops outside its front face',async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();
  await goToScene(page,'PROCESSOR');
  const contact=await page.evaluate(()=>Math.max(...window.__game.clearance().solids
    .filter(s=>s.minX<=5 && s.maxX>=5).map(s=>s.maxZ))+.55);
  await page.evaluate(()=>{const g=window.__game;g.setPlayerPos(5,3.4);g.player.yaw=0;});
  await page.locator('#worldCanvas').focus();await page.keyboard.down('w');
  try {
    // The facade projects beyond the main wall. Reach its actual contact plane,
    // then keep walking through five updates and verify the player stays there.
    await expect.poll(()=>page.evaluate(()=>window.__game.player.z),{timeout:30000}).toBeCloseTo(contact,5);
    await waitForFrames(page,5);
    expect(await page.evaluate(()=>window.__game.player.z)).toBeCloseTo(contact,5);
    expect(await page.evaluate(()=>window.__game.player.z)).toBeGreaterThanOrEqual(2.55);
  } finally {
    await page.keyboard.up('w');
  }
});
