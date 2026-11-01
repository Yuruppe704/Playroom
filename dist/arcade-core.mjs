import {onIsland,islandPosition,coastRadius} from './island-world.mjs?v=1.7.0';
export const TAU=Math.PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const wrap=a=>(a%TAU+TAU)%TAU;
class Run {
  constructor(){this.phase='ready';this.score=0;this.time=0;this.inputs=new Set();this.events=[];}
  start(){if(this.phase==='ready')this.phase='running';}
  input(key,down){if(!down)this.inputs.delete(key);else if(this.phase==='running')this.inputs.add(key);}
  clear(){this.inputs.clear();}
  pause(force){if(!['running','paused'].includes(this.phase))return;this.phase=force===true?'paused':this.phase==='paused'?'running':'paused';this.clear();this.events.push({type:'pause',paused:this.phase==='paused'});}
  drainEvents(){return this.events.splice(0);}
  end(won){if(this.phase!=='running')return;this.phase='ended';this.clear();this.events.push({type:'end',result:this.summary(won)});}
}
export class TowerRun extends Run {
  constructor(random=Math.random){
    super();this.random=random;this.rotation=0;this.y=2.3;this.velocity=0;this.cleared=0;this.streak=0;this.bestStreak=0;this.power=0;this.nextFloor=0;this.floors=[];
    this.ensureFloors();
  }
  ensureFloors(){
    // A bounded window persists through arbitrarily long runs; IDs never repeat.
    this.floors=this.floors.filter(f=>f.id>=this.cleared-3);
    while(this.nextFloor<this.cleared+28){
      const i=this.nextFloor++,gap=i===0?3:Math.floor(this.random()*12),sectors=Array(12).fill(1);
      for(let j=0;j<3;j++)sectors[(gap+j)%12]=0;
      if(i>1){const danger=(gap+5+Math.floor(this.random()*3))%12;sectors[danger]=2;if(i>9)sectors[(danger+2)%12]=2;if(i>79)sectors[(danger+3)%12]=2;}
      this.floors.push({id:i,y:-i*3.3,offset:i===0?0:(this.random()-.5)*.3,sectors,cleared:false});
    }
  }
  rotate(delta){if(this.phase==='running')this.rotation=wrap(this.rotation+delta);}
  surface(floor){
    // The ball is fixed at the front of the tower; rotation moves the rings underneath it.
    const a=wrap(-this.rotation-floor.offset),sector=x=>floor.sectors[Math.floor(wrap(x)/(TAU/12))];
    const middle=sector(a);return middle===0&&(sector(a-.12)!==0||sector(a+.12)!==0)?1:middle;
  }
  pass(floor,smashed=false){
    if(floor.cleared)return;floor.cleared=true;this.cleared++;this.streak++;this.bestStreak=Math.max(this.bestStreak,this.streak);
    const points=(smashed?30:10)*Math.min(this.streak,5);this.score+=points;
    if(this.streak===3)this.power=1.35;
    this.events.push({type:smashed?'smash':'pass',floor,points,text:smashed?'击碎圆环 +'+points:this.streak>1?'连续下坠 ×'+this.streak:''});

  }
  update(dt){
    if(this.phase!=='running')return;dt=clamp(dt,0,.05);this.time+=dt;this.power=Math.max(0,this.power-dt);
    this.ensureFloors();
    this.rotate(((this.inputs.has('right')?1:0)-(this.inputs.has('left')?1:0))*2.2*dt);
    // Substeps and swept plane contacts prevent tunneling during long drops.
    for(let remain=dt;remain>1e-8&&this.phase==='running';){
      const h=Math.min(remain,.01);remain-=h;const before=this.y;this.velocity=Math.max(-36,this.velocity-22*h);this.y+=this.velocity*h;
      for(const floor of this.floors){
        if(floor.cleared||this.velocity>=0||before<floor.y+.28-1e-7||this.y>floor.y+.28)continue;
        const surface=this.surface(floor);
        if(surface===0||this.power>0){this.pass(floor,surface!==0);continue;}
        this.y=floor.y+.28;
        if(surface===2){this.events.push({type:'hit',text:'触碰红色区域'});this.end(false);break;}
        this.velocity=7.2;this.streak=0;this.events.push({type:'bounce'});break;
      }
    }
    this.ensureFloors();
  }
  summary(){return {won:false,score:this.score,cleared:this.cleared,bestStreak:this.bestStreak};}
}
export const CITY_TYPES={
  person:{need:.48,mass:2,points:25,label:'小人'},cone:{need:.42,mass:1,points:10,label:'路锥'},bin:{need:.55,mass:2,points:15,label:'垃圾桶'},
  tree:{need:.74,mass:3,points:20,label:'树木'},car:{need:1.15,mass:7,points:40,label:'汽车'},
  house:{need:1.8,mass:15,points:80,label:'房屋'},tower:{need:2.8,mass:26,points:150,label:'高楼'},landmark:{need:3.65,mass:45,points:300,label:'中心大厦'}
};
export class HoleRun extends Run {
  constructor(random=Math.random){
    super();this.random=random;this.x=0;this.z=0;this.radius=.85;this.mass=0;this.remaining=90;this.eaten=0;this.combo=0;this.comboTime=0;this.bestCombo=0;this.target=null;this.dash=0;this.cooldown=0;this.nextId=1;this.items=[];
    const add=(kind,x,z)=>{if(!onIsland(x,z,Math.max(2.6,CITY_TYPES[kind].need+1.3)))return;const item={id:this.nextId++,kind,x,z,...CITY_TYPES[kind],swallow:0,done:false,tilt:random()*TAU,variant:Math.floor(random()*3),appearance:Math.floor(random()*6),heading:random()*TAU,wanderTime:0,walkPhase:random()*TAU,speed:0};this.items.push(item);return item;};
    // Small objects form several accessible routes out of the starting plaza.
    for(let i=0;i<20;i++){const a=i*2.39996,r=1.8+i*.22;add(i%3===0?'bin':'cone',Math.cos(a)*r,Math.sin(a)*r);}
    for(const side of [-1,1])for(let i=0;i<13;i++)add(i%3===0?'tree':'car',-18+i*3,side*3.5);
    for(const z of [-9,-6,6,9])for(const x of [-17,-13,-9,-5,5,9,13,17]){
      const far=Math.abs(x)>10;
      add(far?(Math.abs(z)===9?'tower':'house'):'house',x+(random()-.5)*.3,z);
      add('tree',x+1.35,z+1.15);add('bin',x-1.25,z-1.15);
    }
    for(let i=0;i<16;i++)add('cone',-18+i*2.4,i%2?-1.5:1.5);
    for(let i=0;i<20;i++){const a=i*TAU/20,r=coastRadius(a)-4.2;add(i%4===0?'bin':'tree',Math.cos(a)*r,Math.sin(a)*r);}
    for(let i=0;i<22;i++)add('person',-15+(i%11)*3,(i<11?1:-1)*(4.4+i%3*.25));
    add('landmark',0,-9);this.total=this.items.length;
  }
  input(key,down){super.input(key,down);if(down&&this.phase==='running'){this.target=null;if(key==='dash')this.activateDash();}}
  clear(){super.clear();this.target=null;}
  moveTo(x,z){if(this.phase==='running')this.target=islandPosition(x,z,this.radius+.35);}
  activateDash(){if(this.phase!=='running'||this.cooldown>0)return false;this.dash=1.1;this.cooldown=6;return true;}
  consume(item){
    if(this.phase!=='running'||item.done||item.swallow>0||this.radius+1e-7<item.need)return false;
    item.swallow=.001;this.eaten++;this.mass+=item.mass;this.radius=Math.min(4.8,.85+Math.sqrt(this.mass)*.19);
    this.combo=this.comboTime>0?Math.min(5,this.combo+1):1;this.bestCombo=Math.max(this.bestCombo,this.combo);this.comboTime=2.4;
    const points=item.points*this.combo;this.score+=points;
    let bonus='';if(this.eaten%15===0){this.remaining=Math.min(99,this.remaining+5);bonus=' · 时间 +5 秒';}
    this.events.push({type:'eat',item,points,text:item.label+' +'+points+bonus});
    if(this.eaten===this.total){this.score+=1000;this.end(true);}return true;
  }
  updatePeople(dt){
    const solids=this.items.filter(e=>['house','tower','landmark','car'].includes(e.kind)&&!e.done&&!e.swallow);
    for(const person of this.items){
      if(person.kind!=='person'||person.done||person.swallow)continue;
      const hx=person.x-this.x,hz=person.z-this.z,distance=Math.hypot(hx,hz),fleeing=distance<7+this.radius;
      person.wanderTime-=dt;
      if(person.wanderTime<=0){person.wanderHeading=this.random()*TAU;person.wanderTime=1.5+this.random()*2.5;}
      let dx=fleeing?hx/Math.max(.05,distance):Math.sin(person.wanderHeading),dz=fleeing?hz/Math.max(.05,distance):Math.cos(person.wanderHeading);
      // A gentle tangent breaks deadlocks when fleeing directly into a building.
      if(fleeing){const side=person.id%2?1:-1;dx+=-hz/Math.max(.05,distance)*.18*side;dz+=hx/Math.max(.05,distance)*.18*side;}
      for(const solid of solids){const x=person.x-solid.x,z=person.z-solid.z,d=Math.hypot(x,z),clearance=solid.need*.74+.42;
        if(d<clearance){const force=(clearance-d)/clearance*4;dx+=x/Math.max(.01,d)*force;dz+=z/Math.max(.01,d)*force;}
      }
      const norm=Math.hypot(dx,dz),speed=fleeing?2.7:1.15;
      const beforeX=person.x,beforeZ=person.z;
      if(norm>.01){const position=islandPosition(person.x+dx/norm*speed*dt,person.z+dz/norm*speed*dt,3.2);person.x=position.x;person.z=position.z;}
      const moved=Math.hypot(person.x-beforeX,person.z-beforeZ);person.speed=dt?moved/dt:0;person.fleeing=fleeing;
      if(moved>.0001){const target=Math.atan2(person.x-beforeX,person.z-beforeZ),turn=Math.atan2(Math.sin(target-person.heading),Math.cos(target-person.heading));person.heading+=turn*Math.min(1,dt*10);person.walkPhase+=person.speed*dt*7;}
      if(moved<speed*dt*.35){person.wanderHeading=wrap((person.wanderHeading||0)+Math.PI*.6);person.wanderTime=.7;}
    }
  }
  update(dt){
    if(this.phase!=='running')return;dt=clamp(dt,0,.05);this.time+=dt;this.remaining=Math.max(0,this.remaining-dt);this.dash=Math.max(0,this.dash-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.comboTime=Math.max(0,this.comboTime-dt);if(!this.comboTime)this.combo=0;
    if(this.remaining===0){this.end(false);return;}
    let dx=(this.inputs.has('right')?1:0)-(this.inputs.has('left')?1:0),dz=(this.inputs.has('down')?1:0)-(this.inputs.has('up')?1:0);
    if(this.target){this.target=islandPosition(this.target.x,this.target.z,this.radius+.35);dx=this.target.x-this.x;dz=this.target.z-this.z;}
    const length=Math.hypot(dx,dz),step=(this.dash>0?11:6.4)*dt;
    if(length>.02){const move=this.target?Math.min(length,step):step;const position=islandPosition(this.x+dx/length*move,this.z+dz/length*move,this.radius+.35);this.x=position.x;this.z=position.z;}
    const center=islandPosition(this.x,this.z,this.radius+.35);this.x=center.x;this.z=center.z;
    this.updatePeople(dt);
    const reach=this.radius*.52;
    for(const item of this.items){
      if(item.done)continue;
      if(item.swallow>0){item.swallow+=dt;if(item.swallow>=.72)item.done=true;continue;}
      if(Math.hypot(item.x-this.x,item.z-this.z)<=reach)this.consume(item);
    }
  }
  summary(won=false){return {won,score:this.score,eaten:this.eaten,total:this.total,radius:this.radius,bestCombo:this.bestCombo};}
}
