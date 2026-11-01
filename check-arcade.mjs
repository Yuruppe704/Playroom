import assert from 'node:assert/strict';
import {TowerRun,HoleRun,TAU,wrap} from './dist/arcade-core.mjs';
import {coastRadius,onIsland,islandPosition,shoreDistance,holeViewHalf} from './dist/island-world.mjs';
const tick=(r,t)=>{for(let s=0;s<t-1e-9;s+=.01)r.update(Math.min(.01,t-s));};
{
 const r=new TowerRun(()=>.3);r.start();tick(r,1);
 assert.equal(r.cleared,0);assert.equal(r.phase,'running');assert(r.y>=.28,'safe platform must bounce the ball');
 r.input('left',true);const before=r.rotation;tick(r,.1);assert.notEqual(r.rotation,before);r.input('left',false);
 const state={y:r.y,rotation:r.rotation,score:r.score};r.pause(true);r.rotate(1);tick(r,5);assert.deepEqual({y:r.y,rotation:r.rotation,score:r.score},state,'pause freezes physics and drag');
}
{
 const r=new TowerRun(()=>.2);r.floors[0].sectors.fill(2);r.start();tick(r,1);
 assert.equal(r.phase,'ended');assert.equal(r.drainEvents().filter(e=>e.type==='end').length,1);const score=r.score;tick(r,5);assert.equal(r.score,score);
}
{
 const r=new TowerRun(()=>.5);for(const f of r.floors)f.sectors.fill(0);r.floors[3].sectors.fill(2);r.start();tick(r,1.8);
 assert(r.cleared>=4,'three consecutive gaps must grant protection through a red platform');assert(r.score>40);assert(r.drainEvents().some(e=>e.type==='smash'));
}
{
 const r=new TowerRun(()=>.5);r.start();
 for(let step=0;r.cleared<5000&&step<60000;step++){
  const floor=r.floors.find(f=>!f.cleared),start=floor.sectors.findIndex((s,i)=>s===0&&floor.sectors[(i+11)%12]!==0);
  r.rotate(wrap(-(start+1.5)*TAU/12-floor.offset)-r.rotation);r.update(.02);r.drainEvents();
  assert(r.floors.length<=31,'old floors must be pruned in a bounded window');
 }
 assert.equal(r.cleared,5000);assert.equal(r.phase,'running','there must be no victory or bottom after 24 or 5000 floors');
 assert(r.nextFloor>=5028);assert(r.y<-16000);assert(r.score>200000);
 assert.equal(new Set(r.floors.map(f=>f.id)).size,r.floors.length);
 const floor=r.floors.find(f=>!f.cleared);floor.sectors.fill(2);r.power=0;r.y=floor.y+1;r.velocity=-10;tick(r,.2);assert.equal(r.phase,'ended','red still ends an arbitrarily long run');
}
{
 for(let n=0;n<100;n++){const r=new TowerRun();for(const f of r.floors){assert.equal(f.sectors.filter(x=>x===0).length,3);let reachable=false;for(let i=0;i<24;i++){r.rotation=i*TAU/24;if(r.surface(f)===0)reachable=true;}assert(reachable,'every floor needs an accessible gap');}}
}
{
 const r=new HoleRun(()=>.5);r.start();const house=r.items.find(x=>x.kind==='house');assert.equal(r.consume(house),false,'small hole must not swallow a building');
 const cone=r.items.find(x=>x.kind==='cone');assert.equal(r.consume(cone),true);const score=r.score;assert.equal(r.consume(cone),false);assert.equal(r.score,score,'swallowing object must not score twice');
 const bin=r.items.find(x=>x.kind==='bin');r.consume(bin);assert.equal(r.combo,2);assert(r.radius>.85);
 tick(r,2.5);assert.equal(r.combo,0);assert.equal(cone.done,true,'swallowed objects finish their animation and leave the map');
}
{
 const r=new HoleRun(()=>.5);r.start();r.activateDash();r.moveTo(100,100);tick(r,.2);assert(r.x>0&&r.z>0);r.pause(true);
 const before={x:r.x,z:r.z,time:r.remaining,dash:r.dash,cooldown:r.cooldown};tick(r,10);assert.deepEqual({x:r.x,z:r.z,time:r.remaining,dash:r.dash,cooldown:r.cooldown},before,'pause freezes countdown and dash cooldown');assert.equal(r.target,null);
 r.pause();tick(r,6);assert.equal(r.cooldown,0);assert.equal(r.activateDash(),true);
 r.input('right',true);tick(r,10);assert(shoreDistance(r.x,r.z)>=r.radius+.35-1e-7,'movement stays on the island, including dashing');
}
{
 const r=new HoleRun(()=>.5);r.start();r.remaining=50;let progress=true;while(progress){progress=false;for(const item of r.items)if(!item.swallow&&r.consume(item))progress=true;}
 assert.equal(r.eaten,r.total,'small-object growth must make every building reachable');assert.equal(r.phase,'ended');assert(r.radius>=3.65);assert(r.remaining>50,'collection milestones add time');assert(r.drainEvents().find(e=>e.type==='end').result.won);
}
{
 const r=new HoleRun(()=>.5);r.start();r.items=[];tick(r,91);assert.equal(r.remaining,0);assert.equal(r.phase,'ended');const score=r.score;tick(r,5);assert.equal(r.score,score);
}
console.log('PASS: endless tower over 5000 floors with bounded memory, bounce, rotation, safe gaps, hazards, combo breakthrough, swept drops and pause; hole size gating, growth through all building tiers, combo, deduplication, swallowing, dash, bounds, time rewards, timeout and pause.');

{
 let min=Infinity,max=0;
 for(let i=0;i<360;i++){const a=i*TAU/360,r=coastRadius(a);min=Math.min(min,r);max=Math.max(max,r);
  assert(onIsland(Math.cos(a)*(r-1),Math.sin(a)*(r-1)));assert(!onIsland(Math.cos(a)*(r+1),Math.sin(a)*(r+1)));
  for(const margin of [1.2,3,5.15]){const p=islandPosition(Math.cos(a)*100,Math.sin(a)*100,margin);assert(shoreDistance(p.x,p.z)>=margin-1e-7);}
 }
 assert(max-min>7,'coast must be irregular');const r=new HoleRun();for(const e of r.items)assert(onIsland(e.x,e.z,2.5),'objects must stay on dry land');
 for(const aspect of [.6,1,3]){let old=0;for(let radius=.85;radius<=4.8;radius+=.05){const half=holeViewHalf(radius,aspect);assert(half>old);assert(half>radius*2);old=half;}}
 console.log('PASS: shared island coast, dry-land props, boundary projection in 360 directions, and zoom expanding with growth.');
}
