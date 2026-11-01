import * as T from './vendor/three.module.js';
import {DriveRun,DRIVE_RULES,DRIVE_ZONES,clamp} from './drive-core.mjs?v=1.4.2';

export function mount3DGame({host,onScore,onStatus,onEnd,onPause,onHUD=()=>{}}) {
  const run=new DriveRun();
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label','公路穿行 3D 驾驶画面');host.prepend(renderer.domElement);
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(52,1,.1,210);
  const hemi=new T.HemisphereLight(0xffffff,0x8c9295,2.4);scene.add(hemi);
  const sun=new T.DirectionalLight(0xfff6e7,2.6);sun.position.set(-14,28,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:25,bottom:-28,near:1,far:90});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;scene.add(sun);
  const geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,18,12),cone:new T.ConeGeometry(1,1,7),cylinder:new T.CylinderGeometry(1,1,1,16),crystal:new T.OctahedronGeometry(1),ring:new T.TorusGeometry(1,.08,6,32)};
  const materials=new Map(),extraMaterials=[],textures=[];
  function mat(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.6,metalness:.12,flatShading:true}));return materials.get(color);}
  function mesh(shape,color,scale,position,parent=scene,shadow=false) {
    const m=new T.Mesh(geometries[shape],typeof color==='number'?mat(color):color);
    m.scale.set(...scale);m.position.set(...position);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;
  }
  const box=(color,scale,position,parent,shadow=false)=>mesh('box',color,scale,position,parent,shadow);
  function car(color,parent=scene) {
    const g=new T.Group();parent.add(g);
    box(color,[1.45,.48,2.65],[0,.57,0],g,true);box(color,[1.17,.55,1.25],[0,1.04,-.15],g,true);
    box(0x334553,[1.19,.32,.8],[0,1.14,-.15],g);box(color,[1.2,.08,1.18],[0,1.35,-.15],g,true);
    for(const x of [-.76,.76])for(const z of [-.86,.87]){const w=mesh('cylinder',0x303741,[.3,.18,.3],[x,.35,z],g,true);w.rotation.z=Math.PI/2;}
    for(const x of [-.48,.48]){box(0xffefc2,[.27,.12,.05],[x,.65,-1.34],g);box(0xe4796b,[.27,.12,.05],[x,.65,1.34],g);}
    return g;
  }
  const moving=[],cities=new T.Group(),desert=new T.Group(),trees=new T.Group();scene.add(cities,desert,trees);
  const land=box(0xc6c4a5,[240,.2,340],[0,-.22,-110]),road=box(0x59636c,[10.2,.15,230],[0,-.08,-90]);
  const buildingMats=[0xc9d7d3,0xd9bfa7,0xa7b9bd].map(c=>mat(c));
  const windowMat=new T.MeshBasicMaterial({color:0xa6ded7});extraMaterials.push(windowMat);
  function movingObject(object,length=180){object.userData.loop=length;moving.push(object);return object;}
  for(const side of [-1,1]) {
    box(0xede3c9,[.12,.03,230],[side*4.75,.01,-90]);
    for(let i=0;i<30;i++)movingObject(box(0xf5ead3,[.1,.025,2.5],[side*1.5,.015,-i*6]),180);
    for(let i=0;i<22;i++) {
      const h=3+(i%4)*2,g=new T.Group();g.position.set(side*(10+(i%3)*4),0,-i*11);cities.add(g);
      box(buildingMats[i%3],[3+(i%2),h,4],[0,h/2,0],g);
      for(let j=1;j<h;j+=2)box(windowMat,[2,.08,.025],[0,j,2.02],g);
      movingObject(g,242);
    }
    for(let i=0;i<13;i++) {
      const g=new T.Group();g.position.set(side*6.6,0,-i*14);trees.add(g);
      box(0x8e7160,[.2,1,.2],[0,.5,0],g);mesh('cone',0x6f9784,[1,2.8,1],[0,2,0],g);movingObject(g,182);
      const rock=mesh('crystal',0xb99973,[2+i%3,2+i%4,3],[side*(12+i%3*6),1.5,-i*14],desert);movingObject(rock,182);
    }
  }
  const orb=mesh('sphere',0xffe7b0,[6,6,6],[28,24,-95]);
  const player=new T.Group();player.position.z=2;scene.add(player);car(0xe6a161,player);
  const shadow=mesh('cylinder',0x80969b,[.9,.018,1.6],[0,.016,2]);shadow.castShadow=false;
  const auraMat=new T.MeshBasicMaterial({color:0x69c9ec,transparent:true,opacity:.2,depthWrite:false});extraMaterials.push(auraMat);
  const aura=mesh('sphere',auraMat,[1.25,1.1,1.8],[0,.95,0],player);
  const flameMat=new T.MeshBasicMaterial({color:0x87e4ff});extraMaterials.push(flameMat);
  const flames=new T.Group();player.add(flames);
  for(const x of [-.4,.4]){const f=mesh('cone',flameMat,[.22,1.8,.22],[x,.4,2],flames);f.rotation.x=Math.PI/2;}
  const streakGroup=new T.Group();scene.add(streakGroup);
  for(let i=0;i<24;i++)movingObject(box(flameMat,[.025,.025,3.5],[i%2?-5.2:5.2,.2,-i*6],streakGroup),144);
  const powerColors={shield:0x6abddc,nitro:0xa0ce78,magnet:0xde8f82,double:0xb39ad9,repair:0x7dbba1};
  const labels={shield:'盾',nitro:'氮',magnet:'磁',double:'×2',repair:'+'};
  const labelMaterials={};
  for(const [kind,label] of Object.entries(labels)) {
    const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(64,64,55,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#'+powerColors[kind].toString(16).padStart(6,'0');ctx.lineWidth=7;ctx.stroke();
    ctx.fillStyle='#263843';ctx.font='bold 53px -apple-system, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,64,67);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
    const m=new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false});extraMaterials.push(m);labelMaterials[kind]=m;
  }
  const coinMat=new T.MeshStandardMaterial({color:0xe6bd59,emissive:0x44300c,metalness:.5,roughness:.35});extraMaterials.push(coinMat);
  const objects=new Map(),flying=[];
  const carColors=[0x88b4bd,0xcc847b,0xdac9a1,0x8d9fc1,0xa5baa0];
  function createEntity(e) {
    let object;
    if(e.kind==='car')object=car(carColors[e.color%carColors.length]);
    else if(e.kind==='barrier') {
      object=new T.Group();scene.add(object);box(0xdba16b,[1.8,.75,.3],[0,.55,0],object,true);
      for(const x of [-.6,0,.6]){const stripe=box(0xfff5dc,[.14,.65,.32],[x,.55,0],object);stripe.rotation.z=-.35;}
      for(const x of [-.65,.65])box(0x6e7880,[.15,.5,.6],[x,.2,0],object);
    } else if(e.kind==='coin') {
      object=new T.Group();scene.add(object);const disk=mesh('cylinder',coinMat,[.4,.1,.4],[0,0,0],object);disk.rotation.x=Math.PI/2;
      const ring=mesh('ring',0xffe1a0,[.29,.29,.29],[0,0,.07],object);ring.receiveShadow=false;
    } else {
      object=new T.Group();scene.add(object);
      mesh('crystal',powerColors[e.kind],[.65,.7,.65],[0,0,0],object);
      const ring=mesh('ring',0xf1f7ec,[.75,.75,.75],[0,0,0],object);ring.rotation.x=Math.PI/2;
      const label=new T.Sprite(labelMaterials[e.kind]);label.position.y=1.3;label.scale.set(1.1,1.1,1.1);object.add(label);
    }
    objects.set(e.id,object);return object;
  }
  const hud=document.createElement('div');hud.className='drive-hud';
  hud.innerHTML='<div class="drive-top"><span class="drive-health"></span><span class="drive-coins"></span><span class="drive-zone"></span></div><div class="drive-effects"></div><div class="drive-speed"></div>';
  host.appendChild(hud);
  // Reserve a stable status row outside the road, including while notices fade.
  const feedback=document.createElement('div');feedback.className='drive-feedback';
  feedback.innerHTML='<div class="drive-mission"><span></span><i aria-hidden="true"><b></b></i></div><div class="drive-notice" role="status" aria-live="polite" aria-atomic="true"></div>';
  host.after(feedback);
  const health=hud.querySelector('.drive-health'),coinText=hud.querySelector('.drive-coins'),zoneText=hud.querySelector('.drive-zone'),effectText=hud.querySelector('.drive-effects'),missionText=feedback.querySelector('.drive-mission>span'),missionBar=feedback.querySelector('.drive-mission b'),notice=feedback.querySelector('.drive-notice'),speedText=hud.querySelector('.drive-speed');
  let destroyed=false,lastTime=0,raf=0,lastScore=-1,hudTime=1,noticeTime=0,currentZone=-1;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themes=[
    {sky:0xeee2ce,land:0xc6c4a5,road:0x59636c,buildings:[0xc9d7d3,0xd9bfa7,0xa7b9bd],hemi:2.4,sun:2.6},
    {sky:0xe9cda8,land:0xcdb28b,road:0x68676a,buildings:[0xcfb48d,0xb99e7b,0xd4c6a8],hemi:2.2,sun:2.4},
    {sky:0x172235,land:0x263642,road:0x354351,buildings:[0x405363,0x4b4f65,0x304a57],hemi:1.5,sun:.9}
  ];
  function setTheme() {
    if(currentZone===run.zone)return;currentZone=run.zone;const t=themes[run.zone];
    scene.background=new T.Color(t.sky);scene.fog=new T.Fog(t.sky,45,155);
    land.material.color.setHex(t.land);road.material.color.setHex(t.road);buildingMats.forEach((m,i)=>m.color.setHex(t.buildings[i]));
    hemi.intensity=t.hemi;sun.intensity=t.sun;cities.visible=run.zone!==1;desert.visible=run.zone===1;trees.visible=run.zone===0;orb.material.color.setHex(run.zone===2?0xd7e8f4:0xffe7b0);
  }
  function updateHUD() {
    health.textContent='耐久 '+run.hp+'/3';health.dataset.low=String(run.hp===1);
    coinText.textContent='金币 '+run.coins;zoneText.textContent=DRIVE_ZONES[run.zone];
    const effects=[];
    for(const [kind,name] of [['shield','护盾'],['magnet','磁铁'],['double','积分 ×2'],['boost','冲刺']])if(run[kind]>0)effects.push('<span class="effect-'+kind+'">'+name+' '+run[kind].toFixed(1)+'s</span>');
    effectText.innerHTML=effects.join('');
    const mission=run.mission();missionText.textContent='目标：'+mission.label+' '+mission.progress+'/'+mission.goal+(mission.field==='distance'?' 米':'')+' · +300 分';
    missionBar.style.width=(mission.progress/mission.goal*100)+'%';
    speedText.textContent=Math.floor(run.distance)+' m · '+Math.round(run.speed*3.6)+' km/h';
    onHUD({energy:run.energy,boost:run.boost,running:run.phase==='running'});
  }
  function processEvents() {
    for(const e of run.drainEvents()) {
      if(e.type==='pause'){onPause(e.paused);continue;}
      if(e.type==='end'){onEnd(run.summary());continue;}
      if(['smash','deflect','hit'].includes(e.type)&&e.entity) {
        const object=objects.get(e.entity.id)||createEntity(e.entity);objects.delete(e.entity.id);
        object.position.set(e.entity.x,0,e.entity.z);
        flying.push({object,life:0,vx:(e.entity.x>=run.x?1:-1)*(e.type==='smash'?7:4),vy:e.type==='smash'?8:3,vz:8,spin:e.type==='smash'?8:3});
        if(e.type==='hit'){host.dataset.impact='true';}
      }
      if(e.type==='start')onStatus('');
      // Timed effects already have badges; avoid repeating them as notifications.
      const redundant=['start','boost','deflect'].includes(e.type)||(e.type==='pickup'&&['shield','magnet','double'].includes(e.kind));
      if(e.text&&!redundant){
        notice.textContent=e.type==='hit'?'碰撞 · 耐久 '+run.hp+'/3':e.text;
        notice.dataset.tone=e.type;notice.classList.add('visible');noticeTime=e.type==='hit'?2:1.5;
      }
    }
    host.dataset.phase=run.phase;
  }
  function syncEntities() {
    const active=new Set();
    for(const e of run.entities) {
      active.add(e.id);const m=objects.get(e.id)||createEntity(e);
      m.position.set(e.x,['car','barrier'].includes(e.kind)?0:1.2+Math.sin(run.time*3+e.id)*.13,e.z);
      if(!['car','barrier'].includes(e.kind))m.rotation.y=run.time*1.8+e.id;
    }
    for(const [id,m] of objects)if(!active.has(id)){scene.remove(m);objects.delete(id);}
  }
  function animate(dt,delta) {
    setTheme();
    player.position.x=run.x;player.rotation.z=-(run.targetX-run.x)*.035;player.rotation.y=(run.targetX-run.x)*.04;
    player.visible=run.grace===0||Math.floor(run.time*12)%2===0;
    shadow.position.x=run.x;flames.visible=run.boost>0;flames.scale.z=1+Math.sin(run.time*30)*.1;streakGroup.visible=run.boost>0;
    aura.visible=run.shield>0||run.boost>0;auraMat.color.setHex(run.boost>0?0xf2ce86:0x69c9ec);auraMat.opacity=.15+Math.sin(run.time*4)*.035;
    for(const m of moving){m.position.z+=delta;if(m.position.z>24)m.position.z-=m.userData.loop;}
    for(let i=flying.length-1;i>=0;i--) {
      const f=flying[i];f.life+=dt;f.vy-=12*dt;f.object.position.x+=f.vx*dt;f.object.position.y+=f.vy*dt;f.object.position.z+=(f.vz*dt+delta*.3);f.object.rotation.z+=f.spin*dt;f.object.rotation.x+=dt*2;
      if(f.life>1.15){scene.remove(f.object);flying.splice(i,1);}
    }
    const shake=run.slow>0&&!reduced?Math.sin(run.time*60)*.06:0;
    camera.position.set(run.x*.23+shake,5.5,11);camera.lookAt(run.x*.2,0,-18);
    const targetFov=run.boost>0&&!reduced?60:52;camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*6);camera.updateProjectionMatrix();
    if(run.slow===0)delete host.dataset.impact;
  }
  function resize(){if(destroyed)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function frame(now) {
    if(destroyed)return;const dt=lastTime?Math.min((now-lastTime)/1000,.045):0;lastTime=now;
    const before=run.distance;run.update(dt);processEvents();syncEntities();animate(run.phase==='running'?dt:0,run.distance-before);
    const value=Math.floor(run.score);if(lastScore!==value){lastScore=value;onScore(value);}
    hudTime+=dt;if(hudTime>=.1){hudTime=0;updateHUD();}
    if(noticeTime>0&&run.phase==='running'){noticeTime-=dt;if(noticeTime<=0){notice.classList.remove('visible');notice.textContent='';}}
    renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  function lost(e){e.preventDefault();if(!destroyed){run.phase='ended';onEnd({...run.summary(),reason:'3D 画面中断，请重新开始'});}}
  renderer.domElement.addEventListener('webglcontextlost',lost);
  host.dataset.phase='ready';setTheme();updateHUD();raf=requestAnimationFrame(frame);
  const mapped={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowDown:'brake',s:'brake',S:'brake',ArrowUp:'boost',w:'boost',W:'boost',' ':'boost',Shift:'boost'};
  const api={
    start(){run.start();lastTime=0;processEvents();updateHUD();},
    pause(force){run.pause(force);processEvents();updateHUD();},
    key(key,down=true){if(key==='p'||key==='P'){if(down)api.pause();return true;}const action=mapped[key];if(action){run.input(action,down);return true;}return false;},
    input(action,down){run.input(action,down);},
    steer(value){run.steer(value);},
    clear(){run.clear();},
    destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.clear();objects.clear();for(const g of Object.values(geometries))g.dispose();for(const m of materials.values())m.dispose();extraMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();hud.remove();feedback.remove();}
  };
  return api;
}
