// Reused by every destination. createModelSession ignores unshipped manifest
// entries, so planned assets do not cause requests for nonexistent files.
export function placeDestinationAssets(models, scene, location, addObstacle) {
  const placements = {
    farm: [
      ['dairy-barn',[-14,0,-2],15,0,'dairy-barn'],
      ['milk-tanker',[16,0,4],7.5,-.4,'milk-tanker'],
      ['hay-bale',[-21,0,2],1.2,0],
      ['hay-bale',[-21,0,3.4],1.2,.15],
      ['hay-bale',[-21,.75,2.7],1.2,-.1],
      ['milk-tank',[8,0,2],3.8,0]
    ],
    processor: [
      ['milk-tanker',[-16,0,6],7.5,.5,'milk-tanker'],
      ['milk-tank',[-17,0,-5],3.8,0],
      ['milk-tank',[-21,0,-5],3.8,0]
    ],
    market: [
      ['dairy-display',[0,1.05,3],.95,0]
    ]
  };
  const promises = (placements[location] || []).map(([id,position,size,rotation,fallback])=>models.place(id,{
    position,size,rotation,fallback:fallback?scene.getObjectByName(`placeholder:${fallback}`):null,
    onReady:()=>{
      // Existing replacements retain the original obstacle. Small tabletop
      // items and bales stacked above the ground need no extra collider.
      if(!fallback && position[1]===0) addObstacle(position[0],position[2],id==='milk-tank'?1.2:.65);
    }
  }));
  for(const [x,z,size] of [[-27,-16,10],[28,-13,12],[-25,17,9],[26,17,10]]){
    promises.push(models.place('valley-oak',{position:[x,0,z],size,rotation:x*.1}));
  }
  return Promise.allSettled(promises);
}
