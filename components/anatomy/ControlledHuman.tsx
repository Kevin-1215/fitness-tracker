import {memo,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Line,RoundedBox} from '@react-three/drei';
import {BufferAttribute,BufferGeometry,Group,LineBasicMaterial,LineSegments,MeshPhysicalMaterial,Quaternion,Vector3} from 'three';
import {expandMuscles,MUSCLE_LABELS,type AnatomicalMuscle,type Equipment,type MuscleId} from '../../lib/exercisesData';
import {BODY,sampleControlledPose,type ControlledPose} from '../../lib/controlledMotion';
import {cycleDepth,motionPhase} from '../../lib/motionCatalog';
import {createMuscleMaterial,Head,LimbSurface,TorsoSurface,type MuscleMaterials} from './AnatomicalBody';
import {Dumbbell} from './TrainingEquipment';

const SIDES=[-1,1] as const;
export interface ControlledFrame {progress:number;depth:number;metric:number;metricLabel:string;phase:string;side:number}
interface Props {exerciseId:string;equipment:Equipment;primaryMuscles:readonly MuscleId[];secondaryMuscles:readonly MuscleId[];playing:boolean;cycleDuration:number;seek?:{value:number;revision:number};sidePhase?:number;xray:boolean;guides:boolean;pulse:boolean;selected:AnatomicalMuscle|null;onSelect:(muscle:AnatomicalMuscle)=>void;onFrame:(frame:ControlledFrame)=>void}

/** The handle sits inside the curled fingers. Hands inherit the forearm frame;
 * they are never cancelled back to a fixed global orientation. */
function GripHand({skin,side}:{skin:MeshPhysicalMaterial;side:number}){
 return <group name="grip-hand"><mesh position={[0,-.042,-.023]} material={skin} scale={[.062,.070,.034]} castShadow><sphereGeometry args={[1,24,20]}/></mesh>
  {[-.042,-.014,.014,.042].map((x,i)=><mesh key={x} position={[x,-BODY.gripOffset,0]} rotation={[0,Math.PI/2,0]} material={skin} castShadow><torusGeometry args={[.031,i===0||i===3?.010:.012,8,20,Math.PI*1.65]}/></mesh>)}
  <mesh position={[-side*.050,-.058,.021]} rotation={[.4,0,side*.65]} material={skin}><capsuleGeometry args={[.018,.055,6,12]}/></mesh>
 </group>;
}
function ReviewBench({angle}:{angle:number}){
 const tilt=(angle-90)*Math.PI/180;
 return <group name="review-bench"><group position={[0,.82,0]} rotation={[tilt,0,0]}>
  <RoundedBox name="bench-back-pad" args={[.52,1.65,.10]} radius={.045} position={[0,.68,-.235]} castShadow><meshStandardMaterial color="#182831" roughness={.9}/></RoundedBox>
  <RoundedBox args={[.08,1.6,.08]} radius={.015} position={[0,.68,-.33]}><meshStandardMaterial color="#587078" roughness={.4} metalness={.6}/></RoundedBox>
 </group>
 {angle>0&&<RoundedBox args={[.5,.12,.53]} radius={.035} position={[0,.59,.17]} castShadow><meshStandardMaterial color="#182831" roughness={.9}/></RoundedBox>}
 <RoundedBox args={[.10,.50,.12]} radius={.015} position={[0,.29,.31]}><meshStandardMaterial color="#3d5059" metalness={.55} roughness={.4}/></RoundedBox>
 <RoundedBox args={[.75,.08,.27]} radius={.02} position={[0,.04,.31]}><meshStandardMaterial color="#223039" metalness={.3} roughness={.6}/></RoundedBox>
 <RoundedBox args={[.10,.56,.12]} radius={.015} position={[0,.32,-.72]}><meshStandardMaterial color="#3d5059" metalness={.55} roughness={.4}/></RoundedBox>
 <RoundedBox args={[.75,.08,.27]} radius={.02} position={[0,.04,-.72]}><meshStandardMaterial color="#223039" metalness={.3} roughness={.6}/></RoundedBox>
 </group>;
}
function ReviewBar(){return <group name="controlled-barbell"><mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.019,.019,2.2,20]}/><meshStandardMaterial color="#c3d1d5" metalness={.8} roughness={.25}/></mesh>{SIDES.map(side=><group key={side} position={[side*.99,0,0]} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[.15,.15,.055,32]}/><meshStandardMaterial color="#17242d" roughness={.75}/></mesh><mesh position={[0,side*.034,0]}><cylinderGeometry args={[.045,.045,.012,20]}/><meshStandardMaterial color="#8ca2ac" metalness={.7} roughness={.3}/></mesh></group>)}</group>;}

export const ControlledHuman=memo(function ControlledHuman({exerciseId,equipment,primaryMuscles,secondaryMuscles,playing,cycleDuration,seek,sidePhase=0,xray,guides,pulse,selected,onSelect,onFrame}:Props){
 const invalidate=useThree(state=>state.invalidate),root=useRef<Group>(null),bar=useRef<Group>(null),overlay=useRef<Group>(null);
 const upperArms=useRef<(Group|null)[]>([]),forearms=useRef<(Group|null)[]>([]),hands=useRef<(Group|null)[]>([]),thighs=useRef<(Group|null)[]>([]),shins=useRef<(Group|null)[]>([]),feet=useRef<(Group|null)[]>([]),markers=useRef<(Group|null)[]>([]);
 const time=useRef(cycleDuration*.3),lastDuration=useRef(cycleDuration),report=useRef(1);
 const spec=sampleControlledPose(exerciseId,0).spec;
 const primaryKey=primaryMuscles.join('|'),secondaryKey=secondaryMuscles.join('|');
 const primary=useMemo(()=>expandMuscles(primaryMuscles),[primaryKey]),secondary=useMemo(()=>expandMuscles(secondaryMuscles),[secondaryKey]);
 const skin=useMemo(()=>new MeshPhysicalMaterial({color:'#9caeae',roughness:.73,metalness:.015,clearcoat:0}),[]);
 const materials=useMemo(()=>Object.fromEntries(Object.keys(MUSCLE_LABELS).map(id=>[id,createMuscleMaterial()])) as MuscleMaterials,[]);
 const path=useMemo(()=>Array.from({length:41},(_,i)=>sampleControlledPose(exerciseId,i/40).arms[0].grip.toArray() as [number,number,number]),[exerciseId]);
 const skeleton=useMemo(()=>{const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(22*3),3));const material=new LineBasicMaterial({color:'#7ed6e6',transparent:true,opacity:.6,depthTest:false});const line=new LineSegments(geometry,material);line.frustumCulled=false;line.renderOrder=8;return line;},[]);
 useEffect(()=>{time.current=cycleDuration*.3;report.current=1;invalidate();},[exerciseId,invalidate]);
 useEffect(()=>{time.current=time.current/lastDuration.current*cycleDuration;lastDuration.current=cycleDuration;invalidate();},[cycleDuration,invalidate]);
 useEffect(()=>{if(seek){time.current=Math.max(0,Math.min(.99999,seek.value))*lastDuration.current;report.current=1;invalidate();}},[seek,invalidate]);
 useEffect(()=>{
  skin.transparent=xray;skin.opacity=xray?.17:1;skin.depthWrite=!xray;skin.needsUpdate=true;
  for(const id of Object.keys(materials) as AnatomicalMuscle[]){const main=primary.has(id),assist=!main&&secondary.has(id),focused=selected===id,m=materials[id];m.color.set(main?'#f97316':assist?'#eab308':focused?'#82cfdf':xray?'#334155':'#9faeae');m.emissive.set(main?'#f97316':assist?'#eab308':focused?'#326a7c':'#000000');m.emissiveIntensity=main?.9:assist?.45:focused?.3:0;m.roughness=.73;m.transparent=xray;m.opacity=main||assist||focused||!xray?1:.3;m.depthWrite=!xray||main||assist||focused;m.needsUpdate=true;}
  invalidate();
 },[skin,materials,xray,primary,secondary,selected,invalidate]);
 useEffect(()=>()=>{skin.dispose();Object.values(materials).forEach(m=>m.dispose());skeleton.geometry.dispose();skeleton.material.dispose();},[skin,materials,skeleton]);
 useFrame(({clock},delta)=>{
  if(!root.current)return;if(playing)time.current+=Math.min(.1,delta);
  const progress=(time.current%cycleDuration)/cycleDuration,side=spec.kind==='alternate'?(sidePhase+Math.floor(time.current/cycleDuration))%2:0,depth=cycleDepth(progress),p=sampleControlledPose(exerciseId,depth,side);
  root.current.position.copy(p.root);root.current.quaternion.copy(p.rotation);
  SIDES.forEach((_,i)=>{upperArms.current[i]?.quaternion.copy(p.arms[i].upper);forearms.current[i]?.quaternion.copy(p.arms[i].lower);hands.current[i]?.quaternion.copy(p.arms[i].hand);thighs.current[i]?.quaternion.copy(p.legs[i].upper);shins.current[i]?.quaternion.copy(p.legs[i].lower);feet.current[i]?.quaternion.copy(p.legs[i].foot);});
  bar.current?.position.copy(p.equipmentPosition);bar.current?.quaternion.copy(p.equipmentRotation);
  const points=p.arms.flatMap(arm=>[arm.shoulder,arm.elbow,arm.wrist]).concat(p.legs.flatMap(leg=>[leg.hip,leg.knee,leg.ankle]));
  points.forEach((point,i)=>markers.current[i]?.position.copy(point));
  const pairs=[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[9,10],[10,11],[0,3],[6,9]],positions=skeleton.geometry.getAttribute('position') as BufferAttribute;
  let index=0;for(const [a,b]of pairs){positions.setXYZ(index++,...points[a].toArray());positions.setXYZ(index++,...points[b].toArray());}positions.setXYZ(index++,...p.root.toArray());positions.setXYZ(index,...p.arms[0].shoulder.clone().add(p.arms[1].shoulder).multiplyScalar(.5).toArray());positions.needsUpdate=true;
  if(overlay.current)overlay.current.visible=guides;
  for(const id of primary)materials[id].emissiveIntensity=pulse?.86+.08*Math.sin(clock.elapsedTime*1.6):.9;
  report.current+=delta;if(report.current>.10){report.current=0;onFrame({progress,depth,metric:p.metric,metricLabel:p.metricLabel,phase:motionPhase(progress,spec),side});}
 });
 const surface={materials,skin,primary,secondary,selected,onSelect};
 return <group name="controlled-motion-scene">
  <group ref={root} name="controlled-human">
   <RoundedBox args={[.56,.28,.36]} radius={.09} position={[0,-.025,0]} castShadow><meshStandardMaterial color="#152731" roughness={.86}/></RoundedBox>
   {SIDES.map(side=><mesh key={side} position={[side*.135,-.025,-.18]} scale={[.135,.12,.024]} material={materials.glutes}><sphereGeometry args={[1,24,20]}/></mesh>)}
   <group position={[0,.1,0]}><TorsoSurface {...surface}/><group position={[0,.99,0]} scale={.91}><Head skin={skin}/></group></group>
   {SIDES.map((side,i)=><group key={side}>
    <group position={[side*BODY.shoulderX,BODY.shoulderY,0]} ref={node=>{upperArms.current[i]=node;}} name={'controlled-shoulder-'+i}>
     <mesh material={skin} scale={[.105,.09,.105]}><sphereGeometry args={[1,24,20]}/></mesh><group scale={[1,BODY.upperArm/.44,1]}><LimbSurface kind="upperArm" side={side} {...surface}/></group>
     <group position={[0,-BODY.upperArm,0]} ref={node=>{forearms.current[i]=node;}} name={'controlled-elbow-'+i}><mesh material={skin} scale={[.075,.075,.075]}><sphereGeometry args={[1,20,16]}/></mesh><group scale={[1,BODY.forearm/.43,1]}><LimbSurface kind="forearm" side={side} {...surface}/></group>
      <group position={[0,-BODY.forearm,0]} ref={node=>{hands.current[i]=node;}} name={'controlled-wrist-'+i}><GripHand skin={skin} side={side}/><group position={[0,-BODY.gripOffset,0]} name={'controlled-grip-'+i}>{equipment==='啞鈴'&&<Dumbbell/>}</group></group>
     </group>
    </group>
    <group position={[side*BODY.hipX,0,0]} ref={node=>{thighs.current[i]=node;}} name={'controlled-hip-'+i}><LimbSurface kind="thigh" side={side} {...surface}/><mesh position={[0,-.06,0]}><cylinderGeometry args={[.16,.16,.16,32]}/><meshStandardMaterial color="#152731" roughness={.86}/></mesh>
     <group position={[0,-BODY.thigh,0]} ref={node=>{shins.current[i]=node;}} name={'controlled-knee-'+i}><mesh material={skin} scale={[.09,.09,.09]}><sphereGeometry args={[1,20,16]}/></mesh><LimbSurface kind="shin" side={side} {...surface}/>
      <group position={[0,-BODY.shin,0]} ref={node=>{feet.current[i]=node;}} name={'controlled-ankle-'+i}><RoundedBox args={[.16,.105,.32]} radius={.04} position={[0,-.0435,.085]} castShadow><meshStandardMaterial color="#49626d" roughness={.8}/></RoundedBox><RoundedBox args={[.168,.028,.332]} radius={.01} position={[0,-.096,.085]}><meshStandardMaterial color="#20323b" roughness={.95}/></RoundedBox></group>
     </group>
    </group>
   </group>)}
  </group>
  {equipment==='槓鈴'&&<group ref={bar}><ReviewBar/></group>}
  {spec.kind==='bench'&&<ReviewBench angle={spec.benchAngle??0}/>}
  <group ref={overlay} visible={guides} name="motion-guides"><primitive object={skeleton}/><Line points={path} color="#ffa874" transparent opacity={.65} lineWidth={1.5} dashed dashSize={.045} gapSize={.025} depthTest={false}/>
   {Array.from({length:12},(_,i)=><group key={i} ref={node=>{markers.current[i]=node;}}><mesh renderOrder={9}><sphereGeometry args={[.027,12,10]}/><meshBasicMaterial color="#9be5ef" depthTest={false} transparent opacity={.9}/></mesh></group>)}
   {sampleControlledPose(exerciseId,0).legs.map((leg,i)=><mesh key={i} position={[leg.ankle.x,.012,leg.ankle.z+.06]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.13,.144,32]}/><meshBasicMaterial color="#addd91" transparent opacity={.75} depthTest={false}/></mesh>)}
  </group>
 </group>;
});
