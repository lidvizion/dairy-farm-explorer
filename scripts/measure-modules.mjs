// Local workload review. Start the normal static server on port 4175 first.
// The library assets are supplied by the test harness, never by the production server.
import { chromium, devices } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const directory='artifacts/module-review';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch();
try {
  const result={};
  for(const topic of ['dairy','library']) {
    const context=await browser.newContext({...devices['iPhone 13'],reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));
    if(topic==='library') {
      await page.route('**/js/config/module.js',r=>r.fulfill({contentType:'text/javascript',body:"export {default} from '/tests/fixtures/library/pack.js';"}));
      for(const [file,type] of [['pack.js','text/javascript'],['assets/library.svg','image/svg+xml']])
        await page.route(`**/tests/fixtures/library/${file}`,async r=>r.fulfill({contentType:type,body:await readFile(`tests/fixtures/library/${file}`,'utf8')}));
    }
    await page.goto('http://127.0.0.1:4175');await page.locator('#beginBtn').click();
    await page.locator('.journey-card button').first().click();
    await page.locator('#objective').waitFor();
    const destinations=await page.evaluate(()=>window.__game.LOCATIONS.map(l=>({id:l.id,state:window.__game.GAME_STATES[l.id.toUpperCase()]})));
    result[topic]=[];
    async function sample() {
      const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
      await page.waitForFunction(f=>window.__game.renderInfo().frame>f+3,frame);
      return page.evaluate(()=>window.__game.renderInfo());
    }
    for(let pass=0;pass<2;pass++)for(const dest of destinations) {
      await page.evaluate(state=>window.__game.go(state),dest.state);
      const spawn=await sample();let demo;
      if(pass===0)await page.screenshot({path:`${directory}/${topic}-${dest.id}.png`});
      if(await page.locator('#tryWorld').count()) {
        await page.locator('#tryWorld').click();
        for(let i=0;i<await page.locator('.lab-actions button').count();i++)await page.locator('.lab-actions button').nth(i).click();
        demo=await sample();
        if(pass===0)await page.screenshot({path:`${directory}/${topic}-${dest.id}-demo.png`});
      }
      result[topic].push({destination:dest.id,pass,spawn,demo});
    }
    await context.close();
  }
  await writeFile(`${directory}/workloads.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally {await browser.close();}
