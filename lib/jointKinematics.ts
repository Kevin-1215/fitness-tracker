import {Matrix4,Quaternion,Vector3} from 'three';
import {controlledMotionFor,type ControlledMotionSpec} from './motionCatalog';
import {solveTwoBone,type V3} from './motionRig';

// New segment proportions: the upper arm is longer than the forearm.
export const BODY={upperArm:.46,forearm:.37,thigh:.57,shin:.55,shoulderX:.43,shoulderY:.94,hipX:.19,ankleY:.11,gripOffset:.075} as const;
export const DOWN=new Vector3(0,-1,0),X=new Vector3(1,0,0),Y=new Vector3(0,1,0),Z=new Vector3(0,0,1),SIDES=[-1,1] as const;
export const rad=(degrees:number)=>degrees*Math.PI/180;
export const turn=(axis:Vector3,angle:number)=>new Quaternion().setFromAxisAngle(axis,angle);
export const at=(x:number,y:number,z:number)=>new Vector3(x,y,z);
export const transform=(parent:Matrix4,point:Vector3)=>point.clone().applyMatrix4(parent);
export const compose=(position:Vector3,q:Quaternion)=>new Matrix4().compose(position,q,at(1,1,1));
export interface ControlledArm {upper:Quaternion;lower:Quaternion;hand:Quaternion;flexion:number;wristDeviation:number;shoulder:Vector3;elbow:Vector3;wrist:Vector3;grip:Vector3;handWorld:Quaternion;forearmWorld:Quaternion;roll?:number;palm?:boolean}
export interface ControlledLeg {upper:Quaternion;lower:Quaternion;foot:Quaternion;flexion:number;hip:Vector3;knee:Vector3;ankle:Vector3}
export interface ControlledPose {root:Vector3;rotation:Quaternion;arms:[ControlledArm,ControlledArm];legs:[ControlledLeg,ControlledLeg];metric:number;metricLabel:string;equipmentPosition:Vector3;equipmentRotation:Quaternion;points:Vector3[];spec:ControlledMotionSpec;spine?:Quaternion;headPosition?:Vector3;headRotation?:Quaternion;headCenter?:Vector3;contacts?:Vector3[];cables?:[Vector3,Vector3][];singleWeight?:{position:Vector3;rotation:Quaternion};plate?:{position:Vector3;rotation:Quaternion}}

/** Recover a proper hinge frame from a reviewed elbow plane. Lower segments
 * rotate around ONE local X axis; no separate free endpoint quaternion. */
export function orientChain(start:Vector3,middle:Vector3,end:Vector3,sign:1|-1){
 const upper=middle.clone().sub(start).normalize(),lower=end.clone().sub(middle).normalize();
 const hinge=sign===-1?lower.clone().cross(upper):upper.clone().cross(lower);
 if(hinge.lengthSq()<1e-10)hinge.copy(X);hinge.normalize();
 const localY=upper.clone().negate(),localZ=hinge.clone().cross(localY).normalize();
 const world=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(hinge,localY,localZ));
 const flexion=Math.acos(Math.max(-1,Math.min(1,upper.dot(lower))));
 return {world,flexion,lower:turn(X,sign*flexion)};
}
export function handOnBar(lowerWorld:Quaternion){
 // A forearm may incline slightly at lockout. Project its long axis onto the
 // plane perpendicular to the bar, leaving a small, measured wrist deviation.
 const forearm=DOWN.clone().applyQuaternion(lowerWorld),along=forearm.clone().addScaledVector(X,-forearm.x).normalize();
 const localY=along.clone().negate(),localZ=X.clone().cross(localY).normalize();
 const world=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(X,localY,localZ));
 return {world,deviation:Math.acos(Math.max(-1,Math.min(1,forearm.dot(along))))};
}
export function armFromWorld(shoulder:Vector3,upperWorld:Quaternion,flexion:number,rootQ:Quaternion,roll=0):ControlledArm{
 const lower=turn(X,-flexion),lowerWorld=upperWorld.clone().multiply(lower);
 const elbow=shoulder.clone().add(DOWN.clone().multiplyScalar(BODY.upperArm).applyQuaternion(upperWorld));
 const wrist=elbow.clone().add(DOWN.clone().multiplyScalar(BODY.forearm).applyQuaternion(lowerWorld));
 const handWorld=lowerWorld.clone().multiply(turn(Y,roll)),grip=wrist.clone().add(at(0,-BODY.gripOffset,0).applyQuaternion(handWorld));
 return {upper:rootQ.clone().invert().multiply(upperWorld),lower,hand:turn(Y,roll),flexion,wristDeviation:0,shoulder,elbow,wrist,grip,handWorld,forearmWorld:lowerWorld};
}
export function armToGrip(shoulder:Vector3,target:Vector3,pole:Vector3,rootQ:Quaternion):ControlledArm{
 let wrist=target.clone().add(at(0,-BODY.gripOffset,0)),frame!:ControlledArm;
 for(let i=0;i<8;i++){
  const solved=solveTwoBone(shoulder.toArray() as V3,wrist.toArray() as V3,pole.toArray() as V3,BODY.upperArm,BODY.forearm);
  const elbow=new Vector3(...solved.elbow),end=new Vector3(...solved.end),chain=orientChain(shoulder,elbow,end,-1);
  frame=armFromWorld(shoulder,chain.world,chain.flexion,rootQ);
  const gripFrame=handOnBar(frame.forearmWorld);
  frame.handWorld=gripFrame.world;frame.hand=frame.forearmWorld.clone().invert().multiply(frame.handWorld);frame.wristDeviation=gripFrame.deviation;
  frame.grip=frame.wrist.clone().add(at(0,-BODY.gripOffset,0).applyQuaternion(frame.handWorld));
  wrist=target.clone().sub(at(0,-BODY.gripOffset,0).applyQuaternion(frame.handWorld));
 }
 return frame;
}
export function legFromAngles(hip:Vector3,thighQ:Quaternion,kneeAngle:number,rootQ:Quaternion,side:number):ControlledLeg{
 const lower=turn(X,kneeAngle),lowerWorld=thighQ.clone().multiply(lower);
 const knee=hip.clone().add(DOWN.clone().multiplyScalar(BODY.thigh).applyQuaternion(thighQ));
 const ankle=knee.clone().add(DOWN.clone().multiplyScalar(BODY.shin).applyQuaternion(lowerWorld));
 return {upper:rootQ.clone().invert().multiply(thighQ),lower,foot:lowerWorld.invert().multiply(turn(Y,side*rad(12))),flexion:kneeAngle,hip,knee,ankle};
}

/** A fixed target and an explicit hinge plane. Pronation is a separate
 * forearm roll, not an additional bending axis at the elbow. */
export function armTarget(shoulder:Vector3,target:Vector3,pole:Vector3,parent:Quaternion,handWorld?:Quaternion,roll=0):ControlledArm{
 if(!handWorld){const arm=armToGrip(shoulder,target,pole,parent);if(roll){arm.hand.multiply(turn(Y,roll));arm.handWorld=arm.forearmWorld.clone().multiply(arm.hand);arm.roll=roll;}return arm;}
 const wrist=target.clone().sub(at(0,-BODY.gripOffset,0).applyQuaternion(handWorld));
 const solved=solveTwoBone(shoulder.toArray() as V3,wrist.toArray() as V3,pole.toArray() as V3,BODY.upperArm,BODY.forearm),chain=orientChain(shoulder,new Vector3(...solved.elbow),new Vector3(...solved.end),-1);
 const arm=armFromWorld(shoulder,chain.world,chain.flexion,parent);
 arm.handWorld=handWorld.clone();arm.hand=arm.forearmWorld.clone().invert().multiply(handWorld);arm.grip=arm.wrist.clone().add(at(0,-BODY.gripOffset,0).applyQuaternion(handWorld));arm.wristDeviation=DOWN.clone().applyQuaternion(arm.forearmWorld).angleTo(DOWN.clone().applyQuaternion(handWorld));return arm;
}
export function freeGripTarget(shoulder:Vector3,target:Vector3,pole:Vector3,parent:Quaternion):ControlledArm{
 let wrist=target.clone().add(at(0,BODY.gripOffset,0)),a!:ControlledArm;
 for(let i=0;i<10;i++){const solved=solveTwoBone(shoulder.toArray() as V3,wrist.toArray() as V3,pole.toArray() as V3,BODY.upperArm,BODY.forearm),chain=orientChain(shoulder,new Vector3(...solved.elbow),new Vector3(...solved.end),-1);a=armFromWorld(shoulder,chain.world,chain.flexion,parent);wrist=target.clone().sub(at(0,-BODY.gripOffset,0).applyQuaternion(a.handWorld));}return a;
}
/** For a straight horizontal shaft, keep forearms in sagittal planes at the
 * grip width. The upper arm supplies lateral reach, rather than bent wrists. */
export function barGripTarget(shoulder:Vector3,target:Vector3,pole:Vector3,parent:Quaternion):ControlledArm{
 const dx=target.x-shoulder.x,a2=Math.sqrt(Math.max(.001,BODY.upperArm**2-dx**2)),projected=at(target.x,shoulder.y,shoulder.z),planePole=at(0,pole.y,pole.z);
 let wrist=target.clone().add(at(0,BODY.gripOffset,0)),a!:ControlledArm;
 for(let i=0;i<10;i++){
  const solved=solveTwoBone(projected.toArray() as V3,wrist.toArray() as V3,planePole.toArray() as V3,a2,BODY.forearm),chain=orientChain(shoulder,new Vector3(...solved.elbow),new Vector3(...solved.end),-1);
  a=armFromWorld(shoulder,chain.world,chain.flexion,parent);wrist=target.clone().sub(at(0,-BODY.gripOffset,0).applyQuaternion(a.handWorld));
 }return a;
}
export function legTarget(hip:Vector3,ankle:Vector3,pole:Vector3,parent:Quaternion,side:number,footWorld=new Quaternion()):ControlledLeg{
 const solved=solveTwoBone(hip.toArray() as V3,ankle.toArray() as V3,pole.toArray() as V3,BODY.thigh,BODY.shin),chain=orientChain(hip,new Vector3(...solved.elbow),new Vector3(...solved.end),1);
 const leg=legFromAngles(hip,chain.world,chain.flexion,parent,side),lowerWorld=chain.world.clone().multiply(leg.lower);
 leg.foot=lowerWorld.invert().multiply(footWorld);return leg;
}
