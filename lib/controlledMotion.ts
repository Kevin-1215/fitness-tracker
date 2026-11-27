import {Box3,Quaternion,Vector3} from 'three';
import {controlledMotionFor} from './motionCatalog';
import {BODY,DOWN,X,Y,Z,SIDES,rad,turn,at,transform,compose,orientChain,armFromWorld,armToGrip,legFromAngles,type ControlledPose,type ControlledArm,type ControlledLeg} from './jointKinematics';
import {sampleExtendedPose,sceneBoundsPoints} from './extendedMotion';
import {solveTwoBone,type V3} from './motionRig';
export {BODY} from './jointKinematics';
export type {ControlledPose} from './jointKinematics';
const ORIGINAL_IDS=new Set(['bench_press','dumbbell_bench_press','close_grip_bench_press','incline_dumbbell_press','incline_barbell_press','barbell_biceps_curl','dumbbell_hammer_curl','alternating_dumbbell_curl','dumbbell_lateral_raise','dumbbell_front_raise','barbell_back_squat','dumbbell_romanian_deadlift']);
export function sampleControlledPose(id:string,depth:number,sidePhase=0):ControlledPose{
 const spec=controlledMotionFor(id);if(!spec)throw Error('Unreviewed motion: '+id);
 if(!ORIGINAL_IDS.has(id))return sampleExtendedPose(id,depth,sidePhase);
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
 if(!upperBody)for(const point of sceneBoundsPoints(id))bounds.expandByPoint(point);
 for(let i=0;i<=50;i++){
  const p=sampleControlledPose(id,i/50);
  const points=upperBody?[p.root,...p.arms.flatMap(arm=>[arm.shoulder,arm.elbow,arm.wrist,arm.grip]),p.headCenter??p.points.at(-1)!]:p.points;
  for(const point of points){bounds.expandByPoint(point.clone().addScalar(.23));bounds.expandByPoint(point.clone().addScalar(-.23));}
  if(equipment==='槓鈴')for(const side of SIDES){const edge=p.equipmentPosition.clone().add(at(side*1.12,0,0));bounds.expandByPoint(edge.clone().addScalar(.20));bounds.expandByPoint(edge.clone().addScalar(-.20));}
 }
 if(!upperBody)bounds.min.y=0;return bounds;
}
