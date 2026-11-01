export const DRIVE_RULES = Object.freeze({shield:8,magnet:10,double:10,boost:3.5,boostCost:60,maxEnergy:100,maxHp:3,zoneLength:800});
export const DRIVE_ZONES = ['城市大道','沙漠公路','霓虹夜道'];
export const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const LANES = [-3,0,3];
const MISSIONS = [
  {field:'coins',goal:20,label:'收集金币'},
  {field:'passed',goal:8,label:'超越车辆'},
  {field:'smashes',goal:3,label:'冲刺撞翻'},
  {field:'distance',goal:1000,label:'行驶距离'}
];

export class DriveRun {
  constructor(random=Math.random) {
    this.random=random;this.phase='ready';this.distance=0;this.score=0;this.coins=0;this.hp=3;
    this.energy=65;this.shield=0;this.magnet=0;this.double=0;this.boost=0;this.grace=0;this.slow=0;
    this.x=0;this.targetX=0;this.speed=0;this.time=0;this.passed=0;this.smashes=0;this.near=0;
    this.combo=0;this.comboTime=0;this.zone=0;this.missionIndex=0;this.missionDone=0;this.missionBase=0;
    this.entities=[];this.events=[];this.inputs=new Set();this.nextId=1;
    this.nextWave=25;this.nextCoins=35;this.nextPickup=95;this.pickupIndex=0;
    for(let i=0;i<5;i++)this.addEntity('coin',0,-15-i*5);
    this.addEntity('shield',0,-45);
  }
  emit(type,text='',extra={}){this.events.push({type,text,...extra});}
  drainEvents(){return this.events.splice(0);}
  start(){if(this.phase!=='ready')return;this.phase='running';this.emit('start','左右换道，空格冲刺；收集蓝色护盾获得 8 秒保护。');}
  pause(force){if(!['running','paused'].includes(this.phase))return;this.phase=force===true?'paused':this.phase==='paused'?'running':'paused';this.inputs.clear();this.emit('pause','',{paused:this.phase==='paused'});}
  clear(){this.inputs.clear();}
  input(action,down) {
    if(!down){this.inputs.delete(action);return;}
    if(this.phase!=='running'||this.inputs.has(action))return;
    this.inputs.add(action);
    if(action==='left'||action==='right')this.targetX=clamp(this.targetX+(action==='left'?-3:3),-3,3);
    if(action==='boost')this.activateBoost();
  }
  steer(normal){if(this.phase==='running')this.targetX=clamp(Math.round(normal*1.6),-1,1)*3;}
  activateBoost() {
    if(this.phase!=='running'||this.boost>0)return false;
    if(this.energy<DRIVE_RULES.boostCost){this.emit('notice','氮气不足：需要 60，当前 '+Math.floor(this.energy));return false;}
    this.energy-=DRIVE_RULES.boostCost;this.boost=DRIVE_RULES.boost;this.combo=0;this.comboTime=0;
    this.emit('boost','冲刺 3.5 秒 · 碰撞免伤，撞翻车辆加分');return true;
  }
  addEntity(kind,x,z) {
    const e={id:this.nextId++,kind,x,z,checked:false,color:Math.floor(this.random()*5)};
    this.entities.push(e);return e;
  }
  addScore(points){this.score+=points*(this.double>0?2:1);}
  collect(kind) {
    if(this.phase!=='running')return;
    if(kind==='coin'){this.coins++;this.addScore(10);this.energy=clamp(this.energy+.8,0,100);return;}
    if(['shield','magnet','double'].includes(kind)) {
      this[kind]=DRIVE_RULES[kind];
      this.emit('pickup',kind==='shield'?'护盾 8 秒 · 碰撞免伤':kind==='magnet'?'磁铁 10 秒 · 吸取附近金币':'双倍积分 10 秒',{kind});
    } else if(kind==='nitro'){this.energy=clamp(this.energy+45,0,100);this.emit('pickup','补充 45 氮气',{kind});}
    else if(kind==='repair'){const before=this.hp;this.hp=clamp(this.hp+1,0,3);if(before===3)this.addScore(50);this.emit('pickup',before===3?'耐久已满 · +50 分':'修复 1 格耐久',{kind});}
  }
  collide(e) {
    if(this.phase!=='running')return;
    if(this.boost>0) {
      this.combo=clamp(this.combo+1,1,5);this.comboTime=4;if(e.kind==='car')this.smashes++;
      const points=(e.kind==='barrier'?75:150)*this.combo*(this.double>0?2:1);
      this.score+=points;this.energy=clamp(this.energy+5,0,100);
      this.emit('smash',(e.kind==='barrier'?'撞开路障 +':'撞翻 +')+points+(this.combo>1?' · 连撞 ×'+this.combo:''),{entity:e,points});
    } else if(this.shield>0||this.grace>0) {
      this.emit('deflect',this.shield>0?'护盾挡下碰撞':'碰撞保护中',{entity:e});
    } else {
      this.hp--;this.grace=1.8;this.slow=.8;
      this.emit('hit','发生碰撞 · 耐久 '+this.hp+'/3',{entity:e});
      if(this.hp===0){this.phase='ended';this.inputs.clear();this.emit('end','车辆损坏');}
    }
  }
  mission() {
    const m=MISSIONS[this.missionIndex%MISSIONS.length];
    const goal=m.goal+(m.field==='coins'?Math.floor(this.missionIndex/4)*10:0);
    return {...m,goal,progress:Math.min(goal,Math.floor(this[m.field]-this.missionBase))};
  }
  updateMission() {
    const m=this.mission();if(m.progress<m.goal)return;
    this.addScore(300);this.energy=clamp(this.energy+20,0,100);this.missionDone++;this.missionIndex++;
    this.missionBase=this[MISSIONS[this.missionIndex%MISSIONS.length].field];
    this.emit('mission','目标完成 · +'+(this.double>0?600:300)+' 分 · 氮气 +20');
  }
  spawnWave() {
    const safe=Math.floor(this.random()*3);
    const blocked=[0,1,2].filter(n=>n!==safe);
    if(this.random()<.5)blocked.reverse();
    const count=this.distance>450&&this.random()<.5?2:1;
    for(let i=0;i<count;i++)this.addEntity(this.distance>650&&this.random()<.22?'barrier':'car',LANES[blocked[i]],-105);
    // Every wave has a clear lane. Coins mark a possible route without creating a full-width wall.
    for(let i=0;i<5;i++)this.addEntity('coin',LANES[safe],-99-i*5);
  }
  update(dt) {
    if(this.phase!=='running')return;
    dt=clamp(dt,0,.05);this.time+=dt;
    for(const key of ['shield','magnet','double','boost','grace','slow','comboTime'])this[key]=Math.max(0,this[key]-dt);
    if(!this.comboTime)this.combo=0;
    if(!this.boost)this.energy=clamp(this.energy+3.5*dt,0,100);
    this.speed=this.boost>0?55:this.slow>0?16:this.inputs.has('brake')?13:26+Math.min(this.distance/180,13);
    const delta=this.speed*dt;this.distance+=delta;this.addScore(delta);
    this.x+=(this.targetX-this.x)*Math.min(1,dt*13);
    const zone=Math.floor(this.distance/DRIVE_RULES.zoneLength)%DRIVE_ZONES.length;
    if(zone!==this.zone){this.zone=zone;this.emit('zone','进入'+DRIVE_ZONES[zone]);}
    if(this.distance>=this.nextWave){this.spawnWave();this.nextWave=this.distance+Math.max(47,65-this.distance/250);}
    if(this.distance>=this.nextCoins){
      const x=LANES[Math.floor(this.random()*3)];for(let i=0;i<4;i++)this.addEntity('coin',x,-115-i*5);
      this.nextCoins=this.distance+75;
    }
    if(this.distance>=this.nextPickup){
      const sequence=['nitro','magnet','double','shield','repair'];
      const kind=this.hp===1?'repair':sequence[this.pickupIndex++%sequence.length];
      this.addEntity(kind,LANES[Math.floor(this.random()*3)],-98);this.nextPickup=this.distance+155;
    }
    for(let i=this.entities.length-1;i>=0;i--) {
      const e=this.entities[i],previousZ=e.z;e.z+=delta*(e.kind==='car'?.66:1);
      if(e.kind==='coin'&&this.magnet>0&&Math.abs(e.z-2)<22) {
        e.x+=(this.x-e.x)*Math.min(1,dt*9);e.z+=(2-e.z)*Math.min(1,dt*3.5);
      }
      const dx=Math.abs(e.x-this.x),dz=Math.abs(e.z-2);
      const hazard=e.kind==='car'||e.kind==='barrier';
      if(hazard) {
        if((dz<(e.kind==='car'?2.35:1.05)||(previousZ<2&&e.z>=2))&&dx<1.42){this.collide(e);this.entities.splice(i,1);if(this.phase==='ended')return;continue;}
        if(!e.checked&&e.z>3.8){e.checked=true;if(e.kind==='car'&&this.boost===0&&dx>=1.42&&dx<2.35){this.near++;this.addScore(40);this.energy=clamp(this.energy+12,0,100);this.emit('near','险超 +'+(this.double>0?80:40)+' 分 · 氮气 +12');}}
        if(e.z>10){if(e.kind==='car')this.passed++;this.addScore(e.kind==='car'?25:10);this.entities.splice(i,1);continue;}
      } else if(dz<1.7&&dx<(e.kind==='coin'?.95:1.1)){this.collect(e.kind);this.entities.splice(i,1);continue;}
      if(e.z>15)this.entities.splice(i,1);
    }
    this.updateMission();
  }
  summary(){return {score:Math.floor(this.score),distance:Math.floor(this.distance),coins:this.coins,passed:this.passed,smashes:this.smashes,missions:this.missionDone,reason:'耐久耗尽'};}
}
