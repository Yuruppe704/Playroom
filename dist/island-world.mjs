// One coast definition drives terrain, road clipping, ocean depth and movement bounds.
export const ISLAND_RX=27,ISLAND_RZ=20;
export function coastRadius(angle){
  const c=Math.cos(angle),s=Math.sin(angle);
  return (1+.10*Math.sin(angle*3)+.07*Math.cos(angle*5)+.035*Math.sin(angle*9))/Math.sqrt(c*c/(ISLAND_RX*ISLAND_RX)+s*s/(ISLAND_RZ*ISLAND_RZ));
}
export function shoreDistance(x,z){return coastRadius(Math.atan2(z,x))-Math.hypot(x,z);}
export function onIsland(x,z,margin=0){return shoreDistance(x,z)>=margin;}
export function islandPosition(x,z,margin=0){
  const distance=Math.hypot(x,z),limit=Math.max(0,coastRadius(Math.atan2(z,x))-margin);
  if(distance<=limit||distance===0)return{x,z};return{x:x/distance*limit,z:z/distance*limit};
}
export function holeViewHalf(radius,aspect=1){const half=4+radius*2.1;return half*Math.max(1,.85/aspect);}
export const ISLAND_GLSL=`
float coastRadius(vec2 p){
 float a=atan(p.y,p.x),c=cos(a),s=sin(a);
 return (1.0+.10*sin(a*3.0)+.07*cos(a*5.0)+.035*sin(a*9.0))/sqrt(c*c/729.0+s*s/400.0);
}
float shoreDistance(vec2 p){return coastRadius(p)-length(p);}
`;
