import { test, expect } from '@playwright/test';
import { LOCATIONS } from '../../js/config/content.js';
async function map(page){await page.goto('/');await page.locator('#beginBtn').click();await expect(page.locator('#journeyMap')).toBeVisible();}
async function farm(page){await map(page);await page.locator('[data-location="farm"] button').click();await expect(page.locator('#objective')).toBeVisible();}
test('laptop cards are above the fold and map chrome scrolls with the heading',async({page})=>{
  await page.setViewportSize({width:1568,height:726}); await map(page);
  const button=await page.locator('[data-location="farm"] button').boundingBox(); expect(button.y+button.height).toBeLessThan(726);
  expect(await page.locator('#hud').evaluate(e=>getComputedStyle(e).position)).toBe('static');
  await page.locator('#journeyMap').evaluate(e=>e.scrollTop=200);
  await page.getByRole('button',{name:'Leaderboard',exact:true}).click();
  await expect(page.locator('.leaderboard')).toContainText('Earn a badge');
});
test('phone controls fit portrait and landscape; renderer follows the viewport',async({page})=>{
  await page.setViewportSize({width:360,height:740}); await farm(page);
  await page.evaluate(()=>document.body.classList.add('touch-controls-active'));
  for(const size of [{width:360,height:640},{width:844,height:390}]){
    await page.setViewportSize(size);
    await page.evaluate(()=>{
      document.documentElement.style.setProperty('--safe-top','20px');
      document.documentElement.style.setProperty('--safe-bottom','24px');
      document.documentElement.style.setProperty('--safe-left','12px');
      document.documentElement.style.setProperty('--safe-right','12px');
      document.getElementById('caption').textContent='Follow the milk from farm to flavor.';
    });
    await expect.poll(()=>page.locator('#worldCanvas').evaluate(e=>Math.round(e.getBoundingClientRect().height))).toBe(size.height);
    const hud=await page.locator('#hud').boundingBox();
    const hint=await page.locator('#hint').boundingBox(); expect(hint.y).toBeGreaterThan(hud.y+hud.height);
    for(const id of ['joy','lookJoy','touchAct']){
      const rect=await page.locator('#'+id).boundingBox(); if(!rect)continue;
      expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x+rect.width).toBeLessThanOrEqual(size.width);
      expect(rect.y+rect.height).toBeLessThanOrEqual(size.height); expect(rect.y).toBeGreaterThan(hud.y+hud.height);
    }
    await page.screenshot({path:`test-results/controls-${size.width}-${test.info().project.name}.png`});
  }
});
test('stick ignores a second finger and clears capture, modal and blur input',async({page})=>{
  await farm(page);
  await page.locator('#joy').evaluate(stick=>{
    // Synthetic pointers do not have browser capture, so stub only that API.
    stick.setPointerCapture=()=>{};
    const r=stick.getBoundingClientRect();
    stick.dispatchEvent(new PointerEvent('pointerdown',{pointerId:11,clientX:r.right,clientY:r.top+r.height/2}));
    stick.dispatchEvent(new PointerEvent('pointerdown',{pointerId:12,clientX:r.left,clientY:r.top}));
    stick.dispatchEvent(new PointerEvent('pointerup',{pointerId:11}));
  });
  expect(await page.locator('#joyKnob').evaluate(e=>e.style.left)).toBe('50%');
  await page.locator('#joy').evaluate(stick=>{
    stick.dispatchEvent(new PointerEvent('pointerdown',{pointerId:13,clientX:100,clientY:100}));
    stick.dispatchEvent(new PointerEvent('lostpointercapture',{pointerId:13}));
  });
  expect(await page.locator('#joyKnob').evaluate(e=>e.style.left)).toBe('50%');
  await page.keyboard.down('w'); await page.locator('#nextLesson').click();
  await page.keyboard.up('w'); await page.getByRole('button',{name:'Close',exact:true}).click();
  const pos=await page.evaluate(()=>window.__game.player.z);
  await page.waitForTimeout(200); expect(await page.evaluate(()=>window.__game.player.z)).toBe(pos);
  await page.keyboard.down('w'); await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  const after=await page.evaluate(()=>window.__game.player.z); await page.waitForTimeout(200);
  expect(await page.evaluate(()=>window.__game.player.z)).toBe(after); await page.keyboard.up('w');
});
test('badge completion offers a safe name, saves once, and shows the board on map and certificate',async({page})=>{
  await page.setViewportSize({width:360,height:740}); await farm(page);
  await page.evaluate(()=>{
    for(const lesson of window.__game.LOCATIONS[0].lessons) window.__game.Progress.completeLesson('farm',lesson.id);
    window.__game.startQuiz('farm');
  });
  for(let i=0;i<LOCATIONS[0].quiz.length;i++){
    await page.locator(`.quiz-opt[data-answer-index="${LOCATIONS[0].quiz[i].correct}"]`).click();
    await page.getByRole('button',{name:i<LOCATIONS[0].quiz.length-1?'Next question':'See results',exact:true}).click();
  }
  await page.locator('#leaderboardName').fill('sh1t'); await page.getByRole('button',{name:'Save my score'}).click();
  await expect(page.locator('#leaderboardError')).toContainText('family-friendly');
  await page.locator('#leaderboardName').fill('<b>Milk</b>'); await page.getByRole('button',{name:'Save my score'}).click();
  await expect(page.locator('.current-player')).toContainText('<b>Milk</b>');
  await expect(page.locator('.leaderboard-name b')).toHaveCount(0);
  await page.getByRole('button',{name:/Continue to the map/}).click(); await page.getByRole('button',{name:'Leaderboard',exact:true}).click();
  await expect(page.locator('.current-player')).toContainText('<b>Milk</b>');
  await page.reload(); await page.locator('#beginBtn').click();
  await page.evaluate(()=>window.__game.enterCompletion());
  await expect(page.locator('.current-player')).toContainText('<b>Milk</b>');
  await expect(page.locator('#leaderboardName')).toHaveCount(0);
});

test('all three dressed scenes render with high-quality shadows',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('rcm_quality','high'));
  await farm(page);
  for(const [id,state] of [['farm','FARM'],['processor','PROCESSOR'],['market','MARKET']]){
    await page.evaluate(state=>window.__game.go(window.__game.GAME_STATES[state]),state);
    await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().calls)).toBeGreaterThan(0);
    expect(await page.evaluate(()=>window.__game.renderInfo().shadows)).toBe(true);
    const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
    await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().frame)).toBeGreaterThan(frame+2);
    await page.screenshot({path:`test-results/scene-${id}-high-${test.info().project.name}.png`});
  }
});
