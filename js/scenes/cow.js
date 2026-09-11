import { BODY_VERTICES, BODY_FACES, HEAD_VERTICES, HEAD_FACES, TAIL_VERTICES, TAIL_FACES } from './cow-mesh.js';

// Three authored rigid surfaces preserve the existing factory and idle rig.
export function makeCow(THREE, scale = 1, spotted = true, options = {}) {
  const { seed = 0, headDip = 0, headTurn = 0 } = options;
  const jersey = !spotted, group = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
  const palette = (jersey ? [0xb88449,0xb88449,0xb88449,0x946537,0x292d2b,0xbd9475,0x49403a]
    : [0xf3eee0,0x292d2b,0x292d2b,0x292d2b,0x292d2b,0xd2a59c,0xd2a59c]).map(c=>new THREE.Color(c));
  function surface(name, vertices, faces, pivot, mirrored) {
    const positions=[],colors=[];
    for(const side of mirrored ? [1,-1] : [1]) for(const [indices,region] of faces) {
      let tint=region;
      if(name==='cow-body' && !jersey) {
        if(region===2 && (seed+Number(side<0))%3===0)tint=0;
        if(region===1 && (seed+Number(side<0))%4===1)tint=0;
      }
      const polygon=side===1 ? indices : [...indices].reverse();
      for(let i=1;i<polygon.length-1;i++) for(const index of [polygon[0],polygon[i],polygon[i+1]]) {
        let [x,y,z]=vertices[index];
        if(name==='cow-body') {
          x*=1+Math.sin(seed*2.1)*.025;
          z*=1+Math.cos(seed*1.7)*.025;
          if(side<0 && index>=35 && index<=66)x+=.045*(1-y/1.05);
        }
        if(jersey && name==='cow-head'){x*=.91;z*=.91;}
        positions.push(x,y,z*side);
        colors.push(palette[tint].r,palette[tint].g,palette[tint].b);
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const node=new THREE.Group();node.name=name;node.position.set(...pivot);
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;
    node.add(mesh);group.add(node);return node;
  }
  surface('cow-body',BODY_VERTICES,BODY_FACES,[0,0,0],true);
  const head=surface('cow-head',HEAD_VERTICES,HEAD_FACES,[1.19,2.17,0],true);
  const tail=surface('cow-tail',TAIL_VERTICES,TAIL_FACES,[-1.32,2.18,0],false);
  group.scale.set(scale*1.12*(jersey?.87:1),scale*1.12*(jersey?.9:1),scale*1.12*(jersey?.84:1));
  head.rotation.z=headDip;head.rotation.y=headTurn;
  group.userData={type:'cow',head,tail,phase:seed*1.79,headDip,headTurn,breed:jersey?'jersey':'holstein',seed};
  return group;
}
