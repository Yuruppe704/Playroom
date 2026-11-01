import assert from 'node:assert/strict';
import {DriveRun,DRIVE_RULES} from './dist/drive-core.mjs';

function quiet(){const r=new DriveRun(()=>.35);r.start();r.entities=[];r.nextWave=r.nextCoins=r.nextPickup=Infinity;r.drainEvents();return r;}
function tick(r,seconds){for(let t=0;t<seconds-1e-8;t+=.02)r.update(Math.min(.02,seconds-t));}
function hazard(r,kind='car',x=0,z=2){return r.addEntity(kind,x,z);}

{
 const r=quiet();r.collect('shield');
 assert.equal(r.shield,8);hazard(r);r.update(.02);assert.equal(r.hp,3);
 tick(r,1);const before={distance:r.distance,shield:r.shield,energy:r.energy};r.pause(true);tick(r,10);
 assert.deepEqual({distance:r.distance,shield:r.shield,energy:r.energy},before,'pause must freeze movement, effect expiry and recharge');
 r.pause();tick(r,7.1);assert.equal(r.shield,0);hazard(r);r.update(.02);assert.equal(r.hp,2,'damage resumes after the eight-second shield');
}
{
 const r=quiet();assert.equal(r.activateBoost(),true);assert.equal(r.energy,5);assert.equal(r.boost,3.5);
 const e=hazard(r);r.update(.02);assert.equal(r.hp,3);assert.equal(r.smashes,1);
 let hits=r.drainEvents().filter(e=>e.type==='smash');assert.equal(hits[0].points,150);assert.equal(hits[0].entity.id,e.id);
 r.update(.02);assert.equal(r.smashes,1,'the same car must not score again on the next frame');
 hazard(r);r.update(.02);hits=r.drainEvents().filter(e=>e.type==='smash');assert.equal(hits[0].points,300,'second smash doubles its bonus');
 r.collect('double');hazard(r);r.update(.02);hits=r.drainEvents().filter(e=>e.type==='smash');assert.equal(hits[0].points,900,'double points stacks with the third combo');
 tick(r,3.6);assert.equal(r.boost,0);hazard(r);r.update(.02);assert.equal(r.hp,2,'boost immunity must expire');
}
{
 const r=quiet();r.energy=59;assert.equal(r.activateBoost(),false);assert.equal(r.boost,0);assert.equal(r.energy,59);
 r.collect('nitro');assert.equal(r.energy,100);assert.equal(r.activateBoost(),true);assert.equal(r.energy,40);
 r.pause(true);const energy=r.energy;assert.equal(r.activateBoost(),false);assert.equal(r.energy,energy);
}
{
 const r=quiet();r.activateBoost();hazard(r,'barrier',0,.5);r.update(.05);
 assert.equal(r.drainEvents().filter(e=>e.type==='smash')[0].points,75,'fast movement must use swept collision rather than skip a thin road barrier');
 assert.equal(r.smashes,0,'road barriers must not count as flipped cars');
}
{
 const r=quiet();r.collect('magnet');r.addEntity('coin',3,-9);tick(r,1.2);assert.equal(r.coins,1,'magnet pulls a coin from an adjacent lane');
 const before=r.score;r.collect('double');r.collect('coin');assert.equal(r.score-before,20);assert.equal(r.coins,2,'score multiplier must not counterfeit collected coins');
 tick(r,10.1);assert.equal(r.magnet,0);assert.equal(r.double,0);
}
{
 const r=quiet();hazard(r);r.update(.02);assert.equal(r.hp,2);hazard(r);r.update(.02);assert.equal(r.hp,2,'post-hit grace prevents rapid duplicate damage');
 r.collect('repair');assert.equal(r.hp,3);r.collect('repair');assert.equal(r.hp,3,'repair cannot exceed three durability');
 for(let i=0;i<3;i++){tick(r,1.9);hazard(r);r.update(.02);}
 assert.equal(r.phase,'ended');assert.equal(r.hp,0);const score=r.score;tick(r,4);assert.equal(r.score,score,'game-over stops score and movement');
}
{
 const r=quiet();for(let i=0;i<20;i++)r.collect('coin');r.update(.02);assert.equal(r.missionDone,1);assert.equal(r.mission().field,'passed');assert.equal(Math.floor(r.score),500);
 for(let i=0;i<8;i++)hazard(r,'car',3,11);r.update(.02);assert.equal(r.passed,8);assert.equal(r.missionDone,2);assert.equal(r.mission().field,'smashes');
}
{
 let seed=789;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const r=new DriveRun(random);r.distance=1200;
 for(let i=0;i<300;i++){r.entities=[];r.spawnWave();const hazards=r.entities.filter(e=>['car','barrier'].includes(e.kind));assert(hazards.length<=2);assert(new Set(hazards.map(e=>e.x)).size<=2,'every spawned wave preserves a safe lane');}
}
{
 const r=quiet();r.input('left',true);r.input('left',true);assert.equal(r.targetX,-3);r.input('left',false);r.input('right',true);assert.equal(r.targetX,0);
 r.distance=DRIVE_RULES.zoneLength-.1;r.update(.02);assert.equal(r.zone,1);
 r.distance=DRIVE_RULES.zoneLength*2-.1;r.update(.02);assert.equal(r.zone,2);
 r.distance=DRIVE_RULES.zoneLength*3-.1;r.update(.02);assert.equal(r.zone,0);
}
console.log('PASS: shield duration, pause freeze, boost immunity and expiry, smash combo and deduplication, score stacking, swept collision, magnet, energy, repair, durability, missions, 300 safe-lane waves and three zones.');
