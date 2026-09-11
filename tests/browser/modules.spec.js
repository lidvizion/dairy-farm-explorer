import { readFile } from 'node:fs/promises';
import { test, expect, waitForFrames } from './support.js';

async function useLibrary(page,{flip=false,fallback=false}={}) {
  await page.route('**/tests/fixtures/library/pack.js',async route=>route.fulfill({contentType:'text/javascript',body:await readFile('tests/fixtures/library/pack.js','utf8')}));
  await page.route('**/tests/fixtures/library/assets/library.svg',async route=>route.fulfill({contentType:'image/svg+xml',body:await readFile('tests/fixtures/library/assets/library.svg','utf8')}));
  await page.route('**/js/config/module.js',route=>route.fulfill({contentType:'text/javascript',body:`
    import pack from '/tests/fixtures/library/pack.js';
    ${flip ? "pack.LOCATIONS[0].quiz.find(q=>q.id==='note').mode='quiz';" : ''}
    export default pack;`}));
  if(fallback)await page.route('**/vendor/three/three.module.min.js',route=>route.abort());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');await page.locator('#beginBtn').click();
}
async function finishCard(page){
  await page.getByRole('button',{name:'Finish lesson',exact:true}).click();
  await page.locator('#modalBody').getByRole('button',{name:'Continue',exact:true}).click();
}
async function quiz(page,{first=false,flip=false}={}){
  await expect(page.locator('.fun-fact')).toHaveCount(0);
  await page.locator('[data-answer-index="0"]').click();
  if(first){
    await expect(page.locator('[data-fact-id="extra"]')).toBeVisible();
    const points=await page.evaluate(()=>window.__game.Progress.data.points);
    await page.getByRole('button',{name:'Next question',exact:true}).click();
    if(flip){await expect(page.locator('[data-fact-id="note"]')).toHaveCount(0);await page.locator('[data-answer-index="0"]').click();}
    else {await expect(page.locator('[data-fact-id="note"]')).toBeVisible();expect(await page.evaluate(()=>window.__game.Progress.data.points)).toBe(points);}
  }
  await page.getByRole('button',{name:'See results',exact:true}).click();
  await page.getByRole('button',{name:/Continue to the map/}).click();
}

test('second content pack completes in real 3D with two destinations, facts, a generic lab and isolated saves',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await useLibrary(page);
  await expect(page.locator('.journey-card')).toHaveCount(2);
  await expect(page.locator('[data-location="reading-room"] button')).toBeDisabled();
  await page.locator('[data-location="courtyard"] button').click();await waitForFrames(page);
  expect(await page.evaluate(()=>window.__game.state())).toBe('courtyardScene');
  await page.locator('#tryWorld').click();
  await page.getByRole('button',{name:'Find a seat',exact:true}).click();
  await expect(page.locator('#labStatus')).toHaveText('Choose a book first.');
  await page.getByRole('button',{name:'Choose a book',exact:true}).click();
  await page.getByRole('button',{name:'Find a seat',exact:true}).click();
  await expect(page.locator('#labStatus')).toHaveText('Ready to read.');
  expect(await page.evaluate(()=>window.__game.Progress.data.points)).toBe(0);
  await page.getByRole('button',{name:'Leave demonstration'}).click();
  await page.locator('#nextLesson').click();await finishCard(page);
  await page.locator('#nextLesson').click();await quiz(page,{first:true});
  await page.locator('[data-location="reading-room"] button').click();await waitForFrames(page);
  await expect(page.locator('#tryWorld')).toHaveCount(0);
  for(let i=0;i<2;i++){await page.locator('#nextLesson').click();await finishCard(page);}
  await page.locator('#nextLesson').click();await quiz(page);
  await page.getByRole('button',{name:'View your certificate'}).click();
  await expect(page.locator('#completeTitle')).toHaveText('LIBRARY VISIT COMPLETE');
  await expect(page.locator('#cLoc')).toHaveText('2/2');await expect(page.locator('#cLes')).toHaveText('3/3');await expect(page.locator('#cPoints')).toHaveText('75');
  await page.locator('#complete #leaderboardName').fill('Reader');
  await page.locator('#complete').getByRole('button',{name:'Save my score',exact:true}).click();
  await expect(page.locator('#complete .leaderboard-list small')).toHaveText('2/2 badges \u00b7 3/3 lessons');
  const saved=await page.evaluate(()=>({library:JSON.parse(localStorage.getItem('library_fixture_v1')),dairy:localStorage.getItem('rcm_journey_v1')}));
  expect(saved.dairy).toBeNull();expect(saved.library.quizAwards).toEqual({'courtyard.shelf':true,'reading-room.shelf':true});
  await page.reload();await page.locator('#beginBtn').click();
  await page.locator('[data-location="courtyard"] button').click();
  await page.evaluate(()=>window.__game.startQuiz('courtyard'));
  await page.locator('[data-answer-index="1"]').click();await expect(page.locator('.fun-fact')).toHaveCount(0);
  await quiz(page,{first:true});
  expect(await page.evaluate(()=>window.__game.Progress.data.points)).toBe(75);
  expect(errors).toEqual([]);
});

test('one-field fact-to-quiz change scores the same item and works without WebGL',async({page})=>{
  await useLibrary(page,{flip:true,fallback:true});await page.locator('[data-location="courtyard"] button').click();await expect(page.locator('#fallback')).toBeVisible();
  await page.getByRole('button',{name:/Reading the signs/}).click();await finishCard(page);
  await page.evaluate(()=>window.__game.startQuiz('courtyard'));await quiz(page,{first:true,flip:true});
  const data=await page.evaluate(()=>window.__game.Progress.data);
  expect(data.points).toBe(45);expect(data.quizAwards).toEqual({'courtyard.shelf':true,'courtyard.note':true});
  await page.locator('[data-location="reading-room"] button').click();
  for(const title of ['Browse the shelves','Choose a book']){await page.getByRole('button',{name:new RegExp(title)}).click();await finishCard(page);}
  await page.evaluate(()=>window.__game.startQuiz('reading-room'));await quiz(page);
  await page.getByRole('button',{name:'View your certificate',exact:true}).click();
  await expect(page.locator('#completeTitle')).toHaveText('LIBRARY VISIT COMPLETE');await expect(page.locator('#cPoints')).toHaveText('85');
});
