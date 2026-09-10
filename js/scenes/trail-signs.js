// Physical text: separate outward-facing planes keep the reverse legible.
function faces(THREE, geometry, material, depth) {
  const group=new THREE.Group();
  for(const side of [1,-1]) {
    const face=new THREE.Mesh(geometry,material);
    face.position.z=side*depth; face.rotation.y=side===1?0:Math.PI; group.add(face);
  }
  return group;
}

export function fixedLabel(THREE,text,scale=1) {
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const x=c.getContext('2d');x.fillStyle='#234d39';x.fillRect(0,0,512,128);
  x.fillStyle='#fff9ee';x.textAlign='center';x.textBaseline='middle';
  let size=40; do{x.font=`700 ${size--}px Segoe UI, sans-serif`;}while(x.measureText(text).width>480 && size>16);
  x.fillText(text,256,64);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const group=faces(THREE,new THREE.PlaneGeometry(4*scale,.65*scale),new THREE.MeshBasicMaterial({map:texture}),.065);
  group.userData.dynamic=true; // Visibility is controlled with its attached text faces.
  group.add(new THREE.Mesh(new THREE.BoxGeometry(4*scale,.65*scale,.12),new THREE.MeshLambertMaterial({color:0x856c4d})));
  return group;
}

export function makeTrailSigns(THREE,B,labels) {
  // One local 1024px atlas per destination; no downloads or font dependency.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=704;
  const ctx=canvas.getContext('2d');
  labels.forEach((text,i)=>{
    const x=(i%2)*512,y=Math.floor(i/2)*352;ctx.fillStyle='#234d39';ctx.fillRect(x,y,512,352);
    ctx.strokeStyle='#e2be76';ctx.lineWidth=4;ctx.strokeRect(x+8,y+8,496,336);
    ctx.fillStyle='#fff9ee';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='600 90px Georgia';ctx.fillText(i<3?String(i+1):'?',x+256,y+110);
    const title=text.replace(/^\d\. /,'');let size=38;
    do{ctx.font=`600 ${size--}px Segoe UI, sans-serif`;}while(ctx.measureText(title).width>470 && size>16);
    ctx.fillText(title,x+256,y+245);
  });
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return (index,color)=>{
    const g=new THREE.Group();
    const ring=new THREE.Mesh(new THREE.RingGeometry(1,1.5,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.085;g.add(ring);
    g.add(B.box(.14,1.8,.14,B.lamb(0x856c4d),0,.9,0));
    g.add(B.box(1.65,1.15,.18,B.lamb(0x856c4d),0,1.8,0));
    g.add(B.box(1.8,.1,.25,B.lamb(0xe2be76),0,2.425,0));
    const geometry=new THREE.PlaneGeometry(1.6,1.1),uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(index%2+uv.getX(i))/2,(1-Math.floor(index/2)+uv.getY(i))/2);
    const material=new THREE.MeshBasicMaterial({map:texture});
    const label=faces(THREE,geometry,material,.101);label.position.y=1.8;g.add(label);
    g.userData={ring,label,icon:label.children[0]};return g;
  };
}
