import {Box3,Vector3} from "three";
import type {AnimationType,Equipment} from "./exercisesData";
import {sampleExercisePose,solvePose,type V3} from "./motionRig";

export type CameraView="front"|"side"|"back"|"reset";
export const BACK_MOVEMENTS:readonly AnimationType[]=["pulldown","pulldown_supinated","pulldown_neutral","row_seated","row_pull","row_single","reverse_fly","pullover_cable","inverted_row"];
export const SINGLE_DUMBBELL:readonly AnimationType[]=["goblet_squat","overhead_extension"];
export const BENCH_MOVEMENTS:readonly AnimationType[]=["press_horizontal","press_incline","press_close","fly_supine"];
export const HANGING_MOVEMENTS:readonly AnimationType[]=["pull_up","hanging_knee_raise"];

/** Include the complete motion, not only the current pose. Zoom never breathes with repetitions. */
export function motionEnvelope(type:AnimationType,equipment:Equipment,anatomy=false) {
  const bounds=new Box3();
  for(let step=0;step<=40;step++){
    const sample=solvePose(sampleExercisePose(anatomy?"anatomy":type,step/40));
    for(const point of sample.worldPoints){
      bounds.expandByPoint(point.clone().addScalar(.24));
      bounds.expandByPoint(point.clone().addScalar(-.24));
    }
    if(!anatomy&&equipment==="槓鈴"){
      const wrists=sample.arms.map(arm=>new Vector3(...arm.end).applyMatrix4(sample.torsoMatrix));
      const direction=wrists[1].clone().sub(wrists[0]).normalize();
      const mid=wrists[0].clone().add(wrists[1]).multiplyScalar(.5),halfLength=Math.max(1.1,wrists[0].distanceTo(wrists[1])/2+.2);
      for(let i=0;i<2;i++){
        const edge=mid.clone().addScaledVector(direction,(i===0?-1:1)*halfLength);
        bounds.expandByPoint(edge.clone().addScalar(.2));bounds.expandByPoint(edge.clone().addScalar(-.2));
      }
    }
  }
  if(!anatomy){
    if(equipment==="滑輪/機械"&&type!=="leg_press"){
      if(type==="fly_standing"){bounds.expandByPoint(new Vector3(-1.7,0,-.3));bounds.expandByPoint(new Vector3(1.7,2.8,1.3));}
      else if(type==="pallof_press"){bounds.expandByPoint(new Vector3(1.07,0,-.5));bounds.expandByPoint(new Vector3(1.9,2.8,.5));}
      else {bounds.expandByPoint(new Vector3(-.95,0,-.4));bounds.expandByPoint(new Vector3(.95,3.25,1.5));}
    }
    if(HANGING_MOVEMENTS.includes(type)){bounds.expandByPoint(new Vector3(-.9,0,-.1));bounds.expandByPoint(new Vector3(.9,3.15,.2));}
    if(BENCH_MOVEMENTS.includes(type)){bounds.expandByPoint(new Vector3(-.5,0,-1.6));bounds.expandByPoint(new Vector3(.5,.7,.68));}
    if(type==="inverted_row"){bounds.expandByPoint(new Vector3(-.86,0,-.84));bounds.expandByPoint(new Vector3(.86,1.4,-.6));}
    if(type==="hip_thrust"){bounds.expandByPoint(new Vector3(-.8,0,-1.15));bounds.expandByPoint(new Vector3(.8,.65,-.65));}
    if(type==="leg_press"){bounds.expandByPoint(new Vector3(-.8,0,-1.45));bounds.expandByPoint(new Vector3(.8,2.4,1.6));}
  }
  bounds.min.y=Math.max(0,bounds.min.y);
  return bounds;
}

export function fitCamera(bounds:Box3,aspect:number,view:CameraView,fov=37,occupancy=.84){
  const target=bounds.getCenter(new Vector3());
  const direction=new Vector3(...({front:[0,.14,1],side:[1,.16,0],back:[0,.14,-1],reset:[.85,.48,1.05]} as Record<CameraView,V3>)[view]).normalize();
  const right=new Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
  const tangent=Math.tan(fov*Math.PI/360),safeAspect=Math.max(.15,aspect);
  let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const point=new Vector3(x,y,z).sub(target),depth=point.dot(direction);
    distance=Math.max(distance,depth+Math.abs(point.dot(right))/(tangent*safeAspect*occupancy),depth+Math.abs(point.dot(up))/(tangent*occupancy));
  }
  return {target,position:target.clone().addScaledVector(direction,Math.max(2.5,distance)),distance};
}
