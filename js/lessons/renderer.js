import { BRAND_ASSETS, GAME_STATES, LOC_BY_ID, SCORING } from '../config/content.js';
import { Analytics, Progress } from '../core/progress.js';
import { Audio } from '../core/audio.js';
import { $, el, toast, caption } from '../ui/dom.js';
import { LEARNING_EXPERIENCES } from '../config/learning-experience.js';
import { learningLayout, feedbackRegion, shuffled } from './presentation.js';
import { renderMilkRoute } from './milk-route.js';

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
  if(!loc || !Progress.isUnlocked(locId)) return;
  const lesson = loc.lessons.find(l=>l.id===lessonId);
  if(!lesson) return;
  currentLesson = { loc, lesson, solved: false };
  Audio.click();
  Analytics.track('lesson_started',{location:locId,lesson:lessonId});
  caption(lesson.intro);
  openModal(`${lesson.icon} ${lesson.title}`, loc.stage, body=>{
    const experience=LEARNING_EXPERIENCES[lesson.id];
    const workbench=learningLayout(body,experience,{step:`ACTIVITY ${loc.lessons.indexOf(lesson)+1} OF ${loc.lessons.length}`});
    const context=el('details','lesson-context');
    context.append(el('summary',null,'Read the field notes'),el('p',null,lesson.intro));
    workbench.appendChild(context);
    const gameHost = el('div','game-host'); workbench.appendChild(gameHost);
    renderGame(gameHost, lesson);
  });
}

function lessonSolved(){
  if(currentLesson.solved) return;
  currentLesson.solved=true;
  const {loc,lesson} = currentLesson;
  const isNew = Progress.completeLesson(loc.id, lesson.id);
  Audio.good();
  fireConfetti();
  if (isNew) toast(`+${SCORING.lesson} ⭐ Lesson complete!`);
  const body=$('modalBody').querySelector('.learning-workbench');
  const insight=el('div','learning-takeaway',`<span class="eyebrow">FIELD NOTE UNLOCKED</span><p>${LEARNING_EXPERIENCES[lesson.id].takeaway}</p>`);
  insight.setAttribute('role','status');body.appendChild(insight);
  const done=el('div','btnrow activity-actions');
  const more=el('button','btn btn-primary','Back to '+loc.title.toLowerCase().replace(/^where /,'')+' ✔');
  more.textContent = 'Continue';
  more.onclick = ()=>{ closeModal(); caption(''); afterLessonReturn(loc.id); };
  done.appendChild(more);
  body.appendChild(done);
  more.focus({preventScroll:true});
  more.scrollIntoView({block:'nearest',behavior:'instant'});
}

// hook the world can override to refresh station visuals after a lesson
let afterLessonReturn = () => {};
export function setAfterLessonReturn(callback) { afterLessonReturn = callback; }

function renderGame(host, lesson){
  const g = lesson.game;
  host.appendChild(el('div','mg-instructions', g.prompt));
  if (g.type==='multiselect') return renderMultiSelect(host,g);
  if (g.type==='sequence')    return renderMilkRoute(host,g,lessonSolved);
  if (g.type==='match')       return renderMatch(host,g);
  if (g.type==='branch')      return renderBranch(host,g);
  if (g.type==='seal')        return renderSeal(host,g);
}

// MULTISELECT: choose the correct subset, then confirm
function renderMultiSelect(host,g){
  const sel=new Set();
  const count=el('p','activity-counter',`Choose ${g.need} · 0 selected`);host.appendChild(count);
  const grid=el('div','chip-grid');
  const buttons=new Map();
  shuffled(g.options.map((o,i)=>({o,i}))).forEach(({o,i})=>{
    const b=el('button','pick',`<span class="ic">${o.ic}</span><span>${o.t}</span>`);
    b.setAttribute('aria-pressed','false');
    b.onclick=()=>{
      if(b.getAttribute('aria-disabled')==='true') return;
      b.classList.remove('bad','correct');
      if(sel.has(i)){ sel.delete(i); b.classList.remove('sel'); b.setAttribute('aria-pressed','false'); }
      else { sel.add(i); b.classList.add('sel'); b.setAttribute('aria-pressed','true'); Audio.click(); }
      check.disabled = sel.size!==g.need;
      count.textContent=`Choose ${g.need} · ${sel.size} selected`;
    };
    buttons.set(i,b);
    grid.appendChild(b);
  });
  host.appendChild(grid);
  const fb=feedbackRegion(host);
  const row=el('div','btnrow');
  const check=el('button','btn btn-primary',`Check (${g.need} needed)`); check.disabled=true;
  check.onclick=()=>{
    const btns=g.options.map((_,i)=>buttons.get(i)); let allOk=true;
    btns.forEach((b,i)=>{
      if(sel.has(i)){ if(g.options[i].ok){b.classList.add('correct');} else {b.classList.add('bad'); allOk=false;} }
    });
    if(allOk){ fb.style.color='var(--green-dk)'; fb.textContent=g.success; btns.forEach(b=>b.setAttribute('aria-disabled','true')); row.remove(); lessonSolved(); }
    else { Audio.bad(); fb.dataset.state='retry'; fb.textContent='Not quite—rethink the highlighted choices. '+LEARNING_EXPERIENCES[currentLesson.lesson.id].takeaway+' Change your choices and check again.'; }
  };
  row.appendChild(check); host.appendChild(row);
}

// MATCH: click a left item then a right target; supports many-left-to-one-target
function renderMatch(host,g){
  let active=null; const paired={}; // leftIndex -> rightIndex
  const wrap=el('div','match-wrap'); const cols=el('div','match-cols');
  const leftCol=el('div','match-col'); leftCol.appendChild(el('h4',null,'Items'));
  const rightCol=el('div','match-col'); rightCol.appendChild(el('h4',null,'Destinations'));
  const fb=el('div','quiz-feedback');fb.setAttribute('role','status');
  const counter=el('p','activity-counter',`0 of ${g.left.length} deliveries routed`);host.appendChild(counter);
  const leftBtns=[], rightBtns=[];
  g.left.forEach((L,li)=>{
    const b=el('button','match-item',`<span class="ic">${L.ic||'•'}</span><span>${L.t}</span>`);
    b.onclick=()=>{ if(b.classList.contains('paired'))return; leftBtns.forEach(x=>x.classList.remove('active')); active=li; b.classList.add('active'); Audio.click(); };
    leftBtns.push(b); leftCol.appendChild(b);
  });
  shuffled(g.right.map((R,ri)=>({R,ri}))).forEach(({R,ri})=>{
    const b=el('button','match-item target',`<span>${R.t}</span>`);
    b.onclick=()=>{
      if(active===null){ fb.style.color='#777'; fb.textContent='Pick an item on the left first.'; return; }
      const L=g.left[active];
      if(L.id===R.id){
        paired[active]=ri; leftBtns[active].classList.add('paired'); leftBtns[active].classList.remove('active');
        leftBtns[active].disabled=true;
        leftBtns[active].appendChild(el('small','matched-destination','✓ '+R.t));
        counter.textContent=`${Object.keys(paired).length} of ${g.left.length} deliveries routed`;
        fb.dataset.state='success';fb.textContent=`${L.t} → ${R.t}. Delivery routed.`;
        Audio.pop(); active=null;
        if(Object.keys(paired).length===g.left.length){ fb.style.color='var(--green-dk)'; fb.textContent=g.success; row.remove(); lessonSolved(); }
      } else { Audio.bad(); b.classList.add('bad'); fb.dataset.state='retry'; fb.textContent=`Not quite. Think about what ${L.t.toLowerCase()} will be used for. Choose another destination.`; setTimeout(()=>b.classList.remove('bad'),600); }
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
  const counter=el('p','activity-counter','0 of 2 product paths explored');host.appendChild(counter);
  function show(pi){
    const p=g.products[pi]; seen.add(pi);
    counter.textContent=`${seen.size} of ${g.products.length} product paths explored · compare at least 2`;
    [...tabs.children].forEach((t,i)=>{t.classList.toggle('on',i===pi);t.setAttribute('aria-pressed',i===pi?'true':'false');});
    path.innerHTML='';
    p.steps.forEach((s,i)=>{
      const step=el('div','branch-step',s); step.style.animationDelay=(i*0.18)+'s'; path.appendChild(step);
      if(i<p.steps.length-1){ const a=el('span','branch-arrow','→'); path.appendChild(a); }
    });
    Audio.pop();
    if(seen.size>=Math.min(2,g.products.length)){ done.disabled=false; }
    if(seen.size>=2 && !solved){ solved=true; fb.style.color='var(--green-dk)'; fb.textContent='Compare the paths: cheese forms curds, butter uses churning, and ice cream is frozen with air. These are simplified overviews, not production instructions.'; }
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
  fb.setAttribute('role','status');
  const counter=el('p','activity-counter','0 packages selected');host.appendChild(counter);
  g.packages.forEach((p,i)=>{
    const c=el('button','pkg');
    c.setAttribute('aria-pressed','false');
    c.innerHTML = `<div class="art">${p.ic}</div><div class="nm">${p.name}</div>
      <div class="sealbox">${p.seal?`<img src="${BRAND_ASSETS.logo}" alt="Real California Milk seal">`:'<span class="plain-package-label">DAIRY<br>PRODUCT</span>'}</div><span class="package-check" aria-hidden="true">✓</span>`;
    const toggle=()=>{ if(c.getAttribute('aria-disabled')==='true')return;
      if(sel.has(i)){sel.delete(i);c.classList.remove('sel');c.setAttribute('aria-pressed','false');}
      else{sel.add(i);c.classList.add('sel');c.setAttribute('aria-pressed','true');Audio.click();}
      check.disabled=sel.size===0; counter.textContent=`${sel.size} packages selected`; };
    c.onclick=toggle;
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
  if(!loc || !Progress.isUnlocked(locId) || Progress.locationLessonsDone(locId)<loc.lessons.length){ toast('Finish this destination’s lessons to unlock the quiz.'); return; }
  const questions=loc.quiz;
  Audio.click(); Analytics.track('quiz_started',{location:locId});
  let idx=0, correctCount=0;
  openModal('Field check · '+loc.badge.name, loc.stage, renderQ);

  function renderQ(body){
    const question=questions[idx], experience=LEARNING_EXPERIENCES[question.from];
    let attempts=0, answered=false;
    const workbench=learningLayout(body,experience,{quiz:true,question:question.q,step:'QUESTION '+(idx+1)+' OF '+questions.length});
    const dots=el('div','progress-dots'); dots.setAttribute('aria-hidden','true');
    questions.forEach((_,i)=>{ const dot=el('span',i<idx?'done':i===idx?'on':'');dots.append(dot); });
    workbench.prepend(dots);
    const options=el('div','quiz-options'); workbench.append(options);
    const feedback=feedbackRegion(workbench);
    const entries=shuffled(question.a.map((text,index)=>({text,index})));
    entries.forEach(({text,index},position)=>{
      const button=el('button','quiz-opt'); button.dataset.answerIndex=index;
      button.innerHTML='<span class="answer-letter" aria-hidden="true">'+String.fromCharCode(65+position)+'</span><span>'+text+'</span><span class="answer-state" aria-hidden="true"></span>';
      button.onclick=()=>{
        if(answered) return;
        const correct=index===question.correct;
        Analytics.track('quiz_answered',{location:locId,question:idx,correct,firstTry:attempts===0});
        if(!correct){
          attempts++; button.classList.add('wrong');button.disabled=true;
          button.querySelector('.answer-state').textContent='×';
          feedback.dataset.state='retry';feedback.textContent='Not quite. '+experience.feedback[index]+' Try another answer.';
          Audio.bad(); return;
        }
        answered=true;
        const first=attempts===0, points=first?SCORING.quizFirst:SCORING.quizLater;
        const awarded=Progress.addQuizPoints(locId,idx,points,first);
        if(first) correctCount++;
        button.classList.add('right');button.querySelector('.answer-state').textContent='✓';
        [...options.children].forEach(option=>option.disabled=true);
        feedback.dataset.state='success';
        feedback.textContent=(awarded?'Correct! +'+points+' points. ':'Correct! Review complete. ')+experience.feedback[index];
        Audio.good();
        if(question.source){
          const source=el('details','lesson-source');source.appendChild(el('summary',null,'Explore the source'));
          const link=el('a',null,question.source.label);link.href=question.source.url;link.target='_blank';link.rel='noopener';source.append(link);workbench.append(source);
        }
        const row=el('div','btnrow activity-actions');
        const next=el('button','btn btn-primary',idx<questions.length-1?'Next question':'See results');
        next.onclick=()=>{ idx++; if(idx<questions.length){renderQ(body);$('modalCard').scrollTop=0;body.querySelector('.quiz-opt')?.focus({preventScroll:true});}else finish(body); };
        row.append(next);workbench.append(row);
        next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',behavior:'instant'});
      };
      options.append(button);
    });
  }
  function finish(body){
    const isNew=Progress.completeLocation(locId);
    body.replaceChildren();Audio.fanfare();
    const summary=el('section','quiz-results');
    summary.innerHTML='<p class="eyebrow">CHAPTER COMPLETE</p><div class="result-badge" aria-hidden="true">'+loc.badge.emoji+'</div><h2>Badge earned: '+loc.badge.name+'!</h2><p>'+correctCount+' of '+questions.length+' answers right on the first try.</p>';
    summary.appendChild(el('h3',null,'Your field notes'));
    const notes=el('ul','result-notes');loc.lessons.forEach(lesson=>notes.appendChild(el('li',null,LEARNING_EXPERIENCES[lesson.id].takeaway)));summary.append(notes);
    summary.appendChild(el('p',null,loc.completeMsg));
    const row=el('div','btnrow activity-actions'), next=el('button','btn btn-primary','Continue to the map 🗺️');
    next.onclick=()=>{closeModal();navigate(GAME_STATES.MAP,{justCompleted:locId});};
    row.append(next);summary.append(row);body.append(summary);$('modalCard').scrollTop=0;
    next.focus({preventScroll:true});
    if(isNew) toast('+'+SCORING.location+' ⭐ Location complete!');
  }
}
