import * as T from './vendor/three.module.js';
import {TowerRun,HoleRun,TAU,clamp} from './arcade-core.mjs?v=1.7.0';

import {ISLAND_GLSL,holeViewHalf} from './island-world.mjs?v=1.7.0';
import {cloudWorldY} from './scene-motion.mjs?v=1.7.0';
import {createCityModels} from './city-models.js?v=1.7.0';
import {createIsland} from './island-scene.js?v=1.7.0';

export function mountArcade3D({kind,host,onScore,onEnd,onPause}){
  const tower=kind==='tower',run=tower?new TowerRun():new HoleRun();
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label',tower?'下坠小球 3D 圆环塔':'黑洞吞城 3D 城市地图');host.prepend(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(tower?0xeee9f4:0xe7eeeb);
  const camera=tower?new T.PerspectiveCamera(43,1,.1,180):new T.OrthographicCamera(-24,24,14,-14,.1,120);
  const geometries=[],materials=[],objects=new Map(),particles=[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function geo(g){geometries.push(g);return g;}
  function mat(color,extra={}){const m=new T.MeshStandardMaterial({color,roughness:.65,metalness:.08,...extra});materials.push(m);return m;}
  const boxGeo=geo(new T.BoxGeometry(1,1,1)),sphereGeo=geo(new T.SphereGeometry(1,24,16)),cylinderGeo=geo(new T.CylinderGeometry(1,1,1,32)),coneGeo=geo(new T.ConeGeometry(1,1,10));
  function mesh(g,m,scale,pos,parent=scene,cast=true){const o=new T.Mesh(g,m);o.scale.set(...scale);o.position.set(...pos);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
  function box(m,s,p,parent,cast=true){return mesh(boxGeo,m,s,p,parent,cast);}
  const hemi=new T.HemisphereLight(0xffffff,0x98a7aa,2.6);scene.add(hemi);
  const sun=new T.DirectionalLight(0xfff5e6,3);sun.position.set(-14,30,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;
  Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:85});sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target);
  const hud=document.createElement('div');hud.className='arcade-hud';hud.innerHTML='<span class="arcade-counter"></span><span class="arcade-effect"></span>';host.appendChild(hud);
  const info=document.createElement('div');info.className='arcade-feedback';info.innerHTML='<div class="arcade-progress"><span></span><i aria-hidden="true"><b></b></i></div><div class="arcade-notice" role="status" aria-live="polite" aria-atomic="true"></div>';host.after(info);
  const counter=hud.querySelector('.arcade-counter'),effect=hud.querySelector('.arcade-effect'),progress=info.querySelector('.arcade-progress span'),bar=info.querySelector('b'),notice=info.querySelector('.arcade-notice');
  let destroyed=false,raf=0,last=0,hudTick=1,lastScore=-1,noticeTime=0;
  let draw,point,fitCamera=()=>{};
  if(tower){
    const pillarMat=mat(0xd9cfdf),safeMats=[mat(0x94c6b4),mat(0xb2a2d1),mat(0x8fbacd),mat(0xd6b18a)],dangerMat=mat(0xe37f75),stripeMat=mat(0xffe9d6);
    const towerGroup=new T.Group();scene.add(towerGroup);
    const pillar=mesh(cylinderGeo,pillarMat,[.62,180,.62],[0,-45,0],towerGroup);
    function sectorGeometry(start,length){
      const positions=[],indices=[],steps=8;
      for(let i=0;i<=steps;i++){
        const a=start+length*i/steps;
        for(const y of [-.22,0])for(const r of [.68,3])positions.push(Math.sin(a)*r,y,Math.cos(a)*r);
      }
      const quad=(a,b,c,d)=>indices.push(a,b,c,a,c,d);
      for(let i=0;i<steps;i++){const a=i*4,b=a+4;quad(a+2,b+2,b+3,a+3);quad(a+1,b+1,b,a);quad(a,b,b+2,a+2);quad(a+3,b+3,b+1,a+1);}
      quad(0,2,3,1);const a=steps*4;quad(a+1,a+3,a+2,a);
      const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];g.setIndex(indices);g.computeVertexNormals();return g;
    }
    const sectorGeos=Array.from({length:12},(_,i)=>sectorGeometry(i*TAU/12+.008,TAU/12-.016));
    function syncFloors(origin){
      const active=new Set();
      for(const floor of run.floors){
        active.add(floor.id);let group=objects.get(floor.id);
        if(!group){
          group=new T.Group();group.rotation.y=floor.offset;towerGroup.add(group);objects.set(floor.id,group);
          floor.sectors.forEach((surface,i)=>{
            if(!surface)return;const a=(i+.5)*TAU/12;
            mesh(sectorGeos[i],surface===2?dangerMat:safeMats[Math.floor(floor.id/6)%safeMats.length],[1,1,1],[0,0,0],group);
            if(surface===2)for(const r of [1.25,1.9,2.55]){const stripe=box(stripeMat,[.12,.025,.28],[Math.sin(a)*r,.016,Math.cos(a)*r],group,false);stripe.rotation.y=a+.4;}
          });
        }
        group.position.y=floor.y-origin;group.visible=!floor.cleared;
      }
      for(const [id,group] of objects)if(!active.has(id)){towerGroup.remove(group);objects.delete(id);}
    }
    const ballMat=mat(0xf0b359,{metalness:.2,roughness:.3}),ball=mesh(sphereGeo,ballMat,[.28,.28,.28],[0,run.y,2.23]);
    const shadow=mesh(cylinderGeo,mat(0x46414f,{transparent:true,opacity:.17}),[.32,.012,.32],[0,.02,2.23],towerGroup,false);
    const trailMat=mat(0xffcc75,{transparent:true,opacity:.25,depthWrite:false});
    const trail=Array.from({length:7},(_,i)=>mesh(sphereGeo,trailMat,[.2-i*.02,.2-i*.02,.2-i*.02],[0,run.y,2.23],scene,false));
    const path=Array(30).fill(run.y);let cameraY=run.y;
    const sparkMat=mat(0xf1c67b,{emissive:0x6c3e12});
    const clouds=new T.Group();scene.add(clouds);const cloudMat=mat(0xffffff,{transparent:true,opacity:.35});
    for(let i=0;i<12;i++){const o=mesh(sphereGeo,cloudMat,[1.5+i%3,1.5+i%3,1.5+i%3],[(i%2?1:-1)*(9+i%4*2),4-i*7,-5-i%3*4],clouds,false);}
    draw=(dt)=>{
      const origin=-Math.floor(run.cleared/128)*128*3.3;
      syncFloors(origin);towerGroup.rotation.y=run.rotation;pillar.position.y=run.y-origin-45;
      ball.position.y=run.y-origin;ballMat.color.setHex(run.power>0?0xf07b50:0xf0b359);ballMat.emissive.setHex(run.power>0?0x793518:0x000000);
      const squash=run.velocity>6?1.2:1;ball.scale.set(.28*Math.sqrt(squash),.28/squash,.28*Math.sqrt(squash));
      path.unshift(run.y);path.length=30;trail.forEach((o,i)=>{o.position.y=path[Math.min(29,(i+1)*3)]-origin;o.visible=!reduced&&run.velocity<0;});
      const next=run.floors.find(f=>!f.cleared);shadow.visible=!!next;if(next){shadow.position.y=next.y-origin+.025;shadow.position.x=Math.sin(-run.rotation)*2.23;shadow.position.z=Math.cos(-run.rotation)*2.23;const radius=.3+clamp(run.y-next.y,0,4)*.05;shadow.scale.set(radius,.012,radius);}
      clouds.children.forEach((cloud,i)=>cloud.position.y=cloudWorldY(i,cameraY)-origin);
      cameraY+=(run.y-cameraY)*Math.min(1,dt*7);camera.position.set(7,cameraY-origin+5.4,11);camera.lookAt(0,cameraY-origin-3.8,0);
      sun.position.y=cameraY-origin+28;sun.target.position.y=cameraY-origin-6;
      for(const event of pendingVisual){if(event.type==='smash'||event.type==='pass'){
        if(event.type==='smash'&&!reduced)for(let i=0;i<9;i++){const a=i*TAU/9,o=mesh(boxGeo,sparkMat,[.22,.15,.22],[Math.sin(a)*2,event.floor.y-origin,Math.cos(a)*2]);particles.push({o,y:event.floor.y,vx:Math.sin(a)*3,vy:3+i%2,vz:Math.cos(a)*3,t:0});}
      }}
      for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.t+=dt;p.o.position.x+=p.vx*dt;p.y+=p.vy*dt;p.o.position.y=p.y-origin;p.o.position.z+=p.vz*dt;p.vy-=12*dt;p.o.rotation.x+=dt*3;if(p.t>1){scene.remove(p.o);particles.splice(i,1);}}
    };
    scene.fog=new T.Fog(0xeee9f4,27,65);
  }else{
    const uniforms={holeCenter:{value:new T.Vector2(0,0)},holeRadius:{value:run.radius}};
    function cutMat(color,options={},margin=-100){const m=mat(color,options);m.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniforms,{shoreMargin:{value:margin}});
      shader.vertexShader='varying vec3 vHoleWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHoleWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
      shader.fragmentShader='uniform vec2 holeCenter;uniform float holeRadius;uniform float shoreMargin;varying vec3 vHoleWorld;\n'+ISLAND_GLSL+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(distance(vHoleWorld.xz,holeCenter)<holeRadius||shoreDistance(vHoleWorld.xz)<shoreMargin)discard;');
    };return m;}
    const island=createIsland({scene,geo,cutMat,box});materials.push(island.waterMaterial);scene.background.setHex(0x70abb5);
    const black=mat(0x141526,{roughness:1}),rimMat=mat(0xb49be0,{emissive:0x493665,metalness:.25}),innerMat=mat(0x2b2441);
    const hole=new T.Group();scene.add(hole);
    const cavity=mesh(cylinderGeo,black,[run.radius,1.8,run.radius],[0,-1,0],hole,false);
    const lip=mesh(geo(new T.TorusGeometry(1,.045,8,64)),rimMat,[run.radius,run.radius,run.radius],[0,.055,0],hole,false);lip.rotation.x=-Math.PI/2;
    const inner=mesh(geo(new T.TorusGeometry(.72,.035,6,48)),innerMat,[run.radius,run.radius,run.radius],[0,-.6,0],hole,false);inner.rotation.x=-Math.PI/2;
    const cityModels=createCityModels({geo,mat});
    for(const item of run.items){const model=cityModels.create(item);scene.add(model);objects.set(item.id,model);}
    const marker=mesh(geo(new T.TorusGeometry(1,.028,6,64)),rimMat,[1,1,1],[0,.04,0],scene,false);marker.rotation.x=-Math.PI/2;
    let viewHalf=holeViewHalf(run.radius,1);
    fitCamera=(dt=0,instant=false)=>{
      const aspect=Math.max(.1,host.clientWidth/Math.max(1,host.clientHeight)),target=holeViewHalf(run.radius,aspect);
      viewHalf=instant?target:viewHalf+(target-viewHalf)*(1-Math.exp(-dt*4));
      camera.top=viewHalf;camera.bottom=-viewHalf;camera.left=-viewHalf*aspect;camera.right=viewHalf*aspect;camera.updateProjectionMatrix();
      // Move camera and target together: the hole stays exactly at visual center, even at the coast.
      camera.position.set(run.x,32,run.z+24);camera.lookAt(run.x,0,run.z);
      sun.position.set(run.x-14,30,run.z+20);sun.target.position.set(run.x,0,run.z);
    };
    fitCamera(0,true);
    const raycaster=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
    point=(x,y)=>{const r=host.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);if(raycaster.ray.intersectPlane(plane,hit))run.moveTo(hit.x,hit.z);};
    draw=(dt)=>{
      fitCamera(dt);island.time.value=run.time;
      hole.position.set(run.x,0,run.z);uniforms.holeCenter.value.set(run.x,run.z);uniforms.holeRadius.value=run.radius;
      cavity.scale.set(run.radius,1.8,run.radius);lip.scale.setScalar(run.radius);inner.scale.setScalar(run.radius);inner.rotation.z+=dt*.8;
      rimMat.emissiveIntensity=run.dash>0?2:1;
      marker.visible=!!run.target&&run.phase==='running';if(run.target){marker.position.set(run.target.x,.045,run.target.z);marker.scale.setScalar(.2);}
      for(const item of run.items){const o=objects.get(item.id);o.visible=!item.done;if(item.done)continue;
        if(item.kind==='person'&&!item.swallow){cityModels.animatePerson(item,o);}
        if(item.swallow>0){const t=clamp(item.swallow/.72,0,1);o.position.set(item.x+(run.x-item.x)*t,-t*t*8,item.z+(run.z-item.z)*t);o.rotation.z=Math.sin(item.tilt)*t*.8;o.rotation.x=Math.cos(item.tilt)*t*.8;o.scale.setScalar(1-t*.5);}
      }
    };
  }
  const pendingVisual=[];
  function events(){for(const e of run.drainEvents()){
    if(e.type==='pause'){onPause(e.paused);continue;}
    if(e.type==='end'){onEnd(e.result);continue;}
    pendingVisual.push(e);
    if(e.text&&e.type!=='pass'){notice.textContent=e.text;noticeTime=1.4;notice.classList.add('visible');}
  }}
  function updateHUD(){
    if(tower){counter.textContent='已穿过 '+run.cleared+' 层';effect.textContent=run.power>0?'破障 '+run.power.toFixed(1)+'s':run.streak>1?'连续下坠 ×'+run.streak:'';
      progress.textContent='无限模式 · 下坠 '+Math.floor(Math.max(0,-run.y))+' 米';bar.parentElement.hidden=true;
    }else{counter.textContent='剩余 '+Math.ceil(run.remaining)+' 秒';counter.dataset.urgent=String(run.remaining<15);effect.textContent='半径 '+(Math.round(run.radius*10)/10).toFixed(1)+' 米'+(run.combo>1?' · 连吞 ×'+run.combo:'');
      progress.textContent='已吞噬 '+run.eaten+' / '+run.total+' · 每 15 件 +5 秒';bar.style.width=(run.eaten/run.total*100)+'%';
    }
    effect.hidden=!effect.textContent;
  }
  function resize(){if(destroyed)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);if(tower)camera.aspect=r.width/r.height;else fitCamera(0,true);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();updateHUD();
  function frame(now){if(destroyed)return;const dt=last?Math.min((now-last)/1000,.045):0;last=now;run.update(dt);events();draw(run.phase==='running'?dt:0);pendingVisual.length=0;
    if(run.score!==lastScore){lastScore=run.score;onScore(run.score);}
    hudTick+=dt;if(hudTick>=.1){hudTick=0;updateHUD();}
    if(noticeTime>0&&run.phase==='running'){noticeTime-=dt;if(noticeTime<=0){notice.classList.remove('visible');notice.textContent='';}}
    renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  const keys=tower?{ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'}:{ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',' ':'dash',Shift:'dash'};
  function lost(e){e.preventDefault();if(!destroyed){run.phase='ended';onEnd({...run.summary(),error:'3D 画面中断，请重新开始'});}}
  renderer.domElement.addEventListener('webglcontextlost',lost);raf=requestAnimationFrame(frame);
  return {
    start(){run.start();last=0;updateHUD();},pause(force){run.pause(force);events();updateHUD();},
    key(key,down=true){if(key==='p'||key==='P'){if(down){run.pause();events();}return true;}if(keys[key]){run.input(keys[key],down);return true;}return false;},
    input(action,down){run.input(action,down);},clear(){run.clear();},
    drag(dx){if(tower)run.rotate(dx*.009);},point(x,y){point?.(x,y);},
    status(){return {running:run.phase==='running',cooldown:run.cooldown||0,dash:run.dash||0};},
    destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);scene.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();hud.remove();info.remove();}
  };
}
