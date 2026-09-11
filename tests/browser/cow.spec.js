import {test,expect,goToScene,waitForFrames} from './support.js';

test('cow poses freeze in performance and reduced motion, and animate only in high quality',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  await goToScene(page,'FARM');
  const poses=()=>page.evaluate(()=>window.__game.scene().userData.cows.map(c=>({head:c.userData.head.rotation.toArray(),tail:c.userData.tail.rotation.toArray()})));
  const initial=await poses();await waitForFrames(page,5);expect(await poses()).toEqual(initial);
  await page.getByRole('button',{name:'Help',exact:true}).click();
  await page.getByRole('button',{name:'High',exact:true}).click();
  await page.getByRole('button',{name:'Got it',exact:true}).click();
  await goToScene(page,'FARM');
  const high=await poses();
  await expect.poll(poses,{timeout:30000}).not.toEqual(high);
  await page.emulateMedia({reducedMotion:'reduce'});
  // Reduced motion is captured at page setup; reload to exercise that path.
  await page.reload();await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  await goToScene(page,'FARM');
  await page.getByRole('button',{name:'Help',exact:true}).click();
  await page.getByRole('button',{name:'High',exact:true}).click();
  await page.getByRole('button',{name:'Got it',exact:true}).click();
  const reduced=await poses();await waitForFrames(page,5);expect(await poses()).toEqual(reduced);
});
