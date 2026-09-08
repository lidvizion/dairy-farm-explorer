// Environment builders are independent of navigation, progress, and UI.
export function createEnvironmentBuilders(THREE, B) {
/* ---- location environment builders (low-poly, themed) ---- */
function buildFarm(scene,addObst){
  const {box,cyl,ball,lamb,labelSprite}=B;
  // modern free-stall barn (open sides, light roof) — not a red barn
  const barn=new THREE.Group();
  const post=lamb(0xcfd3d6);
  for(const px of [-6,-2,2,6]) for(const pz of [-4,4]) barn.add(cyl(0.18,0.2,4.4,post,px,2.2,pz,8));
  const roof=box(15,0.3,10,lamb(0xe2e6e9),0,4.5,0); roof.rotation.x=0.04; barn.add(roof);
  // ridge vents (ventilation)
  barn.add(box(15,0.5,0.8,lamb(0xf2f4f6),0,4.9,0));
  // fans
  for(const fx of [-5,0,5]){ const f=cyl(0.7,0.7,0.2,lamb(0x333333),fx,3.6,-4.1,10); f.rotation.x=Math.PI/2; barn.add(f);}
  barn.position.set(-14,0,-2); scene.add(barn); addObst(-14,-2,6);
  scene.add(withLabel(labelSprite('Ventilated Barn',1),-14,5.6,-2));

  // feed & water lane
  const feed=box(6,0.5,1.2,lamb(0x8a6a44),-14,0.35,4); scene.add(feed);
  const trough=box(4,0.6,1,lamb(0x8d9aa5),-14,0.4,6); scene.add(trough);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(3.6,0.8),lamb(0x4aa3d8)); water.rotation.x=-Math.PI/2; water.position.set(-14,0.68,6); scene.add(water);

  // milking area + bulk tank (milk house)
  const mh=new THREE.Group();
  mh.add(box(6,3,5,lamb(0xe8ece0),0,1.5,0));
  const tank=new THREE.Group(); const steel=lamb(0xd9e2e8); const body=cyl(1,1,3,steel,0,0,0,18); body.rotation.z=Math.PI/2; tank.add(body); tank.add(ball(1,steel,1.5,0,0)); tank.add(ball(1,steel,-1.5,0,0)); tank.position.set(0,2,0); mh.add(tank);
  mh.position.set(8,0,-2); scene.add(mh); addObst(8,-2,3.4);

  // refrigerated tanker
  const tanker=makeTanker(); tanker.position.set(16,0,4); tanker.rotation.y=-0.4; scene.add(tanker); addObst(16,4,2.4);
  scene.add(withLabel(labelSprite('Refrigerated Tanker',1),16,3.4,4));

  // solar panels
  const solar=new THREE.Group(); for(let i=0;i<3;i++){ const p=box(2.4,0.1,1.4,lamb(0x1b2a4a),i*2.7,1.2,0); p.rotation.x=-0.5; solar.add(p); solar.add(cyl(0.06,0.06,1.1,lamb(0x888),i*2.7,0.55,0.3,6)); } solar.position.set(-22,0,8); scene.add(solar);
  scene.add(withLabel(labelSprite('Solar',0.8),-19.5,2.2,8));

  // manure/renewable-energy digester dome
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2,16,10,0,Math.PI*2,0,Math.PI/2),lamb(0x2e5e3e)); dome.position.set(-22,0,-8); dome.castShadow=true; scene.add(dome); addObst(-22,-8,2.2);
  scene.add(withLabel(labelSprite('Renewable Energy',0.9),-22,2.6,-8));

  // feed crops (rows) + a couple cows
  for(let r=0;r<5;r++) for(let c=0;c<8;c++){ const crop=cyl(0.05,0.05,0.5+Math.random()*0.3,lamb(0x6fae2e),18+c*0.6,0.3,-12+r*0.7,4,false); scene.add(crop); }
  addFarmCows(scene);
}
function addFarmCows(scene){
  const cows=[];
  for(let i=0;i<4;i++){ const c=makeCow(.85,i!==2); c.position.set(-13+i*2.8,0,-10-(i%2)*2); c.rotation.y=-.45+(i%2)*.3; scene.add(c); cows.push(c); }
  // make cows clickable for a moo
  cows.forEach(c=>{ c.userData.type='cow'; });
  // enterLocation merges these into the location's clickables after setActive.
  scene.userData.cows=cows;
}
function makeCow(scale=1,spotted=true){
  const {box,rbox,cyl,ball,lamb}=B;
  const g=new THREE.Group();
  const hideMat=new THREE.MeshLambertMaterial({map:B.cowTexture(spotted)});
  const dark=lamb(0x201f1c), pink=lamb(0xe8a8a8), horn=lamb(0xe8dfc8);

  // body — bigger barrel proportions read more clearly as "cow" at a distance
  const bodyMesh=new THREE.Mesh(new THREE.CapsuleGeometry(0.68,1.55,4,10),hideMat);
  bodyMesh.rotation.z=Math.PI/2; bodyMesh.position.y=1.28; bodyMesh.castShadow=true; bodyMesh.receiveShadow=true;
  g.add(bodyMesh);

  // head — rounded box (RoundedBoxGeometry) instead of a hard cube, with a
  // clearly separated dark snout, visible ears, and small polled-breed horns.
  const head=new THREE.Group(); head.position.set(1.38,1.78,0);
  head.add(rbox(0.72,0.66,0.58,hideMat,0,0,0,0.1));
  head.add(rbox(0.4,0.32,0.42,pink,0.44,-0.16,0,0.08));
  head.add(ball(0.045,dark,0.62,-0.1,0.13,false));
  head.add(ball(0.045,dark,0.62,-0.1,-0.13,false));
  for(const s of [1,-1]) head.add(ball(0.055,dark,0.3,0.05,s*0.24,false));
  for(const s of [1,-1]){
    const ear=rbox(0.3,0.16,0.2,hideMat,-0.02,0.22,s*0.42,0.05,false);
    ear.rotation.z=s*0.5; ear.rotation.y=s*0.3; head.add(ear);
  }
  for(const s of [1,-1]) head.add(cyl(0.02,0.05,0.16,horn,0.05,0.42,s*0.22,6,false));
  g.add(head);

  for(const [lx,lz] of [[0.72,0.32],[0.72,-0.32],[-0.72,0.32],[-0.72,-0.32]]) g.add(cyl(0.11,0.13,0.95,dark,lx,0.48,lz,8));
  g.add(ball(0.34,pink,-0.55,0.78,0,false));

  // tail — animated in updateCows for a gentle swish
  const tail=new THREE.Group(); tail.position.set(-1.5,1.7,0);
  tail.add(cyl(0.035,0.05,0.85,dark,0,-0.4,0,6,false));
  tail.add(ball(0.08,dark,0,-0.82,0,false));
  g.add(tail);

  g.scale.setScalar(scale*1.12);
  g.userData={type:'cow',head,tail,phase:Math.random()*9};
  return g;
}
function makeTanker(){
  const {box,cyl,ball,lamb}=B; const g=new THREE.Group(); const steel=lamb(0xe3eaee), dark=lamb(0x2b2b2b);
  g.add(box(1.8,1.7,2,lamb(0x1f6fb2),0,1.3,2.8));
  const tk=cyl(1.1,1.1,4.6,steel,0,1.8,-0.6,18); tk.rotation.x=Math.PI/2; g.add(tk);
  g.add(ball(1.1,steel,0,1.8,1.7)); g.add(ball(1.1,steel,0,1.8,-2.9));
  g.add(box(2.2,0.4,5.4,dark,0,0.6,-0.2));
  for(const zz of [2.4,-1,-2.4]) for(const s of [1,-1]){ const w=cyl(0.5,0.5,0.35,dark,s*1,0.5,zz,12); w.rotation.z=Math.PI/2; g.add(w);}
  return g;
}
function withLabel(sprite,x,y,z){ sprite.position.set(x,y,z); sprite.userData.environmentLabel=true; return sprite; }

function buildProcessor(scene,addObst){
  const {box,rbox,cyl,ball,lamb,basic,labelSprite}=B;
  // clean modern facility shell (visitor-safe walkway implied)
  const bldg=new THREE.Group();
  bldg.add(box(24,7,16,lamb(0xeef1f4),0,3.5,-6));
  bldg.add(box(24.4,0.4,16.4,lamb(0xcfd6dc),0,7.1,-6));
  bldg.position.set(0,0,0); scene.add(bldg); addObst(0,-12,12);

  // ---- street-facing facade (the wall the player spawns looking at) ----
  const wallZ=2.06; // just proud of the front wall at z=2
  const facade=new THREE.Group();
  const glass=new THREE.MeshPhongMaterial({color:0x8fd0e6,transparent:true,opacity:0.55,shininess:90});
  const frameM=lamb(0xffffff), accent=lamb(0x1a7a3c), steel=lamb(0xb7c2cc);
  // corner pilasters give the wall real architectural edges instead of a flat slab
  for(const px of [-11.4,11.4]) facade.add(rbox(1.2,7,1.2,lamb(0xd7dee4),px,3.5,wallZ-0.5,0.15));
  // ribbon of tinted windows with white mullion frames
  for(const wx of [-8.4,-4.6,4.6,8.4]){
    facade.add(rbox(2.6,3,0.14,frameM,wx,4.3,wallZ,0.06));
    facade.add(box(2.3,2.7,0.05,glass,wx,4.3,wallZ+0.08,false));
    facade.add(box(2.6,0.1,0.1,frameM,wx,4.3,wallZ+0.08,false));
  }
  // entrance: glass double doors + canopy + signage
  facade.add(rbox(2.4,3.4,0.12,frameM,0,2,wallZ,0.06));
  facade.add(box(1,3,0.06,glass,-0.55,1.9,wallZ+0.08,false));
  facade.add(box(1,3,0.06,glass,0.55,1.9,wallZ+0.08,false));
  const canopy=rbox(4.6,0.22,1.6,accent,0,3.9,wallZ+0.9,0.06); facade.add(canopy);
  for(const px of [-2,2]) facade.add(cyl(0.07,0.07,3.79,steel,px,1.895,wallZ+1.55,8,false));
  facade.add(withLabel(labelSprite('PROCESSING & PACKAGING',1.3),0,5.4,wallZ+0.9));
  // exterior pipe run along the base — visible plant character, not just a wall
  for(const py of [0.9,1.3]){ const pipe=cyl(0.09,0.09,20,steel,0,py,wallZ-0.35,8,false); pipe.rotation.z=Math.PI/2; facade.add(pipe); }
  facade.add(cyl(0.16,0.16,2.2,steel,-9.5,1.6,wallZ-0.35,10,false));
  // roof-mounted equipment breaks up the flat roofline silhouette
  for(const rx of [-6,0,6]){
    facade.add(box(1.4,0.8,1.4,lamb(0xc7ced3),rx,7.5,-8,false));
    const fan=cyl(0.5,0.5,0.08,lamb(0x7f8a92),rx,7.95,-8,14,false); fan.rotation.x=Math.PI/2; facade.add(fan);
  }
  scene.add(facade);

  // receiving bay + tanker
  const tanker=makeTanker(); tanker.position.set(-16,0,6); tanker.rotation.y=0.5; scene.add(tanker); addObst(-16,6,2.4);
  scene.add(withLabel(labelSprite('Receiving Bay',1),-16,3.4,6));
  // stainless tanks + pipes
  for(let i=0;i<4;i++){ const t=cyl(1,1,4,lamb(0xd7dee4),-8+i*2.4,2,-4,16); scene.add(t); }
  scene.add(withLabel(labelSprite('Stainless Tanks',0.9),-5,4.6,-4));
  // pipes
  for(let i=0;i<4;i++){ const p=box(8,0.15,0.15,lamb(0xb7c2cc),-2,3.4+i*0.3,-2); scene.add(p); }
  // cheese line: block, cutter, shredder, packaging
  const line=new THREE.Group();
  line.add(box(0.9,0.9,0.9,lamb(0xf3d98a),0,1,0));   // cheese block
  line.add(box(1.2,1.4,1.2,lamb(0x9fb4c4),2.4,0.9,0)); // shredder
  line.add(box(1.4,1,1,lamb(0xcfd6dc),4.8,0.7,0));   // packager
  line.position.set(6,0,-4); scene.add(line);
  scene.add(withLabel(labelSprite('Cheese & Shred Line',0.9),8.4,3,-4));
  // consumer vs foodservice packaging stacks
  const cons=box(1,0.6,0.7,lamb(0x2a9c53),12,0.6,-2); scene.add(cons);
  const food=box(1.6,1,1.2,lamb(0xf5b21e),14,0.9,-2); scene.add(food);
  scene.add(withLabel(labelSprite('Consumer + Foodservice',0.9),13,2.4,-2));
  // refrigerated storage + shipping dock
  scene.add(withLabel(labelSprite('Cold Storage',0.9),-10,3,-10));
  const dock=box(6,1,4,lamb(0x9aa7b0),12,0.5,8); scene.add(dock); addObst(12,8,3);
  scene.add(withLabel(labelSprite('Shipping Dock',0.9),12,2.4,8));
}
function buildMarket(scene,addObst){
  const {box,rbox,cyl,ball,lamb,labelSprite}=B;
  const glass=new THREE.MeshPhongMaterial({color:0x9fe0ea,transparent:true,opacity:0.5,shininess:90});
  const steamGlass=new THREE.MeshPhongMaterial({color:0xffe0b0,transparent:true,opacity:0.35,shininess:60});
  const frameM=lamb(0xffffff);

  // grocery side (left)
  const grocery=new THREE.Group();
  grocery.add(box(12,6,10,lamb(0xf3efe3),0,3,-6));
  // dairy case
  for(let i=0;i<3;i++){ const c=box(3,2.2,1.2,lamb(0xbfe0ea),-3+i*3,1.1,-1); grocery.add(c); grocery.add(box(3,0.1,1.2,lamb(0xffffff),-3+i*3,2.25,-1)); }
  grocery.position.set(-12,0,0); scene.add(grocery); addObst(-12,-6,8.6);
  scene.add(withLabel(labelSprite('Grocery Dairy Aisle',1),-12,4.4,-1));

  // grocery street-facing storefront (this is what the player actually spawns
  // looking toward — was previously a flat undecorated wall)
  {
    const gz=-0.92, gx=-12;
    const f=new THREE.Group();
    for(const px of [gx-6.4,gx+6.4]) f.add(rbox(0.8,6,0.8,lamb(0xe2dcc8),px,3,gz-0.4,0.1));
    f.add(rbox(9,3.4,0.14,frameM,gx,3.1,gz,0.06));
    f.add(box(8.6,3,0.05,glass,gx,3.1,gz+0.08,false));
    for(const lx of [-3,-1,1,3]) f.add(box(0.1,3,0.06,frameM,gx+lx,3.1,gz+0.1,false));
    f.add(rbox(1.8,3,0.1,frameM,gx,1.6,gz,0.06));
    f.add(box(0.85,2.7,0.05,glass,gx-0.42,1.5,gz+0.08,false));
    f.add(box(0.85,2.7,0.05,glass,gx+0.42,1.5,gz+0.08,false));
    const awning=rbox(9.6,0.2,1.1,lamb(0x1a7a3c),gx,5,gz+0.55,0.05); f.add(awning);
    for(let i=0;i<6;i++) f.add(box(1.6,0.05,1.1,lamb(i%2?0xffffff:0x1a7a3c),gx-7.2+i*2.88,4.9,gz+0.55,false));
    f.add(withLabel(labelSprite('MARKET',1.3),gx,5.9,gz+0.6));
    // planter box + small produce color pop out front for street character
    const planter=box(2.4,0.5,0.6,lamb(0x7a5a3a),gx,0.25,gz+1.3); f.add(planter);
    const leafM=lamb(0x3e8a3e);
    for(let i=0;i<5;i++) f.add(ball(0.22,i%2?leafM:lamb(0xd94f4f),gx-1+i*0.5,0.55,gz+1.3,false));
    scene.add(f);
  }

  // restaurant / commercial kitchen (right)
  const kitchen=new THREE.Group();
  kitchen.add(box(12,6,10,lamb(0xe7ede9),0,3,-6));
  // stainless counters + range
  kitchen.add(box(6,1,1.4,lamb(0xcfd6dc),0,1,-1));
  kitchen.add(box(2,1,1.4,lamb(0x333333),3.5,1,-1));
  kitchen.position.set(12,0,0); scene.add(kitchen); addObst(12,-6,8.6);
  scene.add(withLabel(labelSprite('Commercial Kitchen',1),12,4.4,-1));

  // kitchen street-facing facade — warm awning + steamy glass + roof exhaust
  // hood so it reads as "restaurant," distinct from the grocery storefront
  {
    const kz=-0.92, kx=12;
    const f=new THREE.Group();
    for(const px of [kx-6.4,kx+6.4]) f.add(rbox(0.8,6,0.8,lamb(0xe2dcc8),px,3,kz-0.4,0.1));
    f.add(rbox(9,3.4,0.14,frameM,kx,3.1,kz,0.06));
    f.add(box(8.6,3,0.05,steamGlass,kx,3.1,kz+0.08,false));
    for(const lx of [-3,-1,1,3]) f.add(box(0.1,3,0.06,frameM,kx+lx,3.1,kz+0.1,false));
    f.add(rbox(1.8,3,0.1,lamb(0x4a2f1c),kx,1.6,kz,0.06));
    const awning=rbox(9.6,0.2,1.1,lamb(0xb8481f),kx,5,kz+0.55,0.05); f.add(awning);
    for(let i=0;i<6;i++) f.add(box(1.6,0.05,1.1,lamb(i%2?0xffffff:0xb8481f),kx-7.2+i*2.88,4.9,kz+0.55,false));
    f.add(withLabel(labelSprite('KITCHEN',1.3),kx,5.9,kz+0.6));
    // roof exhaust hood stack signals "commercial kitchen" from a glance
    f.add(cyl(0.28,0.28,2,lamb(0xb7c2cc),kx-4,7,-8,10,false));
    f.add(cyl(0.4,0.34,0.35,lamb(0x8d9aa5),kx-4,8.1,-8,10,false));
    scene.add(f);
  }

  // small bistro table + umbrella in the plaza between the two storefronts —
  // a cheap, high-impact prop that visually bridges grocery and restaurant
  {
    const t=new THREE.Group();
    t.add(cyl(0.06,0.06,1.0,lamb(0x3a3a3a),0,0.5,0,8));
    t.add(cyl(0.55,0.55,0.06,lamb(0xf5f0e6),0,1.02,0,16));
    t.add(cyl(0.04,0.04,1.4,lamb(0xd9d2c0),0,1.7,0,8,false));
    const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.1,0.5,10),lamb(0xf5b21e)); canopy.position.y=2.15; canopy.castShadow=true; t.add(canopy);
    t.position.set(0,0,3);
    scene.add(t); addObst(0,3,1.1);
  }

  // receiving dock between
  const dock=box(5,1,3,lamb(0x9aa7b0),12,0.5,8); scene.add(dock); addObst(12,8,3);
  scene.add(withLabel(labelSprite('Restaurant Receiving',0.9),12,2.4,8));
  // refrigerated storage
  scene.add(withLabel(labelSprite('Refrigerated Storage',0.9),0,3,-12));
  const cold=box(6,4,4,lamb(0xcfe3ea),0,2,-12); scene.add(cold); addObst(0,-12,3.5);
  // chef character (simple)
  const chef=makeChef(); chef.position.set(9,0,2); scene.add(chef);
  // packages consumer + foodservice
  scene.add(withLabel(labelSprite('Consumer + Foodservice Packages',0.8),0,2.2,4));
}
function makeChef(){ const {box,cyl,ball,lamb}=B; const g=new THREE.Group(); g.add(cyl(0.4,0.5,1.4,lamb(0xffffff),0,0.9,0,10)); g.add(ball(0.35,lamb(0xe8b98f),0,1.9,0)); g.add(cyl(0.36,0.36,0.4,lamb(0xffffff),0,2.3,0,12)); g.add(ball(0.34,lamb(0xffffff),0,2.6,0,false)); return g; }


return { buildFarm, buildProcessor, buildMarket };
}
