// Clouds are stationary in world space. Only recycle them after they are above the view.
export function cloudWorldY(index,cameraY){
  const base=4-index*7,span=84;
  return base-Math.max(0,Math.ceil((base-cameraY-35)/span))*span;
}
