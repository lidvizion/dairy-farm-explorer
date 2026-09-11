// Local-only visual and interaction review; start the static server on 4175.
import { chromium, devices, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const directory = 'artifacts/feedback-review';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('rcm_quality', 'perf'));
    await page.goto('http://127.0.0.1:4175');
    await page.locator('#beginBtn').click();
    await page.screenshot({ path: `${directory}/map-${reducedMotion}.png` });
    await page.locator('[data-location="farm"] button').click();
    await expect(page.locator('#tryWorld')).toHaveText('Optional: Cow comfort demo ↗');
    await page.screenshot({ path: `${directory}/farm-${reducedMotion}.png` });
    await page.getByRole('button', { name: 'Steps', exact: true }).click();
    await page.getByRole('button', { name: /2. Milking & Cooling/ }).click();
    const labels = await page.evaluate(() => window.__game.LOCATIONS[0].lessons[1].game.steps.map(s => s.t));
    const host = page.locator('#modalBody');
    await host.getByRole('button', { name: labels[0], exact: false }).click();
    await expect(host.locator('.route-step.connected')).toHaveCount(1);
    const animation = await host.locator('.just-connected').evaluate(el => getComputedStyle(el).animationName);
    expect(animation).toBe(reducedMotion === 'reduce' ? 'none' : 'route-connect');
    // A later correct item cannot jump an incorrect connection.
    await host.getByRole('button', { name: labels[2], exact: false }).click();
    await host.getByRole('button', { name: labels[1], exact: false }).click();
    await expect(host.locator('.route-step.connected')).toHaveCount(1);
    await expect(host.locator('.quiz-feedback')).toContainText('Not quite');
    await host.getByRole('button', { name: 'Clear route' }).click();
    await expect(host.locator('.route-step.connected')).toHaveCount(0);
    for (const label of labels.slice(0, 2)) await host.getByRole('button', { name: label, exact: false }).click();
    await host.locator('.route-step').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${directory}/route-${reducedMotion}.png` });
    expect(await page.evaluate(() => window.__game.Progress.isLessonDone('farm', 'milking'))).toBe(false);
    await page.locator('#modalClose').click();
    await page.setViewportSize({ width: 844, height: 390 });
    const launch = page.locator('#tryWorld');
    await expect(launch).toBeInViewport();
    await launch.click();
    await expect(page.locator('#labTitle')).toHaveText('Make a comfortable cow corner');
    await page.screenshot({ path: `${directory}/demo-landscape-${reducedMotion}.png` });
    results.push({ reducedMotion, placementAnimation: animation, wrongPrefixAndClear: 'passed', prematureReward: false });
    await context.close();
  }
  await writeFile(`${directory}/checks.json`, JSON.stringify(results, null, 2));
  console.log(results);
} finally { await browser.close(); }
