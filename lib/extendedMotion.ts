import {Euler,Quaternion,Vector3} from 'three';
import {controlledMotionFor} from './motionCatalog';
import {BODY,DOWN,X,Y,Z,SIDES,at,rad,turn,compose,transform,armFromWorld,armTarget,barGripTarget,freeGripTarget,legFromAngles,legTarget,type ControlledArm,type ControlledLeg,type ControlledPose} from './jointKinematics';

export interface ScenePart {name:string;position:[number,number,number];size:[number,number,number];rotation?:[number,number,number];color?:string;opacity?:number}
const lerp=(a:number,b:number,q:number)=>a+(b-a)*q;
const box=(name:string,position:ScenePart['position'],size:ScenePart['size'],rotation?:ScenePart['rotation'],color='#334751'):ScenePart=>({name,position,size,rotation,color});
const seatedIds=new Set(['machine_chest_press','machine_shoulder_press','lat_pulldown','reverse_grip_lat_pulldown','neutral_grip_lat_pulldown','seated_machine_row']);
const pullIds=new Set(['lat_pulldown','reverse_grip_lat_pulldown','neutral_grip_lat_pulldown']);
const floorIds=new Set(['push_up','diamond_push_up','pike_push_up','forearm_plank','bird_dog','dead_bug','glute_bridge','barbell_ab_rollout','kneeling_cable_crunch']);
export function motionScene(id:string):ScenePart[]{
 const parts:ScenePart[]=[];
 if(floorIds.has(id))parts.push(box('floor-mat',[0,-.01,0],[2.2,.035,4.8],undefined,'#142c35'));
 if(seatedIds.has(id)){
  parts.push(box('seat-pad',[0,.48,.02],[.60,.12,.58],undefined,'#172a33'),box('seat-pedestal',[0,.23,.02],[.16,.44,.25]));
  if(id.startsWith('machine_'))parts.push(box('back-pad',[0,1.05,-.23],[.58,1.10,.12],undefined,'#172a33'));
 }
 if(pullIds.has(id)){
  parts.push(box('pulley-crossbar',[0,2.98,.70],[1.70,.10,.14]));
  for(const s of SIDES)parts.push(box('pulley-post',[s*.78,1.49,.70],[.09,2.98,.12]),box('thigh-pad',[s*.24,.82,.29],[.31,.13,.20],undefined,'#16252f'));
 }
 if(id==='machine_chest_press')for(const s of SIDES)parts.push(box('press-guide',[s*.52,1.46,.52],[.055,.055,1.15]),box('press-support',[s*.72,1.08,-.28],[.10,1.98,.12]));
 if(id==='machine_shoulder_press')for(const s of SIDES)parts.push(box('shoulder-guide',[s*.58,2.09,.24],[.055,1.28,.055],[-Math.atan2(.32,.70),0,0]),box('shoulder-guide-base',[s*.58,.93,.33],[.10,.12,.46]));
 if(id==='seated_machine_row')for(const s of SIDES)parts.push(box('row-footplate',[s*.28,.08,.71],[.30,.08,.42],[-.18,0,0]),box('row-guide',[s*.58,1.42,.61],[.05,.05,1.10]));
 if(['pull_up','hanging_knee_raise'].includes(id)){
  parts.push(box('fixed-pullup-bar',[0,2.94,.12],[1.85,.045,.045]));
  for(const s of SIDES)parts.push(box('pullup-post',[s*.90,1.47,.12],[.065,2.94,.065]));
 }
 if(id==='inverted_row'){
  parts.push(box('fixed-row-bar',[0,1.25,-.40],[1.85,.045,.045]));for(const s of SIDES)parts.push(box('row-upright',[s*.90,.625,-.40],[.065,1.25,.12]));
 }
 if(id==='one_arm_dumbbell_row')parts.push(box('row-bench',[-.43,.455,.27],[.48,.12,1.48],undefined,'#182b35'),box('row-bench-leg',[-.43,.20,.27],[.18,.40,.90]));
 if(id==='barbell_hip_thrust')parts.push(box('thrust-bench',[0,.54,-.82],[1.15,.20,.43],undefined,'#182b35'),box('thrust-bench-stand',[0,.23,-.82],[.80,.42,.30]));
 if(id==='leg_press'){
  parts.push(box('legpress-back',[0,.932,-.712],[.62,1.48,.12],[-rad(35),0,0],'#192d36'),box('legpress-seat',[0,.40,-.19],[.64,.14,.55]));
  for(const s of SIDES)parts.push(box('legpress-rail',[s*.61,1.143,.602],[.065,1.65,.065],[Math.atan2(.34,.36),0,0]),box('legpress-handle-support',[s*.43,.55,-.45],[.04,.20,.04]));
 }
 if(['standing_cable_fly'].includes(id))for(const s of SIDES)parts.push(box('fly-column',[s*1.65,1.40,-.15],[.12,2.80,.17]));
 if(['cable_face_pull','cable_triceps_pushdown','straight_arm_pulldown','kneeling_cable_crunch'].includes(id))parts.push(box('cable-column',[0,1.52,1.72],[.14,3.04,.18]));
 if(id==='standing_pallof_press')parts.push(box('pallof-column',[1.85,1.40,.28],[.14,2.80,.18]));
 return parts.map(p=>['column','post','upright','rail','guide'].some(name=>p.name.includes(name))?{...p,opacity:.24}:p);
}
export function sceneBoundsPoints(id:string){return motionScene(id).filter(p=>p.name!=='floor-mat').flatMap(p=>{const m=compose(new Vector3(...p.position),new Quaternion().setFromEuler(new Euler(...(p.rotation??[0,0,0]))));return [-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>at(x*p.size[0]/2,y*p.size[1]/2,z*p.size[2]/2).applyMatrix4(m))));});}

/** Make the shoulder plane explicit; the elbow still has only one hinge axis. */
function upperFrame(direction:Vector3,bend:Vector3){
 const d=direction.clone().normalize(),z=bend.clone().addScaledVector(d,-bend.dot(d));if(z.lengthSq()<1e-8)z.copy(Z).addScaledVector(d,-Z.dot(d));z.normalize();
 const x=z.clone().cross(d).normalize(),y=d.clone().negate();return new Quaternion().setFromRotationMatrix(compose(at(0,0,0),new Quaternion()).makeBasis(x,y,z));
}
function setHand(a:ControlledArm,world:Quaternion,palm=false){a.handWorld=world.clone();a.hand=a.forearmWorld.clone().invert().multiply(world);a.grip=a.wrist.clone().add(at(0,-BODY.gripOffset,0).applyQuaternion(world));a.wristDeviation=DOWN.clone().applyQuaternion(a.forearmWorld).angleTo(DOWN.clone().applyQuaternion(world));a.palm=palm;return a;}
function stand(thigh=4,shin=2,stance=.26,lean=0){
 const t=rad(thigh),s=rad(shin),vertical=BODY.thigh*Math.cos(t)+BODY.shin*Math.cos(s),spread=stance-BODY.hipX;
 const root=at(0,.11+Math.sqrt(vertical*vertical-spread*spread),-(BODY.thigh*Math.sin(t)-BODY.shin*Math.sin(s))),rotation=turn(X,rad(lean));
 return {root,rotation,stance,shin:s};
}
export function sampleExtendedPose(id:string,depth:number,sidePhase=0):ControlledPose{
 const spec=controlledMotionFor(id);if(!spec)throw Error('Unknown motion '+id);
 const q=spec.isHold?0:Math.max(0,Math.min(1,depth)),sideIndex=sidePhase===1?1:0;
 let base=stand(),root=base.root,rotation=base.rotation,spine=new Quaternion(),metric=0;
 let headPosition:Vector3|undefined,headRotation:Quaternion|undefined;
 if(seatedIds.has(id)){root=at(0,id==='seated_machine_row'?.72:.67,0);rotation=turn(X,rad(pullIds.has(id)?-7:0));}
 if(['barbell_row','bent_over_reverse_fly'].includes(id)){base=stand(20,4,.27,id==='barbell_row'?60:65);root=base.root;rotation=base.rotation;}
 if(id==='straight_arm_pulldown'){base=stand(10,4,.27,15);root=base.root;rotation=base.rotation;}
 if(id==='dumbbell_chest_fly'){root=at(0,.82,0);rotation=turn(X,-Math.PI/2);}
 if(id==='one_arm_dumbbell_row'){root=at(0,.94,-.30);rotation=turn(X,rad(68));}
 if(['pull_up','hanging_knee_raise'].includes(id)){root=at(0,id==='pull_up'?1.19+.67*q:1.19,-.16);}
 if(['barbell_deadlift','goblet_squat'].includes(id)){
  base=id==='barbell_deadlift'?stand(4+66*q,2+28*q,.28,4+68*q):stand(4+81*q,2+28*q,.30,3+12*q);root=base.root;rotation=base.rotation;
 }
 if(id==='dumbbell_reverse_lunge'){root=at(0,1.22-.49*q,-.28*q);}
 if(id==='standing_calf_raise'){const angle=rad(35*q),ankle=at(0,0,.25).sub(at(0,-.11,.25).applyQuaternion(turn(X,angle)));root.y+=ankle.y-.11;root.z+=ankle.z;metric=35*q;}
 if(['push_up','diamond_push_up','forearm_plank'].includes(id)){
  root.y=id==='forearm_plank'?.43:lerp(.57,.33,q);const dy=root.y-.28,run=Math.sqrt(1.115**2-dy**2-.01**2);root.z=-1.23+run;rotation=turn(X,Math.atan2(run,dy));
 }
 if(id==='pike_push_up'){root=at(0,1.12,-.35);rotation=turn(X,rad(110+20*q));}
 if(id==='inverted_row'){root.y=.30+.30*q;const dy=root.y-.14,run=Math.sqrt(1.115**2-dy**2-.05**2);root.z=1.30-run;rotation=turn(X,-Math.atan2(run,dy));}
 if(id==='bird_dog'){root=at(0,.675,-.15);rotation=turn(X,rad(77.5));}
 if(id==='dead_bug'){root=at(0,.23,0);rotation=turn(X,-Math.PI/2);}
 if(['kneeling_cable_crunch','barbell_ab_rollout'].includes(id)){
  root=at(0,.685,-.106);if(id==='kneeling_cable_crunch')spine=turn(X,rad(35*q));
  else{const angle=rad(-10+70*q);root=at(0,.125+BODY.thigh*Math.cos(angle),BODY.thigh*Math.sin(angle));rotation=turn(X,rad(70+15*q));}
 }
 if(id==='dumbbell_side_bend'){spine=turn(Z,rad(15*q));metric=15*q;}
 if(['glute_bridge','barbell_hip_thrust'].includes(id)){
  const thrust=id==='barbell_hip_thrust',shoulder=at(0,thrust?.82:.22,thrust?-.68:-.80),height=thrust?lerp(.40,.82,q):lerp(.26,.65,q),angle=-Math.acos((shoulder.y-height)/BODY.shoulderY);
  rotation=turn(X,angle);root=shoulder.clone().sub(at(0,BODY.shoulderY,0).applyQuaternion(rotation));
  if(!thrust){headPosition=at(0,.22,-.97);headRotation=turn(X,-Math.PI/2);}
  metric=q*35;
 }
 if(id==='leg_press'){root=at(0,.62,-.20);rotation=turn(X,-rad(35));}
 const rootMatrix=compose(root,rotation),torsoMatrix=rootMatrix.clone().multiply(compose(at(0,.10,0),spine)).multiply(compose(at(0,-.10,0),new Quaternion())),torsoQ=rotation.clone().multiply(spine);
 const shoulder=(s:number)=>transform(torsoMatrix,at(s*BODY.shoulderX,BODY.shoulderY,0));
 const palmQ=turn(X,-Math.PI/2),arms=SIDES.map((s,i)=>{
  const sh=shoulder(s),normal=(world=new Quaternion(),flex=rad(8),roll=0)=>armFromWorld(sh,world,flex,torsoQ,roll);
  const fixedBar=['row','pulldown','pullup','hanging_knee','inverted_row','deadlift','hip_thrust','rollout'].includes(spec.kind)&&id!=='neutral_grip_lat_pulldown'||id==='barbell_overhead_press';
  const target=(p:Vector3,pole:Vector3,hand?:Quaternion)=>hand?armTarget(sh,p,pole,torsoQ,hand):fixedBar?barGripTarget(sh,p,pole,torsoQ):freeGripTarget(sh,p,pole,torsoQ);
  switch(spec.kind){
   case 'chest_machine':return target(at(s*.52,1.49,.24+.58*q),at(s*.30,-1,-.1));
   case 'overhead_press':{
    const seated=id==='machine_shoulder_press',db=id==='dumbbell_shoulder_press',width=db?lerp(.64,.50,q):seated?.58:.60;
    return target(at(s*width,sh.y+.13+.70*q,.32*(1-q)+.08),at(s*.6,-.4,.15));
   }
   case 'pulldown':{
    const narrow=id==='neutral_grip_lat_pulldown',supinated=id==='reverse_grip_lat_pulldown',width=narrow?.23:supinated?.43:.65;
    const high=narrow?2.38:supinated?2.42:2.35;
    const a=target(at(s*width,lerp(high,1.48,q),lerp(.27,.40,q)),at(s*(narrow||supinated?.22:.55),-1,.1));
    if(supinated){a.hand.multiply(turn(Y,Math.PI));a.handWorld=a.forearmWorld.clone().multiply(a.hand);a.roll=Math.PI;}
    return a;
   }
   case 'pullup':case 'hanging_knee':return target(at(s*.62,2.94,.12),at(s*.5,-1,-.12));
   case 'row':return target(at(s*.50,lerp(sh.y-.86,sh.y-.24,q),lerp(sh.z,sh.z-.30,q)),at(s*.25,.05,-1));
   case 'row_single':{
    if(i===0){const a=target(at(-.43,.54,.83),at(-.2,-1,-.15),palmQ);a.palm=true;return a;}
    const a=target(at(sh.x,lerp(sh.y-.88,sh.y-.24,q),lerp(sh.z,sh.z-.34,q)),at(.2,.1,-1));a.roll=-s*Math.PI/2;a.hand.multiply(turn(Y,a.roll));a.handWorld=a.forearmWorld.clone().multiply(a.hand);return a;
   }
   case 'row_seated':return target(at(s*.58,1.42,lerp(.88,.23,q)),at(s*.8,-.2,-.6));
   case 'inverted_row':return target(at(s*.50,1.25,-.40),at(0,-1,1));
   case 'pullover':return normal(turn(X,rad(-140+125*q)),rad(12));
   case 'pushdown':return normal(turn(X,-rad(18)),rad(105-95*q));
   case 'reverse_curl':{const a=normal(new Quaternion(),rad(8+112*q),Math.PI);a.roll=Math.PI;return a;}
   case 'overhead_extension':return target(at(s*.10,root.y+lerp(1.75,1.25,q),lerp(-.13,-.48,q)),at(s*.8,1,-.15));
   case 'face_pull':return target(at(s*lerp(.19,.55,q),sh.y+lerp(-.12,.08,q),lerp(.83,.30,q)),at(s*1,.15,-.4));
   case 'fly':return normal(turn(Z,-s*rad(-20+105*q)).multiply(turn(X,Math.PI)),rad(15),-s*Math.PI/2);
   case 'cable_fly':{const spread=rad(76-98*q),d=at(s*Math.sin(spread),-.13,Math.cos(spread));return normal(upperFrame(d,at(0,-1,0)),rad(18),-s*Math.PI/2);}
   case 'reverse_fly':{const angle=rad(8+78*q);return normal(upperFrame(at(s*Math.sin(angle),-Math.cos(angle),.03),at(0,-.2,1)),rad(10),-s*Math.PI/2);}
   case 'deadlift':{
    const z=.28,reach=.898,dy=Math.sqrt(reach**2-(.50-BODY.shoulderX)**2-(sh.z-z)**2);return target(at(s*.50,sh.y-dy,z),at(s*.15,-.5,.6));
   }
   case 'goblet':return target(transform(torsoMatrix,at(s*.115,.70,.40)),at(s*.5,-1,.3));
   case 'pushup':case 'pike':case 'plank':{
    const width=id==='diamond_push_up'?.20:spec.kind==='pike'?.44:.56,z=spec.kind==='plank'?1.24:spec.kind==='pike'?.62:.90;
    const pole=spec.kind==='plank'?at(s*.1,-1,-.3):spec.kind==='pike'?at(s*.25,-.1,-.38):at(s*(id==='diamond_push_up'?.35:.15),.3,-1);
    const a=target(at(s*width,spec.kind==='plank'?.085:.055,z),pole,palmQ);a.palm=true;return a;
   }
   case 'bridge':return setHand(target(at(s*.55,.09,-.04),at(s*.1,.2,.5),palmQ),palmQ,true);
   case 'hip_thrust':return target(transform(rootMatrix,at(s*.52,.18,.25)),at(s*.3,-1,.2));
   case 'leg_press':return target(at(s*.43,.65,-.45),at(s*.4,-1,-.2));
   case 'rollout':{
    const z=sh.z+Math.sqrt(.898**2-(sh.y-.155)**2);return target(at(s*.43,.155,z),at(0,1,0));
   }
   case 'side_bend':return i===0?normal(new Quaternion(),rad(4)):target(at(.30,root.y+.16,.13),at(.4,-1,.1));
   case 'crunch':return target(transform(torsoMatrix,at(s*.23,1.20,.23)),at(s*.5,-.4,.6));
   case 'dead_bug':{const amount=i===sideIndex?q:0;const a=normal(turn(X,rad(180-90*amount)),rad(8));a.palm=true;return a;}
   case 'bird_dog':{
    const start=target(at(s*.43,.055,.833),at(s*.1,-1,-.2),palmQ);start.palm=true;if(i!==sideIndex)return start;
    const world=torsoQ.clone().multiply(start.upper).slerp(turn(X,-rad(102.5)),q),a=normal(world,lerp(start.flexion,rad(8),q));return setHand(a,palmQ,true);
   }
   case 'pallof':return target(at(s*.065,sh.y-.25,.32+.53*q),at(s*.7,-.3,-.2));
   default:return normal(new Quaternion(),rad(5));
  }
 }) as [ControlledArm,ControlledArm];
 const legs=SIDES.map((s,i)=>{
  const hip=transform(rootMatrix,at(s*BODY.hipX,0,0)),standard=(ankle:Vector3,pole=at(s*.1,-.1,1),foot=new Quaternion())=>legTarget(hip,ankle,pole,rotation,s,foot);
  if(id==='one_arm_dumbbell_row')return i===0?legFromAngles(hip,turn(X,-rad(54)),rad(144),rotation,s):standard(at(.36,.11,-.40));
  if(seatedIds.has(id))return standard(at(s*.28,id==='seated_machine_row'?.23:.11,id==='seated_machine_row'?.70:.65),at(s*.1,.4,1));
  if(id==='dumbbell_chest_fly')return standard(at(s*.29,.11,.72),at(0,.45,1));
  if(id==='pull_up')return legFromAngles(hip,turn(X,rad(8)),rad(35),rotation,s);
  if(id==='hanging_knee_raise')return legFromAngles(hip,turn(X,-rad(5+80*q)),rad(35+55*q),rotation,s);
  if(id==='dumbbell_reverse_lunge'){
   if(i!==sideIndex)return standard(at(s*.26,.11,0),at(s*.1,-1,1),turn(Y,s*rad(8)));
   const step=Math.min(1,q/.65),ankle=at(s*.26,.11+.17*step+.06*Math.sin(Math.PI*step),-1.05*step);return standard(ankle,at(0,-1,.3),turn(X,rad(55*step)));
  }
  if(id==='standing_calf_raise'){const angle=rad(35*q),ankle=at(s*.26,0,.25).sub(at(0,-.11,.25).applyQuaternion(turn(X,angle)));return standard(ankle,at(s*.1,-.1,1),turn(X,angle));}
  if(['push_up','diamond_push_up','forearm_plank','pike_push_up'].includes(id))return standard(at(s*.20,.28,id==='pike_push_up'?-1.00:-1.23),at(s*.05,.1,.1),turn(X,rad(60)));
  if(id==='inverted_row')return standard(at(s*.24,.14,1.30),at(0,.4,.1),turn(X,-rad(40)));
  if(['barbell_ab_rollout','kneeling_cable_crunch','bird_dog'].includes(id)){
   const ankle=at(s*.19,.145,-.5496),knee=at(s*.19,.125,0),start=standard(ankle,knee.clone().sub(hip));
   if(id!=='bird_dog'||i===sideIndex)return start;
   const thigh=rotation.clone().multiply(start.upper).slerp(rotation,q),leg=legFromAngles(hip,thigh,lerp(start.flexion,rad(8),q),rotation,s);
   const lower=thigh.clone().multiply(leg.lower);leg.foot=lower.invert().multiply(turn(X,rad(90*Math.max(0,(q-.65)/.35))));return leg;
  }
  if(id==='dead_bug'){const amount=i!==sideIndex?q:0,thigh=turn(X,rad(-180+85*amount));return legFromAngles(hip,thigh,rad(90-82*amount),rotation,s);}
  if(['glute_bridge','barbell_hip_thrust'].includes(id))return standard(at(s*.28,.11,id==='barbell_hip_thrust'?.70:.65),at(s*.1,1,.7),turn(Y,s*rad(8)));
  if(id==='leg_press')return standard(at(s*.28,lerp(1.16,.80,q),lerp(.73,.39,q)),at(s*.1,1,-.4),turn(X,-rad(135)));
  const stance=base.stance,ankle=at(s*stance,.11,0),kneeZ=BODY.shin*Math.sin(base.shin),pole=at(s*(stance+kneeZ*Math.tan(rad(12))),.11+BODY.shin*Math.cos(base.shin),kneeZ).sub(hip);
  return standard(ankle,pole,turn(Y,s*rad(12)));
 }) as [ControlledLeg,ControlledLeg];
 const equipmentPosition=arms[0].grip.clone().add(arms[1].grip).multiplyScalar(.5),equipmentRotation=new Quaternion().setFromUnitVectors(X,arms[1].grip.clone().sub(arms[0].grip).normalize());
 const headPoint=headPosition?.clone().add(at(0,.225,0).applyQuaternion(headRotation!))??transform(torsoMatrix,at(0,1.31,0));
 const points=[root,...arms.flatMap(a=>[a.shoulder,a.elbow,a.wrist,a.grip]),...legs.flatMap(l=>[l.hip,l.knee,l.ankle]),headPoint];
 if(!metric)metric=spec.jointLabel.includes('膝')?legs[spec.alternateSides?1-sideIndex:sideIndex].flexion*180/Math.PI:spec.kind==='crunch'?35*q:spec.kind==='pullover'?125*q:spec.kind==='hanging_knee'?5+80*q:Math.max(...arms.map(a=>a.flexion))*180/Math.PI;
 let contacts:Vector3[]=legs.filter(l=>l.ankle.y<.4).map(l=>at(l.ankle.x,.015,l.ankle.z+.06));
 if(['pullup','hanging_knee','inverted_row'].includes(spec.kind))contacts.push(...arms.map(a=>a.grip.clone()));
 if(['pushup','pike','plank','bird_dog'].includes(spec.kind))contacts.push(...arms.filter(a=>a.grip.y<.2).map(a=>at(a.grip.x,.015,a.grip.z)));
 if(['crunch','rollout','bird_dog'].includes(spec.kind))contacts.push(...legs.filter(l=>l.knee.y<.2).map(l=>at(l.knee.x,.015,l.knee.z)));
 const ground=(v:Vector3)=>at(v.x,.015,v.z);
 if(['pullup','hanging_knee','dead_bug','leg_press'].includes(spec.kind))contacts=[];
 if(spec.kind==='bird_dog')contacts=[ground(arms[1-sideIndex].grip),ground(legs[sideIndex].knee)];
 if(['crunch','rollout'].includes(spec.kind))contacts=legs.map(l=>ground(l.knee));
 if(spec.kind==='rollout')contacts.push(at(-.99,.015,equipmentPosition.z),at(.99,.015,equipmentPosition.z));
 if(['pushup','pike','plank'].includes(spec.kind))contacts=[...legs.map(l=>ground(l.ankle.clone().add(at(0,-.11,.251).applyQuaternion(turn(X,rad(60)))))),...arms.map(a=>ground(spec.kind==='plank'?a.elbow:a.grip))];
 if(spec.kind==='calf')contacts=SIDES.map(s=>at(s*.26,.015,.25));
 if(spec.kind==='row_single')contacts=[ground(legs[1].ankle)];
 if(spec.kind==='lunge')contacts=legs.filter((_,i)=>i!==sideIndex||q===0||q>=.65).map(l=>ground(l.ankle));
 const cables:[Vector3,Vector3][]=[];
 if(pullIds.has(id))cables.push([equipmentPosition.clone(),at(0,2.98,.70)]);
 if(['cable_face_pull','cable_triceps_pushdown','straight_arm_pulldown','kneeling_cable_crunch'].includes(id)){
  const connection=spec.gear==='rope'?equipmentPosition.clone().add(at(0,.03,.22)):equipmentPosition.clone();cables.push([connection,at(0,id==='cable_face_pull'?2.25:2.96,1.62)]);
  if(spec.gear==='rope')for(const a of arms)cables.push([a.grip.clone(),connection.clone()]);
 }
 if(id==='standing_cable_fly')for(let i=0;i<2;i++)cables.push([arms[i].grip.clone(),at(SIDES[i]*1.65,2.12,-.15)]);
 if(id==='standing_pallof_press')cables.push([equipmentPosition.clone(),at(1.85,equipmentPosition.y,.28)]);
 const p:ControlledPose={root,rotation,spine,arms,legs,metric,metricLabel:spec.jointLabel,equipmentPosition,equipmentRotation,points,spec,contacts,cables,headCenter:headPoint};
 if(headPosition){p.headPosition=headPosition;p.headRotation=headRotation;}
 if(spec.gear==='single'){p.singleWeight={position:equipmentPosition.clone().add(at(0,-.13,0)),rotation:new Quaternion()};points.push(p.singleWeight.position);}
 if(id==='leg_press'){const r=turn(X,-rad(135));p.plate={position:legs[0].ankle.clone().add(legs[1].ankle).multiplyScalar(.5).add(at(0,-.145,.085).applyQuaternion(r)),rotation:r};points.push(p.plate.position.clone().add(at(.6,.4,.4)),p.plate.position.clone().sub(at(.6,.4,.4)));}
 for(const [a,b]of cables)points.push(a,b);return p;
}
