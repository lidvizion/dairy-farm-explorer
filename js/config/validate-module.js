// Content errors fail before navigation, rather than producing an unrelated scene.
export function validateModule(pack) {
  const fail=message=>{throw new Error(`Invalid module: ${message}`);};
  if(!pack.id || !pack.storageKey || !pack.leaderboardKey)fail('id and separate storage keys are required');
  if(!Array.isArray(pack.LOCATIONS) || !pack.LOCATIONS.length)fail('at least one destination is required');
  const ids=new Set(),routes=new Set(['loading','earthIntro','californiaMap','completion','fallback']),stateKeys=new Set(['LOADING','EARTH_INTRO','MAP','COMPLETION','FALLBACK']);
  const kinds=new Set(['building','shelter','fence','sign','tree','platform','box']);
  const position=p=>Array.isArray(p) && p.length===2 && p.every(Number.isFinite);
  for(const [index,loc] of pack.LOCATIONS.entries()) {
    if(!/^[a-z][a-z0-9-]*$/.test(loc.id) || ids.has(loc.id) || stateKeys.has(loc.id.toUpperCase()))fail('duplicate or invalid destination ID');
    ids.add(loc.id);stateKeys.add(loc.id.toUpperCase());
    const route=loc.route || `${loc.id}Scene`;
    if(routes.has(route))fail('duplicate or reserved route');routes.add(route);
    if(loc.order!==index+1)fail(`${loc.id}: order must match pack order`);
    if(!loc.badge?.name || !loc.card?.title || !loc.card?.image)fail(`${loc.id}: badge and map card required`);
    if(!loc.lessons?.length || loc.stationPos?.length!==loc.lessons.length || !loc.stationPos.every(position) || !position(loc.quizPos))fail(`${loc.id}: one valid station position per lesson and a quiz position required`);
    if(!(loc.drops || []).every(position))fail(`${loc.id}: invalid drop positions`);
    if(loc.spawn && (!['x','z','yaw'].every(key=>Number.isFinite(loc.spawn[key])) || Math.abs(loc.spawn.x)>23 || loc.spawn.z < -25 || loc.spawn.z > 40))fail(`${loc.id}: invalid spawn`);
    const env=loc.environment;
    if(!['farmyard','facility','storefronts','kit'].includes(env?.template))fail(`${loc.id}: unsupported environment template`);
    for(const spec of [...env.buildings || [],...env.props || []]) {
      if(!kinds.has(spec.kind))fail(`${loc.id}: unknown scene piece`);
      if(spec.kind==='shelter' && !spec.roof)fail(`${loc.id}: shelter needs roof configuration`);
      if(spec.kind==='fence' && (!Number.isInteger(spec.segments) || spec.segments<1))fail(`${loc.id}: fence needs segments`);
      if(spec.size && (spec.size.length!==3 || !spec.size.every(n=>Number.isFinite(n)&&n>0)))fail(`${loc.id}: invalid piece size`);
    }
    const items=new Set();
    for(const q of loc.quiz) {
      if(typeof q.id!=='string' || !q.id || items.has(q.id))fail(`${loc.id}: unique stable quiz item IDs required`);items.add(q.id);
      if(!['quiz','fact'].includes(q.mode))fail(`${loc.id}: item mode must be quiz or fact`);
      if(q.mode==='fact' && !q.fact)fail(`${loc.id}: fact text required`);
    }
    for(const q of loc.quiz)if(q.mode==='fact' && q.attachedTo && (!loc.quiz.some(target=>target.id===q.attachedTo) || q.attachedTo===q.id))fail(`${loc.id}: attached fact needs another item as its target`);
    if(loc.lab) {
      const lab=loc.lab;
      if(!['comfort','line','delivery','steps'].includes(lab.model) || !['toggle','sequence'].includes(lab.rule))fail(`${loc.id}: unsupported demonstration`);
      if(!lab.actions?.length || lab.actions.length>12 || lab.notes?.length!==lab.actions.length)fail(`${loc.id}: demonstration needs 1-12 actions with notes`);
      if(!loc.lessons.some(l=>l.id===lab.lesson))fail(`${loc.id}: demonstration lesson missing`);
      if(lab.model==='comfort' && lab.rule!=='toggle' || ['line','delivery'].includes(lab.model) && lab.rule!=='sequence')fail(`${loc.id}: specialized model rule mismatch`);
      if(lab.model!=='steps' && lab.labels?.length!==3 && lab.model!=='comfort' || lab.model==='comfort' && !lab.labels?.[0])fail(`${loc.id}: model labels missing`);
      if(['comfort','line'].includes(lab.model) && lab.actions.length!==3 || lab.model==='delivery' && lab.actions.length!==2)fail(`${loc.id}: specialized model action count mismatch`);
    }
  }
  for(const key of ['lesson','quizFirst','quizLater','collectible','location'])if(!Number.isSafeInteger(pack.SCORING?.[key]) || pack.SCORING[key]<0)fail('invalid scoring');
  return pack;
}
