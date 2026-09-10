import {test,expect} from './support.js';
async function map(page){await page.goto('/');await page.locator('#beginBtn').click();await expect(page.locator('#journeyMap')).toBeVisible();}
async function farm(page){await map(page);await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();}
test('Space activates focused scene buttons; navigation and certificate own focus',async({page})=>{
  await farm(page);
  await page.locator('#nextLesson').focus();await page.keyboard.press('Space');
  await expect(page.locator('#modal')).toBeVisible();
  await page.evaluate(()=>window.__game.go(window.__game.GAME_STATES.MAP));
  await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('.journey-heading h1')).toBeFocused();
  await page.evaluate(()=>window.__game.enterCompletion());await expect(page.locator('#completeTitle')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>document.getElementById('complete').contains(document.activeElement))).toBe(true);
  await page.locator('#cMap').click();await expect(page.locator('.journey-heading h1')).toBeFocused();
});
test('denied storage gives honest progress and leaderboard notices',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Denied');}}));
  await map(page);await expect(page.locator('.journey-footer')).toContainText('session only');
  await page.evaluate(()=>{window.__game.Progress.completeLocation('farm');window.__game.enterCompletion();});
  await page.locator('#leaderboardName').fill('Session player');await page.getByRole('button',{name:'Save my score'}).click();
  await expect(page.locator('#completionBoard [role="status"]')).toContainText('storage is unavailable');
  await expect(page.locator('.current-player')).toContainText('Session player');
});
test('context loss stops rendering; restore rebuilds the scene; retry replaces a lost canvas',async({page})=>{
  await farm(page);
  await page.evaluate(()=>{
    const canvas=document.getElementById('worldCanvas');
    window.lossExtension=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
    window.lossExtension.loseContext();
  });
  await expect(page.locator('#fallback')).toBeVisible();
  const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
  await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__game.renderInfo().frame)).toBe(frame);
  await page.evaluate(()=>window.lossExtension.restoreContext());
  await expect(page.locator('#objective')).toBeVisible();await expect(page.locator('#fallback')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().frame),{timeout:30000}).toBeGreaterThan(frame);
  await page.evaluate(()=>{
    window.oldCanvas=document.getElementById('worldCanvas');
    window.oldCanvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
  });
  await expect(page.locator('#fallback')).toBeVisible();await page.getByRole('button',{name:'Retry 3D',exact:true}).click();
  await expect(page.locator('#objective')).toBeVisible();
  expect(await page.evaluate(()=>window.oldCanvas.isConnected)).toBe(false);
  await expect(page.locator('#worldCanvas')).toHaveCount(1);
});
test('a load beyond twelve seconds still initializes a single playable renderer',async({page})=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/vendor/three/three.module.min.js',async route=>{await gate;await route.continue();});
  await map(page);await page.locator('[data-location="farm"] button').click();
  await expect(page.getByRole('button',{name:'Use text-friendly lessons'})).toBeVisible({timeout:16000});
  await page.getByRole('button',{name:'Use text-friendly lessons'}).click();await expect(page.locator('#fallback')).toBeVisible();
  release();
  await expect(page.getByRole('button',{name:'Return to 3D',exact:true})).toBeVisible({timeout:15000});
  await page.getByRole('button',{name:'Return to 3D',exact:true}).click();
  await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();
  await expect(page.locator('#worldCanvas')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().calls)).toBeGreaterThan(0);
});
test('resize bursts are coalesced and performance mode recreates a cheaper renderer',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));await farm(page);
  const info=await page.evaluate(()=>window.__game.renderInfo());expect(info.pixelRatio).toBeLessThanOrEqual(1);expect(info.antialias).toBe(false);
  const result=await page.evaluate(async()=>{
    const viewport=window.visualViewport;
    Object.defineProperty(viewport,'height',{configurable:true,value:viewport.height-20});
    const before=window.__game.renderInfo().resizeCount;
    for(let i=0;i<40;i++)viewport.dispatchEvent(new Event('resize'));
    await new Promise(requestAnimationFrame);
    const after=window.__game.renderInfo().resizeCount;
    for(let i=0;i<40;i++)viewport.dispatchEvent(new Event('resize'));
    await new Promise(requestAnimationFrame);
    const stable=window.__game.renderInfo().resizeCount;
    delete viewport.height;viewport.dispatchEvent(new Event('resize'));
    return {before,after,stable};
  });
  expect(result.after-result.before).toBe(1);expect(result.stable).toBe(result.after);
  await page.getByRole('button',{name:'Help',exact:true}).click();await page.getByRole('button',{name:'High',exact:true}).click();
  expect(await page.evaluate(()=>window.__game.renderInfo().antialias)).toBe(true);
  await page.getByRole('button',{name:'Performance',exact:true}).click();expect(await page.evaluate(()=>window.__game.renderInfo().pixelRatio)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(()=>window.__game.renderInfo().antialias)).toBe(false);await expect(page.locator('#worldCanvas')).toHaveCount(1);
});
test('small lesson grids and short landscape objective avoid narrow targets and stick overlap',async({page})=>{
  await page.setViewportSize({width:360,height:640});await farm(page);
  await page.evaluate(()=>window.__game.startLesson('farm','resource'));
  // Test grid rules with the actual shared activity classes, without depending on quiz progress.
  const columns=await page.evaluate(()=>{
    const host=document.getElementById('modalBody');
    return ['match-cols','pkg-grid','milk-route'].map(className=>{
      const node=document.createElement('div');node.className=className;host.append(node);
      const count=getComputedStyle(node).gridTemplateColumns.split(' ').length;node.remove();return count;
    });
  });
  expect(columns).toEqual([1,2,2]);
  await page.evaluate(()=>window.__game.go(window.__game.GAME_STATES.FARM));await page.setViewportSize({width:844,height:300});
  const panel=await page.locator('#objective').boundingBox(),stick=await page.locator('#joy').boundingBox();
  if(stick)expect(panel.x>=stick.x+stick.width || panel.y+panel.height<=stick.y).toBe(true);
  expect(await page.locator('#touchAct').evaluate(e=>getComputedStyle(e).touchAction)).toBe('manipulation');
});
