import * as T from './vendor/three.module.js';

export function createCityModels({geo,mat}){
  const palette=[0x82aaa8,0xc9947e,0x929fbd,0xd4b875,0x8aab91,0xb49dab];
  function roundBox(){
    const s=new T.Shape(),a=.42,r=.07;s.moveTo(-a+r,-a);s.lineTo(a-r,-a);s.quadraticCurveTo(a,-a,a,-a+r);s.lineTo(a,a-r);s.quadraticCurveTo(a,a,a-r,a);s.lineTo(-a+r,a);s.quadraticCurveTo(-a,a,-a,a-r);s.lineTo(-a,-a+r);s.quadraticCurveTo(-a,-a,-a+r,-a);
    return geo(new T.ExtrudeGeometry(s,{depth:.84,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,steps:1,curveSegments:3}).center());
  }
  const boxGeo=roundBox(),sphere=geo(new T.SphereGeometry(1,14,10)),cylinder=geo(new T.CylinderGeometry(1,1,1,12)),cone=geo(new T.ConeGeometry(1,1,10)),crown=geo(new T.IcosahedronGeometry(1,1));
  const hairGeo=geo(new T.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI*.55));
  const paint=palette.map(c=>mat(c,{roughness:.42,metalness:.14})),roof=mat(0x677a7c),stone=mat(0xc9cbc1),trim=mat(0xe6dfcb),dark=mat(0x334951),glass=mat(0x65969f,{roughness:.22,metalness:.35}),lightGlass=mat(0x9bc1bf,{roughness:.25,metalness:.25}),rubber=mat(0x333d43),chrome=mat(0xa9b5b3,{metalness:.65,roughness:.32}),warm=mat(0xffd9a3,{emissive:0x39250e}),red=mat(0xb85d54),orange=mat(0xd9955c),wood=mat(0x917057);
  const leaves=[mat(0x5d9279,{flatShading:true}),mat(0x78a58b,{flatShading:true}),mat(0x8ab295,{flatShading:true})],pine=[mat(0x497a68,{flatShading:true}),mat(0x60917b,{flatShading:true})],palm=[mat(0x578b6a,{side:T.DoubleSide}),mat(0x75a275,{side:T.DoubleSide})];
  const skins=[0xe5ba92,0xc99470,0x9a684e].map(c=>mat(c)),pants=mat(0x425368),hair=mat(0x51423d);
  function part(shape,material,scale,position,parent){const o=new T.Mesh(shape,material);o.scale.set(...scale);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(m,s,p,g)=>part(boxGeo,m,s,p,g),ball=(m,s,p,g)=>part(sphere,m,s,p,g);
  function branch(from,to,r,material,g){const a=new T.Vector3(...from),b=new T.Vector3(...to),v=b.clone().sub(a);const o=part(cylinder,material,[r,v.length(),r],a.clone().add(b).multiplyScalar(.5).toArray(),g);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
  function frondGeometry(){
    const p=[],idx=[];for(let i=0;i<=7;i++){const t=i/7,width=Math.sin(t*Math.PI)*.21+.015;for(const sign of [-1,1])p.push(sign*width,.45*Math.sin(t*Math.PI)-t*.24,t*1.2);}
    for(let i=0;i<7;i++){const k=i*2;idx.push(k,k+2,k+3,k,k+3,k+1);}const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const frond=frondGeometry();
  function tree(g,variant){
    if(variant===0){
      branch([0,0,0],[0,1.25,0],.105,wood,g);
      branch([0,.75,0],[-.4,1.5,.1],.055,wood,g);branch([0,.9,0],[.4,1.6,-.1],.05,wood,g);
      const clusters=[[-.37,1.47,.13,.47],[.35,1.59,-.13,.48],[0,1.95,0,.5],[.12,1.45,.35,.4],[-.1,1.64,-.36,.42]];
      clusters.forEach(([x,y,z,r],i)=>part(crown,leaves[i%3],[r,r*.95,r],[x,y,z],g));
    }else if(variant===1){
      branch([0,0,0],[0,2.2,0],.09,wood,g);
      for(let i=0;i<4;i++){const r=.65-i*.13;part(cone,pine[i%2],[r,.82,r],[0,.85+i*.38,0],g);}
      part(cone,leaves[1],[.16,.4,.16],[0,2.3,0],g);
    }else{
      for(let i=0;i<5;i++)branch([i*.035,i*.34,0],[(i+1)*.035,(i+1)*.34,0],.09-i*.006,wood,g);
      for(let i=0;i<7;i++){const o=part(frond,palm[i%2],[1,1,1],[.175,1.7,0],g);o.rotation.y=i*Math.PI*2/7;}
      for(let i=0;i<3;i++)ball(wood,[.09,.11,.09],[.1+i*.07,1.65,.08],g);
    }
  }
  function car(g,color,variant){
    box(rubber,[.84,.18,1.65],[0,.25,0],g);box(color,[.94,.36,1.74],[0,.47,0],g);
    box(color,[.82,.34,.86],[0,.78,-.08],g);box(glass,[.74,.24,.9],[0,.81,-.08],g);box(color,[.8,.08,.79],[0,.97,-.08],g);
    box(color,[.92,.08,.5],[0,.68,.57],g);box(color,[.92,.07,.3],[0,.64,-.72],g);
    for(const x of [-.47,.47])for(const z of [-.54,.56]){const w=part(cylinder,rubber,[.22,.14,.22],[x,.27,z],g);w.rotation.z=Math.PI/2;const hub=part(cylinder,chrome,[.115,.151,.115],[x,.27,z],g);hub.rotation.z=Math.PI/2;}
    for(const x of [-.29,.29]){box(warm,[.2,.09,.035],[x,.53,.875],g);box(red,[.2,.085,.035],[x,.52,-.875],g);box(color,[.13,.07,.15],[x*1.74,.76,.2],g);}
    box(chrome,[.72,.07,.05],[0,.34,.89],g);box(chrome,[.72,.07,.05],[0,.34,-.89],g);
    box(dark,[.29,.06,.025],[0,.47,.896],g);box(trim,[.21,.07,.025],[0,.43,-.902],g);
    for(const x of [-.478,.478])box(chrome,[.02,.035,.14],[x,.65,-.13],g);
    if(variant===2){box(roof,[.58,.035,.65],[0,1.025,-.1],g);}
  }
  function building(g,kind,color,variant){
    const house=kind==='house',landmark=kind==='landmark',w=house?1.8:landmark?3.2:2.6,h=house?1.65:landmark?5.7:3.9;
    box(stone,[w+.12,.17,w+.12],[0,.08,0],g);box(color,[w,h,w],[0,h/2+.16,0],g);
    box(trim,[w+.12,.13,w+.12],[0,h+.16,0],g);box(roof,[w-.16,.08,w-.16],[0,h+.26,0],g);
    const rows=house?2:landmark?6:4,cols=house?2:3;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const p=(col-(cols-1)/2)*(w*.24),y=.55+row*(h-.5)/rows;
      for(const side of [-1,1]){
        box(row%3===1?lightGlass:glass,[w*.16,.27,.045],[p,y,side*(w/2+.025)],g);
        box(trim,[w*.19,.035,.09],[p,y-.16,side*(w/2+.03)],g);
        box(row%3===1?lightGlass:glass,[.045,.27,w*.16],[side*(w/2+.025),y,p],g);
      }
    }
    box(dark,[.4,.64,.045],[0,.44,w/2+.035],g);box(glass,[.14,.39,.025],[.06,.47,w/2+.064],g);
    box(color,[.7,.07,.4],[0,.82,w/2+.15],g);box(stone,[.65,.08,.3],[0,.10,w/2+.12],g);
    if(house&&variant===1){const r=part(geoRoof,roof,[w*.73,.5,w*.73],[0,h+.47,0],g);r.rotation.y=Math.PI/4;}
    else{box(stone,[.48,.3,.42],[w*.2,h+.43,-w*.2],g);box(dark,[.35,.035,.32],[w*.2,h+.6,-w*.2],g);}
    if(landmark){box(color,[1.7,.85,1.7],[0,h+.7,0],g);box(trim,[1.8,.1,1.8],[0,h+1.15,0],g);part(cone,chrome,[.12,1.1,.12],[0,h+1.7,0],g);}
  }
  const geoRoof=geo(new T.ConeGeometry(1,1,4));
  // Bake static details per material once per template; clones share the resulting geometry.
  function bake(group){
    group.updateMatrixWorld(true);const batches=new Map();const v=new T.Vector3(),n=new T.Vector3();
    group.traverse(o=>{if(!o.isMesh)return;let batch=batches.get(o.material);if(!batch){batch={p:[],n:[]};batches.set(o.material,batch);}const p=o.geometry.attributes.position,normal=o.geometry.attributes.normal,index=o.geometry.index,nm=new T.Matrix3().getNormalMatrix(o.matrixWorld);
      for(let k=0;k<(index?index.count:p.count);k++){const i=index?index.getX(k):k;v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);n.fromBufferAttribute(normal,i).applyMatrix3(nm).normalize();batch.p.push(v.x,v.y,v.z);batch.n.push(n.x,n.y,n.z);}
    });
    const result=new T.Group();for(const [material,b]of batches){const geometry=geo(new T.BufferGeometry());geometry.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geometry.computeBoundingSphere();const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;result.add(m);}return result;
  }
  function person(item){
    const g=new T.Group(),body=new T.Group();g.add(body);const skin=skins[item.appearance%3],shirt=paint[item.appearance%paint.length];
    box(shirt,[.3,.38,.2],[0,.78,0],body);box(trim,[.1,.055,.22],[0,.97,0],body);box(pants,[.26,.14,.18],[0,.55,0],body);
    ball(skin,[.14,.16,.14],[0,1.1,0],body);part(hairGeo,hair,[.15,.15,.13],[0,1.13,-.025],body);
    for(const x of [-.045,.045])ball(dark,[.014,.017,.009],[x,1.11,.135],body);
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.075,.54,0);body.add(leg);legs.push(leg);
      part(cylinder,pants,[.055,.44,.055],[0,-.22,0],leg);box(rubber,[.12,.085,.22],[0,-.475,.03],leg);
      const arm=new T.Group();arm.position.set(side*.19,.93,0);body.add(arm);arms.push(arm);
      part(cylinder,shirt,[.05,.24,.05],[0,-.12,0],arm);branch([0,-.23,0],[0,-.34,.025],.04,skin,arm);ball(skin,[.047,.055,.047],[0,-.37,.025],arm);
    }
    g.userData={body,legs,arms};return g;
  }
  const templates=new Map();
  function create(item){
    let g;if(item.kind==='person')g=person(item);else{
      const variant=item.variant||0,appearance=(item.appearance||0)%palette.length,key=item.kind==='tree'?'tree-'+variant:item.kind==='cone'?'cone':item.kind+'-'+appearance+(['house','car'].includes(item.kind)?'-'+(variant===(item.kind==='house'?1:2)?1:0):'');
      if(!templates.has(key)){
        const root=new T.Group(),color=paint[appearance];
        if(item.kind==='tree')tree(root,variant);
        if(item.kind==='car')car(root,color,variant);
        if(['house','tower','landmark'].includes(item.kind))building(root,item.kind,color,variant);
        if(item.kind==='cone'){
          box(rubber,[.48,.065,.48],[0,.035,0],root);part(cone,orange,[.24,.65,.24],[0,.38,0],root);
          part(cylinder,trim,[.15,.075,.15],[0,.35,0],root);part(cylinder,trim,[.095,.07,.095],[0,.52,0],root);
        }
        if(item.kind==='bin'){
          box(color,[.48,.66,.48],[0,.38,0],root);box(roof,[.56,.09,.54],[0,.76,0],root);box(dark,[.31,.13,.025],[0,.63,.265],root);
          for(const x of [-.15,.15]){const w=part(cylinder,rubber,[.09,.065,.09],[x,.10,-.21],root);w.rotation.z=Math.PI/2;}
          for(const x of [-.13,0,.13])box(trim,[.017,.4,.019],[x,.38,.247],root);
        }
        templates.set(key,bake(root));
      }
      g=templates.get(key).clone(true);
    }
    g.position.set(item.x,0,item.z);if(item.kind==='car')g.rotation.y=item.z>0?Math.PI/2:-Math.PI/2;if(item.kind==='tree')g.rotation.y=item.tilt;
    return g;
  }
  function animatePerson(item,g){
    g.position.set(item.x,0,item.z);g.rotation.y=item.heading;const {body,legs,arms}=g.userData,amount=Math.min(1,item.speed/2.7),phase=item.walkPhase;
    body.position.y=Math.abs(Math.sin(phase))*amount*.035;legs[0].rotation.x=Math.sin(phase)*.65*amount;legs[1].rotation.x=-Math.sin(phase)*.65*amount;
    arms[0].rotation.x=-Math.sin(phase)*.65*amount;arms[1].rotation.x=Math.sin(phase)*.65*amount;body.rotation.x=item.fleeing?.10:0;
  }
  return{create,animatePerson};
}
