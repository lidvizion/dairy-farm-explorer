import { readPreference, writePreference } from '../core/preferences.js';

// Learn by doing. Optional, non-blocking guidance; no modal before first play.
export function createTrailGuide(player, touch) {
  let phase = readPreference('rcm_trail_guide', '') === 'done' ? 3 : 0;
  const start = {x:player.x,z:player.z,yaw:player.yaw};
  const finish=()=>{if(phase===3)return;phase=3;writePreference('rcm_trail_guide','done');};
  document.addEventListener('rcm:modalopen',finish);
  return {get hint(){return [
    touch ? '01 / Move your thumb on the MOVE stick. Or choose Start next lesson.' : '01 / Try W A S D or the arrow keys to move. Or choose Start next lesson.',
    touch ? '02 / You’re moving! Try the LOOK stick to look around.' : '02 / You’re moving! Drag the world to look around.',
    '03 / Follow a numbered sign. Get close to open it, or choose Start next lesson.'
  ][phase] || '';},update(){
    if(phase===0 && Math.hypot(player.x-start.x,player.z-start.z)>1.2){phase=1;start.yaw=player.yaw;}
    if(phase===1 && Math.abs(player.yaw-start.yaw)>.25)phase=2;
  },dispose(){document.removeEventListener('rcm:modalopen',finish);}};
}
