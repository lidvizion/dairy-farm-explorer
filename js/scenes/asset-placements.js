// Reused by every destination. createModelSession ignores unshipped manifest
// entries, so planned assets do not cause requests for nonexistent files.
// Each row: [id, position, size (m), rotation, placeholders to hide, collider radius].
// Placeholders are the primitive groups in location-environments.js; they stay
// visible until the model arrives, so a failed download keeps the old scene.
const PLACEMENTS = {
  farm: [
    ['dairy-barn',[-14,0,-2],15,0,'dairy-barn'],
    ['milk-tanker',[16,0,4],7.5,-.4,'milk-tanker'],
    ['milk-house',[17,0,-3],6,0,'milk-house'],
    ['milk-tank',[21.6,0,-3.2],3.8,0,null,1.2],
    ['feed-bunk',[-14,0,4],6,0,'feed-bunk'],
    ['water-trough',[-14,0,6.2],3.5,0,'water-trough'],
    ['solar-array',[-19.3,0,8],8,0,'solar-array'],
    ['biogas-digester',[-22,0,-8],4.5,0,'biogas-digester'],
    ['hay-bale',[-21,0,2],1.2,0,null,.65],
    ['hay-bale',[-21,0,3.4],1.2,.15,null,.65],
    ['hay-bale',[-21,.75,2.7],1.2,-.1]
  ],
  processor: [
    ['processing-plant',[0,0,-6],24,0,['processing-plant','processing-plant-facade']],
    ['milk-tanker',[-16,0,6],7.5,.5,'milk-tanker'],
    ['milk-tank',[-17,0,-5],3.8,0,null,1.2],
    ['milk-tank',[-21,0,-5],3.8,0,null,1.2],
    ['cheese-line',[12.5,0,3.4],5,0,null,1.4],
    ['pallet-boxes',[15.6,0,7.4],1.6,0,null,.9],
    ['pallet-boxes',[15.6,0,9.4],1.6,.2,null,.9]
  ],
  market: [
    ['grocery-storefront',[-12,0,-6],12,-Math.PI/2,['grocery-storefront','grocery-storefront-facade']],
    ['restaurant-storefront',[12,0,-5.6],12,0,['restaurant-storefront','restaurant-storefront-facade']],
    ['bistro-set',[-2,0,3],2.6,0,'bistro-set'],
    ['dairy-display',[-2,.76,3],.7,0],
    ['produce-crate',[-16,0,.9],1.2,0,null,.7],
    ['dairy-case',[-4.4,0,-1.2],3,0,null,1.2],
    ['chef',[9,0,2],1.8,0,'chef',.4],
    ['walk-in-cooler',[0,0,-12],6,0,'walk-in-cooler']
  ]
};

export function placeDestinationAssets(models, scene, location, addObstacle) {
  const promises = (PLACEMENTS[location] || []).map(([id,position,size,rotation,hide,radius])=>models.place(id,{
    position,size,rotation,
    fallback:[].concat(hide||[]).map(name=>scene.getObjectByName(`placeholder:${name}`)),
    // Replacements keep the original obstacle; new ground props add their own.
    onReady:()=>{ if(radius) addObstacle(position[0],position[2],radius); }
  }));
  // The distant instanced tree ring stays procedural: decimated far enough
  // for 36 copies, the Meshy oak loses its canopy and reads worse.
  for(const [x,z,size] of [[-27,-16,10],[28,-13,12],[-25,17,9],[26,17,10]]){
    promises.push(models.place('valley-oak',{position:[x,0,z],size,rotation:x*.1}));
  }
  return Promise.allSettled(promises);
}
