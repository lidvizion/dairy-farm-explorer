import { WORLD_LABS, advanceLab } from '../config/world-labs.js';
import { Audio } from '../core/audio.js';

// A replaceable visual boundary: future approved models can replace these groups
// without changing the interaction state, accessible controls, or lesson system.
export function createLabVisual(THREE, scene, id, B, makeCow) {
  const root = new THREE.Group(); root.position.set(0, 0, 17);
  root.userData.dynamic = true; root.visible = false; scene.add(root);
  const { box, cyl, ball, lamb } = B;
  const cream = lamb(0xf6edda), wood = lamb(0x88664b), green = lamb(0x326c51);
  const blue = lamb(0x65bbcf), steel = lamb(0xb8cacb), gold = lamb(0xe8b657);
  root.add(cyl(5.3, 5.6, .35, cream, 0, .12, 0, 48));
  root.add(cyl(5.6, 5.6, .12, green, 0, -.08, 0, 48));
  const pieces = {};
  const sign = (text, x, y, z, size = .65) => {
    const sprite = B.labelSprite(text, size); sprite.position.set(x, y, z); root.add(sprite); return sprite;
  };
  if (id === 'farm') {
    root.add(box(6.7, .08, 4, lamb(0x8a9c67), 0, .34, 0));
    for (const x of [-3, 0, 3]) root.add(box(.14, 1, .14, wood, x, .9, -2));
    for (const y of [.65, 1.2]) root.add(box(6.2, .12, .12, wood, 0, y, -2));
    const cow = makeCow(.72); cow.position.set(-.6, .28, .2); root.add(cow);
    root.add(box(2.2, .48, 1, steel, 1.6, .6, 1.5));
    pieces.water = box(1.96, .06, .8, blue, 1.6, .82, 1.5); root.add(pieces.water);
    pieces.shade = new THREE.Group();
    for (const x of [-2.5, 1.5]) for (const z of [-1.5, 1]) pieces.shade.add(cyl(.06, .06, 2.8, wood, x, 1.7, z, 7));
    pieces.shade.add(box(4.6, .16, 3.2, green, -.5, 3.15, -.25)); root.add(pieces.shade);
    root.add(cyl(.09, .12, 2, steel, 3.1, 1.3, -1, 8));
    pieces.fan = new THREE.Group(); pieces.fan.position.set(3.1, 2.3, -1);
    for (let i = 0; i < 3; i++) { const blade = box(.18, 1.15, .08, gold); blade.rotation.z = i * Math.PI / 3; pieces.fan.add(blade); }
    pieces.fan.add(ball(.13, green)); root.add(pieces.fan);
    sign('WATER', 2.2, 1.2, 2, .5);
  } else if (id === 'processor') {
    const labels = ['CHECK', 'HEAT', 'COOL'];
    pieces.lights = []; pieces.cartons = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 3;
      root.add(cyl(.75, .75, 2, steel, x, 1.5, 0, 18));
      root.add(ball(.75, steel, x, 2.5, 0));
      root.add(box(1.7, .18, 1.7, wood, x, .48, 0));
      const lamp = box(.55, .4, .12, lamb(0x62736e), x, 1.6, .77); root.add(lamp); pieces.lights.push(lamp);
      sign(labels[i], x, 3.65, 0, .65);
      if (i < 2) { const pipe = cyl(.13, .13, 1.5, steel, x + 1.5, .85, 0, 10); pipe.rotation.z = Math.PI / 2; root.add(pipe); }
    }
    root.add(box(6.8, .12, 1, green, 0, .6, 2.15));
    for (let i = 0; i < 5; i++) {
      pieces.cartons.add(box(.43, .7, .43, cream, -.8 + i * .65, 1, 2.15));
      pieces.cartons.add(box(.44, .2, .44, blue, -.8 + i * .65, 1.12, 2.15));
    }
    root.add(pieces.cartons);
  } else {
    for (const [x, color, label] of [[-3, green, 'GROCERY'], [3, wood, 'KITCHEN']]) {
      root.add(box(2.4, 2.4, 1.5, cream, x, 1.55, -1));
      root.add(box(2.7, .18, 2, color, x, 2.9, -.6));
      root.add(box(1.7, 1.35, .1, blue, x, 1.7, -.2));
      for (let i = 0; i < 5; i++) root.add(box(.28, .3, .15, cream, x - .65 + i * .32, 1.3, -.1));
      sign(label, x, 3.7, -1, .65);
    }
    pieces.carton = new THREE.Group();
    pieces.carton.add(box(.7, 1.1, .7, cream, 0, .95, 0));
    pieces.carton.add(box(.72, .35, .72, green, 0, 1.08, 0));
    pieces.carton.add(cyl(.15, .15, .1, blue, .15, 1.54, 0, 8));
    pieces.case = new THREE.Group();
    pieces.case.add(box(1.35, .85, .9, gold, 0, .85, 0));
    pieces.case.add(box(.15, .86, .91, cream, 0, .85, 0));
    root.add(pieces.carton, pieces.case);
    sign('REFRIGERATED DELIVERY', 0, .7, 3.5, .7);
  }
  let state = { mask: 0, step: 0 }, time = 0;
  const moves = [];
  function move(object, x, y, z, animate) {
    if(animate) moves.push({object,from:object.position.clone(),to:new THREE.Vector3(x,y,z),elapsed:0});
    else object.position.set(x,y,z);
  }
  function sync(next, animate = false) {
    moves.length=0;
    state = next;
    if (id === 'farm') {
      const hadWater=pieces.water.visible;
      pieces.water.visible = !!(state.mask & 1); pieces.shade.visible = !!(state.mask & 2);
      if(animate && !hadWater)pieces.water.position.y=.5;
      move(pieces.water,1.6,.82,1.5,animate);
    }
    if (id === 'processor') {
      pieces.lights.forEach((lamp, i) => lamp.material.color.setHex(state.step > i ? [0x67bf82, 0xee955e, 0x67c6e2][i] : 0x62736e));
      pieces.cartons.visible = state.step === 3;
    }
    if (id === 'market') {
      move(pieces.carton,state.step > 0 ? -3 : 0, 0, state.step > 0 ? .7 : 2,animate);
      pieces.case.visible = state.step > 0;
      move(pieces.case,state.step > 1 ? 3 : 0, 0, state.step > 1 ? .7 : 2,animate);
    }
    root.userData.labState = { mask: state.mask, step: state.step };
  }
  sync(state);
  return { root, sync, inspect() {
    if(id==='farm')return {waterVisible:pieces.water.visible,waterHeight:pieces.water.position.y,shadeVisible:pieces.shade.visible};
    if(id==='processor')return {cartonsVisible:pieces.cartons.visible,indicators:pieces.lights.map(lamp=>lamp.material.color.getHex())};
    return {cartonX:pieces.carton.position.x,caseX:pieces.case.position.x};
  }, update(dt, reducedMotion) {
    if (!root.visible) return;
    for(let i=moves.length-1;i>=0;i--){
      const motion=moves[i];motion.elapsed+=dt;
      const fraction=reducedMotion?1:Math.min(1,motion.elapsed/.7);
      const ease=fraction*fraction*(3-2*fraction);
      motion.object.position.lerpVectors(motion.from,motion.to,ease);
      if(fraction===1)moves.splice(i,1);
    }
    if(reducedMotion)return;
    time += dt;
    if (id === 'farm' && (state.mask & 4)) pieces.fan.rotation.z += dt * 4;
    if (id === 'processor' && state.step === 3) pieces.cartons.position.x = Math.sin(time) * .18;
  } };
}

export function mountWorldLab({ id, visual, camera, resetInput, reducedMotion, onLesson }) {
  const config = WORLD_LABS[id];
  const panel = document.createElement('section'); panel.id = 'worldLab'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'labTitle');
  panel.innerHTML = `<div class="lab-heading"><div><p class="eyebrow">${config.kicker} · OPTIONAL</p><h2 id="labTitle">${config.title}</h2></div><button class="lab-close" aria-label="Leave demonstration">×</button></div><p id="labStatus" role="status"></p><div class="lab-actions"></div><div class="lab-footer"><span id="labProgress"></span><button id="labReset">Start again</button><button id="labLesson" hidden>Explore the lesson →</button></div>`;
  document.body.append(panel);
  const launch = document.createElement('button'); launch.id = 'tryWorld'; launch.className = 'btn world-launch';
  launch.textContent = 'Try it in the world ↗'; document.getElementById('objective').append(launch);
  let state, saved = null;
  let previousAspect = null;
  const status = panel.querySelector('#labStatus'), actions = panel.querySelector('.lab-actions');
  const controls = config.actions.map((name, i) => {
    const button = document.createElement('button'); button.textContent = name;
    button.onclick = () => {
      const next = advanceLab(id, state, i); state = next;
      if (next.accepted) { Audio.pop(); visual.sync(state,!reducedMotion); } else Audio.click();
      render();
    };
    actions.append(button); return button;
  });
  const background = ['hud', 'objective', 'joy', 'lookJoy', 'touchAct', 'worldCanvas'];
  function render() {
    status.textContent = state.complete ? config.finish : state.note || config.intro;
    const count = id === 'farm' ? [1, 2, 4].filter(bit => state.mask & bit).length : state.step;
    panel.querySelector('#labProgress').textContent = `${count} / ${config.actions.length} discoveries${state.complete ? ' · Complete' : ''}`;
    panel.querySelector('#labLesson').hidden = !state.complete;
    controls.forEach((button, i) => {
      const done = id === 'farm' ? !!(state.mask & (1 << i)) : state.step > i;
      button.setAttribute('aria-pressed', String(done));
      button.dataset.done = String(done);
    });
  }
  function reset() { state = { mask: 0, step: 0, complete: false }; visual.sync(state); render(); }
  function frameModel() {
    // Fit the model into the unobscured part of the actual viewport, including
    // phone rotation. No forced camera animation, including on reduced motion.
    const landscape = innerHeight <= 500 && innerWidth > innerHeight;
    const distance = camera.aspect < .8 ? 15.5 : 11.5;
    camera.position.set(0, 6.5, 17 + distance);
    camera.lookAt(landscape ? 5 : 0, camera.aspect < .8 ? -1.8 : -.3, 17);
    previousAspect = camera.aspect;
  }
  function leave(restore = true) {
    if (!saved) return;
    if (restore) { camera.position.copy(saved.position); camera.quaternion.copy(saved.quaternion); }
    saved = null; visual.root.visible = false; panel.hidden = true;
    document.body.classList.remove('in-world-lab');
    background.forEach(id => { const node = document.getElementById(id); if (node) node.inert = false; });
    resetInput(); if (restore) launch.focus({ preventScroll: true });
  }
  launch.onclick = () => {
    resetInput(); Audio.init(); Audio.click();
    saved = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
    frameModel();
    visual.root.visible = true; panel.hidden = false; document.body.classList.add('in-world-lab');
    background.forEach(id => { const node = document.getElementById(id); if (node) node.inert = true; });
    reset(); controls[0].focus({ preventScroll: true });
  };
  const keydown = e => {
    if (!saved) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); leave(); }
    if (e.key === 'Tab') {
      const buttons = [...panel.querySelectorAll('button')].filter(b => !b.hidden);
      const first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', keydown, true);
  panel.querySelector('.lab-close').onclick = () => leave();
  panel.querySelector('#labReset').onclick = () => { reset(); controls[0].focus(); };
  panel.querySelector('#labLesson').onclick = () => { leave(); onLesson(config.lesson); };
  return { get running() { return !!saved; }, inspect:()=>visual.inspect(), update(dt) { if(previousAspect!==camera.aspect)frameModel(); visual.update(dt, reducedMotion); },
    dispose() { leave(false); document.removeEventListener('keydown', keydown, true); panel.remove(); launch.remove(); } };
}
