import * as T from './vendor/three.module.js';
import {coastRadius,ISLAND_GLSL} from './island-world.mjs?v=1.7.0';

export function createIsland({scene,geo,cutMat,box}){
  const segments=192,positions=[0,.015,0],colors=[],indices=[];
  const grass=new T.Color(0xb2c6ab),sand=new T.Color(0xe6d0a3),wetSand=new T.Color(0xb8c7b4);
  colors.push(grass.r,grass.g,grass.b);
  const rings=[{inset:3.2,y:.015,color:grass},{inset:2.9,y:.008,color:sand},{inset:.1,y:-.28,color:sand},{inset:-1.9,y:-.8,color:wetSand},{inset:-4.5,y:-1.9,color:wetSand}];
  rings.forEach(({inset,y,color},j)=>{
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,r=coastRadius(a)-inset,variation=1+Math.sin(a*19)*.015;
      positions.push(Math.cos(a)*r,y,Math.sin(a)*r);colors.push(color.r*variation,color.g*variation,color.b*variation);
      const index=1+j*segments+i,next=1+j*segments+(i+1)%segments;
      if(j===0)indices.push(0,next,index);
      else{const inside=index-segments,insideNext=next-segments;indices.push(inside,insideNext,next,inside,next,index);}
    }
  });
  const terrainGeometry=geo(new T.BufferGeometry());terrainGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));terrainGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrainGeometry.setIndex(indices);terrainGeometry.computeVertexNormals();
  const terrain=new T.Mesh(terrainGeometry,cutMat(0xffffff,{vertexColors:true},-100));terrain.receiveShadow=true;scene.add(terrain);
  const asphalt=cutMat(0x75868a,{},3.1),paving=cutMat(0xe1e3d8,{},3.3),roadMark=cutMat(0xdde5dc,{},3.4);
  box(asphalt,[59,.04,5.5],[0,.035,0],scene,false);box(asphalt,[4,.04,46],[0,.04,0],scene,false);
  for(const z of [-8,8])for(const x of [-12,12])box(paving,[17,.10,9],[x,.055,z],scene,false);
  for(let x=-25;x<=25;x+=3)box(roadMark,[1,.012,.06],[x,.062,0],scene,false);
  const time={value:0};
  const waterMaterial=new T.ShaderMaterial({
    uniforms:{uTime:time},
    vertexShader:`
      uniform float uTime;
      varying vec3 vWorld;
      float wave(vec2 p){return .12*sin(p.x*.64+uTime*1.1)+.085*sin(p.y*.91-uTime*.83)+.035*sin(dot(p,vec2(.46,.57))+uTime*1.7);}
      void main(){vec3 p=position;p.y=-.46+wave(p.xz);vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
    `,
    fragmentShader:`
      uniform float uTime;
      varying vec3 vWorld;
      ${ISLAND_GLSL}
      void main(){
        vec2 p=vWorld.xz;
        // Analytic derivatives of the displaced waves give a continuously changing normal.
        float dx=.0768*cos(p.x*.64+uTime*1.1)+.0161*cos(dot(p,vec2(.46,.57))+uTime*1.7);
        float dz=.07735*cos(p.y*.91-uTime*.83)+.01995*cos(dot(p,vec2(.46,.57))+uTime*1.7);
        dx+=.10*sin(p.x*3.1+p.y*1.8+uTime*1.4+.65*sin(p.y*.8+uTime*.2));dz+=.10*cos(p.y*3.6-p.x*1.6-uTime*1.2+.7*sin(p.x*.9-uTime*.3));
        vec3 n=normalize(vec3(-dx,1.,-dz)),view=normalize(cameraPosition-vWorld),light=normalize(vec3(-.25,.95,-.55));
        float shore=shoreDistance(p),depth=smoothstep(.0,13.,-shore);
        vec3 color=mix(vec3(.13,.58,.57),vec3(.018,.23,.34),depth);
        float diffuse=.78+.22*max(dot(n,light),0.);
        float fresnel=pow(1.-max(dot(view,n),0.),3.);
        float spec=pow(max(dot(n,normalize(light+view)),0.),140.);
        float ripple=sin(p.x*1.3+p.y*.45+uTime*1.3)*sin(p.y*1.8-p.x*.4-uTime*.9);
        color+=vec3(.014,.045,.052)*ripple;
        color=color*diffuse+vec3(.29,.51,.59)*fresnel*.4+vec3(1.,.93,.72)*spec*.17;
        float ripples=.5+.5*sin(shore*7.+uTime*2.3+sin(p.x*1.8+p.y*1.1)*.8);
        float foam=exp(-abs(shore+.75+.18*sin(uTime+p.x*.4))*2.)*smoothstep(.4,.9,ripples);
        color=mix(color,vec3(.83,.94,.88),foam*.78);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const waterGeometry=geo(new T.PlaneGeometry(260,260,180,180));waterGeometry.rotateX(-Math.PI/2);
  const water=new T.Mesh(waterGeometry,waterMaterial);water.frustumCulled=false;scene.add(water);
  return {waterMaterial,time};
}
