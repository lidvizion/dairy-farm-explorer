import {test,expect,goToScene} from './support.js';
async function enter(page) {
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  await expect(page.locator('#objective')).toBeVisible();
}
for(const [id,state] of [['farm','FARM'],['processor','PROCESSOR'],['market','MARKET']]) test(`hands-on ${id} world updates real geometry, explains mistakes, resets and restores exploration`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await enter(page);
  await goToScene(page,state);
  const names = {farm:'Cow comfort demo', processor:'Milk line demo', market:'Package delivery demo'};
  await expect(page.locator('#tryWorld')).toHaveText(`Optional: ${names[id]} ↗`);
  const before=await page.evaluate(()=>({...window.__game.player}));
  await page.locator('#tryWorld').click();
  await expect(page.locator('#worldLab')).toBeVisible();
  if(id!=='farm'){
    await page.locator('.lab-actions button').last().click();
    await expect(page.locator('#labProgress')).toContainText('0 /');
  }
  const count=await page.locator('.lab-actions button').count();
  for(let i=0;i<count;i++)await page.locator('.lab-actions button').nth(i).click();
  await expect(page.locator('#labProgress')).toContainText('Complete');
  const actual=await page.evaluate(()=>window.__game.renderInfo().labState);
  expect(id==='farm'?actual.mask:actual.step).toBe(id==='farm'?7:count);
  const expectedVisual=id==='farm'?{waterVisible:true,waterHeight:.82,shadeVisible:true}
    :id==='processor'?{cartonsVisible:true,indicators:[0x67bf82,0xee955e,0x67c6e2]}:{cartonX:-3,caseX:3};
  await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().labVisual),{timeout:30000}).toEqual(expectedVisual);
  const info=await page.evaluate(()=>window.__game.renderInfo());
  if(test.info().project.name==='mobile')expect(info.calls).toBeLessThan(260);
  console.log('Demonstration budget',id,JSON.stringify({calls:info.calls,triangles:info.triangles}));
  await page.screenshot({path:`test-results/lab-${id}-${test.info().project.name}.png`});
  await page.locator('#labReset').click();await expect(page.locator('#labProgress')).toContainText('0 /');
  await page.keyboard.press('Escape');await expect(page.locator('#worldLab')).toBeHidden();
  await expect(page.locator('#tryWorld')).toBeFocused();
  expect(await page.evaluate(()=>window.__game.player.x)).toBe(before.x);
  expect(await page.evaluate(()=>window.__game.player.z)).toBe(before.z);
  expect(errors).toEqual([]);
});
test('demonstration keyboard focus and reduced motion preserve the complete interaction',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await enter(page);
  await page.locator('#tryWorld').click();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Leave demonstration'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.locator('#labReset')).toBeFocused();
  for(let i=0;i<3;i++){await page.locator('.lab-actions button').nth(i).focus();await page.keyboard.press('Space');}
  await expect(page.locator('#labProgress')).toContainText('Complete');
  await page.locator('#labLesson').click();await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#worldLab')).toBeHidden();
});
test('scenery has bounded draw calls and disposes resources across repeat visits',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));await enter(page);
  const measurements=[];
  for(let pass=0;pass<2;pass++)for(const state of ['FARM','PROCESSOR','MARKET']){
    await goToScene(page,state);
    const info=await page.evaluate(()=>window.__game.renderInfo());measurements.push({state,pass,...info});
    expect(info.calls).toBeLessThan(230);expect(info.batchedDrawCalls).toBeGreaterThan(20);
    await page.screenshot({path:`test-results/place-${state}-${test.info().project.name}.png`});
  }
  for(let i=0;i<3;i++){
    expect(measurements[i+3].geometries).toBeLessThanOrEqual(measurements[i].geometries+2);
    expect(measurements[i+3].textures).toBeLessThanOrEqual(measurements[i].textures+2);
  }
  await test.info().attach('render-budgets',{body:JSON.stringify(measurements,null,2),contentType:'application/json'});
  console.log('Scene budgets',JSON.stringify(measurements.map(({state,pass,calls,triangles,geometries,textures,batchedDrawCalls})=>({state,pass,calls,triangles,geometries,textures,batchedDrawCalls}))));
});

test('phone rotation keeps demonstrations reachable and context loss cleans up their dialog',async({page})=>{
  await page.setViewportSize({width:360,height:640});await enter(page);
  const objective=await page.locator('#objective').boundingBox();
  const hint=await page.locator('#hint').boundingBox();expect(objective.y+objective.height).toBeLessThan(hint.y);
  await page.locator('#tryWorld').click();
  for(const viewport of [{width:360,height:640},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    for(let i=0;i<3;i++)await page.locator('.lab-actions button').nth(i).click();
    await expect(page.locator('#labProgress')).toContainText('Complete');
    const panel=await page.locator('#worldLab').boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.x+panel.width).toBeLessThanOrEqual(viewport.width);expect(panel.y+panel.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({path:`test-results/lab-rotation-${viewport.width}-${test.info().project.name}.png`});
  }
  await page.evaluate(()=>{
    window.demoLoss=document.getElementById('worldCanvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.demoLoss.loseContext();
  });
  await expect(page.locator('#fallback')).toBeVisible();await expect(page.locator('#worldLab')).toHaveCount(0);
  expect(await page.evaluate(()=>document.body.classList.contains('in-world-lab'))).toBe(false);
  await page.evaluate(()=>window.demoLoss.restoreContext());await expect(page.locator('#objective')).toBeVisible();
  await page.locator('#tryWorld').click();await expect(page.locator('#labProgress')).toContainText('0 /');
});

test('movement guidance advances through actions and sound preference survives reload',async({page})=>{
  await enter(page);await expect(page.locator('#hint')).toContainText('01 /');
  await page.locator('#worldCanvas').focus();await page.keyboard.down('d');
  await expect(page.locator('#hint')).toContainText('02 /');await page.keyboard.up('d');
  await page.evaluate(()=>window.__game.player.yaw+=.4);
  await expect(page.locator('#hint')).toContainText('03 /');
  await page.getByRole('button',{name:'Sound',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sound',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.locator('#nextLesson').click();await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.reload();await page.locator('#beginBtn').click();
  await expect(page.getByRole('button',{name:'Sound',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.locator('[data-location="farm"] button').click();await expect(page.locator('#hint')).not.toContainText('01 /');
});
