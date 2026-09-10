import { moveVector } from './core/movement.js';
import { GAME_STATES, BRAND_ASSETS, EXTERNAL_LINKS, SCORING, COPY, LOCATIONS, LOC_BY_ID } from './config/content.js';
import { Analytics, Progress } from './core/progress.js';
import { renderLeaderboard } from './ui/leaderboard.js';
import { Audio } from './core/audio.js';
import { $, el, toast, caption } from './ui/dom.js';
import { validateLessonContent } from './lessons/validate-content.js';
import { configureLessonRenderer, setAfterLessonReturn, startLesson, startQuiz } from './lessons/renderer.js';
import { effectiveQuality as determineQuality, isTouchDevice } from './scenes/quality.js';
import { animateCow } from './scenes/animation.js';
import { createEnvironmentBuilders } from './scenes/location-environments.js';
import { dressEnvironment } from './scenes/environment-detail.js';
import { playIntro } from './ui/intro.js';
import { renderJourneyMap, DESTINATIONS } from './ui/journey-map.js';
import { readPreference, writePreference } from './core/preferences.js';

/* Application orchestration: UI flow, lesson rendering, and 3D scenes. */

function updateHUD(){
  $('hudPoints').textContent = Progress.data.points;
  $('hudLoc').textContent = Progress.locationsDoneCount();
  $('hudLes').textContent = Progress.lessonsDoneCount();
  $('hudBadge').textContent = Progress.badgeCount();
}
document.addEventListener('rcm:progresschange', updateHUD);
let persistenceNoticeShown=false;
function showPersistenceNotice(){
  // A toast behind the lesson overlay would be missed; defer until it closes.
  if(modalOpen)return;
  if(persistenceNoticeShown)return; persistenceNoticeShown=true;
  toast('Device storage is unavailable. Progress is kept only for this session.');
}
document.addEventListener('rcm:storageunavailable',showPersistenceNotice);

let modalOpen=false;
let modalReturnFocus=null;

// "Scroll for more" affordance: modal content (lessons especially — steps that
// build up a list, matching games, etc.) can grow taller than the viewport,
// especially on short mobile screens. Without a visible cue, players don't
// know a Continue/Check button is hiding below the fold. This watches the
// card for overflow (both on open and as content changes) and shows/hides a
// bobbing "Scroll for more" pill pinned to the bottom of the screen.
let modalScrollObserver=null;
function checkModalScroll(){
  const card=$('modalCard'), hint=$('scrollHint');
  if(!modalOpen){ hint.classList.add('hidden'); return; }
  const overflow = card.scrollHeight > card.clientHeight+2;
  const atBottom = card.scrollTop + card.clientHeight >= card.scrollHeight-4;
  hint.classList.toggle('hidden', !overflow || atBottom);
}
function openModal(title, sub, bodyBuilder){
  stopConfetti();
  document.dispatchEvent(new Event('rcm:modalopen'));
  const settings=$('graphicsSettings');
  settings.classList.add('hidden'); document.body.appendChild(settings);
  if(!modalOpen) modalReturnFocus=document.activeElement;
  for(const id of ['hud','title','journeyMap','objective','complete','fallback','joy','lookJoy','touchAct']) $(id).inert=true;
  modalOpen=true; resetInput();
  if(renderer)renderer.domElement.inert=true;
  $('modalTitle').innerHTML = title;
  $('modalSub').textContent = sub||'';
  const body=$('modalBody'); body.innerHTML='';
  bodyBuilder(body);
  $('modal').classList.remove('hidden');
  const card=$('modalCard'); card.scrollTop=0;
  // focus first focusable for keyboard users
  const f=body.querySelector('button,input,[tabindex]'); if(f) setTimeout(()=>f.focus(),30);
  requestAnimationFrame(checkModalScroll);
  if(modalScrollObserver) modalScrollObserver.disconnect();
  modalScrollObserver=new MutationObserver(()=>requestAnimationFrame(checkModalScroll));
  modalScrollObserver.observe(body,{childList:true,subtree:true});
}
function closeModal({restoreFocus=true}={}){
  resetInput();
  stopConfetti();
  document.dispatchEvent(new Event('rcm:modalclose'));
  for(const id of ['hud','title','journeyMap','objective','complete','fallback','joy','lookJoy','touchAct']) $(id).inert=false;
  $('graphicsSettings').classList.add('hidden');
  document.body.appendChild($('graphicsSettings'));
  $('modal').classList.add('hidden'); modalOpen=false;
  if(!Progress.persistenceAvailable)showPersistenceNotice();
  if(renderer)renderer.domElement.inert=!isLocationState();
  $('scrollHint').classList.add('hidden');
  if(modalScrollObserver){ modalScrollObserver.disconnect(); modalScrollObserver=null; }
  // Backing out of a lesson/quiz via the X (or any other close path) should
  // never leave that lesson's caption text stuck on screen, overlapping the
  // movement hint underneath it.
  caption('');
  if(restoreFocus && modalReturnFocus?.isConnected) modalReturnFocus.focus({preventScroll:true});
}
document.addEventListener('keydown', e=>{
  const dialog=modalOpen ? $('modal') : !$('complete').classList.contains('hidden') ? $('complete') : null;
  if(!dialog || e.key!=='Tab') return;
  const focusable=[...dialog.querySelectorAll('button:not(:disabled),a[href],input,[tabindex="0"]')].filter(node=>node.getClientRects().length);
  const first=focusable[0], last=focusable.at(-1);
  if(e.shiftKey && (document.activeElement===first || !focusable.includes(document.activeElement))){e.preventDefault();last?.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
});
$('modalCard').addEventListener('scroll',checkModalScroll);
addEventListener('resize',()=>{ if(modalOpen) checkModalScroll(); });
// Always-available X button — players can back out of any lesson, quiz, or
// dialog without being forced to finish it.
$('modalClose').addEventListener('click',closeModal);

// ---- confetti celebration (small burst, no deps) ----
let confettiRAF=null;
function stopConfetti(){
  if(confettiRAF) cancelAnimationFrame(confettiRAF);
  confettiRAF=null;
  $('confettiCanvas').classList.add('hidden');
}
function fireConfetti(){
  if(reducedMotion) return;
  const canvas=$('confettiCanvas'); canvas.classList.remove('hidden');
  canvas.width=innerWidth; canvas.height=innerHeight;
  const ctx=canvas.getContext('2d');
  const colors=['#f5b21e','#2a9c53','#0b5e2a','#ffffff','#4aa3d8'];
  const N=80;
  const particles=Array.from({length:N},()=>({
    x:canvas.width/2+(Math.random()-0.5)*160, y:canvas.height*0.32,
    vx:(Math.random()-0.5)*9, vy:-Math.random()*8-4, g:0.28+Math.random()*0.16,
    size:5+Math.random()*5, rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.3,
    color:colors[(Math.random()*colors.length)|0], life:1
  }));
  const startT=performance.now(); let last=startT;
  if(confettiRAF) cancelAnimationFrame(confettiRAF);
  function frame(now){
    const dt=Math.min(32,now-last); last=now;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=false;
    particles.forEach(p=>{
      p.vy+=p.g; p.x+=p.vx*(dt/16); p.y+=p.vy*(dt/16); p.rot+=p.vr; p.life-=0.011;
      if(p.life>0 && p.y<canvas.height+30){
        alive=true;
        ctx.save(); ctx.globalAlpha=Math.max(0,p.life); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
        ctx.restore();
      }
    });
    if(alive && now-startT<2200){ confettiRAF=requestAnimationFrame(frame); }
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.classList.add('hidden'); confettiRAF=null; }
  }
  confettiRAF=requestAnimationFrame(frame);
}

// generic confirm dialog
function confirmDialog(title, msg, onYes, yesLabel='Yes', noLabel='Cancel'){
  openModal(title,'',body=>{
    body.appendChild(el('p',null,msg));
    const row=el('div','btnrow');
    const no=el('button','btn btn-ghost',noLabel); no.onclick=closeModal;
    const yes=el('button','btn btn-primary',yesLabel); yes.onclick=()=>{ closeModal(); onYes(); };
    row.append(no,yes); body.appendChild(row);
  });
}

// help dialog
function showHelp(){
  Audio.click();
  openModal('❓ How to Play','Follow California dairy from farm to flavor.',body=>{
    body.innerHTML = `
      <p><b>Goal:</b> Visit 3 California destinations. At each one, finish 3 short lessons and a quiz to earn a badge. You do not need to collect anything extra to finish.</p>
      <ul>
        <li><b>Desktop:</b> Move with <b>W A S D</b> or arrow keys. Look with mouse drag. <b>E</b> or click to interact. Hold <b>Shift</b> to move faster. <b>Esc</b> or the Map button to leave a scene.</li>
        <li><b>Mobile — two thumb sticks:</b> the <b>left stick moves</b>, the <b>right stick looks</b> around. Tap the big <b>Interact</b> button (it turns gold and says <b>OPEN</b> when you’re next to a station).</li>
        <li><b>Next lesson</b> starts your next objective without walking. <b>📋 Steps</b> opens any lesson you want to revisit. On the map, choose a destination card.</li>
        <li><b>Map</b> returns you to California. <b>Sound</b> toggles audio. <b>Reset</b> puts you back at the scene’s start if you get stuck.</li>
      </ul>
      <p style="font-size:13px;color:#777;">Optional golden milk drops are worth a few extra points, but they are never required.</p>
      <div class="btnrow">
        <button class="btn btn-ghost" id="helpResetAll">Reset all progress</button>
        <button class="btn btn-primary" id="helpClose">Got it</button>
      </div>`;
    $('helpClose').onclick=closeModal;
    const settings=$('graphicsSettings');
    settings.classList.remove('hidden');
    body.appendChild(el('h3',null,'Graphics quality'));
    body.appendChild(settings);
    $('helpResetAll').onclick=()=>{
      confirmDialog('Reset all progress?','This clears your points, lessons, and badges on this device. This cannot be undone.',()=>{
        Progress.reset(); toast('Progress reset'); go(GAME_STATES.MAP);
      },'Reset everything','Keep my progress');
    };
  });
}

// Steps menu — jump straight to any lesson or the quiz in the current location
// (so players never have to precisely walk into a beacon, esp. on mobile).
function showStepsMenu(){
  const loc = active.loc; if(!loc) return;
  Audio.click();
  openModal(`📋 ${loc.title}`, loc.stage, body=>{
    body.appendChild(el('p',null,'Tap a step to jump straight to it.'));
    // Grid of compact tiles (icon + short label) that flow left-to-right and
    // wrap, instead of one long vertical list — much less scrolling, esp.
    // on short mobile screens.
    const list=el('div'); list.style.display='grid';
    list.style.gridTemplateColumns='repeat(auto-fit, minmax(122px,1fr))'; list.style.gap='10px';
    loc.lessons.forEach((les,i)=>{
      const done=Progress.isLessonDone(loc.id,les.id);
      const b=el('button','btn '+(done?'btn-ghost':'btn-primary'));
      b.style.cssText='flex-direction:column;gap:4px;padding:14px 8px;text-align:center;white-space:normal;line-height:1.25;';
      b.innerHTML=`<span style="font-size:26px;">${les.icon}</span><span style="font-size:13px;font-weight:800;">${i+1}. ${les.title}</span>${done?'<span style="font-size:12px;">✓ Done</span>':''}`;
      b.onclick=()=>{ closeModal(); startLesson(loc.id,les.id); };
      list.appendChild(b);
    });
    const lessonsDone=Progress.locationLessonsDone(loc.id);
    const quizReady=lessonsDone>=loc.lessons.length;
    const locDone=Progress.isLocationDone(loc.id);
    const q=el('button','btn '+(quizReady?'btn-sun':'btn-ghost'));
    q.style.cssText='flex-direction:column;gap:4px;padding:14px 8px;text-align:center;white-space:normal;line-height:1.25;';
    q.innerHTML=`<span style="font-size:26px;">🧠</span><span style="font-size:13px;font-weight:800;">Take the Quiz</span>${locDone?'<span style="font-size:12px;">✓ Done</span>':quizReady?'':'<span style="font-size:12px;">🔒 Locked</span>'}`;
    q.disabled=!quizReady;
    q.onclick=()=>{ closeModal(); startQuiz(loc.id); };
    list.appendChild(q);
    body.appendChild(list);
    const row=el('div','btnrow');
    const back=el('button','btn btn-ghost','🗺️ Back to map'); back.onclick=()=>{ closeModal({restoreFocus:false}); go(GAME_STATES.MAP); };
    const close=el('button','btn btn-primary','Keep exploring'); close.onclick=closeModal;
    row.append(back,close); body.appendChild(row);
  });
}

/* ============================================================================
   7. THREE.js setup, quality, disposal
============================================================================ */
let THREE=null, RoundedBoxGeometry=null, renderer=null, camera=null, webglOK=true;
let quality = readPreference('rcm_quality', 'auto');
const isTouch = isTouchDevice();

function effectiveQuality(){
  return determineQuality(quality);
}

let engineTask=null, lostDestination=null, resizeRAF=0;
let resizeCount=0;
async function initThree(){
  try {
    THREE = await import('three');
    try { ({RoundedBoxGeometry} = await import('three/addons/geometries/RoundedBoxGeometry.js')); }
    catch { RoundedBoxGeometry=null; }
    if(!camera){
      camera=new THREE.PerspectiveCamera(70,1,0.1,2000);
      camera.rotation.order='YXZ';
    }
    createRenderer();
    B=makeBuilders();
    environments=createEnvironmentBuilders(THREE,B);
    webglOK=true;
    startRenderLoop();
    return true;
  } catch {
    webglOK=false;
    renderer?.setAnimationLoop(null);
    return false;
  }
}

function createRenderer(){
  const high=effectiveQuality()==='high';
  const next=new THREE.WebGLRenderer({antialias:high});
  const previous=renderer;
  renderer=next;
  next.setPixelRatio(Math.min(devicePixelRatio,high?2:1));
  next.shadowMap.enabled=high;
  next.shadowMap.type=THREE.PCFSoftShadowMap;
  next.toneMapping=THREE.ACESFilmicToneMapping;
  next.toneMappingExposure=1.15;
  const canvas=next.domElement;
  canvas.id='worldCanvas';
  canvas.tabIndex=0;
  canvas.inert=modalOpen || !isLocationState();
  canvas.setAttribute('aria-label','Interactive 3D destination. Use WASD to move, drag to look, or use Next lesson.');
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    if(renderer!==next)return;
    lostDestination=isLocationState()?active.id:null;
    webglOK=false; next.setAnimationLoop(null); resetInput();
    if(lostDestination){
      if(modalOpen)closeModal({restoreFocus:false});
      enterFallback();
    }
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    if(renderer!==next)return;
    try {
      webglOK=true;
      resizeWorldNow();
      startRenderLoop();
      const destination=lostDestination; lostDestination=null;
      // Rebuild the disposed destination with fresh GPU resources. Do not interrupt
      // a learner who has already opened a fallback lesson during restoration.
      if(destination && active.id==='FALLBACK' && !modalOpen)go(destination);
      else if(active.id==='FALLBACK' && !modalOpen)renderFallback();
    } catch {
      webglOK=false; next.setAnimationLoop(null);
      if(!modalOpen)enterFallback();
    }
  });
  document.body.prepend(canvas);
  attachCanvasInput();
  resizeWorldNow();
  if(previous){previous.setAnimationLoop(null);previous.dispose();previous.forceContextLoss();previous.domElement.remove();}
}

// Keep one initialization in flight. A slow load can complete normally, including
// after the player chooses the text-friendly lessons; no abandoned timeout canvas.
function startEngine(){
  if(engineTask)return engineTask;
  engineTask=initThree().then(ok=>{
    if(ok && active.id==='FALLBACK' && !modalOpen)renderFallback();
    return ok;
  }).finally(()=>{engineTask=null;});
  engineReady=engineTask;
  return engineTask;
}

function startRenderLoop(){
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{
    const dt=Math.min(clock.getDelta(),0.05), t=clock.elapsedTime;
    try {
      if(active.update && !modalOpen)active.update(dt,t);
      if(active.scene && !modalOpen && webglOK)renderer.render(active.scene,camera);
    } catch(error) {
      console.error('The 3D scene stopped; switching to the accessible journey',error);
      renderer.setAnimationLoop(null); enterFallback();
    }
  });
}

function resizeWorld(){
  if(resizeRAF)return;
  resizeRAF=requestAnimationFrame(()=>{resizeRAF=0;resizeWorldNow();});
}
function resizeWorldNow(){
  if(!renderer || !camera)return;
  const width=window.visualViewport?.width || innerWidth, height=window.visualViewport?.height || innerHeight;
  const ratio=renderer.getPixelRatio(), canvas=renderer.domElement;
  if(camera.aspect!==width/height){camera.aspect=width/height;camera.updateProjectionMatrix();}
  if(canvas.width!==Math.floor(width*ratio) || canvas.height!==Math.floor(height*ratio)){
    renderer.setSize(width,height); resizeCount++;
  } else {
    canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  }
  if(modalOpen)checkModalScroll();
}
addEventListener('resize',resizeWorld);
window.visualViewport?.addEventListener('resize',resizeWorld);

function applyRendererQuality(){
  if(!renderer || !webglOK)return;
  const high=effectiveQuality()==='high';
  try {
    if(renderer.getContext().getContextAttributes().antialias!==high){
      resetInput();createRenderer();startRenderLoop();
    } else {
      const ratio=Math.min(devicePixelRatio,high?2:1);
      if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
    }
    renderer.shadowMap.enabled=high;
    renderer.shadowMap.needsUpdate=true;
    resizeWorld();
    active.scene?.traverse(object=>{
      if(object.isDirectionalLight||object.isSpotLight){
        object.castShadow=high;
        object.shadow.map?.dispose();object.shadow.map=null;
        object.shadow.mapSize.set(high?1024:512,high?1024:512);
      }
    });
  } catch { if(modalOpen)closeModal({restoreFocus:false});enterFallback(); }
}

// Deep-dispose a scene's geometry, materials, textures.
function disposeScene3D(scene){
  if(scene.background?.isTexture) scene.background.dispose();
  scene.traverse(obj=>{
    if(obj.geometry) obj.geometry.dispose();
    if(obj.material){
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      mats.forEach(m=>{ for(const k in m){ const v=m[k]; if(v&&v.isTexture)v.dispose(); } m.dispose(); });
    }
  });
  while(scene.children.length) scene.remove(scene.children[0]);
}

/* ============================================================================
   8. BUILD HELPERS + first-person controller
============================================================================ */
function makeBuilders(){
  const lamb=(color,extra={})=>new THREE.MeshLambertMaterial({color,...extra});
  const basic=(color,extra={})=>new THREE.MeshBasicMaterial({color,...extra});
  function box(w,h,d,mat,x=0,y=0,z=0,shadow=true){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); if(shadow){m.castShadow=m.receiveShadow=true;} return m; }
  // Rounded-corner box (three/addons RoundedBoxGeometry) for a softer, more
  // "polished toy" silhouette — falls back to a sharp box if the addon didn't load.
  function rbox(w,h,d,mat,x=0,y=0,z=0,radius=0.08,shadow=true){
    const geo = RoundedBoxGeometry ? new RoundedBoxGeometry(w,h,d,3,radius) : new THREE.BoxGeometry(w,h,d);
    const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); if(shadow){m.castShadow=m.receiveShadow=true;} return m;
  }
  function cyl(rt,rb,h,mat,x=0,y=0,z=0,seg=14,shadow=true){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat); m.position.set(x,y,z); if(shadow){m.castShadow=m.receiveShadow=true;} return m; }
  function ball(r,mat,x=0,y=0,z=0,shadow=true){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,12),mat); m.position.set(x,y,z); if(shadow){m.castShadow=m.receiveShadow=true;} return m; }
  function emojiSprite(emoji,scale=1.7){
    const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    x.font='92px serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emoji,64,72);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(scale,scale,1); return s;
  }
  function labelSprite(text,scale=1){
    // Auto-shrinks the font so long labels ("Consumer + Foodservice Packages")
    // fit inside the pill instead of clipping off the canvas edge.
    const c=document.createElement('canvas'); c.width=512; c.height=128; const x=c.getContext('2d');
    x.fillStyle='rgba(11,94,42,.92)'; roundRect(x,6,30,500,68,20); x.fill();
    x.fillStyle='#fff'; x.textAlign='center'; x.textBaseline='middle';
    const maxTextWidth=460; let fontSize=40;
    x.font=`700 ${fontSize}px Segoe UI, sans-serif`;
    while(fontSize>18 && x.measureText(text).width>maxTextWidth){ fontSize-=2; x.font=`700 ${fontSize}px Segoe UI, sans-serif`; }
    x.fillText(text,256,64);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(4*scale,1*scale,1); return s;
  }
  function roundRect(x,rx,ry,w,h,r){ x.beginPath(); x.moveTo(rx+r,ry); x.arcTo(rx+w,ry,rx+w,ry+h,r); x.arcTo(rx+w,ry+h,rx,ry+h,r); x.arcTo(rx,ry+h,rx,ry,r); x.arcTo(rx,ry,rx+w,ry,r); x.closePath(); }
  function noiseTexture(base,fleck,count,size=128){
    const c=document.createElement('canvas'); c.width=c.height=size; const x=c.getContext('2d');
    x.fillStyle=base; x.fillRect(0,0,size,size);
    for(let i=0;i<count;i++){ x.fillStyle=fleck[(Math.random()*fleck.length)|0]; x.globalAlpha=0.25+Math.random()*0.4; const s=1+Math.random()*3; x.fillRect(Math.random()*size,Math.random()*size,s,s); }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
  }
  // Bold Holstein-style patch texture (canvas, not tiny attached spheres) so
  // cows read clearly as cows — not sheep — at normal in-scene viewing distance.
  function cowTexture(spotted){
    const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    if(spotted){
      x.fillStyle='#fdfdfb'; x.fillRect(0,0,256,256);
      x.fillStyle='#20201e';
      const blob=(cx,cy,r)=>{ x.beginPath(); const n=8; for(let i=0;i<n;i++){ const a=(i/n)*Math.PI*2; const rr=r*(0.72+Math.random()*0.5); const px=cx+Math.cos(a)*rr, py=cy+Math.sin(a)*rr*0.85; i===0?x.moveTo(px,py):x.lineTo(px,py); } x.closePath(); x.fill(); };
      blob(70,70,58); blob(190,60,46); blob(60,190,50); blob(180,185,60); blob(128,128,34);
    } else {
      x.fillStyle='#c9975f'; x.fillRect(0,0,256,256);
      x.fillStyle='#b6844e';
      for(let i=0;i<4;i++){ x.globalAlpha=0.5; x.beginPath(); x.ellipse(40+Math.random()*180,40+Math.random()*180,34,26,Math.random()*Math.PI,0,Math.PI*2); x.fill(); }
      x.globalAlpha=1;
    }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
  }
  return {lamb,basic,box,rbox,cyl,ball,emojiSprite,labelSprite,noiseTexture,cowTexture};
}
let B=null, environments=null; // builders (set after THREE loads)

// ---- First-person controller (shared by location scenes) ----
const player={x:0,z:0,yaw:0,pitch:0,eye:1.7,bob:0};
let curOBST=[], curBounds={minX:-40,maxX:40,minZ:-40,maxZ:40}, curSpawn={x:0,z:0,yaw:0};
function resetPlayer(){ player.x=curSpawn.x; player.z=curSpawn.z; player.yaw=curSpawn.yaw; player.pitch=0; if(camera){camera.position.set(player.x,player.eye,player.z); camera.rotation.y=player.yaw; camera.rotation.x=0;} }

function updatePlayer(dt){
  // right look joystick — continuous camera rotation while held
  if(lookVec.x||lookVec.y){
    player.yaw   -= lookVec.x * dt * 2.6;
    player.pitch  = Math.max(-1.2, Math.min(1.2, player.pitch - lookVec.y * dt * 2.0));
  }
  let fx=0,fz=0;
  if(keys.has('KeyW')||keys.has('ArrowUp'))fz-=1;
  if(keys.has('KeyS')||keys.has('ArrowDown'))fz+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))fx-=1;
  if(keys.has('KeyD')||keys.has('ArrowRight'))fx+=1;
  fx+=joyVec.x; fz+=joyVec.y;
  const m=Math.hypot(fx,fz); if(m>1){fx/=m;fz/=m;}
  const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight'))?10:6;
  const direction=moveVector(fx,fz,player.yaw);
  const vx=direction.x*speed, vz=direction.z*speed;
  player.x+=vx*dt; player.z+=vz*dt;
  const R=0.55;
  for(const o of curOBST){ const dx=player.x-o.x,dz=player.z-o.z,rr=o.r+R,d2=dx*dx+dz*dz; if(d2<rr*rr&&d2>1e-4){const d=Math.sqrt(d2),p=(rr-d)/d; player.x+=dx*p; player.z+=dz*p;} }
  player.x=Math.max(curBounds.minX,Math.min(curBounds.maxX,player.x));
  player.z=Math.max(curBounds.minZ,Math.min(curBounds.maxZ,player.z));
  const moving=m>0.1; player.bob+=dt*(moving?speed*1.4:0);
  const bobY=moving&&!reducedMotion?Math.sin(player.bob)*0.05:0;
  camera.position.set(player.x,player.eye+bobY,player.z);
  camera.rotation.y=player.yaw; camera.rotation.x=player.pitch;
}

/* ---- global input ---- */
const keys=new Set();
addEventListener('keydown',e=>{
  if(modalOpen){ if(e.code==='Escape')closeModal(); return; }
  if(e.target.closest('button,a,input,textarea,select,[contenteditable]')) return;
  if(e.code==='Escape'){ if(isLocationState()) go(GAME_STATES.MAP); return; }
  if(!isLocationState()) return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if(e.code==='KeyE') interactNearest();
});
addEventListener('keyup',e=>keys.delete(e.code));
const stickResets=[];
function resetInput(){ keys.clear(); lookId=null; stickResets.forEach(reset=>reset()); }
addEventListener('blur',resetInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden) resetInput();});

const joyVec={x:0,y:0}, lookVec={x:0,y:0};
let downX=0,downY=0,downT=0,lastX=0,lastY=0,movedFar=false;

// Reusable virtual-stick factory (Roblox-style): drag the knob, get a -1..1 vector.
function makeStick(elId, knobId, vec){
  const stick=$(elId), knob=$(knobId); let id=null;
  function set(e){ const r=stick.getBoundingClientRect(); let dx=(e.clientX-(r.left+r.width/2))/(r.width/2), dy=(e.clientY-(r.top+r.height/2))/(r.height/2); const m=Math.hypot(dx,dy); if(m>1){dx/=m;dy/=m;} vec.x=dx; vec.y=dy; knob.style.left=`${50+dx*34}%`; knob.style.top=`${50+dy*34}%`; }
  function reset(){ const previous=id; id=null; vec.x=vec.y=0; knob.style.left='50%'; knob.style.top='50%'; if(previous!==null && stick.hasPointerCapture(previous)) stick.releasePointerCapture(previous); }
  stickResets.push(reset);
  function end(e){ if(e.pointerId===id) reset(); }
  stick.addEventListener('pointerdown',e=>{ if(id!==null || modalOpen)return; id=e.pointerId; stick.setPointerCapture(e.pointerId); e.preventDefault(); set(e); });
  stick.addEventListener('pointermove',e=>{ if(e.pointerId===id) set(e); });
  stick.addEventListener('pointerup',end); stick.addEventListener('pointercancel',end); stick.addEventListener('lostpointercapture',end);
}
makeStick('joy','joyKnob',joyVec);      // left  = move
makeStick('lookJoy','lookKnob',lookVec); // right = look
let lookId=null; // canvas drag-to-look pointer id
$('touchAct').addEventListener('click',()=>{ if(!modalOpen) interactNearest(); });

/* pointer look + tap-to-interact on canvas (attached after renderer exists) */
function attachCanvasInput(){
  const cv=renderer.domElement;
  cv.addEventListener('pointerdown',e=>{ if(lookId!==null||modalOpen||!isLocationState())return; cv.focus({preventScroll:true}); lookId=e.pointerId; downX=lastX=e.clientX; downY=lastY=e.clientY; downT=performance.now(); movedFar=false; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove',e=>{ if(e.pointerId!==lookId||modalOpen)return; const dx=e.clientX-lastX,dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; if(Math.hypot(e.clientX-downX,e.clientY-downY)>7)movedFar=true; player.yaw-=dx*0.0045; player.pitch=Math.max(-1.2,Math.min(1.2,player.pitch-dy*0.0045)); });
  cv.addEventListener('pointerup',e=>{ if(e.pointerId!==lookId)return; lookId=null; if(!modalOpen&&!movedFar&&performance.now()-downT<450) tryClick(e.clientX,e.clientY); });
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  // map clicks (markers)
  for(const type of ['pointercancel','lostpointercapture']) cv.addEventListener(type,e=>{if(e.pointerId===lookId)lookId=null;});
}

const raycaster = { r:null, ndc:null };
function ray(cx,cy,list){ if(!raycaster.r){ raycaster.r=new THREE.Raycaster(); raycaster.ndc=new THREE.Vector2(); } const rect=renderer.domElement.getBoundingClientRect(); raycaster.ndc.x=((cx-rect.left)/rect.width)*2-1; raycaster.ndc.y=-(((cy-rect.top)/rect.height)*2-1); raycaster.r.setFromCamera(raycaster.ndc,camera); return raycaster.r.intersectObjects(list,true); }
function resolveTarget(o){ while(o&&!(o.userData&&o.userData.type))o=o.parent; return o; }

function isLocationState(){ return [GAME_STATES.FARM,GAME_STATES.PROCESSOR,GAME_STATES.MARKET].includes(active.id); }

/* ============================================================================
   9-10. SCENES + SCENE MANAGER
============================================================================ */
let active={ id:null, scene:null, update:null, dispose:null };
function setActive(id,{scene=null,update=null,dispose=null}){
  if(active.dispose) try{active.dispose();}catch(e){}
  if(active.scene) disposeScene3D(active.scene);
  active={id,scene,update,dispose};
}

// central navigation
function go(stateId, opts={}){
  resetInput();
  if(modalOpen) closeModal({restoreFocus:false});
  for(const id of ['hud','title','journeyMap','objective','fallback','joy','lookJoy','touchAct'])$(id).inert=false;
  if(stateId!==GAME_STATES.COMPLETION) $('completionBoard')?.replaceChildren();
  // In no-WebGL mode, all map/location navigation resolves to the DOM fallback
  // hub (completion is a DOM screen and still works).
  if(!webglOK && [GAME_STATES.FARM,GAME_STATES.PROCESSOR,GAME_STATES.MARKET].includes(stateId)){
    $('complete').classList.add('hidden');
    enterFallback(); return;
  }
  // toggle chrome
  const showHUD = [GAME_STATES.MAP,GAME_STATES.FARM,GAME_STATES.PROCESSOR,GAME_STATES.MARKET].includes(stateId);
  $('hud').classList.toggle('hidden',!showHUD);
  const onMap = stateId===GAME_STATES.MAP;
  $('caption').classList.remove('hidden');
  $('fallback').classList.add('hidden');
  $('complete').classList.add('hidden');
  $('btnMap').classList.toggle('hidden',onMap);
  const inLoc=[GAME_STATES.FARM,GAME_STATES.PROCESSOR,GAME_STATES.MARKET].includes(stateId);
  if(renderer)renderer.domElement.inert=!inLoc;
  // Joysticks visible on all platforms (desktop gets arrow labels; mobile uses touch).
  // This helps players discover the movement and look controls without guessing.
  $('joy').classList.toggle('hidden',!inLoc);
  $('lookJoy').classList.toggle('hidden',!inLoc);
  $('touchAct').classList.toggle('hidden',!inLoc);
  document.body.classList.toggle('touch-controls-active',inLoc);
  $('btnSteps').classList.toggle('hidden',!inLoc);
  $('btnReset').classList.toggle('hidden',!inLoc);
  $('hint').classList.toggle('hidden',!inLoc);
  $('objective').classList.toggle('hidden',!inLoc);
  document.body.dataset.screen=stateId;
  keys.clear(); joyVec.x=joyVec.y=lookVec.x=lookVec.y=0;
  caption('');
  $('hint').textContent='';

  try {
  if(stateId===GAME_STATES.EARTH_INTRO) return enterEarthIntro();
  if(stateId===GAME_STATES.MAP)         return enterMap(opts);
  if(stateId===GAME_STATES.FARM)        return enterLocation('farm');
  if(stateId===GAME_STATES.PROCESSOR)   return enterLocation('processor');
  if(stateId===GAME_STATES.MARKET)      return enterLocation('market');
  if(stateId===GAME_STATES.COMPLETION)  return enterCompletion();
  } catch(error) {
    console.error('Destination could not be opened', error);
    enterFallback();
  }
}

/* ---------------- OPENING FILM + JOURNEY MAP ---------------- */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let engineReady = Promise.resolve(false);

function enterEarthIntro(){
  Analytics.track('intro_started');
  setActive(GAME_STATES.EARTH_INTRO, {});
  active.dispose = playIntro({
    video: $('introVideo'), root: $('title'), playButton: $('playIntro'),
    skipButton: $('skipIntro'), beginButton: $('beginBtn'), status: $('introStatus'),
    reducedMotion,
    onFinish: () => { Audio.init(); Analytics.track('intro_completed'); go(GAME_STATES.MAP); }
  });
  focusHeading($('title').querySelector('h1'));
}

function enterMap(){
  Analytics.track('map_opened');
  setActive(GAME_STATES.MAP, {});
  const disposeMap = renderJourneyMap($('journeyMap'), {
    onEnter: onMarker,
    onLeaderboard:()=>openModal('Leaderboard','The California field guide',body=>renderLeaderboard(body)),
    onReplay: () => go(GAME_STATES.EARTH_INTRO),
    onComplete: () => go(GAME_STATES.COMPLETION)
  });
  $('journeyMap').prepend($('hud'));
  active.dispose=()=>{document.body.appendChild($('hud'));disposeMap();};
  updateHUD();
  focusHeading($('journeyMap').querySelector('h1'));
}

async function onMarker(loc){
  if(!Progress.isUnlocked(loc.id)) return;
  Audio.init(); Audio.click();
  const origin = active;
  $('engineStatus').textContent = 'Preparing your destination…';
  const slowTimer=setTimeout(()=>{
    if(active!==origin)return;
    const status=$('engineStatus'); status.textContent='3D is taking longer to load. ';
    const fallback=el('button','btn btn-ghost','Use text-friendly lessons');
    fallback.onclick=()=>{status.replaceChildren();enterFallback();};status.append(fallback);
  },12000);
  const ready = await engineReady;
  clearTimeout(slowTimer);
  $('engineStatus').textContent = '';
  if(active !== origin) return; // navigation changed while the engine loaded
  if(!ready || !webglOK){ enterFallback(); return; }
  go(loc.id==='farm'?GAME_STATES.FARM:loc.id==='processor'?GAME_STATES.PROCESSOR:GAME_STATES.MARKET);
}

/* ---------------- LOCATION SCENES ---------------- */
function enterLocation(locId){
  const loc=LOC_BY_ID[locId];
  Analytics.track('location_started',{location:locId});
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xbfe3f5); scene.fog=new THREE.Fog(0xcfe8f5,55,130);
  // Non-shadowed sky and bounce light keep foliage and sheltered surfaces readable.
  scene.add(new THREE.HemisphereLight(0xe4f2ff,0xb0a080,1.6));
  scene.add(new THREE.AmbientLight(0xfff1d6,0.65));
  const sun=new THREE.DirectionalLight(0xffe4b8,2.6); sun.position.set(-18,30,12);
  sun.castShadow=effectiveQuality()==='high'; sun.shadow.mapSize.set(effectiveQuality()==='high'?1024:512,effectiveQuality()==='high'?1024:512); sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36; sun.shadow.camera.far=110; sun.shadow.bias=-0.0003; sun.shadow.normalBias=.03;
  scene.add(sun);

  // ground
  const grass=B.noiseTexture(loc.id==='farm'?'#929575':'#a5ac9c',loc.id==='farm'?['#8c8b6a','#98977a','#a5a183']:['#a1a899','#abb0a1','#b2b5a8'],600); grass.repeat.set(24,24);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),B.lamb(0xffffff,{map:grass})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

  const clickables=[]; const obst=[];
  const addObst=(x,z,r)=>obst.push({x,z,r});

  // build themed environment
  if(locId==='farm')      environments.buildFarm(scene,addObst);
  if(locId==='processor') environments.buildProcessor(scene,addObst);
  if(locId==='market')    environments.buildMarket(scene,addObst);
  dressEnvironment(THREE,scene,loc);
  const environmentLabels=[];
  scene.traverse(object=>{ if(object.userData.environmentLabel) environmentLabels.push(object); });
  const labelPosition=new THREE.Vector3();
  const sceneCows = scene.userData.cows || [];
  sceneCows.forEach(c=>{ c.userData.type='cow'; clickables.push(c); addObst(c.position.x,c.position.z,0.9); });

  // lesson stations (beacons) arranged in an arc in front of spawn
  // (a location can override this — see market's stationPos — when the
  // generic arc would land a beacon inside a building's collision zone)
  const stationPos=loc.stationPos || [[-10,-6],[0,-11],[10,-6]];
  const beacons=[];
  loc.lessons.forEach((lesson,i)=>{
    const [sx,sz]=stationPos[i];
    const done=Progress.isLessonDone(locId,lesson.id);
    const g=makeBeacon(lesson.icon, done?0x9e9e9e:loc.color, `${i+1}. ${lesson.title}`);
    g.position.set(sx,0,sz);
    Object.assign(g.userData,{type:'station',kind:'lesson',lesson,idx:i,done});
    scene.add(g); clickables.push(g); beacons.push(g); addObst(sx,sz,0.6);
  });
  // quiz station (center-back), locked until 3 lessons done
  const quizG=makeBeacon('🧠',0xf5b21e,'Take the Quiz');
  const [quizX,quizZ]=loc.quizPos || [0,-18];
  quizG.position.set(quizX,0,quizZ);
  Object.assign(quizG.userData,{type:'station',kind:'quiz'});
  scene.add(quizG); clickables.push(quizG); addObst(quizX,quizZ,0.6);

  // collectibles (golden milk drops) — optional
  const drops=[];
  const dropSpots=[[-14,2],[14,2],[0,4]];
  dropSpots.forEach(([dx,dz],i)=>{
    const id=`${locId}.drop${i}`;
    if(Progress.data.collectibles[id]) return;
    const d=makeDrop(); d.scale.setScalar(.65); d.position.set(dx,0.8,dz); d.userData={type:'drop',id}; scene.add(d); clickables.push(d); drops.push(d);
  });

  // spawn + bounds — all stations sit at negative Z from spawn, so face yaw:0
  // (Three.js default camera forward is -Z) so "W" visually advances toward them.
  curSpawn={x:0,z:8,yaw:0}; curBounds={minX:-24,maxX:24,minZ:-26,maxZ:22}; curOBST=obst;
  resetPlayer();

  const refreshStations=()=>{
    const lessonsDone=Progress.locationLessonsDone(locId);
    beacons.forEach(b=>{ const dn=Progress.isLessonDone(locId,b.userData.lesson.id); b.userData.done=dn; setBeaconDone(b,dn,loc.color); });
    const unlocked=lessonsDone>=loc.lessons.length && !Progress.isLocationDone(locId);
    quizG.userData.unlocked=unlocked;
    quizG.userData.doneLoc=Progress.isLocationDone(locId);
    setBeaconLocked(quizG, !(lessonsDone>=loc.lessons.length));
    const next=loc.lessons.find(lesson=>!Progress.isLessonDone(locId,lesson.id));
    $('objectivePlace').textContent=`CHAPTER 0${loc.order} · ${DESTINATIONS[locId].title}`;
    $('objectiveTitle').textContent=next ? next.title : Progress.isLocationDone(locId) ? 'Chapter complete' : 'Ready for your quiz?';
    $('objectiveProgress').textContent=`${lessonsDone}/${loc.lessons.length} lessons complete`;
    $('nextLesson').textContent=next ? 'Start next lesson →' : Progress.isLocationDone(locId) ? 'Continue the journey →' : 'Take the quiz →';
    $('nextLesson').onclick=()=>next ? startLesson(locId,next.id) : Progress.isLocationDone(locId) ? go(GAME_STATES.MAP) : startQuiz(locId);
  };
  refreshStations();

  // Direction arrow pointing to next destination (first incomplete lesson, or quiz if done)
  // Uses a simple billboard-style sprite that always faces camera
  function makeArrowSprite(){
    const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    x.fillStyle='#e4b45b'; x.beginPath(); x.moveTo(70,85);x.lineTo(186,85);x.lineTo(128,165);x.closePath();x.fill();
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
    s.scale.set(5,5,1); return s;
  }
  const dirArrow=makeArrowSprite();
  scene.add(dirArrow);

  let tipT=0;
  const update=(dt,t)=>{
    if(!modalOpen) updatePlayer(dt);
    environmentLabels.forEach(label=>{label.getWorldPosition(labelPosition); label.visible=Math.hypot(labelPosition.x-player.x,labelPosition.z-player.z)<10;});
    // animate beacons + drops
    clickables.forEach((c,i)=>{ if(c.userData.type==='station'){ if(c.userData.icon){c.userData.icon.position.y=2.1+(reducedMotion?0:Math.sin(t*2+i)*0.08);} }
      if(c.userData.type==='drop'){ if(!reducedMotion){c.position.y=0.8+Math.sin(t*2.5+i)*0.14; c.rotation.y+=dt*1.6;} if(!modalOpen && Math.hypot(c.position.x-player.x,c.position.z-player.z)<1.3) collectDrop(c); }
      // gentle head-graze bob + tail swish so cows read as alive, not static props
      if(c.userData.type==='cow'&&!reducedMotion) animateCow(c,t); });

    // Update direction arrow to point toward next destination + flash
    if(!modalOpen){
      // Find next destination: first incomplete lesson, or quiz if all lessons done
      let nextDest=null;
      for(const b of beacons){ if(!b.userData.done){ nextDest=b; break; } }
      if(!nextDest && !Progress.isLocationDone(locId) && Progress.locationLessonsDone(locId)>=loc.lessons.length) nextDest=quizG;
      for(const station of [...beacons,quizG]) station.userData.label.visible=station===nextDest || Math.hypot(station.position.x-player.x,station.position.z-player.z)<7;

      if(nextDest){
        // Position arrow above next destination (billboard style, always faces camera)
        dirArrow.position.copy(nextDest.position);
        dirArrow.position.y=3.25;
        // Pulsing scale + opacity for flashing effect
        const pulse=reducedMotion?1.3:1.3+Math.sin(t*2.5)*0.12;
        dirArrow.scale.set(pulse,pulse,1);
        dirArrow.material.opacity=0.85+Math.sin(t*2.5)*0.15;
        dirArrow.visible=true;
      } else {
        dirArrow.visible=false;
      }
      updateLocHint(loc,beacons,quizG); checkAutoInteract();
    }
  };

  setActive(locId==='farm'?GAME_STATES.FARM:locId==='processor'?GAME_STATES.PROCESSOR:GAME_STATES.MARKET,{
    scene,update,dispose:()=>{ setAfterLessonReturn(()=>{}); document.removeEventListener('rcm:progresschange',refreshStations); }
  });
  setAfterLessonReturn(refreshStations);
  document.addEventListener('rcm:progresschange',refreshStations);
  active.clickables=clickables; active.loc=loc; active.beacons=beacons; active.quizG=quizG;

  function collectDrop(d){ if(d.userData.got)return; d.userData.got=true; d.visible=false; if(Progress.collect(d.userData.id)){ Audio.pop(); toast(`+${SCORING.collectible} 💧 Golden milk drop!`); } }
  active.collectDrop=collectDrop;

  caption('');
  toast(`${loc.badge.emoji} ${loc.title}`);
  focusHeading($('objectiveTitle'));
}

function updateLocHint(loc,beacons,quizG){
  const hint=$('hint'), act=$('touchAct');
  let near=null,nd=4.2;
  for(const b of beacons){ const d=Math.hypot(b.position.x-player.x,b.position.z-player.z); if(d<nd){nd=d;near=b;} }
  const dq=Math.hypot(quizG.position.x-player.x,quizG.position.z-player.z);
  if(dq<4.2 && dq<nd){ near=quizG; nd=dq; }
  let ready=false;
  if(near){
    hint.classList.add('action');
    if(near.userData.kind==='quiz'){
      if(Progress.isLocationDone(loc.id)){ hint.innerHTML=`✅ Quiz complete — get close to start over`; ready=true; }
      else if(Progress.locationLessonsDone(loc.id)>=loc.lessons.length){ hint.innerHTML=`🧠 <b>Take the Quiz</b> — press E or tap to start`; ready=true; }
      else hint.innerHTML=`🔒 Finish all 3 lessons to unlock the quiz (${Progress.locationLessonsDone(loc.id)}/3)`;
    } else {
      const dn=near.userData.done;
      hint.innerHTML=`${dn?'✅':'📘'} <b>${near.userData.lesson.title}</b> — get closer to start`;
      ready=true;
    }
  } else {
    hint.classList.remove('action');
    hint.innerHTML = isTouch
      ? 'Left stick to move · right stick to look · or tap <b>📋 Steps</b> to jump to any lesson.'
      : 'Walk (W A S D or arrows) to a glowing station — it starts automatically when you get close, or use <b>📋 Steps</b>.';
  }
  // context-aware interact button (mobile) — only touch DOM when state changes
  const rs = ready?'1':'0';
  if(act.dataset.ready!==rs){ act.dataset.ready=rs; act.classList.toggle('ready',ready); act.innerHTML = ready ? 'OPEN' : 'TAP TO<br>INTERACT'; }
}

/* interact: nearest station via E / touch button / auto-trigger when very close */
let lastAutoInteractTime=0;
function interactNearest(){
  if(active.id===GAME_STATES.MAP){ return; }
  if(!isLocationState()||!active.beacons) return;
  const loc=active.loc;
  let near=null,nd=4.5;
  for(const b of active.beacons){ const d=Math.hypot(b.position.x-player.x,b.position.z-player.z); if(d<nd){nd=d;near=b;} }
  const q=active.quizG; const dq=Math.hypot(q.position.x-player.x,q.position.z-player.z);
  if(dq<4.5 && dq<nd) near=q;
  if(!near) return;
  activateStation(near);
}
// Auto-interact when player gets very close (< 1.5 units). To avoid the modal
// re-opening the instant it's closed (player is still standing in range), we
// "arm" only once per station: once triggered, that same station won't
// auto-trigger again until the player leaves its radius and comes back.
let armedStation=null;
function checkAutoInteract(){
  if(!isLocationState()||!active.beacons||modalOpen) return;
  const now=performance.now();
  let near=null,nd=1.5;
  for(const b of active.beacons){ const d=Math.hypot(b.position.x-player.x,b.position.z-player.z); if(d<nd){nd=d;near=b;} }
  const dq=Math.hypot(active.quizG.position.x-player.x,active.quizG.position.z-player.z);
  if(dq<1.5 && dq<nd){ near=active.quizG; nd=dq; }
  if(!near){ armedStation=null; return; } // out of range of everything — re-arm for next time
  if(near===armedStation) return; // same station we just closed — wait until player leaves range
  if(now-lastAutoInteractTime<500) return;
  lastAutoInteractTime=now; armedStation=near;
  interactNearest();
}
function tryClick(cx,cy){
  if(!isLocationState()||!active.clickables) return;
  const hits=ray(cx,cy,active.clickables);
  for(const h of hits){ const o=resolveTarget(h.object); if(!o)continue;
    if(o.userData.type==='drop'){ if(h.distance<18) active.collectDrop(o); return; }
    if(o.userData.type==='cow'){ if(h.distance<24) Audio.moo(); return; }
    if(o.userData.type==='station'){ const d=Math.hypot(o.position.x-player.x,o.position.z-player.z); if(d<9) activateStation(o); else toast('🚶 Walk a little closer!'); return; }
  }
}
function activateStation(g){
  const loc=active.loc;
  if(g.userData.kind==='lesson'){ startLesson(loc.id,g.userData.lesson.id); return; }
  if(g.userData.kind==='quiz'){
    if(Progress.locationLessonsDone(loc.id)<loc.lessons.length){ toast(`🔒 Finish all 3 lessons first (${Progress.locationLessonsDone(loc.id)}/3)`); return; }
    startQuiz(loc.id);
  }
}

/* ---- beacon + drop factories ---- */
function makeBeacon(emoji,color,labelText){
  const g=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.0,1.5,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.85,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=0.06; g.add(ring);
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.5,1.4,12,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide})); pillar.position.y=.7; g.add(pillar);
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'); ctx.beginPath();ctx.arc(64,64,54,0,Math.PI*2);ctx.fillStyle='#193e30';ctx.fill();ctx.strokeStyle='#f4e4ba';ctx.lineWidth=5;ctx.stroke();
  ctx.fillStyle='#fff9ee';ctx.font='600 52px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(/^\d/.test(labelText)?labelText[0]:'?',64,66);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const icon=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true}));icon.scale.set(1.35,1.35,1);icon.position.y=2.1;g.add(icon);
  const label=B.labelSprite(labelText,0.85); label.position.y=3.85; g.add(label);
  g.userData={ring,pillar,icon,label};
  return g;
}
function setBeaconDone(g,done,color){ g.userData.ring.material.color.set(done?0x9e9e9e:color); g.userData.ring.material.opacity=done?0.4:0.85; g.userData.pillar.visible=!done; }
function setBeaconLocked(g,locked){ g.userData.pillar.visible=!locked; g.userData.ring.material.color.set(locked?0x9e9e9e:0xf5b21e); g.userData.ring.material.opacity=locked?0.4:0.85; g.userData.icon.material.opacity=locked?0.5:1; g.userData.icon.material.transparent=true; }
function makeDrop(){ const g=new THREE.Group(); const m=B.lamb(0xf5b21e,{emissive:0x7a5600,emissiveIntensity:0.4}); const ball=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,10),m); const tip=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.45,12),m); tip.position.y=0.42; g.add(ball); g.add(tip); return g; }

/* ---------------- COMPLETION ---------------- */
function focusHeading(heading){ if(!heading)return; heading.tabIndex=-1; heading.focus({preventScroll:true}); }
function enterCompletion(){
  if(modalOpen)closeModal({restoreFocus:false});
  resetInput();
  if(renderer)renderer.domElement.inert=true;
  Analytics.track('game_completed',{points:Progress.data.points});
  setActive(GAME_STATES.COMPLETION,{});
  $('hud').classList.add('hidden'); $('hint').classList.add('hidden'); $('joy').classList.add('hidden'); $('touchAct').classList.add('hidden');
  Audio.fanfare();
  $('cPoints').textContent=Progress.data.points;
  $('cLoc').textContent=`${Progress.locationsDoneCount()}/3`;
  $('cLes').textContent=`${Progress.lessonsDoneCount()}/9`;
  $('cFirst').textContent=Progress.data.quizFirstTry;
  const br=$('cBadges'); br.innerHTML='';
  LOCATIONS.forEach(l=>{ if(Progress.data.badges[l.id]){ const c=el('div','badge-chip',`<span class="em">${l.badge.emoji}</span><span>${l.badge.name}</span>`); br.appendChild(c);} });
  for(const id of ['hud','title','journeyMap','objective','fallback','joy','lookJoy','touchAct'])$(id).inert=true;
  for(const id of ['objective','lookJoy','caption'])$(id).classList.add('hidden');
  $('complete').classList.remove('hidden');
  let board=$('completionBoard');
  if(!board){board=document.createElement('section');board.id='completionBoard';$('cBadges').after(board);}
  renderLeaderboard(board,{offerSubmission:Progress.badgeCount()>0});
  focusHeading($('completeTitle'));
}
$('cMap').onclick=()=>{ $('complete').classList.add('hidden'); go(GAME_STATES.MAP); };
$('cReplay').onclick=()=>{ confirmDialog('Play again?','This resets your progress and starts a fresh journey.',()=>{ Progress.reset(); go(GAME_STATES.EARTH_INTRO); },'Start over','Cancel'); };
$('cProducts').onclick=()=>{ Analytics.track('external_cta_clicked',{cta:'products'}); window.open(EXTERNAL_LINKS.products,'_blank','noopener'); };
$('cFoodservice').onclick=()=>{ Analytics.track('external_cta_clicked',{cta:'foodservice'}); window.open(EXTERNAL_LINKS.foodservice,'_blank','noopener'); };

/* ============================================================================
   11. FALLBACK (no-WebGL) — same educational content, DOM only
============================================================================ */
function enterFallback(){
  webglOK=false;
  if(renderer)renderer.domElement.inert=true;
  renderer?.setAnimationLoop(null);
  resetInput();
  setActive('FALLBACK',{});
  for(const id of ['hud','hint','caption','joy','lookJoy','touchAct','objective','complete']) $(id).classList.add('hidden');
  document.body.classList.remove('touch-controls-active');
  document.body.dataset.screen='FALLBACK';
  Analytics.track('fallback_shown');
  $('boot').classList.add('hidden'); $('title').classList.add('hidden'); $('hud').classList.add('hidden');
  const root=$('fallback'); root.classList.remove('hidden');
  renderFallback();
  focusHeading(root.querySelector('h1'));
}
function renderFallback(){
  const root=$('fallback');
  root.innerHTML='';
  const wrap=el('div','fb-wrap');
  const head=el('div','fb-head');
  head.innerHTML=`<img src="${BRAND_ASSETS.logo}" alt="Real California Milk (logo placeholder)">
    <h1>The Farm-to-Flavor Journey</h1>
    <p>${COPY.title.split(':')[1]||''}</p>
    <p style="font-size:12.5px;color:#789;">Text-friendly version — the same lessons, quizzes, and certificate, without 3D.</p>`;
  wrap.appendChild(head);
  const retry=el('button','btn btn-primary',webglOK?'Return to 3D':'Retry 3D');
  const retryStatus=el('p');retryStatus.setAttribute('role','status');
  retry.onclick=async()=>{
    retry.disabled=true;retryStatus.textContent='Preparing 3D. You can continue with the lessons while it loads.';
    const origin=active;
    const ok=webglOK || await startEngine();
    if(active!==origin || modalOpen)return;
    if(ok)go(lostDestination || GAME_STATES.MAP);
    else {retry.disabled=false;retryStatus.textContent='3D is still unavailable. Try again or continue with the lessons.';}
  };
  head.append(retry,retryStatus);
  // progress bar
  const prog=el('div','chip-grid'); prog.style.justifyContent='center';
  prog.innerHTML=`<div class="chip">⭐ ${Progress.data.points}</div><div class="chip">📍 ${Progress.locationsDoneCount()}/3</div><div class="chip">📘 ${Progress.lessonsDoneCount()}/9</div><div class="chip">🏅 ${Progress.badgeCount()}/3</div>`;
  wrap.appendChild(prog);

  LOCATIONS.forEach(loc=>{
    const unlocked=Progress.isUnlocked(loc.id), done=Progress.isLocationDone(loc.id);
    const card=el('div','fb-loc'+(unlocked?'':' locked'));
    card.innerHTML=`<div class="stage">${loc.stage}</div><h3>${loc.order}. ${loc.title} ${done?'<span class="fb-done">✓ done</span>':''}</h3><p>${loc.intro}</p>`;
    const btns=el('div','fb-lessons');
    if(!unlocked){ btns.innerHTML='<span style="color:#999;font-weight:700;">🔒 Complete the previous location to unlock.</span>'; }
    else{
      loc.lessons.forEach(les=>{ const d=Progress.isLessonDone(loc.id,les.id); const b=el('button','btn '+(d?'btn-ghost':'btn-primary'),`${les.icon} ${les.title}${d?' ✓':''}`); b.onclick=()=>startLesson(loc.id,les.id); btns.appendChild(b); });
      const qd=Progress.locationLessonsDone(loc.id)>=loc.lessons.length;
      const qb=el('button','btn '+(qd?'btn-sun':'btn-ghost'),`🧠 Quiz${done?' ✓':''}`); qb.disabled=!qd&&!done; qb.onclick=()=>startQuiz(loc.id); btns.appendChild(qb);
    }
    card.appendChild(btns); wrap.appendChild(card);
  });

  if(Progress.allDone()){
    const c=el('div','fb-loc'); c.style.borderLeftColor='var(--sun)';
    c.innerHTML='<h3>🏆 Journey complete!</h3><p>You followed California dairy from farm to flavor.</p>';
    const row=el('div','fb-lessons');
    const cert=el('button','btn btn-primary','View certificate'); cert.onclick=()=>enterCompletion();
    const prod=el('button','btn btn-ghost','Find Products ↗'); prod.onclick=()=>{Analytics.track('external_cta_clicked',{cta:'products'});window.open(EXTERNAL_LINKS.products,'_blank','noopener');};
    const food=el('button','btn btn-sun','Foodservice ↗'); food.onclick=()=>{Analytics.track('external_cta_clicked',{cta:'foodservice'});window.open(EXTERNAL_LINKS.foodservice,'_blank','noopener');};
    row.append(cert,prod,food); c.appendChild(row); wrap.appendChild(c);
  }
  const reset=el('div'); reset.style.textAlign='center'; reset.style.margin='18px 0';
  const rb=el('button','btn btn-ghost','🔄 Reset progress'); rb.onclick=()=>confirmDialogFallback(); reset.appendChild(rb); wrap.appendChild(reset);
  root.appendChild(wrap);
  // in fallback, lessons/quiz reuse the same modal; after they finish, re-render hub
  setAfterLessonReturn(()=>renderFallback());
}
function confirmDialogFallback(){ if(confirm('Reset all progress on this device?')){ Progress.reset(); renderFallback(); } }
// Note: in no-WebGL mode, go() detects !webglOK and re-renders this DOM hub,
// so the quiz "Continue to the map" button works correctly in the fallback too.

/* ============================================================================
   12. BOOT
============================================================================ */
// HUD buttons
$('btnMap').onclick=()=>{ Audio.click(); go(GAME_STATES.MAP); };
$('btnSteps').onclick=showStepsMenu;
$('btnHelp').onclick=showHelp;
$('btnReset').onclick=()=>{ Audio.click(); if(isLocationState()){ resetPlayer(); toast('Position reset'); } else { toast('Nothing to reset here'); } };
$('btnSound').onclick=()=>{ const on=Audio.toggle(); $('btnSound').innerHTML=(on?'🔊':'🔇')+' <span class="lbl">Sound</span>'; $('btnSound').setAttribute('aria-pressed',on?'true':'false'); };

// quality segmented control
$('qualitySeg').querySelectorAll('button').forEach(b=>{
  const selected=b.dataset.q===quality;
  b.classList.toggle('on',selected);
  b.setAttribute('aria-pressed',selected?'true':'false');
  b.onclick=()=>{
    quality=b.dataset.q;
    writePreference('rcm_quality',quality);
    $('qualitySeg').querySelectorAll('button').forEach(x=>{
      x.classList.toggle('on',x===b);
      x.setAttribute('aria-pressed',x===b?'true':'false');
    });
    applyRendererQuality();
    toast(`Graphics: ${quality==='perf'?'Performance':quality[0].toUpperCase()+quality.slice(1)}`);
  };
});

function showResumeBanner(){
  const hasProgress = Progress.data.points>0 || Progress.lessonsDoneCount()>0;
  const banner=$('resumeBanner');
  if(!hasProgress){ banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  banner.innerHTML = `Welcome back! You've saved ⭐ ${Progress.data.points} points, `
    + `📘 ${Progress.lessonsDoneCount()}/9 lessons, and 🏅 ${Progress.badgeCount()}/3 badges ${Progress.persistenceAvailable ? 'on this device.' : 'for this session only.'}`;
  $('beginBtn').textContent = 'CONTINUE THE CALIFORNIA JOURNEY';
}

async function boot(){
  validateLessonContent(LOCATIONS);
  showResumeBanner();
  if(!Progress.persistenceAvailable)showPersistenceNotice();
  updateHUD();
  go(GAME_STATES.EARTH_INTRO);
  $('boot').classList.add('hidden');
  // Initialization continues even on a slow connection; the map stays usable.
  await startEngine();
  $('boot').classList.add('hidden');
  // sound button initial label
  $('btnSound').innerHTML=(Audio.enabled?'🔊':'🔇')+' <span class="lbl">Sound</span>';
}

// debug hooks for automated testing / QA
window.__game = { GAME_STATES, LOCATIONS, Progress, go:(s,o)=>go(s,o), startLesson, startQuiz, enterCompletion, enterFallback, Audio, state:()=>active.id, player, beacons:()=>active.beacons, quizG:()=>active.quizG, setPlayerPos:(x,z)=>{player.x=x;player.z=z;}, obst:()=>curOBST };
window.__RCM_DEBUG = false;
window.__game.renderInfo=()=>({calls:renderer?.info.render.calls||0, frame:renderer?.info.render.frame||0, shadows:renderer?.shadowMap.enabled, pixelRatio:renderer?.getPixelRatio(), antialias:renderer?.getContext().getContextAttributes()?.antialias, resizeCount, aspect:camera?.aspect});

configureLessonRenderer({ openModal, closeModal, fireConfetti, navigate: go });

boot();
