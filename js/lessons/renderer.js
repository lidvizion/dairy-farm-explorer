import { BRAND_ASSETS, GAME_STATES, LOC_BY_ID, SCORING } from '../config/content.js';
import { Analytics, Progress } from '../core/progress.js';
import { Audio } from '../core/audio.js';
import { $, el, toast, caption } from '../ui/dom.js';

let openModal;
let closeModal;
let fireConfetti;
let navigate = () => {};

export function configureLessonRenderer(dependencies) {
  ({ openModal, closeModal, fireConfetti, navigate } = dependencies);
}

/* ============================================================================
   5. LESSONS — DOM mini-games (shared by 3D + fallback)
============================================================================ */
let currentLesson = null; // {loc, lesson}

export function startLesson(locId, lessonId){
  const loc = LOC_BY_ID[locId];
  const lesson = loc.lessons.find(l=>l.id===lessonId);
  currentLesson = { loc, lesson };
  Audio.click();
  Analytics.track('lesson_started',{location:locId,lesson:lessonId});
  caption(lesson.intro);
  openModal(`${lesson.icon} ${lesson.title}`, loc.stage, body=>{
    body.appendChild(el('p',null,lesson.intro));
    const gameHost = el('div','game-host'); body.appendChild(gameHost);
    renderGame(gameHost, lesson);
  });
}

function lessonSolved(){
  const {loc,lesson} = currentLesson;
  const isNew = Progress.completeLesson(loc.id, lesson.id);
  Audio.good();
  fireConfetti();
  if (isNew) toast(`+${SCORING.lesson} ⭐ Lesson complete!`);
  const body=$('modalBody');
  const done=el('div','btnrow');
  const more=el('button','btn btn-primary','Back to '+loc.title.toLowerCase().replace(/^where /,'')+' ✔');
  more.textContent = 'Continue';
  more.onclick = ()=>{ closeModal(); caption(''); afterLessonReturn(loc.id); };
  done.appendChild(more);
  body.appendChild(done);
}

// hook the world can override to refresh station visuals after a lesson
let afterLessonReturn = () => {};
export function setAfterLessonReturn(callback) { afterLessonReturn = callback; }

function renderGame(host, lesson){
  const g = lesson.game;
  host.appendChild(el('div','mg-instructions', g.prompt));
  if (g.type==='multiselect') return renderMultiSelect(host,g);
  if (g.type==='sequence')    return renderSequence(host,g);
  if (g.type==='match')       return renderMatch(host,g);
  if (g.type==='branch')      return renderBranch(host,g);
  if (g.type==='seal')        return renderSeal(host,g);
}

// MULTISELECT: choose the correct subset, then confirm
function renderMultiSelect(host,g){
  const sel=new Set();
  const grid=el('div','chip-grid');
  g.options.forEach((o,i)=>{
    const b=el('button','pick',`<span class="ic">${o.ic}</span><span>${o.t}</span>`);
    b.setAttribute('aria-pressed','false');
    b.onclick=()=>{
      if(b.getAttribute('aria-disabled')==='true') return;
      if(sel.has(i)){ sel.delete(i); b.classList.remove('sel'); b.setAttribute('aria-pressed','false'); }
      else { sel.add(i); b.classList.add('sel'); b.setAttribute('aria-pressed','true'); Audio.click(); }
      check.disabled = sel.size!==g.need;
    };
    grid.appendChild(b);
  });
  host.appendChild(grid);
  const fb=el('div','quiz-feedback'); host.appendChild(fb);
  const row=el('div','btnrow');
  const check=el('button','btn btn-primary',`Check (${g.need} needed)`); check.disabled=true;
  check.onclick=()=>{
    const btns=[...grid.children]; let allOk=true;
    btns.forEach((b,i)=>{
      if(sel.has(i)){ if(g.options[i].ok){b.classList.add('correct');} else {b.classList.add('bad'); allOk=false;} }
    });
    if(allOk){ fb.style.color='var(--green-dk)'; fb.textContent=g.success; btns.forEach(b=>b.setAttribute('aria-disabled','true')); row.remove(); lessonSolved(); }
    else { Audio.bad(); fb.style.color='#c62828'; fb.textContent='Not quite — remove the wrong picks and try again.';
      setTimeout(()=>{ btns.forEach((b,i)=>{ b.classList.remove('bad'); if(!g.options[i].ok){ sel.delete(i); b.classList.remove('sel'); b.setAttribute('aria-pressed','false'); } }); check.disabled=sel.size!==g.need; },900); }
  };
  row.appendChild(check); host.appendChild(row);
}

// SEQUENCE: order the steps, then run cooling
function renderSequence(host,g){
  const order=[]; const pool=g.steps.map((s,i)=>({...s,i}));
  const list=el('div'); list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='8px';
  const target=el('div'); target.style.display='flex'; target.style.flexDirection='column'; target.style.gap='8px'; target.style.margin='6px 0 12px';
  const poolWrap=el('div','chip-grid');
  const fb=el('div','quiz-feedback');
  function redraw(){
    target.innerHTML='';
    order.forEach((s,idx)=>{ const it=el('div','match-item paired',`<span class="ic">${s.ic}</span><span>${idx+1}. ${s.t}</span>`); target.appendChild(it); });
    poolWrap.innerHTML='';
    pool.forEach(s=>{
      if(order.includes(s)) return;
      const b=el('button','pick',`<span class="ic">${s.ic}</span><span>${s.t}</span>`);
      b.onclick=()=>{ order.push(s); Audio.click(); redraw(); };
      poolWrap.appendChild(b);
    });
    poolHeading.classList.toggle('hidden', pool.length===order.length);
    run.disabled = order.length!==g.steps.length;
  }
  host.appendChild(el('div',null,'<h4 style="margin:2px 0 6px;font-size:13px;color:#5a5140;">Milk path (in order)</h4>'));
  host.appendChild(target);
  const poolHeading=el('h4','',''); poolHeading.style.cssText='margin:6px 0 6px;font-size:13px;color:#5a5140;'; poolHeading.textContent='Tap steps in the right order';
  host.appendChild(poolHeading);
  host.appendChild(poolWrap);
  // cooling meter
  const cool=el('div'); cool.style.margin='12px 0';
  cool.innerHTML=`<div style="font-size:13px;font-weight:700;color:#5a5140;margin-bottom:6px;">${g.cool.label}</div>
    <div style="height:16px;border-radius:999px;background:#ffd9c2;overflow:hidden;border:1px solid #e2c3ad;">
      <div id="coolBar" style="height:100%;width:100%;background:linear-gradient(90deg,#ff8a5b,#ff8a5b);transition:width 1.2s,background 1.2s;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#777;margin-top:3px;"><span>Warm</span><span id="coolTemp">Warm</span><span>Cold</span></div>`;
  host.appendChild(cool);
  host.appendChild(fb);
  const row=el('div','btnrow');
  const run=el('button','btn btn-primary','Start cooling ❄️'); run.disabled=true;
  run.onclick=()=>{
    const correct = order.every((s,i)=>s.i===i);
    if(!correct){ Audio.bad(); fb.style.color='#c62828'; fb.textContent='Close — check the order. Milking comes first, the tanker leaves last.'; order.length=0; redraw(); return; }
    const bar=$('coolBar'); bar.style.width='18%'; bar.style.background='linear-gradient(90deg,#4aa3d8,#7fd0ff)'; $('coolTemp').textContent='Cold ❄️';
    Audio.good(); fb.style.color='var(--green-dk)'; fb.textContent=g.success; run.remove(); lessonSolved();
  };
  row.appendChild(run); host.appendChild(row);
  redraw();
}

// MATCH: click a left item then a right target; supports many-left-to-one-target
function renderMatch(host,g){
  let active=null; const paired={}; // leftIndex -> rightIndex
  const wrap=el('div','match-wrap'); const cols=el('div','match-cols');
  const leftCol=el('div','match-col'); leftCol.appendChild(el('h4',null,'Items'));
  const rightCol=el('div','match-col'); rightCol.appendChild(el('h4',null,'Destinations'));
  const fb=el('div','quiz-feedback');
  const leftBtns=[], rightBtns=[];
  g.left.forEach((L,li)=>{
    const b=el('button','match-item',`<span class="ic">${L.ic||'•'}</span><span>${L.t}</span>`);
    b.onclick=()=>{ if(b.classList.contains('paired'))return; leftBtns.forEach(x=>x.classList.remove('active')); active=li; b.classList.add('active'); Audio.click(); };
    leftBtns.push(b); leftCol.appendChild(b);
  });
  g.right.forEach((R,ri)=>{
    const b=el('button','match-item target',`<span>${R.t}</span>`);
    b.onclick=()=>{
      if(active===null){ fb.style.color='#777'; fb.textContent='Pick an item on the left first.'; return; }
      const L=g.left[active];
      if(L.id===R.id){
        paired[active]=ri; leftBtns[active].classList.add('paired'); leftBtns[active].classList.remove('active');
        Audio.pop(); active=null;
        if(Object.keys(paired).length===g.left.length){ fb.style.color='var(--green-dk)'; fb.textContent=g.success; row.remove(); lessonSolved(); }
      } else { Audio.bad(); b.classList.add('bad'); fb.style.color='#c62828'; fb.textContent='That one goes somewhere else — try again.'; setTimeout(()=>b.classList.remove('bad'),600); }
    };
    rightBtns.push(b); rightCol.appendChild(b);
  });
  cols.append(leftCol,rightCol); wrap.appendChild(cols); host.appendChild(wrap); host.appendChild(fb);
  const row=el('div','btnrow'); host.appendChild(row); // (kept for layout; success removes nothing else)
}

// BRANCH: choose a product, watch a simple animated path
function renderBranch(host,g){
  const tabs=el('div','branch-tabs'); const path=el('div','branch-path'); const seen=new Set();
  const fb=el('div','quiz-feedback');
  function show(pi){
    const p=g.products[pi]; seen.add(pi);
    [...tabs.children].forEach((t,i)=>t.classList.toggle('on',i===pi));
    path.innerHTML='';
    p.steps.forEach((s,i)=>{
      const step=el('div','branch-step',s); step.style.animationDelay=(i*0.18)+'s'; path.appendChild(step);
      if(i<p.steps.length-1){ const a=el('span','branch-arrow','→'); path.appendChild(a); }
    });
    Audio.pop();
    if(seen.size>=1){ done.disabled=false; }
    if(seen.size>=2 && !solved){ solved=true; fb.style.color='var(--green-dk)'; fb.textContent=g.success; }
  }
  g.products.forEach((p,i)=>{ const b=el('button',null,`${p.ic} ${p.name}`); b.onclick=()=>show(i); tabs.appendChild(b); });
  host.appendChild(tabs); host.appendChild(path);
  host.appendChild(el('p',null,'<span style="font-size:13px;color:#777;">Tip: explore at least two products to see how paths differ.</span>'));
  host.appendChild(fb);
  let solved=false;
  const row=el('div','btnrow'); const done=el('button','btn btn-primary','Finish lesson'); done.disabled=true;
  done.onclick=()=>{ if(!solved){ solved=true; fb.style.color='var(--green-dk)'; fb.textContent=g.success; } row.remove(); lessonSolved(); };
  row.appendChild(done); host.appendChild(row);
  show(0);
}

// SEAL SPOTTER: multi-select packages showing the (unaltered) seal
function renderSeal(host,g){
  const sel=new Set(); const grid=el('div','pkg-grid'); const fb=el('div','quiz-feedback');
  g.packages.forEach((p,i)=>{
    const c=el('div','pkg');
    c.setAttribute('role','button'); c.setAttribute('tabindex','0'); c.setAttribute('aria-pressed','false');
    c.innerHTML = `<div class="art">${p.ic}</div><div class="nm">${p.name}</div>
      <div class="sealbox">${p.seal?`<img src="${BRAND_ASSETS.seal}" alt="Real California Milk seal">`:'<span style="font-size:11px;color:#bbb;">no seal</span>'}</div>`;
    const toggle=()=>{ if(c.getAttribute('aria-disabled')==='true')return;
      if(sel.has(i)){sel.delete(i);c.classList.remove('sel');c.setAttribute('aria-pressed','false');}
      else{sel.add(i);c.classList.add('sel');c.setAttribute('aria-pressed','true');Audio.click();}
      check.disabled=sel.size===0; };
    c.onclick=toggle; c.onkeydown=e=>{ if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle();} };
    grid.appendChild(c);
  });
  host.appendChild(grid); host.appendChild(fb);
  const row=el('div','btnrow'); const check=el('button','btn btn-primary','Check my picks'); check.disabled=true;
  check.onclick=()=>{
    const cards=[...grid.children]; let ok=true;
    cards.forEach((c,i)=>{ const want=g.packages[i].seal, got=sel.has(i);
      if(got&&want)c.classList.add('correct');
      if(got&&!want){c.classList.add('bad');ok=false;}
      if(!got&&want){c.classList.add('bad');ok=false;}
    });
    if(ok){ fb.style.color='var(--green-dk)'; fb.textContent=g.success; cards.forEach(c=>c.setAttribute('aria-disabled','true')); row.remove(); lessonSolved(); }
    else { Audio.bad(); fb.style.color='#c62828'; fb.textContent='Not quite — pick only the packages showing the seal.'; setTimeout(()=>cards.forEach(c=>c.classList.remove('bad','correct')),1000); }
  };
  row.appendChild(check); host.appendChild(row);
}

/* ============================================================================
   6. QUIZZES  (3 questions from the completed lessons)
============================================================================ */
export function startQuiz(locId){
  const loc=LOC_BY_ID[locId];
  // only quiz over lessons the player finished
  const pool = loc.quiz.filter(q=>Progress.isLessonDone(locId,q.from));
  const questions = pool.length ? pool : loc.quiz;
  Audio.click();
  Analytics.track('quiz_started',{location:locId});
  let idx=0, correctCount=0;
  openModal(`🧠 ${loc.badge.name} Quiz`, loc.stage, body=>{ renderQ(body); });

  function renderQ(body){
    const q=questions[idx]; let attempts=0;
    body.innerHTML='';
    const dots=el('div','progress-dots');
    questions.forEach((_,i)=>{ const s=el('span'); if(i<idx)s.classList.add('done'); if(i===idx)s.classList.add('on'); dots.appendChild(s); });
    body.appendChild(dots);
    body.appendChild(el('div','quiz-q',`${idx+1}. ${q.q}`));
    const opts=el('div'); body.appendChild(opts);
    const fb=el('div','quiz-feedback'); body.appendChild(fb);
    q.a.forEach((opt,i)=>{
      const b=el('button','quiz-opt',opt);
      b.onclick=()=>{
        if(i===q.correct){
          b.classList.add('right');
          const first=attempts===0, pts=first?SCORING.quizFirst:SCORING.quizLater;
          const awarded=Progress.addQuizPoints(locId,idx,pts,first);
          if(first)correctCount++;
          Analytics.track('quiz_answered',{location:locId,question:idx,correct:true,firstTry:first});
          Audio.good();
          fireConfetti();
          fb.style.color='var(--green-dk)';
          fb.textContent=awarded?`Correct! +${pts} points`:'Correct! Review complete.';
          [...opts.children].forEach(o=>o.disabled=true);
          if(q.source){
            const src=el('div','quiz-source',`Source: <a href="${q.source.url}" target="_blank" rel="noopener">${q.source.label}</a>`);
            body.appendChild(src);
          }
          const nextRow=el('div','btnrow');
          const nextBtn=el('button','btn btn-primary', idx<questions.length-1 ? 'Next question' : 'See results');
          nextBtn.onclick=()=>{ idx++; if(idx<questions.length) renderQ(body); else finish(); };
          nextRow.appendChild(nextBtn); body.appendChild(nextRow);
        } else {
          attempts++; b.classList.add('wrong'); b.disabled=true; Audio.bad();
          Analytics.track('quiz_answered',{location:locId,question:idx,correct:false});
          fb.style.color='#c62828'; fb.textContent='Not quite — try again.';
        }
      };
      opts.appendChild(b);
    });
  }
  function finish(){
    const isNew=Progress.completeLocation(locId);
    Audio.fanfare();
    const body=$('modalBody'); body.innerHTML='';
    body.appendChild(el('div',null,`<div style="text-align:center;font-size:52px;">${loc.badge.emoji}</div>`));
    body.appendChild(el('h2',null,`<span style="color:var(--green-dk)">Badge earned: ${loc.badge.name}!</span>`));
    body.querySelector('h2').style.textAlign='center';
    body.appendChild(el('p',null,`<div style="text-align:center;">You answered <b>${correctCount}/${questions.length}</b> on the first try.</div>`));
    body.appendChild(el('p',null,`<div style="text-align:center;color:#555;">${loc.completeMsg}</div>`));
    if(loc.funFacts && loc.funFacts.length){
      const factsWrap=el('div','fact-wrap');
      factsWrap.appendChild(el('div','fact-heading','🔎 Did you know?'));
      loc.funFacts.forEach(f=>{
        const card=el('div','fact-card');
        card.appendChild(el('div','fact-text',f.text));
        card.appendChild(el('div','quiz-source',`Source: <a href="${f.source.url}" target="_blank" rel="noopener">${f.source.label}</a>`));
        factsWrap.appendChild(card);
      });
      body.appendChild(factsWrap);
    }
    const row=el('div','btnrow'); row.style.justifyContent='center';
    const cont=el('button','btn btn-primary','Continue to the map 🗺️');
    cont.onclick=()=>{ closeModal(); navigate(GAME_STATES.MAP,{justCompleted:locId}); };
    row.appendChild(cont); body.appendChild(row);
    if(isNew) toast(`+${SCORING.location} ⭐ Location complete!`);
  }
}
