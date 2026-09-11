// Local camera/sign review; start the normal preview server on port 4175.
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const directory='artifacts/arrival-review';
await mkdir(directory,{recursive:true});
const label=process.argv[2] || 'after';
const browser=await chromium.launch();
const results=[];
try {
  for(const [view,options] of [['portrait',{...devices['iPhone 13']}],['landscape',{...devices['iPhone 13'],viewport:{width:844,height:390}}],['desktop',{viewport:{width:1440,height:1000}}]]) {
    const page=await browser.newPage({...options,reducedMotion:'reduce'});
    await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));
    await page.goto('http://127.0.0.1:4175');await page.locator('#beginBtn').click();
    await page.locator('[data-location="farm"] button').click();await page.locator('#objective').waitFor();
    for(const state of ['FARM','PROCESSOR','MARKET']) {
      await page.evaluate(state=>window.__game.go(window.__game.GAME_STATES[state]),state);
      const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
      await page.waitForFunction(f=>window.__game.renderInfo().frame>f+3,frame);
      results.push({view,state,...await page.evaluate(()=>({spawn:{...window.__game.player},render:window.__game.renderInfo()}))});
      await page.screenshot({path:`${directory}/${label}-${view}-${state}.png`});
      if(state==='PROCESSOR') {
        await page.evaluate(()=>{const g=window.__game;g.setPlayerPos(16,3);g.player.yaw=.32;});
        const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
        await page.waitForFunction(f=>window.__game.renderInfo().frame>f+3,frame);
        await page.screenshot({path:`${directory}/${label}-${view}-packaging-sign.png`});
      }
    }
    await page.close();
  }
  await writeFile(`${directory}/${label}.json`,JSON.stringify(results,null,2));
  console.log(results.map(r=>({view:r.view,state:r.state,z:r.spawn.z,calls:r.render.calls,triangles:r.render.triangles})));
} finally {await browser.close();}
