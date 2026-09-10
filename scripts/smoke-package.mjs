// Exercise the actual package under a GitHub Pages-style project prefix.
// Run after package:site. This server is local-only and exists just for the check.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../site-dist/', import.meta.url));
const prefix = '/dairy-farm-explorer/';
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4'};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
    const file = resolve(root, relative);
    if (!file.startsWith(resolve(root) + sep)) { response.writeHead(403).end(); return; }
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}`);
  await page.locator('#beginBtn').click();
  await page.locator('[data-location="farm"] button').click();
  await expect(page.locator('#objective')).toBeVisible();
  await page.locator('#tryWorld').click();
  for (let i=0;i<3;i++) await page.locator('.lab-actions button').nth(i).click();
  await expect(page.locator('#labProgress')).toContainText('Complete');
  await page.locator('#labLesson').click();
  await expect(page.locator('#modal')).toBeVisible();
  expect(errors).toEqual([]);
  console.log('Packaged project-prefix smoke passed: entry, 3D, demonstration, lesson; no page errors.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
