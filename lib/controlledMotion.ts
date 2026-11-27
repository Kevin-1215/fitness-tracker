import {Box3,Matrix4,Quaternion,Vector3} from 'three';
import {controlledMotionFor,type ControlledMotionSpec} from './motionCatalog';
import {solveTwoBone,type V3} from './motionRig';

// New segment proportions: the upper arm is longer than the forearm.
export const BODY={upperArm:.46,forearm:.37,thigh:.57,shin:.55,shoulderX:.43,shoulderY:.94,hipX:.19,ankleY:.11,gripOffset:.075} as const;
const DOWN=new Vector3(0,-1,0),X=new Vector3(1,0,0),Y=new Vector3(0,1,0),Z=new Vector3(0,0,1),SIDES=[-1,1] as const;
const rad=(degrees:number)=>degrees*Math.PI/180;
const turn=(axis:Vector3,angle:number)=>new Quaternion().setFromAxisAngle(axis,angle);
const at=(x:number,y:number,z:number)=>new Vector3(x,y,z);
const transform=(parent:Matrix4,point:Vector3)=>point.clone().applyMatrix4(parent);
const compose=(position:Vector3,q:Quaternion)=>new Matrix4().compose(position,q,at(1,1,1));
export interface ControlledArm {upper:Quaternion;lower:Quaternion;hand:Quaternion;flexion:number;wristDeviation:number;shoulder:Vector3;elbow:Vector3;wrist:Vector3;grip:Vector3;handWorld:Quaternion;forearmWorld:Quaternion}
export interface ControlledLeg {upper:Quaternion;lower:Quaternion;foot:Quaternion;flexion:number;hip:Vector3;knee:Vector3;ankle:Vector3}
export interface ControlledPose {root:Vector3;rotation:Quaternion;arms:[ControlledArm,ControlledArm];legs:[ControlledLeg,ControlledLeg];metric:number;metricLabel:string;equipmentPosition:Vector3;equipmentRotation:Quaternion;points:Vector3[];spec:ControlledMotionSpec}

/** Recover a proper hinge frame from a reviewed elbow plane. Lower segments
 * rotate around ONE local X axis; no separate free endpoint quaternion. */
function orientChain(start:Vector3,middle:Vector3,end:Vector3,sign:1|-1){
 const upper=middle.clone().sub(start).normalize(),lower=end.clone().sub(middle).normalize();
 const hinge=sign===-1?lower.clone().cross(upper):upper.clone().cross(lower);
 if(hinge.lengthSq()<1e-10)hinge.copy(X);hinge.normalize();
 const localY=upper.clone().negate(),localZ=hinge.clone().cross(localY).normalize();
 const world=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(hinge,localY,localZ));
 const flexion=Math.acos(Math.max(-1,Math.min(1,upper.dot(lower))));
 return {world,flexion,lower:turn(X,sign*flexion)};
}
function handOnBar(lowerWorld:Quaternion){
 // A forearm may incline slightly at lockout. Project its long axis onto the
 // plane perpendicular to the bar, leaving a small, measured wrist deviation.
 const forearm=DOWN.clone().applyQuaternion(lowerWorld),along=forearm.clone().addScaledVector(X,-forearm.x).normalize();
 const localY=along.clone().negate(),localZ=X.clone().cross(localY).normalize();
 const world=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(X,localY,localZ));
 return {world,deviation:Math.acos(Math.max(-1,Math.min(1,forearm.dot(along))))};
}
function armFromWorld(shoulder:Vector3,upperWorld:Quaternion,flexion:number,rootQ:Quaternion,roll=0):ControlledArm{
 const lower=turn(X,-flexion),lowerWorld=upperWorld.clone().multiply(lower);
 const elbow=shoulder.clone().add(DOWN.clone().multiplyScalar(BODY.upperArm).applyQuaternion(upperWorld));
 const wrist=elbow.clone().add(DOWN.clone().multiplyScalar(BODY.forearm).applyQuaternion(lowerWorld));
 const handWorld=lowerWorld.clone().multiply(turn(Y,roll)),grip=wrist.clone().add(at(0,-BODY.gripOffset,0).applyQuaternion(handWorld));
 return {upper:rootQ.clone().invert().multiply(upperWorld),lower,hand:turn(Y,roll),flexion,wristDeviation:0,shoulder,elbow,wrist,grip,handWorld,forearmWorld:lowerWorld};
}
function armToGrip(shoulder:Vector3,target:Vector3,pole:Vector3,rootQ:Quaternion):ControlledArm{
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
function legFromAngles(hip:Vector3,thighQ:Quaternion,kneeAngle:number,rootQ:Quaternion,side:number):ControlledLeg{
 const lower=turn(X,kneeAngle),lowerWorld=thighQ.clone().multiply(lower);
 const knee=hip.clone().add(DOWN.clone().multiplyScalar(BODY.thigh).applyQuaternion(thighQ));
 const ankle=knee.clone().add(DOWN.clone().multiplyScalar(BODY.shin).applyQuaternion(lowerWorld));
 return {upper:rootQ.clone().invert().multiply(thighQ),lower,foot:lowerWorld.invert().multiply(turn(Y,side*rad(12))),flexion:kneeAngle,hip,knee,ankle};
}
export function sampleControlledPose(id:string,depth:number,sidePhase=0):ControlledPose{
 const spec=controlledMotionFor(id);if(!spec)throw Error('Unreviewed motion: '+id);
 const q=Math.max(0,Math.min(1,depth)),root=at(0,1.23,0),rotation=new Quaternion();
 let thigh=rad(4),shin=rad(2),stance=.26;
 if(spec.kind==='squat'){thigh=rad(4+81*q);shin=rad(2+28*q);stance=.29;rotation.copy(turn(X,rad(6+23*q)));}
 if(spec.kind==='hinge'){thigh=rad(4+34*q);shin=rad(2-14*q);stance=.25;rotation.copy(turn(X,rad(3+65*q)));}
 const spread=stance-BODY.hipX,vertical=BODY.thigh*Math.cos(thigh)+BODY.shin*Math.cos(shin);
 root.y=BODY.ankleY+Math.sqrt(vertical**2-spread**2);root.z=-(BODY.thigh*Math.sin(thigh)-BODY.shin*Math.sin(shin));
 if(spec.kind==='bench'){root.set(0,.82,0);rotation.copy(turn(X,rad((spec.benchAngle??0)-90)));}
 const rootM=compose(root,rotation),shoulders=SIDES.map(side=>transform(rootM,at(side*BODY.shoulderX,BODY.shoulderY,0)));
 const arms=SIDES.map((side,i)=>{
  const shoulder=shoulders[i];
  if(spec.kind==='bench'){
   const incline=(spec.benchAngle??0)>0,shoulderY=shoulder.y,shoulderZ=shoulder.z;
   const reach=Math.sqrt(BODY.upperArm**2+BODY.forearm**2+2*BODY.upperArm*BODY.forearm*Math.cos(rad(14)));
   const high=shoulderY+Math.sqrt(reach**2-((spec.gripHalfWidth??.62)-BODY.shoulderX)**2)+BODY.gripOffset,low=incline?shoulderY+.23:shoulderY+.22;
   const grip=at(side*(spec.gripHalfWidth??.62),high+(low-high)*q,shoulderZ+(incline?.30:.36)*q);
   return armToGrip(shoulder,grip,at(side*(id==='close_grip_bench_press'?.10:.35),-.85,.28),rotation);
  }
  if(spec.kind==='squat')return armToGrip(shoulder,transform(rootM,at(side*.65,.88,-.235)),at(side*.5,-1,-.3).applyQuaternion(rotation),rotation);
  if(spec.kind==='hinge')return armFromWorld(shoulder,turn(X,rad(20*q)),rad(4),rotation,-side*Math.PI/2);
  if(spec.kind==='lateral'){
   const upper=turn(Y,-side*rad(15)).multiply(turn(Z,side*rad(5+80*q)));
   return armFromWorld(shoulder,upper,rad(8),rotation,-side*Math.PI/2);
  }
  if(spec.kind==='front')return armFromWorld(shoulder,turn(X,-rad(5+78*q)),rad(8),rotation,Math.PI);
  const amount=spec.kind==='alternate'?(i===sidePhase?q:0):q;
  return armFromWorld(shoulder,id==='barbell_biceps_curl'?new Quaternion():turn(Z,side*rad(2)),rad(8+112*amount),rotation,spec.kind==='hammer'?-side*Math.PI/2:0);
 }) as [ControlledArm,ControlledArm];
 const legs=SIDES.map(side=>{
  const hip=transform(rootM,at(side*BODY.hipX,0,0));
  if(spec.kind==='bench'){
   const ankle=at(side*.29,BODY.ankleY,.72),solved=solveTwoBone(hip.toArray() as V3,ankle.toArray() as V3,[0,.45,1],BODY.thigh,BODY.shin),knee=new Vector3(...solved.elbow);
   const chain=orientChain(hip,knee,ankle,1);return legFromAngles(hip,chain.world,chain.flexion,rotation,side);
  }
  // Select the knee plane from the planted foot's toe direction. Merely
  // spreading the whole leg leaves the knee inside a wide stance at the bottom.
  const ankle=at(side*stance,BODY.ankleY,0),kneeZ=BODY.shin*Math.sin(shin);
  const kneeReference=at(side*(stance+kneeZ*Math.tan(rad(12))),BODY.ankleY+BODY.shin*Math.cos(shin),kneeZ);
  const solved=solveTwoBone(hip.toArray() as V3,ankle.toArray() as V3,kneeReference.sub(hip).toArray() as V3,BODY.thigh,BODY.shin);
  const chain=orientChain(hip,new Vector3(...solved.elbow),ankle,1);
  return legFromAngles(hip,chain.world,chain.flexion,rotation,side);
 }) as [ControlledLeg,ControlledLeg];
 const equipmentPosition=arms[0].grip.clone().add(arms[1].grip).multiplyScalar(.5),equipmentRotation=new Quaternion();
 const metric=spec.kind==='squat'?legs[0].flexion:spec.kind==='hinge'?rad(3+65*q)+thigh:spec.kind==='lateral'?rad(5+80*q):spec.kind==='front'?rad(5+78*q):Math.max(...arms.map(arm=>arm.flexion));
 const points=[root,...arms.flatMap(arm=>[arm.shoulder,arm.elbow,arm.wrist,arm.grip]),...legs.flatMap(leg=>[leg.hip,leg.knee,leg.ankle]),transform(rootM,at(0,1.31,0))];
 return {root,rotation,arms,legs,metric:metric*180/Math.PI,metricLabel:spec.jointLabel,equipmentPosition,equipmentRotation,points,spec};
}

export function controlledEnvelope(id:string,equipment:'槓鈴'|'啞鈴'|'滑輪/機械'|'徒手',upperBody=false){
 const bounds=new Box3();
 for(let i=0;i<=50;i++){
  const p=sampleControlledPose(id,i/50);
  const points=upperBody?[p.root,...p.arms.flatMap(arm=>[arm.shoulder,arm.elbow,arm.wrist,arm.grip]),p.points.at(-1)!]:p.points;
  for(const point of points){bounds.expandByPoint(point.clone().addScalar(.23));bounds.expandByPoint(point.clone().addScalar(-.23));}
  if(equipment==='槓鈴')for(const side of SIDES){const edge=p.equipmentPosition.clone().add(at(side*1.12,0,0));bounds.expandByPoint(edge.clone().addScalar(.20));bounds.expandByPoint(edge.clone().addScalar(-.20));}
 }
 if(!upperBody)bounds.min.y=0;return bounds;
}
