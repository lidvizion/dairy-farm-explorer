import {test as base,expect} from '@playwright/test';

// Opt-in reproducible slow-CPU run, applied before navigation in either project.
export const test=base.extend({
  cpuThrottle:[async({page},use)=>{
    const rate=Number(process.env.BROWSER_CPU_THROTTLE || 1);
    if(!Number.isFinite(rate) || rate<1)throw new Error('BROWSER_CPU_THROTTLE must be >= 1');
    const session=rate>1?await page.context().newCDPSession(page):null;
    if(session)await session.send('Emulation.setCPUThrottlingRate',{rate});
    await use();
    if(session)await session.detach();
  },{auto:true}]
});
export {expect};

export async function waitForFrames(page,count=1) {
  const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
  await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().frame),{
    timeout:30000,message:`renderer must complete ${count} new frame(s)`
  }).toBeGreaterThanOrEqual(frame+count);
}

export async function goToScene(page,state) {
  // go() builds synchronously. Capture the counter in the same JS task so an
  // old scene's render statistics cannot satisfy destination readiness.
  const target=await page.evaluate(state=>{
    const g=window.__game;
    g.go(g.GAME_STATES[state]);
    return {state:g.GAME_STATES[state],scene:g.scene()?.uuid,frame:g.renderInfo().frame};
  },state);
  expect(target.scene,'destination must build a 3D scene').toBeTruthy();
  await expect.poll(()=>page.evaluate(target=>{
    const g=window.__game;
    return g.state()===target.state && g.scene()?.uuid===target.scene && g.renderInfo().frame>target.frame;
  },target),{timeout:30000,message:`${state} scene must render after navigation`}).toBe(true);
  await expect(page.locator('#tryWorld')).toBeVisible();
}
