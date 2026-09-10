import { test, expect } from '@playwright/test';
import { LOCATIONS, GAME_STATES } from '../../js/config/content.js';

// Exercise exactly the same self-hosted engine that ships in production.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rcm_quality', 'perf'));
});

function observeErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}
async function openMap(page) {
  await page.goto('/');
  await expect(page.locator('#title')).toBeVisible();
  await page.getByRole('button', { name: 'Enter the journey' }).click();
  await expect(page.locator('#journeyMap')).toBeVisible();
}
async function enter(page, id) {
  await page.locator(`.journey-card[data-location="${id}"] button`).click();
  await expect(page.locator('#objective')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__game.state())).toBe(GAME_STATES[id.toUpperCase()]);
  await expect.poll(() => page.evaluate(() => window.__game.renderInfo().calls)).toBeGreaterThan(0);
}
async function solveLesson(page, lesson, { mistakes = false, screenshot = false } = {}) {
  const g = lesson.game, host = page.locator('#modalBody');
  if(screenshot) await page.screenshot({path:`test-results/activity-${lesson.id}-${test.info().project.name}.png`});
  if (g.type === 'multiselect') {
    if(mistakes){
      for(const option of g.options.filter(o=>!o.ok).slice(0,g.need)) await host.getByRole('button',{name:option.t,exact:false}).click();
      await host.getByRole('button',{name:/^Check/}).click();
      await expect(host.locator('.quiz-feedback')).toContainText('Not quite');
      for(const option of g.options.filter(o=>!o.ok).slice(0,g.need)) await host.getByRole('button',{name:option.t,exact:false}).click();
    }
    for (const option of g.options.filter(o => o.ok)) await host.getByRole('button', { name: option.t, exact: false }).click();
    await host.getByRole('button', { name: /^Check/ }).click();
  } else if (g.type === 'sequence') {
    const displayed=await host.locator('.route-choices button').allTextContents();
    expect(displayed.map(text=>g.steps.findIndex(s=>text.includes(s.t)))).not.toEqual([0,1,2,3]);
    if(mistakes){
      for(const step of [...g.steps].reverse()) await host.getByRole('button',{name:step.t,exact:false}).click();
      await host.getByRole('button',{name:/Start cooling/}).click();
      await expect(host.locator('.quiz-feedback')).toContainText('Not quite');
      await host.getByRole('button',{name:'Undo last step'}).click();
      await expect(host.locator('.activity-counter')).toContainText('3 of 4');
      await host.getByRole('button',{name:'Clear route'}).click();
    }
    for (const step of g.steps) await host.getByRole('button', { name: step.t, exact: false }).click();
    await host.getByRole('button', { name: /Start cooling/ }).click();
  } else if (g.type === 'match') {
    for (const left of g.left) {
      await host.locator('.match-col').first().getByRole('button', { name: left.t, exact: false }).click();
      if(mistakes){
        await host.locator('.match-col').last().getByRole('button',{name:g.right.find(r=>r.id!==left.id).t,exact:true}).click();
        await expect(host.locator('.quiz-feedback')).toContainText('Not quite');
      }
      await host.locator('.match-col').last().getByRole('button', { name: g.right.find(r => r.id === left.id).t, exact: true }).click();
    }
  } else if (g.type === 'branch') {
    await expect(host.getByRole('button', { name: 'Finish lesson' })).toBeDisabled();
    for(const product of (mistakes?g.products.slice(1):[g.products[1]])){
      await host.getByRole('button', { name: product.name, exact: false }).click();
      await expect(host.locator('.branch-step')).toHaveText(product.steps);
    }
    await host.getByRole('button', { name: 'Finish lesson' }).click();
  } else if (g.type === 'seal') {
    if(mistakes){
      const wrong=g.packages.findIndex(p=>!p.seal);
      await host.locator('.pkg').nth(wrong).click();
      await host.getByRole('button',{name:'Check my picks'}).click();
      await expect(host.locator('.quiz-feedback')).toContainText('Not quite');
      await host.locator('.pkg').nth(wrong).click();
    }
    for (let i = 0; i < g.packages.length; i++) if (g.packages[i].seal) await host.locator('.pkg').nth(i).click();
    await host.getByRole('button', { name: 'Check my picks' }).click();
  } else throw Error(`Missing test solver: ${g.type}`);
  await host.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#modal')).toBeHidden();
}
async function solveQuiz(page, loc, retry = false) {
  for (let i = 0; i < loc.quiz.length; i++) {
    const q = loc.quiz[i];
    if (retry) {
      for(let wrong=0;wrong<q.a.length;wrong++) if(wrong!==q.correct){
        await test.step(`${loc.id}.${q.from}: reject answer ${wrong+1}`,async()=>{
          await page.locator(`.quiz-opt[data-answer-index="${wrong}"]`).click();
          await expect(page.locator('.quiz-feedback')).toContainText('Not quite');
          await expect(page.locator(`.quiz-opt[data-answer-index="${wrong}"]`)).toBeDisabled();
        });
      }
    }
    await page.locator(`.quiz-opt[data-answer-index="${q.correct}"]`).click();
    await page.getByRole('button', { name: i < loc.quiz.length - 1 ? 'Next question' : 'See results', exact: true }).click();
  }
  await expect(page.locator('#modalBody')).toContainText('Badge earned');
}

test('opening film is the default, plays, pauses, and returns on reload', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto('/');
  await expect(page.locator('#introVideo')).toBeVisible();
  await expect(page.locator('#journeyMap')).toBeHidden();
  await expect.poll(() => page.locator('#introVideo').evaluate(v => v.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause film' }).click();
  await expect(page.getByRole('button', { name: 'Play film', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/intro-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Enter the journey' }).click();
  await expect(page.locator('#journeyMap')).toBeVisible();
  await page.screenshot({ path: `test-results/map-${test.info().project.name}.png`, fullPage: true });
  await page.reload();
  await expect(page.locator('#introVideo')).toBeVisible();
  expect(errors).toEqual([]);
});

test('all nine lessons, quiz retries, navigation, persistence, completion and reset', async ({ page }) => {
  test.setTimeout(240000);
  const errors = observeErrors(page);
  await openMap(page);
  await expect(page.locator('[data-location="processor"] button')).toBeDisabled();
  for (const loc of LOCATIONS) {
    await enter(page, loc.id);
    await page.screenshot({ path: `test-results/${loc.id}-${test.info().project.name}.png` });
    for (const lesson of loc.lessons) {
      await page.locator('#nextLesson').click();
      await expect(page.locator('#modalTitle')).toContainText(lesson.title);
      await test.step(`${loc.id}.${lesson.id}: mistakes and successful completion`,()=>solveLesson(page,lesson,{mistakes:true,screenshot:true}));
    }
    await expect(page.locator('#objectiveProgress')).toHaveText('3/3 lessons complete');
    await page.locator('#nextLesson').click();
    await solveQuiz(page, loc, true);
    await page.getByRole('button', { name: /Continue to the map/ }).click();
    await expect(page.locator('#journeyMap')).toBeVisible();
  }
  const score = await page.evaluate(() => window.__game.Progress.data.points);
  await enter(page, 'farm');
  await page.getByRole('button', { name: 'Steps', exact: true }).click();
  await page.getByRole('button', { name: /Take the Quiz/ }).click();
  await solveQuiz(page, LOCATIONS[0]);
  expect(await page.evaluate(() => window.__game.Progress.data.points)).toBe(score);
  await page.getByRole('button', { name: /Continue to the map/ }).click();
  await page.reload();
  await expect(page.locator('#resumeBanner')).toContainText('9/9');
  await page.locator('#beginBtn').click();
  await page.getByRole('button', { name: 'View your certificate' }).click();
  await expect(page.locator('#complete')).toBeVisible();
  await expect(page.locator('#cLes')).toHaveText('9/9');
  await page.locator('#cReplay').click();
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await expect(page.locator('#introVideo')).toBeVisible();
  expect(await page.evaluate(() => window.__game.Progress.data.points)).toBe(0);
  await page.locator('#beginBtn').click();
  await expect(page.locator('[data-location="processor"] button')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('first chapter renders continuously; movement, reset, quality and quiz proximity work', async ({ page }) => {
  const errors = observeErrors(page);
  await openMap(page); await enter(page, 'farm');
  const before = await page.evaluate(() => window.__game.renderInfo().frame);
  await expect.poll(() => page.evaluate(() => window.__game.renderInfo().frame)).toBeGreaterThan(before + 5);
  await page.locator('#worldCanvas').click({ position: { x: 360, y: 350 } });
  const start = await page.evaluate(() => window.__game.player.z);
  await page.keyboard.down('KeyW');
  await expect.poll(() => page.evaluate(() => window.__game.player.z)).toBeLessThan(start - 1);
  await page.keyboard.up('KeyW');
  await page.getByRole('button', { name: 'Reset position' }).click();
  expect(await page.evaluate(() => window.__game.player.z)).toBe(8);
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Performance', exact: true }).click();
  expect(await page.evaluate(() => window.__game.renderInfo().shadows)).toBe(false);
  await page.getByRole('button', { name: 'High', exact: true }).click();
  expect(await page.evaluate(() => window.__game.renderInfo().shadows)).toBe(true);
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  // Target the actual world marker and proximity logic after completing lessons.
  for (const lesson of LOCATIONS[0].lessons) { await page.locator('#nextLesson').click(); await solveLesson(page, lesson); }
  await page.evaluate(() => { const q=window.__game.quizG(); window.__game.setPlayerPos(q.position.x,q.position.z+3); });
  await expect(page.locator('#hint')).toContainText('Take the Quiz');
  expect(await page.evaluate(() => window.__game.quizG().position.y)).toBe(0);
  await page.locator('#worldCanvas').focus();
  await page.keyboard.press('KeyE');
  await expect(page.locator('#modalTitle')).toContainText('Field check');
  expect(errors).toEqual([]);
});

test('reduced motion, blocked autoplay and unavailable 3D have usable paths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/vendor/three/**', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play film', exact: true })).toBeVisible();
  expect(await page.locator('#introVideo').evaluate(v => v.paused)).toBe(true);
  await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  await expect(page.locator('#fallback')).toBeVisible();
  await page.locator('#fallback').getByRole('button', { name: 'Cow Care', exact: false }).click();
  await solveLesson(page, LOCATIONS[0].lessons[0]);
  await expect(page.locator('#fallback')).toContainText('1/9');
});

test('cooling can pause and closing it never awards a lesson in the background', async ({page})=>{
  const errors=observeErrors(page);
  await openMap(page);await enter(page,'farm');
  await page.getByRole('button',{name:'Steps',exact:true}).click();
  await page.getByRole('button',{name:/2. Milking & Cooling/}).click();
  for(const step of LOCATIONS[0].lessons[1].game.steps) await page.locator('#modalBody').getByRole('button',{name:step.t,exact:false}).click();
  await page.getByRole('button',{name:/Start cooling/}).click();
  await page.getByRole('button',{name:'Pause demonstration'}).click();
  await expect(page.locator('#coolTemp')).toHaveText('Demonstration paused');
  await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  // Enough animation frames pass to prove a discarded completion cannot fire.
  const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
  await expect.poll(()=>page.evaluate(()=>window.__game.renderInfo().frame)).toBeGreaterThan(frame+10);
  expect(await page.evaluate(()=>window.__game.Progress.isLessonDone('farm','milking'))).toBe(false);
  await page.getByRole('button',{name:'Steps',exact:true}).click();
  await page.getByRole('button',{name:/2. Milking & Cooling/}).click();
  await solveLesson(page,LOCATIONS[0].lessons[1]);
  expect(await page.evaluate(()=>window.__game.Progress.isLessonDone('farm','milking'))).toBe(true);
  expect(errors).toEqual([]);
});

test('natural film ending and replay work without a 3D render loop',async({page})=>{
  await page.route('**/vendor/three/**',route=>route.abort());
  await page.goto('/');
  await expect(page.locator('#journeyMap')).toBeVisible({timeout:30000});
  await page.getByRole('button',{name:'↺ Replay the opening film',exact:true}).click();
  await expect(page.locator('#introVideo')).toBeVisible();
  await page.getByRole('button',{name:/Skip Intro/}).click();
  await expect(page.locator('#journeyMap')).toBeVisible();
});

test('blocked autoplay, missing imagery and denied storage still leave lessons usable',async({page})=>{
  await page.addInitScript(()=>{
    HTMLMediaElement.prototype.play=function(){return Promise.reject(new Error('Autoplay blocked for test'));};
    Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage denied for test');}});
  });
  await page.route('**/assets/photos/cow-holstein.jpg',route=>route.abort());
  await openMap(page);
  await enter(page,'farm');
  await page.locator('#nextLesson').click();
  await expect(page.locator('.learning-media')).toHaveClass(/media-unavailable/);
  await solveLesson(page,LOCATIONS[0].lessons[0]);
  await expect(page.locator('#objectiveProgress')).toHaveText('1/3 lessons complete');
});

test('keyboard focus stays in dialogs and restored controls remain usable',async({page})=>{
  await openMap(page);await enter(page,'farm');
  await page.locator('#nextLesson').click();
  await page.getByRole('button',{name:'Close',exact:true}).focus();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>document.getElementById('modal').contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#nextLesson')).toBeFocused();
  await page.getByRole('button',{name:'Help',exact:true}).click();
  await page.getByRole('button',{name:'Reset all progress',exact:true}).click();
  await page.getByRole('button',{name:'Keep my progress',exact:true}).click();
  await page.getByRole('button',{name:'Help',exact:true}).click();
  await expect(page.getByRole('button',{name:'High',exact:true})).toBeVisible();
});
