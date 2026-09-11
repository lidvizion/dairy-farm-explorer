// Small native geometry vocabulary. Immutable pieces join existing scenery batching.
export function createSceneKit(THREE, B) {
  function piece(spec) {
    const g=new THREE.Group(), color=spec.color ?? 0xd7dece;
    const [w,h,d]=spec.size || [6,4,5];
    const addBox=(size,position,c=color)=>g.add(B.box(...size,B.lamb(c),...position));
    switch(spec.kind) {
      case 'building':
        addBox([w,h,d],[0,h/2,0]);
        if(spec.roof) addBox(spec.roof.size || [w+.4,.3,d+.4],spec.roof.position || [0,h+.15,0],spec.roof.color);
        break;
      case 'shelter': {
        for(const x of spec.postsX || [-w/2,w/2]) for(const z of spec.postsZ || [-d/2,d/2])
          g.add(B.cyl(spec.postRadius || .18,spec.postBottomRadius || .2,h,B.lamb(spec.postColor ?? color),x,h/2,z,8));
        const roof=B.box(...(spec.roof.size || [w+.8,.3,d+.8]),B.lamb(spec.roof.color),...(spec.roof.position || [0,h,0]));
        roof.rotation.x=spec.roof.tilt || 0;g.add(roof);break;
      }
      case 'fence':
        for(let i=0;i<=spec.segments;i++)addBox([.15,h,.15],[-w/2+i*w/spec.segments,h/2,0]);
        for(const y of [h*.37,h*.78])addBox([w,.12,.1],[0,y,0]);
        break;
      case 'sign': {const sign=B.labelSprite(spec.text,spec.scale || 1);sign.userData.environmentLabel=true;g.add(sign);break;}
      case 'tree':
        g.add(B.cyl(.18,.28,h,B.lamb(0x71604a),0,h/2,0,7));
        g.add(B.ball(w/2,B.lamb(color),0,h,0));break;
      case 'platform':
        g.add(B.cyl(spec.radius || 5.3,spec.baseRadius || 5.6,.35,B.lamb(color),0,.225,0,48));
        g.add(B.cyl(spec.baseRadius || 5.6,spec.baseRadius || 5.6,.12,B.lamb(spec.edgeColor ?? 0x326c51),0,.06,0,48));break;
      case 'box': addBox([w,h,d],[0,h/2,0]);break;
      default: throw new Error(`Unknown scene piece: ${spec.kind}`);
    }
    g.position.set(...(spec.position || [0,0,0]));g.rotation.y=spec.rotation || 0;
    return g;
  }
  function add(scene,specs,addObst=()=>{}) {
    for(const spec of specs || []) {const object=piece(spec);scene.add(object);
      if(spec.obstacle)addObst(object.position.x,object.position.z,spec.obstacle);
    }
  }
  return {piece,add};
}
