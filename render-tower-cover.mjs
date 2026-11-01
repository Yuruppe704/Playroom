// Static SVG cover projected from the same dimensions, camera angle and colors as the game.
import * as T from './dist/vendor/three.module.js';
import {writeFileSync} from 'node:fs';
const width=512,height=320,tau=Math.PI*2;
const camera=new T.PerspectiveCamera(43,width/height,.1,180);
camera.position.set(7,6.5,11);camera.lookAt(0,-2.7,0);camera.updateMatrixWorld();
const light=new T.Vector3(-14,28,15).normalize(),faces=[];
const zoom=1.16,offsetY=-3;
function project(v){const p=v.clone().project(camera);return [(p.x*width/2)*zoom+width/2,(-p.y*height/2)*zoom+height/2+offsetY];}
function color(hex,normal){const c=new T.Color(hex),strength=.82+.21*Math.max(0,normal.dot(light));c.multiplyScalar(strength);return '#'+c.getHexString();}
function polygon(points,hex,normal,opacity=1){
 const center=points.reduce((v,p)=>v.add(p),new T.Vector3()).multiplyScalar(1/points.length);
 if(normal.dot(camera.position.clone().sub(center))<=0)return;
 const projected=points.map(project);if(projected.every(p=>p[0]<-2)||projected.every(p=>p[0]>width+2)||projected.every(p=>p[1]<-2)||projected.every(p=>p[1]>height+2))return;
 const depth=-center.clone().applyMatrix4(camera.matrixWorldInverse).z;
 const fill=color(hex,normal),d=projected.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(' ')).join('')+'Z';
 faces.push({depth,svg:`<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width=".32" stroke-linejoin="round"${opacity<1?` opacity="${opacity}"`:''}/>`});
}
function xyz(r,a,y){return new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);}
function circle3d(center,r,fill,opacity=1){
 const p=project(center),right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(r).add(center),q=project(right),radius=Math.hypot(q[0]-p[0],q[1]-p[1]);
 faces.push({depth:-center.clone().applyMatrix4(camera.matrixWorldInverse).z,svg:`<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="${radius.toFixed(2)}" fill="${fill}"${opacity<1?` opacity="${opacity}"`:''}/>`});
}
// Split the upright cylinder into short world-space bands so the rings occlude it correctly.
for(let y=-15;y<7;y+=.5)for(let j=0;j<32;j++){
 const a=j*tau/32,b=(j+1)*tau/32,m=(a+b)/2;
 polygon([xyz(.62,a,y),xyz(.62,b,y),xyz(.62,b,y+.5),xyz(.62,a,y+.5)],0xd9cfdf,new T.Vector3(Math.sin(m),0,Math.cos(m)));
}
const layers=[{y:0,gap:3,danger:8,rotation:0},{y:-3.3,gap:9,danger:3,rotation:.10},{y:-6.6,gap:5,danger:10,rotation:-.12},{y:-9.9,gap:1,danger:6,rotation:.08}];
for(const floor of layers)for(let sector=0;sector<12;sector++){
 if([0,1,2].some(i=>(floor.gap+i)%12===sector))continue;
 const a=sector*tau/12+.008+floor.rotation,b=(sector+1)*tau/12-.008+floor.rotation,hex=sector===floor.danger?0xe37f75:0x94c6b4,steps=8;
 const top=[];for(let i=0;i<=steps;i++)top.push(xyz(3,a+(b-a)*i/steps,floor.y));for(let i=steps;i>=0;i--)top.push(xyz(.68,a+(b-a)*i/steps,floor.y));
 polygon(top,hex,new T.Vector3(0,1,0));
 for(let i=0;i<steps;i++){
  const u=a+(b-a)*i/steps,v=a+(b-a)*(i+1)/steps,m=(u+v)/2;
  polygon([xyz(3,u,floor.y),xyz(3,v,floor.y),xyz(3,v,floor.y-.22),xyz(3,u,floor.y-.22)],hex,new T.Vector3(Math.sin(m),0,Math.cos(m)));
  polygon([xyz(.68,v,floor.y),xyz(.68,u,floor.y),xyz(.68,u,floor.y-.22),xyz(.68,v,floor.y-.22)],hex,new T.Vector3(-Math.sin(m),0,-Math.cos(m)));
 }
 for(const [angle,sign] of [[a,-1],[b,1]])polygon([xyz(.68,angle,floor.y),xyz(3,angle,floor.y),xyz(3,angle,floor.y-.22),xyz(.68,angle,floor.y-.22)],hex,new T.Vector3(Math.cos(angle)*sign,0,-Math.sin(angle)*sign));
 if(sector===floor.danger){
  const angle=(a+b)/2,rotation=angle+.4;
  for(const r of [1.25,1.9,2.55]){
   const cx=Math.sin(angle)*r,cz=Math.cos(angle)*r,points=[[-.06,-.14],[.06,-.14],[.06,.14],[-.06,.14]].map(([x,z])=>new T.Vector3(cx+x*Math.cos(rotation)+z*Math.sin(rotation),floor.y+.025,cz-x*Math.sin(rotation)+z*Math.cos(rotation)));
   polygon(points,0xffe9d6,new T.Vector3(0,1,0));
  }
 }
}
const shadow=[];for(let i=0;i<32;i++){const a=i*tau/32;shadow.push(new T.Vector3(.06+Math.cos(a)*.33,.035,2.23+Math.sin(a)*.23));}polygon(shadow,0x3c665c,new T.Vector3(0,1,0),.12);
for(let i=3;i>=1;i--)circle3d(new T.Vector3(0,1.1+i*.32,2.23),.09-i*.012,'#f0b359',.12+i*.025);
circle3d(new T.Vector3(0,1.1,2.23),.28,'url(#ball)');
faces.sort((a,b)=>b.depth-a.depth);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" viewBox="0 0 512 320" role="img" aria-label="金色小球在带缺口的薄圆盘塔上下坠，红色条纹扇区是危险区域"><defs><radialGradient id="background"><stop stop-color="#f4f0f7"/><stop offset="1" stop-color="#e9e4f0"/></radialGradient><radialGradient id="ball" cx=".3" cy=".23" r=".78"><stop stop-color="#ffe3a2"/><stop offset=".4" stop-color="#f0b359"/><stop offset="1" stop-color="#c48b3f"/></radialGradient></defs><rect width="512" height="320" fill="url(#background)"/><circle cx="105" cy="192" r="30" fill="#fff" opacity=".28"/><circle cx="411" cy="108" r="37" fill="#fff" opacity=".36"/>${faces.map(f=>f.svg).join('')}</svg>\n`;
writeFileSync('dist/assets/tower-drop.svg',svg);console.log(`Wrote projected cover: ${faces.length} visible surfaces, ${svg.length} bytes`);
