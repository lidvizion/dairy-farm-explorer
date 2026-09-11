import {test,expect} from './support.js';

test('blank arcade name, reroll, top five and personal best survive reopening',async({page})=>{
  await page.goto('/');await page.locator('#beginBtn').click();
  await page.evaluate(async()=>{
    const g=window.__game;
    for(const lesson of g.LOCATIONS[0].lessons)g.Progress.completeLesson('farm',lesson.id);
    g.Progress.completeLocation('farm');
    const board=await import('/js/core/leaderboard.js');
    for(let i=1;i<=6;i++)await board.submitScore({displayName:`Cow ${i}`,points:i,badges:1,lessons:3,completedAt:'2026-09-10T00:00:00Z'});
    const key=(await import('/js/config/content.js')).MODULE.leaderboardKey;
    const saved=JSON.parse(localStorage.getItem(key));saved.displayName='';localStorage.setItem(key,JSON.stringify(saved));
    g.enterCompletion();
  });
  const input=page.locator('#complete #leaderboardName');
  await expect(input).toBeVisible();
  const original=await input.getAttribute('placeholder');
  await page.getByRole('button',{name:'New cow name',exact:true}).click();
  await expect(input).not.toHaveAttribute('placeholder',original);
  const chosen=await input.getAttribute('placeholder');
  await input.fill('   ');await page.getByRole('button',{name:'Save my score',exact:true}).click();
  await expect(page.locator('#complete .current-player')).toContainText(chosen);
  await expect(page.locator('#complete .leaderboard-list li')).toHaveCount(5);
  await expect(page.locator('#complete .leaderboard')).toContainText('ON THIS DEVICE');
  await page.screenshot({path:`test-results/leaderboard-${test.info().project.name}.png`});
  await page.reload();await page.locator('#beginBtn').click();
  await page.evaluate(()=>window.__game.enterCompletion());
  await expect(page.locator('#complete .current-player')).toContainText(chosen);
  await expect(page.locator('#complete #leaderboardName')).toHaveCount(0);
});
