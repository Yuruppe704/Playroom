import assert from 'node:assert/strict';
import * as T from './dist/vendor/three.module.js';
import {cloudWorldY} from './dist/scene-motion.mjs';
import {createCityModels} from './dist/city-models.js';
import {HoleRun,CITY_TYPES} from './dist/arcade-core.mjs';
import {shoreDistance} from './dist/island-world.mjs';
const tick=(r,t)=>{for(let s=0;s<t;s+=.02)r.update(.02);};
for(let i=0;i<12;i++){
 assert.equal(cloudWorldY(i,0),cloudWorldY(i,-1),'normal descent must not move a world-space cloud');
 let previous=cloudWorldY(i,0);
 for(let cameraY=0;cameraY>-20000;cameraY-=.5){const next=cloudWorldY(i,cameraY);if(next!==previous){assert(previous>cameraY+35,'recycling must happen outside the visible region');assert.equal(previous-next,84);}const origin=-Math.floor(-cameraY/422.4)*422.4;assert(Math.abs(((next-origin)-(cameraY-origin))-(next-cameraY))<1e-8,'origin rebasing must preserve relative cloud position');previous=next;}
}
let seed=9182;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
{
 const r=new HoleRun(random),people=r.items.filter(i=>i.kind==='person');assert.equal(people.length,22);
 assert.deepEqual(new Set(r.items.filter(i=>i.kind==='tree').map(i=>i.variant)),new Set([0,1,2]));
 const p=people[5];r.items=[p];r.total=2;r.x=p.x-3;r.z=p.z;r.start();const distance=Math.hypot(p.x-r.x,p.z-r.z);tick(r,.6);
 assert(Math.hypot(p.x-r.x,p.z-r.z)>distance,'a pedestrian should run away from a nearby hole');assert(p.fleeing);assert(p.speed>1.15);
 r.pause(true);const before={x:p.x,z:p.z,phase:p.walkPhase};tick(r,3);assert.deepEqual({x:p.x,z:p.z,phase:p.walkPhase},before,'pause freezes positions and gait');
 r.pause();r.x=0;r.z=0;r.remaining=99;tick(r,60);assert(shoreDistance(p.x,p.z)>=3.2-1e-7);assert(Number.isFinite(p.heading));
 const value=r.score;assert(r.consume(p));assert(r.score>value);assert(!r.consume(p),'the same person cannot score twice');
}
{
 const geometries=[],materials=[];const models=createCityModels({geo:g=>(geometries.push(g),g),mat:(color,extra={})=>{const m=new T.MeshStandardMaterial({color,...extra});materials.push(m);return m;}});
 const treeSignatures=[];
 for(const kind of Object.keys(CITY_TYPES))for(let variant=0;variant<3;variant++){
  const item={kind,x:0,z:0,variant,appearance:variant,tilt:0,heading:0,speed:2.7,walkPhase:Math.PI/2,fleeing:true};const model=models.create(item);if(kind==='person'){models.animatePerson(item,model);assert(model.userData.legs[0].rotation.x*model.userData.legs[1].rotation.x<0,'running legs must swing in opposite directions');}
  const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3());assert([size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0));
  if(kind==='tree'){assert(size.y>1.5&&size.y<3);assert(size.x<3.2&&size.z<3.2);let vertices=0;model.traverse(o=>{if(o.isMesh)vertices+=o.geometry.attributes.position.count;});treeSignatures.push(vertices);}
  else if(kind!=='person')assert(Math.hypot(size.x,size.z)/2<CITY_TYPES[kind].need*1.15,'model footprint should fit its swallowing threshold');
 }
 assert.equal(new Set(treeSignatures).size,3,'all three tree silhouettes must use distinct geometry');geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
console.log('PASS: stationary clouds, offscreen recycling and origin rebasing; 22 pedestrians, fleeing, pause, coast bounds, swallow deduplication; three distinct trees, finite model geometry, footprints and running limb animation.');
