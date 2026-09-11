// Deterministic landscape accents: hundreds of instances, a handful of draws.
export function addPlaceDetails(THREE, scene, loc, B) {
  const { box, cyl, lamb, labelSprite } = B;
  const dummy = new THREE.Object3D();
  function instances(geometry, color, transforms) {
    const mesh = new THREE.InstancedMesh(geometry, lamb(color), transforms.length);
    transforms.forEach(([x,y,z,sx,sy,sz,turn=0], i) => {
      dummy.position.set(x,y,z); dummy.scale.set(sx,sy,sz); dummy.rotation.set(0,turn,0); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true; mesh.computeBoundingSphere(); mesh.receiveShadow=true; scene.add(mesh); return mesh;
  }
  // A long agricultural horizon, instead of a ring of identical trees alone.
  if (loc.environment.landscape === 'fields') {
    const rows = [], crops = [];
    for(let r=0;r<12;r++) {
      rows.push([31+r*1.3,.035,-6, .75, .08, 39]);
      for(let c=0;c<18;c++) crops.push([31+r*1.3,.35,-24+c*2, .25,.5+(r%3)*.1,.35]);
    }
    instances(new THREE.BoxGeometry(1,1,1),0x89754b,rows);
    instances(new THREE.ConeGeometry(1,1,5),0x728945,crops);
    // A proper arrival gate, out of the visitor's travel lane.
    const timber=lamb(0x92734e), cream=lamb(0xf1dfb6);
    for(const x of [-4.4,4.4]) scene.add(box(.35,3.9,.35,timber,x,1.95,10.5));
    scene.add(box(9.5,.55,.3,cream,0,3.7,10.5));
    const sign=labelSprite('CALIFORNIA DAIRY · VISITOR TRAIL',1.3);sign.position.set(0,3.72,10.7);scene.add(sign);
    const posts=[];
    for(let i=0;i<24;i++)posts.push([-28,.7,-25+i*2,.16,1.4,.16]);
    instances(new THREE.BoxGeometry(1,1,1),0xb59b70,posts);
    for(const y of [.5,1.1])scene.add(box(.12,.12,46,timber,-28,y,-2));
  } else {
    // A civic square: paving, planted edges, lamps, and a warm market palette.
    scene.add(box(48,.012,29,lamb(0xc7bea8),0,.006,7));
    const seams=[];
    for(let i=0;i<13;i++)seams.push([-24+i*4,.016,7,.035,.005,29]);
    for(let i=0;i<8;i++)seams.push([0,.017,-7+i*4,48,.005,.035]);
    instances(new THREE.BoxGeometry(1,1,1),0xaba58f,seams);
    for(const x of [-22,22])for(const z of [-3,9,20]) {
      scene.add(box(2.4,.5,2,lamb(0x806b53),x,.3,z));
      scene.add(box(2.1,.07,1.7,lamb(0x606e45),x,.6,z));
      scene.add(cyl(.07,.1,4,lamb(0x4c6152),x,2,z,8));
      scene.add(box(.6,.18,.6,lamb(0xeee1b8),x,4,z));
    }
  }
  // Ground-cover islands stay outside the playable bounds; no hidden obstacles.
  const leaves=[], flowers=[];
  for(let i=0;i<160;i++) {
    const side=i%2?1:-1, x=side*(26+(i%7)*.65), z=-24+Math.floor(i/7)*2;
    leaves.push([x,.18,z,.38,.35,.38]);
    if(i%3===0)flowers.push([x,.4,z,.1,.1,.1]);
  }
  instances(new THREE.SphereGeometry(1,6,4),0x7e8f53,leaves);
  instances(new THREE.SphereGeometry(1,5,3),loc.environment.flowerColor || 0xe6cc82,flowers);
  const clouds=[];
  for(let i=0;i<18;i++)clouds.push([-70+Math.floor(i/3)*27+(i%3)*3,26+(i%3)*.65,-80+(Math.floor(i/3)%2)*20,5,1.5+(i%3)*.5,3]);
  instances(new THREE.SphereGeometry(1,12,8),0xf4efdf,clouds);
  // Soft contact patches ground the props even when real-time shadows are off.
  const contacts = loc.environment.contacts || [];
  if(!contacts.length)return;
  const shadow = new THREE.InstancedMesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x3e482b,transparent:true,opacity:.13,depthWrite:false}),contacts.length);
  contacts.forEach(([x,z,w,d],i)=>{dummy.position.set(x,.057,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(w,d,1);dummy.updateMatrix();shadow.setMatrixAt(i,dummy.matrix);});
  shadow.instanceMatrix.needsUpdate=true;shadow.computeBoundingSphere();scene.add(shadow);
}
