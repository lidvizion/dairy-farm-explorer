import {test,expect,goToScene,waitForFrames} from './support.js';

test('arrival views stay outside scenery and reset to each destination overview',async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  for(const state of ['FARM','PROCESSOR','MARKET']) {
    await goToScene(page,state);
    const start=await page.evaluate(()=>({...window.__game.player}));
    expect(start.z).toBeGreaterThan(20);
    await waitForFrames(page,3);
    expect(await page.evaluate(()=>window.__game.player.z)).toBe(start.z);
    const clear=await page.evaluate(()=>{
      const g=window.__game,p=g.player;
      return g.clearance().solids.every(b=>p.x<=b.minX-.55 || p.x>=b.maxX+.55 || p.z<=b.minZ-.55 || p.z>=b.maxZ+.55)
        && g.beacons().every(b=>b.position.z < p.z-10);
    });
    expect(clear).toBe(true);
    await page.evaluate(()=>window.__game.setPlayerPos(0,8));
    await page.getByRole('button',{name:'Reset position'}).click();
    expect(await page.evaluate(()=>({x:window.__game.player.x,z:window.__game.player.z,yaw:window.__game.player.yaw})))
      .toEqual({x:start.x,z:start.z,yaw:start.yaw});
  }
});

test('processor packaging sign clears the wall and retains its whole board',async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();await goToScene(page,'PROCESSOR');
  const bounds=await page.evaluate(async()=>{
    const THREE=await import('three');
    const sign=window.__game.scene().getObjectByName('processor-packaging-sign');
    const b=new THREE.Box3().setFromObject(sign);
    return {minX:b.min.x,width:b.max.x-b.min.x,faces:sign.children.filter(c=>c.geometry?.type==='PlaneGeometry').length};
  });
  expect(bounds.minX).toBeGreaterThan(12.2);
  expect(bounds.width).toBeCloseTo(3.6,5);
  expect(bounds.faces).toBe(2);
});

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
