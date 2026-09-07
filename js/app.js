import { GAME_STATES, BRAND_ASSETS, EXTERNAL_LINKS, SCORING, COPY, LOCATIONS, LOC_BY_ID } from './config/content.js';
import { Analytics, Progress } from './core/progress.js';
import { Audio } from './core/audio.js';
import { $, el, toast, caption } from './ui/dom.js';
import { validateLessonContent } from './lessons/validate-content.js';
import { configureLessonRenderer, setAfterLessonReturn, startLesson, startQuiz } from './lessons/renderer.js';
import { effectiveQuality as determineQuality, isTouchDevice } from './scenes/quality.js';

/* Application orchestration: UI flow, lesson rendering, and 3D scenes. */

function updateHUD(){
  $('hudPoints').textContent = Progress.data.points;
  $('hudLoc').textContent = Progress.locationsDoneCount();
  $('hudLes').textContent = Progress.lessonsDoneCount();
  $('hudBadge').textContent = Progress.badgeCount();
}
document.addEventListener('rcm:progresschange', updateHUD);

let modalOpen=false;

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
  modalOpen=true; keys.clear();
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
function closeModal(){
  $('modal').classList.add('hidden'); modalOpen=false;
  $('scrollHint').classList.add('hidden');
  if(modalScrollObserver){ modalScrollObserver.disconnect(); modalScrollObserver=null; }
  // Backing out of a lesson/quiz via the X (or any other close path) should
  // never leave that lesson's caption text stuck on screen, overlapping the
  // movement hint underneath it.
  caption('');
}
$('modalCard').addEventListener('scroll',checkModalScroll);
addEventListener('resize',()=>{ if(modalOpen) checkModalScroll(); });
// Always-available X button — players can back out of any lesson, quiz, or
// dialog without being forced to finish it.
$('modalClose').addEventListener('click',closeModal);

// ---- confetti celebration (small burst, no deps) ----
let confettiRAF=null;
function fireConfetti(){
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
        <li><b>📋 Steps</b> lets you jump straight to any lesson or the quiz without walking. On the map, use the buttons at the bottom to enter each stop.</li>
        <li><b>Map</b> returns you to California. <b>Sound</b> toggles audio. <b>Reset</b> puts you back at the scene’s start if you get stuck.</li>
      </ul>
      <p style="font-size:13px;color:#777;">Optional golden milk drops are worth a few extra points, but they are never required.</p>
      <div class="btnrow">
        <button class="btn btn-ghost" id="helpResetAll">Reset all progress</button>
        <button class="btn btn-primary" id="helpClose">Got it</button>
      </div>`;
    $('helpClose').onclick=closeModal;
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
    const back=el('button','btn btn-ghost','🗺️ Back to map'); back.onclick=()=>{ closeModal(); go(GAME_STATES.MAP); };
    const close=el('button','btn btn-primary','Keep exploring'); close.onclick=closeModal;
    row.append(back,close); body.appendChild(row);
  });
}

/* ============================================================================
   7. THREE.js setup, quality, disposal
============================================================================ */
let THREE=null, RoundedBoxGeometry=null, renderer=null, camera=null, webglOK=true;
let quality = localStorage.getItem('rcm_quality') || 'auto';
const isTouch = isTouchDevice();

function effectiveQuality(){
  return determineQuality(quality);
}

async function initThree(){
  try{ THREE = await import('three'); }
  catch(e){ webglOK=false; return false; }
  // RoundedBoxGeometry (official three.js addon) softens hard box edges into a
  // polished, toy-like silhouette for cows, buildings, and packages. Optional:
  // the game still works with sharp-cornered boxes if the addon fails to load.
  try{ ({RoundedBoxGeometry} = await import('three/addons/geometries/RoundedBoxGeometry.js')); }
  catch(e){ RoundedBoxGeometry=null; }
  try{
    renderer = new THREE.WebGLRenderer({ antialias: effectiveQuality()==='high' });
    const maxPR = effectiveQuality()==='high' ? 2 : 1.5;
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxPR));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = effectiveQuality()==='high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000);
    camera.rotation.order='YXZ';
    addEventListener('resize', ()=>{
      if(!renderer) return;
      camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth,innerHeight);
    });
    return true;
  }catch(e){ webglOK=false; return false; }
}

function applyRendererQuality(){
  if(!renderer) return;
  const high=effectiveQuality()==='high';
  renderer.setPixelRatio(Math.min(devicePixelRatio,high?2:1.5));
  renderer.shadowMap.enabled=high;
  renderer.shadowMap.needsUpdate=true;
  renderer.setSize(innerWidth,innerHeight);
  if(active?.scene){
    active.scene.traverse(object=>{
      if(object.isDirectionalLight||object.isSpotLight) object.castShadow=high;
    });
  }
}

// Deep-dispose a scene's geometry, materials, textures.
function disposeScene3D(scene){
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
let B=null; // builders (set after THREE loads)

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
  const sin=Math.sin(player.yaw),cos=Math.cos(player.yaw);
  const vx=(fx*cos-fz*sin)*speed, vz=(fx*-sin-fz*cos)*speed*-1;
  player.x+=vx*dt; player.z+=vz*dt;
  const R=0.55;
  for(const o of curOBST){ const dx=player.x-o.x,dz=player.z-o.z,rr=o.r+R,d2=dx*dx+dz*dz; if(d2<rr*rr&&d2>1e-4){const d=Math.sqrt(d2),p=(rr-d)/d; player.x+=dx*p; player.z+=dz*p;} }
  player.x=Math.max(curBounds.minX,Math.min(curBounds.maxX,player.x));
  player.z=Math.max(curBounds.minZ,Math.min(curBounds.maxZ,player.z));
  const moving=m>0.1; player.bob+=dt*(moving?speed*1.4:0);
  const bobY=moving?Math.sin(player.bob)*0.05:0;
  camera.position.set(player.x,player.eye+bobY,player.z);
  camera.rotation.y=player.yaw; camera.rotation.x=player.pitch;
}

/* ---- global input ---- */
const keys=new Set();
addEventListener('keydown',e=>{
  if(modalOpen){ if(e.code==='Escape')closeModal(); return; }
  if(e.code==='Escape'){ if(isLocationState()) go(GAME_STATES.MAP); return; }
  keys.add(e.code);
  if(e.code==='KeyE') interactNearest();
});
addEventListener('keyup',e=>keys.delete(e.code));

const joyVec={x:0,y:0}, lookVec={x:0,y:0};
let downX=0,downY=0,downT=0,lastX=0,lastY=0,movedFar=false;

// Reusable virtual-stick factory (Roblox-style): drag the knob, get a -1..1 vector.
function makeStick(elId, knobId, vec){
  const stick=$(elId), knob=$(knobId); let id=null;
  function set(e){ const r=stick.getBoundingClientRect(); let dx=(e.clientX-(r.left+r.width/2))/(r.width/2), dy=(e.clientY-(r.top+r.height/2))/(r.height/2); const m=Math.hypot(dx,dy); if(m>1){dx/=m;dy/=m;} vec.x=dx; vec.y=dy; knob.style.left=`${50+dx*34}%`; knob.style.top=`${50+dy*34}%`; }
  function end(e){ if(e.pointerId===id){ id=null; vec.x=vec.y=0; knob.style.left='50%'; knob.style.top='50%'; } }
  stick.addEventListener('pointerdown',e=>{ id=e.pointerId; stick.setPointerCapture(e.pointerId); e.preventDefault(); set(e); });
  stick.addEventListener('pointermove',e=>{ if(e.pointerId===id) set(e); });
  stick.addEventListener('pointerup',end); stick.addEventListener('pointercancel',end);
}
makeStick('joy','joyKnob',joyVec);      // left  = move
makeStick('lookJoy','lookKnob',lookVec); // right = look
let lookId=null; // canvas drag-to-look pointer id
$('touchAct').addEventListener('click',()=>{ if(!modalOpen) interactNearest(); });

/* pointer look + tap-to-interact on canvas (attached after renderer exists) */
function attachCanvasInput(){
  const cv=renderer.domElement;
  cv.addEventListener('pointerdown',e=>{ if(modalOpen||!isLocationState())return; lookId=e.pointerId; downX=lastX=e.clientX; downY=lastY=e.clientY; downT=performance.now(); movedFar=false; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove',e=>{ if(e.pointerId!==lookId||modalOpen)return; const dx=e.clientX-lastX,dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; if(Math.hypot(e.clientX-downX,e.clientY-downY)>7)movedFar=true; player.yaw-=dx*0.0045; player.pitch=Math.max(-1.2,Math.min(1.2,player.pitch-dy*0.0045)); });
  cv.addEventListener('pointerup',e=>{ if(e.pointerId!==lookId)return; lookId=null; if(!modalOpen&&!movedFar&&performance.now()-downT<450) tryClick(e.clientX,e.clientY); });
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  // map clicks (markers)
  cv.addEventListener('click',e=>{ if(active.id===GAME_STATES.MAP && !modalOpen && !movedFar) tryMapClick(e.clientX,e.clientY); });
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
  // In no-WebGL mode, all map/location navigation resolves to the DOM fallback
  // hub (completion is a DOM screen and still works).
  if(!webglOK && stateId!==GAME_STATES.COMPLETION){
    $('complete').classList.add('hidden');
    enterFallback(); return;
  }
  // toggle chrome
  const showHUD = [GAME_STATES.MAP,GAME_STATES.FARM,GAME_STATES.PROCESSOR,GAME_STATES.MARKET].includes(stateId);
  $('hud').classList.toggle('hidden',!showHUD);
  const onMap = stateId===GAME_STATES.MAP;
  $('mapHeader').classList.toggle('hidden',!onMap);
  $('mapDisclaimer').classList.toggle('hidden',!onMap);
  $('mapNav').classList.toggle('hidden',!onMap);
  const inLoc=[GAME_STATES.FARM,GAME_STATES.PROCESSOR,GAME_STATES.MARKET].includes(stateId);
  // Joysticks visible on all platforms (desktop gets arrow labels; mobile uses touch).
  // This helps players discover the movement and look controls without guessing.
  $('joy').classList.toggle('hidden',!inLoc);
  $('lookJoy').classList.toggle('hidden',!inLoc);
  $('touchAct').classList.toggle('hidden',!inLoc);
  document.body.classList.toggle('touch-controls-active',inLoc);
  $('btnSteps').classList.toggle('hidden',!inLoc);
  $('btnReset').classList.toggle('hidden',!inLoc);
  $('hint').classList.toggle('hidden',!inLoc);
  caption('');

  if(stateId===GAME_STATES.EARTH_INTRO) return enterEarthIntro();
  if(stateId===GAME_STATES.MAP)         return enterMap(opts);
  if(stateId===GAME_STATES.FARM)        return enterLocation('farm');
  if(stateId===GAME_STATES.PROCESSOR)   return enterLocation('processor');
  if(stateId===GAME_STATES.MARKET)      return enterLocation('market');
  if(stateId===GAME_STATES.COMPLETION)  return enterCompletion();
}

/* ---------- California silhouette (normalized 0..1; x east, y north) ---------- */
const CA_OUTLINE=[
  [0.18,1.00],[0.55,1.00],[0.60,0.72],[0.72,0.55],[0.98,0.30],[0.72,0.14],
  [0.62,0.10],[0.50,0.20],[0.40,0.25],[0.30,0.34],[0.22,0.43],[0.14,0.53],
  [0.10,0.63],[0.02,0.74],[0.06,0.87]
];
const CA_W=26, CA_H=44;
function caToWorld(nx,ny){ return { x:(nx-0.5)*CA_W, z:-((ny-0.5)*CA_H) }; }

/* ---------------- EARTH INTRO ---------------- */
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Grabs whatever frame the intro video is showing right now, so the map
// screen can open on a still of the same California footage instead of a
// generic color. Wrapped in try/catch: if the browser blocks canvas capture
// for any reason, we silently fall back to the old map look.
function captureVideoFrame(video){
  try{
    if(!video || video.readyState<2 || !video.videoWidth) return null;
    const c=document.createElement('canvas');
    c.width=video.videoWidth; c.height=video.videoHeight;
    c.getContext('2d').drawImage(video,0,0,c.width,c.height);
    return c.toDataURL('image/jpeg',0.86);
  }catch(e){ return null; }
}
let capturedMapBg=null;

function enterEarthIntro(){
  Analytics.track('intro_started');
  const finish=()=>finishIntro();

  // Video intro. Only the dark-backed caption pill carries text over the
  // footage — the old large white title/subtitle was unreadable over bright
  // video, so it's intentionally not used here.
  const vid=$('introVideo');
  vid.src='assets/california-intro.mp4';
  vid.classList.remove('hidden');
  vid.currentTime=0;
  vid.play().catch(e=>console.log('Video autoplay prevented, skipping intro'));

  $('skipIntro').classList.remove('hidden');
  $('skipIntro').onclick=finish;
  caption(COPY.intro.line1);

  // Change caption halfway through
  const t2=setTimeout(()=>{ caption(COPY.intro.line2); }, 3500);
  // Auto-finish when video ends or after 8 seconds
  const DURATION=8;
  let finished=false, t0=null;
  const update=(dt,t)=>{
    if(t0===null)t0=t;
    const elapsed=t-t0;
    if(!finished && (vid.ended || elapsed/1000>=DURATION)){ finished=true; finish(); }
  };

  setActive(GAME_STATES.EARTH_INTRO,{
    update,
    dispose:()=>{
      vid.pause(); vid.classList.add('hidden');
      $('skipIntro').classList.add('hidden');
      clearTimeout(t2);
    }
  });
}
// helper: approximate CA position on the globe surface given current rotation
function caToSurface(rotY){
  // CA sits around longitude -120°, latitude +37°; place a point and rotate with earth
  const lat=37*Math.PI/180, lon=(-120*Math.PI/180);
  const R=31;
  let x=R*Math.cos(lat)*Math.sin(lon+ (rotY));
  let y=R*Math.sin(lat);
  let z=R*Math.cos(lat)*Math.cos(lon+ (rotY));
  return new THREE.Vector3(x,y,z);
}
function makeEarthTexture(){
  const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d');
  // ocean
  const g=x.createLinearGradient(0,0,0,512); g.addColorStop(0,'#0b3a6b'); g.addColorStop(0.5,'#0f5aa0'); g.addColorStop(1,'#0b3a6b');
  x.fillStyle=g; x.fillRect(0,0,1024,512);
  // stylized landmasses (green blobs) — not geographically exact
  x.fillStyle='#2f8a43';
  const blobs=[[180,190,120,80],[230,250,80,60],[430,140,90,60],[520,220,120,110],[560,360,70,90],[720,180,150,80],[800,300,90,70],[300,120,70,40],[860,150,60,40]];
  blobs.forEach(([bx,by,bw,bh])=>{ x.beginPath(); x.ellipse(bx,by,bw,bh,Math.random(),0,Math.PI*2); x.fill(); });
  // North America / west coast area + a gold California highlight
  x.fillStyle='#3fa055'; x.beginPath(); x.ellipse(210,200,110,90,0.2,0,Math.PI*2); x.fill();
  x.fillStyle='#f5b21e'; x.beginPath(); x.ellipse(150,210,14,26,0.3,0,Math.PI*2); x.fill();
  // ice caps
  x.fillStyle='rgba(240,248,255,.85)'; x.fillRect(0,0,1024,26); x.fillRect(0,486,1024,26);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function finishIntro(){
  if(sessionStorage) sessionStorage.setItem('rcm_introSeen','1');
  Analytics.track('intro_completed');
  // Grab whatever frame is showing right now (natural end, timeout, or Skip)
  // so the map opens on a still of this same footage. Skip this if the
  // player skipped very early (still shows Earth from far away, before the
  // zoom reaches California) — a half-zoomed frame looks worse than the
  // regular illustrated map, so fall back to that instead.
  const vid=$('introVideo');
  const zoomedInEnough = vid.ended || (vid.duration && vid.currentTime/vid.duration>0.6) || vid.currentTime>3.5;
  if(zoomedInEnough) capturedMapBg = captureVideoFrame(vid) || capturedMapBg;
  $('introReduced').classList.add('hidden');
  $('skipIntro').classList.add('hidden');
  caption('');
  go(GAME_STATES.MAP,{fromIntro:true});
}
$('skipIntro').addEventListener('click',()=>{ Analytics.track('intro_skipped'); });

/* ---------------- CALIFORNIA MAP ---------------- */
function enterMap(opts={}){
  Analytics.track('map_opened');
  const scene=new THREE.Scene();
  // If we captured a still from the intro video, use it as a photoreal
  // backdrop and skip the cartoon terrain (sea/CA-blob/mountains) so the
  // destination pins float over real California footage instead — this is
  // what the player just flew into, not a separate illustrated map.
  const usePhotoBg = !!capturedMapBg;
  if(usePhotoBg){
    const tex=new THREE.TextureLoader().load(capturedMapBg);
    tex.colorSpace=THREE.SRGBColorSpace;
    scene.background=tex;
  } else {
    scene.background=new THREE.Color(0x8fd3f4);
    scene.fog=new THREE.Fog(0x8fd3f4,60,160);
  }
  scene.add(new THREE.HemisphereLight(0xeaf6ff,0x6f9f5f,1.1));
  const sun=new THREE.DirectionalLight(0xfff3d6,1.9); sun.position.set(30,60,20);
  if(effectiveQuality()==='high'){ sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40; sun.shadow.camera.far=160; }
  scene.add(sun);

  if(!usePhotoBg){
    // sea plane
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(300,300), B.lamb(0x4aa3d8)); sea.rotation.x=-Math.PI/2; sea.position.y=-0.4; sea.receiveShadow=true; scene.add(sea);

    // California extruded shape
    const shape=new THREE.Shape();
    CA_OUTLINE.forEach(([nx,ny],i)=>{ const px=(nx-0.5)*CA_W, py=(ny-0.5)*CA_H; if(i===0)shape.moveTo(px,py); else shape.lineTo(px,py); });
    shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:1.6,bevelEnabled:true,bevelThickness:0.3,bevelSize:0.3,bevelSegments:1});
    const caTop=new THREE.Mesh(geo,B.lamb(0x74b552)); caTop.rotation.x=-Math.PI/2; caTop.position.y=0; caTop.castShadow=true; caTop.receiveShadow=true; scene.add(caTop);
    // subtle mountains along the east
    for(let i=0;i<10;i++){ const {x,z}=caToWorld(0.6+Math.random()*0.25,0.4+Math.random()*0.5); const mtn=new THREE.Mesh(new THREE.ConeGeometry(1.1+Math.random(),2+Math.random()*2,5),B.lamb(0x8a7d5a)); mtn.position.set(x,1.6,z); mtn.castShadow=true; scene.add(mtn); }
  }

  // markers — sized generously (both visually and for hit-testing) since
  // these sit over a photo backdrop now and need to read clearly at any
  // terrain color, and be easy to tap directly on a phone screen.
  function pinBadge(col){
    const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    x.beginPath(); x.arc(64,64,56,0,Math.PI*2);
    x.fillStyle='rgba(255,255,255,0.97)'; x.fill();
    x.lineWidth=8; x.strokeStyle=col; x.stroke();
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    return new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
  }
  const markers=[]; const markerHitList=[];
  LOCATIONS.forEach(loc=>{
    const {x,z}=caToWorld(loc.map[0],loc.map[1]);
    const g=new THREE.Group(); g.position.set(x,1.7,z);
    const unlocked=Progress.isUnlocked(loc.id), done=Progress.isLocationDone(loc.id);
    const col = done?0x2a9c53 : unlocked?loc.color : 0x9e9e9e;
    const colHex = '#'+col.toString(16).padStart(6,'0');
    // white "badge" backing makes the pin readable against any patch of the
    // photo (ocean, forest, farmland all have different colors/contrast)
    const badge=pinBadge(colHex); badge.scale.set(4.1,4.1,1); badge.position.y=0.1; g.add(badge);
    const icon=B.emojiSprite(done?'✅':unlocked?'📍':'🔒',2.7); icon.position.y=0.14; g.add(icon);
    const label=B.labelSprite(`${loc.order}. ${loc.title.replace('WHERE ','').replace(/^(.{22}).+/,'$1…')}`,1.2); label.position.y=3.35; g.add(label);
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.6,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.7,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=-1.4; g.add(ring);
    // generous invisible tap target — much larger than the visible badge so
    // fingers/imprecise clicks near the pin still register
    const hitArea=new THREE.Mesh(new THREE.CircleGeometry(3.6,20),new THREE.MeshBasicMaterial({visible:false}));
    hitArea.rotation.x=-Math.PI/2; hitArea.position.y=0.1; g.add(hitArea);
    g.userData={type:'marker',loc,unlocked,done,ring,pin:badge,baseY:1.7};
    scene.add(g); markers.push(g); markerHitList.push(g);
  });

  // route lines between stops (draw when unlocked)
  const routeGroup=new THREE.Group(); scene.add(routeGroup);
  function drawRoute(a,b,colored){
    const A=caToWorld(a.map[0],a.map[1]), Bp=caToWorld(b.map[0],b.map[1]);
    const pts=[new THREE.Vector3(A.x,1.8,A.z),new THREE.Vector3(Bp.x,1.8,Bp.z)];
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({color:colored?0xf5b21e:0xbbbbbb,dashSize:0.8,gapSize:0.5,linewidth:2}));
    line.computeLineDistances(); routeGroup.add(line);
    return {A,Bp};
  }
  const seg1=drawRoute(LOCATIONS[0],LOCATIONS[1],Progress.isLocationDone('farm'));
  const seg2=drawRoute(LOCATIONS[1],LOCATIONS[2],Progress.isLocationDone('processor'));

  // truck sprite (animates along a route when a location was just completed)
  const truck=B.emojiSprite('🚚',2.2); truck.visible=false; scene.add(truck);
  let truckAnim=null;
  if(opts.justCompleted){
    let seg=null;
    if(opts.justCompleted==='farm') seg=seg1;
    if(opts.justCompleted==='processor') seg=seg2;
    if(seg){ truck.visible=true; truckAnim={seg,t:0}; }
  }

  // camera — gentle 2.5D orbit above CA
  const camDist=42, camHeight=40; let orbit=0.2;
  camera.position.set(Math.sin(orbit)*camDist,camHeight,Math.cos(orbit)*camDist+8);
  camera.lookAt(0,0,0); camera.rotation.z=0;

  // map-side control buttons injected into HUD region as extra chips
  ensureMapButtons();
  buildMapNav();

  const update=(dt,t)=>{
    orbit+=dt*0.03; if(orbit>0.6)orbit=0.6; // ease to a slight angle then stop drifting far
    camera.position.x=Math.sin(0.28)*camDist; camera.position.z=Math.cos(0.28)*camDist+8; camera.position.y=camHeight;
    camera.lookAt(0,-2,-2);
    markers.forEach((m,i)=>{ m.position.y=m.userData.baseY+Math.sin(t*2+i)*0.18; if(m.userData.unlocked&&!m.userData.done){ const s=1+Math.sin(t*3+i)*0.08; m.userData.ring.scale.setScalar(s);} });
    if(truckAnim){ truckAnim.t=Math.min(1,truckAnim.t+dt*0.4); const s=truckAnim.seg; truck.position.set(s.A.x+(s.Bp.x-s.A.x)*truckAnim.t,2.6,s.A.z+(s.Bp.z-s.A.z)*truckAnim.t); if(truckAnim.t>=1){truck.visible=false; truckAnim=null;} }
  };
  setActive(GAME_STATES.MAP,{scene,update,dispose:()=>{ removeMapButtons(); }});

  // store marker hit list for click handling
  active.markerHitList=markerHitList;

  // Recap / completion trigger
  if(Progress.allDone() && !sessionStorage.getItem('rcm_recapDone') ){
    setTimeout(()=>playRecap(markers,{seg1,seg2},truck),700);
  }
  updateHUD();
}

function tryMapClick(cx,cy){
  if(active.id!==GAME_STATES.MAP || !active.markerHitList) return;
  const hits=ray(cx,cy,active.markerHitList);
  for(const h of hits){ const o=resolveTarget(h.object); if(o&&o.userData.type==='marker'){ onMarker(o.userData.loc); return; } }
}
function onMarker(loc){
  Audio.click();
  if(!Progress.isUnlocked(loc.id)){
    const need = loc.id==='processor'?'Finish the Dairy Farm first.':'Finish Processing & Packaging first.';
    toast('🔒 '+need); return;
  }
  go(loc.id==='farm'?GAME_STATES.FARM:loc.id==='processor'?GAME_STATES.PROCESSOR:GAME_STATES.MARKET);
}

// extra map buttons (Replay Intro, Free Explore)
function ensureMapButtons(){
  removeMapButtons();
  const grp=$('hud').querySelector('.group:last-child');
  const replay=el('button','hbtn map-extra','🎬 <span class="lbl">Replay Intro</span>'); replay.id='btnReplayIntro'; replay.title='Replay Intro'; replay.setAttribute('aria-label','Replay Intro');
  replay.onclick=()=>{ Audio.click(); go(GAME_STATES.EARTH_INTRO); };
  grp.appendChild(replay);
  if(Progress.allDone()){
    const fx=el('button','hbtn map-extra','🧭 <span class="lbl">Free Explore</span>'); fx.id='btnFreeExplore'; fx.title='Free Explore'; fx.setAttribute('aria-label','Free Explore');
    fx.onclick=()=>{ Audio.click(); openModal('🧭 Free Explore','Revisit any destination',body=>{
      body.appendChild(el('p',null,'You’ve completed the journey! Revisit any destination to explore or replay its lessons.'));
      const row=el('div','btnrow'); row.style.justifyContent='center';
      LOCATIONS.forEach(l=>{ const b=el('button','btn btn-ghost',`${l.badge.emoji} ${l.title.replace('WHERE ','')}`); b.onclick=()=>{ closeModal(); onMarker(l); }; row.appendChild(b); });
      body.appendChild(row);
    }); };
    grp.appendChild(fx);
  }
}
function removeMapButtons(){ document.querySelectorAll('.map-extra').forEach(b=>b.remove()); $('mapNav').innerHTML=''; }

// Big tap-target destination bar so the map is fully navigable without hitting a 3D pin.
function buildMapNav(){
  const nav=$('mapNav'); nav.innerHTML='';
  LOCATIONS.forEach(loc=>{
    const unlocked=Progress.isUnlocked(loc.id), done=Progress.isLocationDone(loc.id);
    const b=el('button','mapnav-btn'+(done?' done':unlocked?'':' locked'));
    const status = done?'✓ Done' : unlocked?'Tap to enter' : '🔒 Locked';
    b.innerHTML=`<span class="n">${loc.badge.emoji} Stop ${loc.order}</span><span class="t">${loc.title.replace('WHERE ','').replace('CALIFORNIA DAIRY MEETS ITS CUSTOMERS','MARKET & KITCHEN')}</span><span class="n">${status}</span>`;
    b.setAttribute('aria-label',`Stop ${loc.order}: ${loc.title}. ${status}`);
    b.onclick=()=>onMarker(loc);
    nav.appendChild(b);
  });
}

// Final recap animation, then completion screen
function playRecap(markers,segs,truck){
  sessionStorage.setItem('rcm_recapDone','1');
  caption('Here’s the whole journey: farm to processor to market.');
  toast('🎬 Journey recap');
  // simple: pulse each marker in order, move truck across both segments, then completion
  let step=0;
  const seq=[
    ()=>flashMarker(markers[0]),
    ()=>flashMarker(markers[1]),
    ()=>flashMarker(markers[2]),
    ()=>{ caption(''); go(GAME_STATES.COMPLETION); }
  ];
  const iv=setInterval(()=>{ if(step<seq.length){ seq[step](); step++; } else clearInterval(iv); },1200);
}
function flashMarker(m){ if(!m)return; m.userData.ring.material.color.set(0xf5b21e); m.userData.ring.material.opacity=1; setTimeout(()=>{ if(m.userData.ring.material){m.userData.ring.material.opacity=0.7;} },700); }

/* ---------------- LOCATION SCENES ---------------- */
function enterLocation(locId){
  const loc=LOC_BY_ID[locId];
  Analytics.track('location_started',{location:locId});
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xbfe3f5); scene.fog=new THREE.Fog(0xcfe8f5,55,130);
  scene.add(new THREE.HemisphereLight(0xdff1ff,0x7aa85c,1.15));
  const sun=new THREE.DirectionalLight(0xfff3d6,2.3); sun.position.set(30,55,20);
  if(effectiveQuality()==='high'){ sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45; sun.shadow.camera.far=160; sun.shadow.bias=-0.0006; }
  scene.add(sun);

  // ground
  const grass=B.noiseTexture(loc.id==='farm'?'#7fb85a':'#cfd7c8',['#6fae4e','#86c163','#9fb98a'],600); grass.repeat.set(24,24);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),B.lamb(0xffffff,{map:grass})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

  const clickables=[]; const obst=[];
  const addObst=(x,z,r)=>obst.push({x,z,r});

  // build themed environment
  if(locId==='farm')      buildFarm(scene,addObst);
  if(locId==='processor') buildProcessor(scene,addObst);
  if(locId==='market')    buildMarket(scene,addObst);
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
  quizG.position.set(0,-18,0);
  Object.assign(quizG.userData,{type:'station',kind:'quiz'});
  scene.add(quizG); clickables.push(quizG); addObst(0,-18,0.6);

  // collectibles (golden milk drops) — optional
  const drops=[];
  const dropSpots=[[-14,2],[14,2],[0,4]];
  dropSpots.forEach(([dx,dz],i)=>{
    const id=`${locId}.drop${i}`;
    if(Progress.data.collectibles[id]) return;
    const d=makeDrop(); d.position.set(dx,0.8,dz); d.userData={type:'drop',id}; scene.add(d); clickables.push(d); drops.push(d);
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
  };
  refreshStations();
  setAfterLessonReturn(()=>refreshStations());

  // Direction arrow pointing to next destination (first incomplete lesson, or quiz if done)
  // Uses a simple billboard-style sprite that always faces camera
  function makeArrowSprite(){
    const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    x.fillStyle='rgba(255, 206, 77, 0.9)'; x.fillRect(0,0,256,256);
    x.fillStyle='#1a1a1a';
    x.font='bold 120px Arial'; x.textAlign='center'; x.textBaseline='middle';
    x.fillText('↓',128,128);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
    s.scale.set(5,5,1); return s;
  }
  const dirArrow=makeArrowSprite();
  scene.add(dirArrow);

  let tipT=0;
  const update=(dt,t)=>{
    if(!modalOpen) updatePlayer(dt);
    // animate beacons + drops
    clickables.forEach((c,i)=>{ if(c.userData.type==='station'){ if(c.userData.icon){c.userData.icon.position.y=3.2+Math.sin(t*2+i)*0.22;} if(c.userData.ring&&c.userData.pillar&&c.userData.pillar.visible){ c.userData.pillar.material.opacity=0.22+Math.sin(t*3+i)*0.1; } }
      if(c.userData.type==='drop'){ c.position.y=0.8+Math.sin(t*2.5+i)*0.14; c.rotation.y+=dt*1.6; if(Math.hypot(c.position.x-player.x,c.position.z-player.z)<1.3) collectDrop(c); }
      // gentle head-graze bob + tail swish so cows read as alive, not static props
      if(c.userData.type==='cow'){ const tt=t+c.userData.phase; c.userData.head.rotation.x=Math.sin(tt*0.6)*0.14+0.06; c.userData.tail.rotation.x=Math.sin(tt*2.2)*0.3; c.userData.tail.rotation.z=Math.cos(tt*1.4)*0.12; } });

    // Update direction arrow to point toward next destination + flash
    if(!modalOpen){
      // Find next destination: first incomplete lesson, or quiz if all lessons done
      let nextDest=null;
      for(const b of beacons){ if(!b.userData.done){ nextDest=b; break; } }
      if(!nextDest && Progress.locationLessonsDone(locId)>=loc.lessons.length) nextDest=quizG;

      if(nextDest){
        // Position arrow above next destination (billboard style, always faces camera)
        dirArrow.position.copy(nextDest.position);
        dirArrow.position.y=4.5;
        // Pulsing scale + opacity for flashing effect
        const pulse=0.85+Math.sin(t*2.5)*0.35;
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
    scene,update,dispose:()=>{ setAfterLessonReturn(()=>{}); }
  });
  active.clickables=clickables; active.loc=loc; active.beacons=beacons; active.quizG=quizG;

  function collectDrop(d){ if(d.userData.got)return; d.userData.got=true; d.visible=false; if(Progress.collect(d.userData.id)){ Audio.pop(); toast(`+${SCORING.collectible} 💧 Golden milk drop!`); } }
  active.collectDrop=collectDrop;

  caption(loc.intro);
  toast(`${loc.badge.emoji} ${loc.title}`);
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
      else if(Progress.locationLessonsDone(loc.id)>=loc.lessons.length){ hint.innerHTML=`🧠 <b>${near.userData.lesson.title}</b> — get closer to start`; ready=true; }
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
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.62,6,12,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.3,depthWrite:false,side:THREE.DoubleSide})); pillar.position.y=3; g.add(pillar);
  const icon=B.emojiSprite(emoji,2.15); icon.position.y=3.35; g.add(icon);
  const label=B.labelSprite(labelText,0.95); label.position.y=5.0; g.add(label);
  g.userData={ring,pillar,icon,label};
  return g;
}
function setBeaconDone(g,done,color){ g.userData.ring.material.color.set(done?0x9e9e9e:color); g.userData.ring.material.opacity=done?0.4:0.85; g.userData.pillar.visible=!done; }
function setBeaconLocked(g,locked){ g.userData.pillar.visible=!locked; g.userData.ring.material.color.set(locked?0x9e9e9e:0xf5b21e); g.userData.ring.material.opacity=locked?0.4:0.85; g.userData.icon.material.opacity=locked?0.5:1; g.userData.icon.material.transparent=true; }
function makeDrop(){ const g=new THREE.Group(); const m=B.lamb(0xf5b21e,{emissive:0x7a5600,emissiveIntensity:0.4}); const ball=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,10),m); const tip=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.45,12),m); tip.position.y=0.42; g.add(ball); g.add(tip); return g; }

/* ---- location environment builders (low-poly, themed) ---- */
function buildFarm(scene,addObst){
  const {box,cyl,ball,lamb,labelSprite}=B;
  // modern free-stall barn (open sides, light roof) — not a red barn
  const barn=new THREE.Group();
  const post=lamb(0xcfd3d6);
  for(const px of [-6,-2,2,6]) for(const pz of [-4,4]) barn.add(cyl(0.18,0.2,4.4,post,px,2.2,pz,8));
  const roof=box(15,0.3,10,lamb(0xe2e6e9),0,4.5,0); roof.rotation.x=0.04; barn.add(roof);
  // ridge vents (ventilation)
  barn.add(box(15,0.5,0.8,lamb(0xf2f4f6),0,4.9,0));
  // fans
  for(const fx of [-5,0,5]){ const f=cyl(0.7,0.7,0.2,lamb(0x333333),fx,3.6,-4.1,10); f.rotation.x=Math.PI/2; barn.add(f);}
  barn.position.set(-14,0,-2); scene.add(barn); addObst(-14,-2,6);
  scene.add(withLabel(labelSprite('Ventilated Barn',1),-14,5.6,-2));

  // feed & water lane
  const feed=box(6,0.5,1.2,lamb(0x8a6a44),-14,0.35,4); scene.add(feed);
  const trough=box(4,0.6,1,lamb(0x8d9aa5),-14,0.4,6); scene.add(trough);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(3.6,0.8),lamb(0x4aa3d8)); water.rotation.x=-Math.PI/2; water.position.set(-14,0.68,6); scene.add(water);

  // milking area + bulk tank (milk house)
  const mh=new THREE.Group();
  mh.add(box(6,3,5,lamb(0xe8ece0),0,1.5,0));
  const tank=new THREE.Group(); const steel=lamb(0xd9e2e8); const body=cyl(1,1,3,steel,0,0,0,18); body.rotation.z=Math.PI/2; tank.add(body); tank.add(ball(1,steel,1.5,0,0)); tank.add(ball(1,steel,-1.5,0,0)); tank.position.set(0,2,0); mh.add(tank);
  mh.position.set(8,0,-2); scene.add(mh); addObst(8,-2,3.4);

  // refrigerated tanker
  const tanker=makeTanker(); tanker.position.set(16,0,4); tanker.rotation.y=-0.4; scene.add(tanker); addObst(16,4,2.4);
  scene.add(withLabel(labelSprite('Refrigerated Tanker',1),16,3.4,4));

  // solar panels
  const solar=new THREE.Group(); for(let i=0;i<3;i++){ const p=box(2.4,0.1,1.4,lamb(0x1b2a4a),i*2.7,1.2,0); p.rotation.x=-0.5; solar.add(p); solar.add(cyl(0.06,0.06,1.1,lamb(0x888),i*2.7,0.55,0.3,6)); } solar.position.set(-22,0,8); scene.add(solar);
  scene.add(withLabel(labelSprite('Solar',0.8),-19.5,2.2,8));

  // manure/renewable-energy digester dome
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2,16,10,0,Math.PI*2,0,Math.PI/2),lamb(0x2e5e3e)); dome.position.set(-22,0,-8); dome.castShadow=true; scene.add(dome); addObst(-22,-8,2.2);
  scene.add(withLabel(labelSprite('Renewable Energy',0.9),-22,2.6,-8));

  // feed crops (rows) + a couple cows
  for(let r=0;r<5;r++) for(let c=0;c<8;c++){ const crop=cyl(0.05,0.05,0.5+Math.random()*0.3,lamb(0x6fae2e),18+c*0.6,0.3,-12+r*0.7,4,false); scene.add(crop); }
  addFarmCows(scene);
}
function addFarmCows(scene){
  const cows=[];
  for(let i=0;i<4;i++){ const c=makeCow(1,i!==2); c.position.set(-10+i*2.2,0,-8); c.rotation.y=Math.PI/2; scene.add(c); cows.push(c); }
  // Photographic cutouts add a credible visual anchor while the lightweight
  // procedural herd continues to supply animation and collision geometry.
  const cowTexture=new THREE.TextureLoader().load('assets/characters/holstein-cow.png');
  cowTexture.colorSpace=THREE.SRGBColorSpace;
  for(const [x,z,scale] of [[-15,-7,1],[-18,-10,.82]]){
    const cow=new THREE.Sprite(new THREE.SpriteMaterial({map:cowTexture,transparent:true,alphaTest:.08}));
    cow.scale.set(5.8*scale,3.9*scale,1);
    cow.position.set(x,1.95*scale,z);
    cow.userData.type='cow';
    scene.add(cow); cows.push(cow);
  }
  // make cows clickable for a moo
  cows.forEach(c=>{ c.userData.type='cow'; });
  // enterLocation merges these into the location's clickables after setActive.
  scene.userData.cows=cows;
}
function makeCow(scale=1,spotted=true){
  const {box,rbox,cyl,ball,lamb}=B;
  const g=new THREE.Group();
  const hideMat=new THREE.MeshLambertMaterial({map:B.cowTexture(spotted)});
  const dark=lamb(0x201f1c), pink=lamb(0xe8a8a8), horn=lamb(0xe8dfc8);

  // body — bigger barrel proportions read more clearly as "cow" at a distance
  const bodyMesh=new THREE.Mesh(new THREE.CapsuleGeometry(0.68,1.55,4,10),hideMat);
  bodyMesh.rotation.z=Math.PI/2; bodyMesh.position.y=1.28; bodyMesh.castShadow=true; bodyMesh.receiveShadow=true;
  g.add(bodyMesh);

  // head — rounded box (RoundedBoxGeometry) instead of a hard cube, with a
  // clearly separated dark snout, visible ears, and small polled-breed horns.
  const head=new THREE.Group(); head.position.set(1.38,1.78,0);
  head.add(rbox(0.72,0.66,0.58,hideMat,0,0,0,0.1));
  head.add(rbox(0.4,0.32,0.42,pink,0.44,-0.16,0,0.08));
  head.add(ball(0.045,dark,0.62,-0.1,0.13,false));
  head.add(ball(0.045,dark,0.62,-0.1,-0.13,false));
  for(const s of [1,-1]) head.add(ball(0.055,dark,0.3,0.05,s*0.24,false));
  for(const s of [1,-1]){
    const ear=rbox(0.3,0.16,0.2,hideMat,-0.02,0.22,s*0.42,0.05,false);
    ear.rotation.z=s*0.5; ear.rotation.y=s*0.3; head.add(ear);
  }
  for(const s of [1,-1]) head.add(cyl(0.02,0.05,0.16,horn,0.05,0.42,s*0.22,6,false));
  g.add(head);

  for(const [lx,lz] of [[0.72,0.32],[0.72,-0.32],[-0.72,0.32],[-0.72,-0.32]]) g.add(cyl(0.11,0.13,0.95,dark,lx,0.48,lz,8));
  g.add(ball(0.34,pink,-0.55,0.78,0,false));

  // tail — animated in updateCows for a gentle swish
  const tail=new THREE.Group(); tail.position.set(-1.5,1.7,0);
  tail.add(cyl(0.035,0.05,0.85,dark,0,-0.4,0,6,false));
  tail.add(ball(0.08,dark,0,-0.82,0,false));
  g.add(tail);

  g.scale.setScalar(scale*1.12);
  g.userData={type:'cow',head,tail,phase:Math.random()*9};
  return g;
}
function makeTanker(){
  const {box,cyl,ball,lamb}=B; const g=new THREE.Group(); const steel=lamb(0xe3eaee), dark=lamb(0x2b2b2b);
  g.add(box(1.8,1.7,2,lamb(0x1f6fb2),0,1.3,2.8));
  const tk=cyl(1.1,1.1,4.6,steel,0,1.8,-0.6,18); tk.rotation.x=Math.PI/2; g.add(tk);
  g.add(ball(1.1,steel,0,1.8,1.7)); g.add(ball(1.1,steel,0,1.8,-2.9));
  g.add(box(2.2,0.4,5.4,dark,0,0.6,-0.2));
  for(const zz of [2.4,-1,-2.4]) for(const s of [1,-1]){ const w=cyl(0.5,0.5,0.35,dark,s*1,0.5,zz,12); w.rotation.z=Math.PI/2; g.add(w);}
  return g;
}
function withLabel(sprite,x,y,z){ sprite.position.set(x,y,z); return sprite; }

function buildProcessor(scene,addObst){
  const {box,rbox,cyl,ball,lamb,basic,labelSprite}=B;
  // clean modern facility shell (visitor-safe walkway implied)
  const bldg=new THREE.Group();
  bldg.add(box(24,7,16,lamb(0xeef1f4),0,3.5,-6));
  bldg.add(box(24.4,0.4,16.4,lamb(0xcfd6dc),0,7.1,-6));
  bldg.position.set(0,0,0); scene.add(bldg); addObst(0,-12,12);

  // ---- street-facing facade (the wall the player spawns looking at) ----
  const wallZ=2.06; // just proud of the front wall at z=2
  const facade=new THREE.Group();
  const glass=new THREE.MeshPhongMaterial({color:0x8fd0e6,transparent:true,opacity:0.55,shininess:90});
  const frameM=lamb(0xffffff), accent=lamb(0x1a7a3c), steel=lamb(0xb7c2cc);
  // corner pilasters give the wall real architectural edges instead of a flat slab
  for(const px of [-11.4,11.4]) facade.add(rbox(1.2,7,1.2,lamb(0xd7dee4),px,3.5,wallZ-0.5,0.15));
  // ribbon of tinted windows with white mullion frames
  for(const wx of [-8.4,-4.6,4.6,8.4]){
    facade.add(rbox(2.6,3,0.14,frameM,wx,4.3,wallZ,0.06));
    facade.add(box(2.3,2.7,0.05,glass,wx,4.3,wallZ+0.08,false));
    facade.add(box(2.6,0.1,0.1,frameM,wx,4.3,wallZ+0.08,false));
  }
  // entrance: glass double doors + canopy + signage
  facade.add(rbox(2.4,3.4,0.12,frameM,0,2,wallZ,0.06));
  facade.add(box(1,3,0.06,glass,-0.55,1.9,wallZ+0.08,false));
  facade.add(box(1,3,0.06,glass,0.55,1.9,wallZ+0.08,false));
  const canopy=rbox(4.6,0.22,1.6,accent,0,3.9,wallZ+0.9,0.06); facade.add(canopy);
  for(const px of [-2,2]) facade.add(cyl(0.07,0.07,3.79,steel,px,1.895,wallZ+1.55,8,false));
  facade.add(withLabel(labelSprite('PROCESSING & PACKAGING',1.3),0,5.4,wallZ+0.9));
  // exterior pipe run along the base — visible plant character, not just a wall
  for(const py of [0.9,1.3]){ const pipe=cyl(0.09,0.09,20,steel,0,py,wallZ-0.35,8,false); pipe.rotation.z=Math.PI/2; facade.add(pipe); }
  facade.add(cyl(0.16,0.16,2.2,steel,-9.5,1.6,wallZ-0.35,10,false));
  // roof-mounted equipment breaks up the flat roofline silhouette
  for(const rx of [-6,0,6]){
    facade.add(box(1.4,0.8,1.4,lamb(0xc7ced3),rx,7.5,-8,false));
    const fan=cyl(0.5,0.5,0.08,lamb(0x7f8a92),rx,7.95,-8,14,false); fan.rotation.x=Math.PI/2; facade.add(fan);
  }
  scene.add(facade);

  // receiving bay + tanker
  const tanker=makeTanker(); tanker.position.set(-16,0,6); tanker.rotation.y=0.5; scene.add(tanker); addObst(-16,6,2.4);
  scene.add(withLabel(labelSprite('Receiving Bay',1),-16,3.4,6));
  // stainless tanks + pipes
  for(let i=0;i<4;i++){ const t=cyl(1,1,4,lamb(0xd7dee4),-8+i*2.4,2,-4,16); scene.add(t); }
  scene.add(withLabel(labelSprite('Stainless Tanks',0.9),-5,4.6,-4));
  // pipes
  for(let i=0;i<4;i++){ const p=box(8,0.15,0.15,lamb(0xb7c2cc),-2,3.4+i*0.3,-2); scene.add(p); }
  // cheese line: block, cutter, shredder, packaging
  const line=new THREE.Group();
  line.add(box(0.9,0.9,0.9,lamb(0xf3d98a),0,1,0));   // cheese block
  line.add(box(1.2,1.4,1.2,lamb(0x9fb4c4),2.4,0.9,0)); // shredder
  line.add(box(1.4,1,1,lamb(0xcfd6dc),4.8,0.7,0));   // packager
  line.position.set(6,0,-4); scene.add(line);
  scene.add(withLabel(labelSprite('Cheese & Shred Line',0.9),8.4,3,-4));
  // consumer vs foodservice packaging stacks
  const cons=box(1,0.6,0.7,lamb(0x2a9c53),12,0.6,-2); scene.add(cons);
  const food=box(1.6,1,1.2,lamb(0xf5b21e),14,0.9,-2); scene.add(food);
  scene.add(withLabel(labelSprite('Consumer + Foodservice',0.9),13,2.4,-2));
  // refrigerated storage + shipping dock
  scene.add(withLabel(labelSprite('Cold Storage',0.9),-10,3,-10));
  const dock=box(6,1,4,lamb(0x9aa7b0),12,0.5,8); scene.add(dock); addObst(12,8,3);
  scene.add(withLabel(labelSprite('Shipping Dock',0.9),12,2.4,8));
}
function buildMarket(scene,addObst){
  const {box,rbox,cyl,ball,lamb,labelSprite}=B;
  const glass=new THREE.MeshPhongMaterial({color:0x9fe0ea,transparent:true,opacity:0.5,shininess:90});
  const steamGlass=new THREE.MeshPhongMaterial({color:0xffe0b0,transparent:true,opacity:0.35,shininess:60});
  const frameM=lamb(0xffffff);

  // grocery side (left)
  const grocery=new THREE.Group();
  grocery.add(box(12,6,10,lamb(0xf3efe3),0,3,-6));
  // dairy case
  for(let i=0;i<3;i++){ const c=box(3,2.2,1.2,lamb(0xbfe0ea),-3+i*3,1.1,-1); grocery.add(c); grocery.add(box(3,0.1,1.2,lamb(0xffffff),-3+i*3,2.25,-1)); }
  grocery.position.set(-12,0,0); scene.add(grocery); addObst(-12,-6,8.6);
  scene.add(withLabel(labelSprite('Grocery Dairy Aisle',1),-12,4.4,-1));

  // grocery street-facing storefront (this is what the player actually spawns
  // looking toward — was previously a flat undecorated wall)
  {
    const gz=-0.92, gx=-12;
    const f=new THREE.Group();
    for(const px of [gx-6.4,gx+6.4]) f.add(rbox(0.8,6,0.8,lamb(0xe2dcc8),px,3,gz-0.4,0.1));
    f.add(rbox(9,3.4,0.14,frameM,gx,3.1,gz,0.06));
    f.add(box(8.6,3,0.05,glass,gx,3.1,gz+0.08,false));
    for(const lx of [-3,-1,1,3]) f.add(box(0.1,3,0.06,frameM,gx+lx,3.1,gz+0.1,false));
    f.add(rbox(1.8,3,0.1,frameM,gx,1.6,gz,0.06));
    f.add(box(0.85,2.7,0.05,glass,gx-0.42,1.5,gz+0.08,false));
    f.add(box(0.85,2.7,0.05,glass,gx+0.42,1.5,gz+0.08,false));
    const awning=rbox(9.6,0.2,1.1,lamb(0x1a7a3c),gx,5,gz+0.55,0.05); f.add(awning);
    for(let i=0;i<6;i++) f.add(box(1.6,0.05,1.1,lamb(i%2?0xffffff:0x1a7a3c),gx-7.2+i*2.88,4.9,gz+0.55,false));
    f.add(withLabel(labelSprite('MARKET',1.3),gx,5.9,gz+0.6));
    // planter box + small produce color pop out front for street character
    const planter=box(2.4,0.5,0.6,lamb(0x7a5a3a),gx,0.25,gz+1.3); f.add(planter);
    const leafM=lamb(0x3e8a3e);
    for(let i=0;i<5;i++) f.add(ball(0.22,i%2?leafM:lamb(0xd94f4f),gx-1+i*0.5,0.55,gz+1.3,false));
    scene.add(f);
  }

  // restaurant / commercial kitchen (right)
  const kitchen=new THREE.Group();
  kitchen.add(box(12,6,10,lamb(0xe7ede9),0,3,-6));
  // stainless counters + range
  kitchen.add(box(6,1,1.4,lamb(0xcfd6dc),0,1,-1));
  kitchen.add(box(2,1,1.4,lamb(0x333333),3.5,1,-1));
  kitchen.position.set(12,0,0); scene.add(kitchen); addObst(12,-6,8.6);
  scene.add(withLabel(labelSprite('Commercial Kitchen',1),12,4.4,-1));

  // kitchen street-facing facade — warm awning + steamy glass + roof exhaust
  // hood so it reads as "restaurant," distinct from the grocery storefront
  {
    const kz=-0.92, kx=12;
    const f=new THREE.Group();
    for(const px of [kx-6.4,kx+6.4]) f.add(rbox(0.8,6,0.8,lamb(0xe2dcc8),px,3,kz-0.4,0.1));
    f.add(rbox(9,3.4,0.14,frameM,kx,3.1,kz,0.06));
    f.add(box(8.6,3,0.05,steamGlass,kx,3.1,kz+0.08,false));
    for(const lx of [-3,-1,1,3]) f.add(box(0.1,3,0.06,frameM,kx+lx,3.1,kz+0.1,false));
    f.add(rbox(1.8,3,0.1,lamb(0x4a2f1c),kx,1.6,kz,0.06));
    const awning=rbox(9.6,0.2,1.1,lamb(0xb8481f),kx,5,kz+0.55,0.05); f.add(awning);
    for(let i=0;i<6;i++) f.add(box(1.6,0.05,1.1,lamb(i%2?0xffffff:0xb8481f),kx-7.2+i*2.88,4.9,kz+0.55,false));
    f.add(withLabel(labelSprite('KITCHEN',1.3),kx,5.9,kz+0.6));
    // roof exhaust hood stack signals "commercial kitchen" from a glance
    f.add(cyl(0.28,0.28,2,lamb(0xb7c2cc),kx-4,7,-8,10,false));
    f.add(cyl(0.4,0.34,0.35,lamb(0x8d9aa5),kx-4,8.1,-8,10,false));
    scene.add(f);
  }

  // small bistro table + umbrella in the plaza between the two storefronts —
  // a cheap, high-impact prop that visually bridges grocery and restaurant
  {
    const t=new THREE.Group();
    t.add(cyl(0.06,0.06,1.0,lamb(0x3a3a3a),0,0.5,0,8));
    t.add(cyl(0.55,0.55,0.06,lamb(0xf5f0e6),0,1.02,0,16));
    t.add(cyl(0.04,0.04,1.4,lamb(0xd9d2c0),0,1.7,0,8,false));
    const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.1,0.5,10),lamb(0xf5b21e)); canopy.position.y=2.15; canopy.castShadow=true; t.add(canopy);
    t.position.set(0,0,3);
    scene.add(t); addObst(0,3,1.1);
  }

  // receiving dock between
  const dock=box(5,1,3,lamb(0x9aa7b0),12,0.5,8); scene.add(dock); addObst(12,8,3);
  scene.add(withLabel(labelSprite('Restaurant Receiving',0.9),12,2.4,8));
  // refrigerated storage
  scene.add(withLabel(labelSprite('Refrigerated Storage',0.9),0,3,-12));
  const cold=box(6,4,4,lamb(0xcfe3ea),0,2,-12); scene.add(cold); addObst(0,-12,3.5);
  // chef character (simple)
  const chef=makeChef(); chef.position.set(9,0,2); scene.add(chef);
  // packages consumer + foodservice
  scene.add(withLabel(labelSprite('Consumer + Foodservice Packages',0.8),0,2.2,4));
}
function makeChef(){ const {box,cyl,ball,lamb}=B; const g=new THREE.Group(); g.add(cyl(0.4,0.5,1.4,lamb(0xffffff),0,0.9,0,10)); g.add(ball(0.35,lamb(0xe8b98f),0,1.9,0)); g.add(cyl(0.36,0.36,0.4,lamb(0xffffff),0,2.3,0,12)); g.add(ball(0.34,lamb(0xffffff),0,2.6,0,false)); return g; }

/* register cows/scene extra clickables after location active is set:
   buildFarm pushes into active.clickables directly if present. To be safe we
   also add scene cows here in enterLocation via traversal — handled by tryClick
   using active.clickables which farm builder appended to. */

/* ---------------- COMPLETION ---------------- */
function enterCompletion(){
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
  $('complete').classList.remove('hidden');
}
$('cMap').onclick=()=>{ $('complete').classList.add('hidden'); go(GAME_STATES.MAP); };
$('cReplay').onclick=()=>{ confirmDialog('Play again?','This resets your progress and starts a fresh journey.',()=>{ Progress.reset(); sessionStorage.removeItem('rcm_recapDone'); $('complete').classList.add('hidden'); go(GAME_STATES.MAP); },'Start over','Cancel'); };
$('cProducts').onclick=()=>{ Analytics.track('external_cta_clicked',{cta:'products'}); window.open(EXTERNAL_LINKS.products,'_blank','noopener'); };
$('cFoodservice').onclick=()=>{ Analytics.track('external_cta_clicked',{cta:'foodservice'}); window.open(EXTERNAL_LINKS.foodservice,'_blank','noopener'); };

/* ============================================================================
   11. FALLBACK (no-WebGL) — same educational content, DOM only
============================================================================ */
function enterFallback(){
  Analytics.track('fallback_shown');
  $('boot').classList.add('hidden'); $('title').classList.add('hidden'); $('hud').classList.add('hidden');
  const root=$('fallback'); root.classList.remove('hidden');
  renderFallback();
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
$('btnMap').onclick=()=>{ if(webglOK){ Audio.click(); go(GAME_STATES.MAP);} };
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
    localStorage.setItem('rcm_quality',quality);
    $('qualitySeg').querySelectorAll('button').forEach(x=>{
      x.classList.toggle('on',x===b);
      x.setAttribute('aria-pressed',x===b?'true':'false');
    });
    applyRendererQuality();
    toast(`Graphics: ${quality==='perf'?'Performance':quality[0].toUpperCase()+quality.slice(1)}`);
  };
});

// BEGIN
$('beginBtn').onclick=async ()=>{
  Audio.init(); Audio.click();
  $('btnSound').innerHTML=(Audio.enabled?'🔊':'🔇')+' <span class="lbl">Sound</span>';
  $('title').classList.add('hidden');
  if(!webglOK){ enterFallback(); return; }
  // Don't force intro to replay within the same session
  if(sessionStorage.getItem('rcm_introSeen')==='1'){ go(GAME_STATES.MAP); }
  else { go(GAME_STATES.EARTH_INTRO); }
};

function showResumeBanner(){
  const hasProgress = Progress.data.points>0 || Progress.lessonsDoneCount()>0;
  const banner=$('resumeBanner');
  if(!hasProgress){ banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  banner.innerHTML = `Welcome back! You've saved ⭐ ${Progress.data.points} points, `
    + `📘 ${Progress.lessonsDoneCount()}/9 lessons, and 🏅 ${Progress.badgeCount()}/3 badges on this device.`;
  $('beginBtn').textContent = 'CONTINUE THE CALIFORNIA JOURNEY';
}

async function boot(){
  validateLessonContent(LOCATIONS);
  showResumeBanner();
  updateHUD();
  const ok=await initThree();
  if(!ok){
    // WebGL failed → fallback path, but keep the title so user still chooses BEGIN
    webglOK=false;
    $('boot').classList.add('hidden');
    // title BEGIN will route to fallback
    return;
  }
  B=makeBuilders();
  attachCanvasInput();
  // single animation loop
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{
    const dt=Math.min(clock.getDelta(),0.05), t=clock.elapsedTime;
    if(active.update) active.update(dt,t);
    if(active.scene && renderer) renderer.render(active.scene,camera);
  });
  $('boot').classList.add('hidden');
  // sound button initial label
  $('btnSound').innerHTML=(Audio.enabled?'🔊':'🔇')+' <span class="lbl">Sound</span>';
}

// debug hooks for automated testing / QA
window.__game = { GAME_STATES, LOCATIONS, Progress, go:(s,o)=>go(s,o), startLesson, startQuiz, enterCompletion, enterFallback, Audio, state:()=>active.id, player, beacons:()=>active.beacons, quizG:()=>active.quizG, setPlayerPos:(x,z)=>{player.x=x;player.z=z;}, obst:()=>curOBST };
window.__RCM_DEBUG = false;

configureLessonRenderer({ openModal, closeModal, fireConfetti, navigate: go });

boot();
