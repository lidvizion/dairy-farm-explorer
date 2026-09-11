// Local review only; start npm start on PORT=4175 first.
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const label=process.argv[2] || 'after';
const directory='artifacts/cow-review';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch();
try {
 const context=await browser.newContext({...devices['iPhone 13'],reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('rcm_quality','perf'));
 await page.goto('http://127.0.0.1:4175');
 await page.locator('#beginBtn').click();
 await page.locator('[data-location="farm"] button').click();
 await page.locator('#objective').waitFor();
 async function sample(){
  const frame=await page.evaluate(()=>window.__game.renderInfo().frame);
  await page.waitForFunction(f=>window.__game.renderInfo().frame>f+3,frame);
  return page.evaluate(()=>window.__game.renderInfo());
 }
 const spawn=await sample();
 await page.screenshot({path:`${directory}/${label}-farm.png`});
 await page.locator('#tryWorld').click();
 for(let i=0;i<3;i++)await page.locator('.lab-actions button').nth(i).click();
 const demo=await sample();
 await page.screenshot({path:`${directory}/${label}-demo.png`});
 // Identical fixed-camera isolated herd, useful for judging the model itself.
 const model=await page.evaluate(async()=>{
  const THREE=await import('/vendor/three/three.module.min.js');
  const cows=window.__game.scene().userData.cows;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xc9d9cd);
  scene.add(new THREE.HemisphereLight(0xfff4dd,0x66705e,2));
  const light=new THREE.DirectionalLight(0xffeed6,2);light.position.set(3,7,5);scene.add(light);
  cows.forEach((cow,i)=>{const copy=cow.clone();copy.position.set((i%2)*4.8-2.4,0,-Math.floor(i/2)*4);copy.rotation.y=i===2?.5:-.25;scene.add(copy);});
  const camera=new THREE.PerspectiveCamera(35,1.5,.1,100);camera.position.set(9,6,13);camera.lookAt(0,1,-2);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(1200,800);renderer.render(scene,camera);
  const result={image:renderer.domElement.toDataURL(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,views:{}};
  for(const [name,position] of [['side',[0,3,16]],['rear',[-10,4,-12]]]){
   camera.position.set(...position);camera.lookAt(0,1,-2);renderer.render(scene,camera);result.views[name]=renderer.domElement.toDataURL();
  }
  renderer.dispose();return result;
 });
 await writeFile(`${directory}/${label}-herd.png`,Buffer.from(model.image.split(',')[1],'base64'));
 for(const [name,url] of Object.entries(model.views))await writeFile(`${directory}/${label}-${name}.png`,Buffer.from(url.split(',')[1],'base64'));
 delete model.image;delete model.views;
 const result={spawn,demo,model};
 await writeFile(`${directory}/${label}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await browser.close();}


