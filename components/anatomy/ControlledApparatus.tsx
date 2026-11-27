import {forwardRef,useEffect,useImperativeHandle,useMemo,useRef} from 'react';
import {RoundedBox} from '@react-three/drei';
import {BufferAttribute,BufferGeometry,Group,LineBasicMaterial,LineSegments} from 'three';
import {motionScene} from '../../lib/extendedMotion';
import type {ControlledPose} from '../../lib/jointKinematics';
import {controlledMotionFor} from '../../lib/motionCatalog';
import {Dumbbell} from './TrainingEquipment';

export interface ApparatusHandle {update(pose:ControlledPose):void}
export const ControlledApparatus=forwardRef<ApparatusHandle,{exerciseId:string}>(function ControlledApparatus({exerciseId},ref){
 const spec=controlledMotionFor(exerciseId)!,parts=useMemo(()=>motionScene(exerciseId),[exerciseId]),handles=useRef<(Group|null)[]>([]),bar=useRef<Group>(null),single=useRef<Group>(null),plate=useRef<Group>(null);
 const cables=useMemo(()=>{const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(8*6),3));geometry.setDrawRange(0,0);const material=new LineBasicMaterial({color:'#a6c1c7'});const line=new LineSegments(geometry,material);line.frustumCulled=false;return line;},[]);
 useEffect(()=>()=>{cables.geometry.dispose();cables.material.dispose();},[cables]);
 useImperativeHandle(ref,()=>({update(p){
  const a=cables.geometry.getAttribute('position') as BufferAttribute,segments=p.cables??[];segments.forEach(([from,to],i)=>{a.setXYZ(i*2,...from.toArray());a.setXYZ(i*2+1,...to.toArray());});a.needsUpdate=true;cables.geometry.setDrawRange(0,segments.length*2);
  if(bar.current){bar.current.position.copy(p.equipmentPosition);bar.current.quaternion.copy(p.equipmentRotation);bar.current.scale.x=spec.gear==='bar'?Math.max(.30,p.arms[0].grip.distanceTo(p.arms[1].grip)+.18):1;}
  handles.current.forEach((h,i)=>{if(h){h.position.copy(p.arms[i].grip);h.quaternion.copy(p.arms[i].handWorld);}});
  if(single.current&&p.singleWeight){single.current.position.copy(p.singleWeight.position);single.current.quaternion.copy(p.singleWeight.rotation);}
  if(plate.current&&p.plate){plate.current.position.copy(p.plate.position);plate.current.quaternion.copy(p.plate.rotation);}
 }}),[cables,spec.gear]);
 return <group name="controlled-apparatus">
  {parts.map((p,i)=><RoundedBox key={p.name+i} name={p.name} args={p.size} radius={Math.min(.025,...p.size.map(n=>n/4))} smoothness={2} position={p.position} rotation={p.rotation} castShadow={p.opacity===undefined} receiveShadow><meshStandardMaterial color={p.color} roughness={.65} metalness={.25} transparent={p.opacity!==undefined} opacity={p.opacity??1} depthWrite={p.opacity===undefined}/></RoundedBox>)}
  <primitive object={cables} name="controlled-cables"/>
  {spec.gear==='bar'&&<group ref={bar} name="controlled-handlebar"><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.022,.022,1,20]}/><meshStandardMaterial color="#bdccd1" metalness={.7} roughness={.3}/></mesh></group>}
  {(spec.gear==='handles'||spec.gear==='rope')&&exerciseId!=='standing_pallof_press'&&[0,1].map(i=><group key={i} ref={node=>{handles.current[i]=node;}} name={'controlled-handle-'+i}><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.027,.027,.16,16]}/><meshStandardMaterial color="#233d48" roughness={.7}/></mesh></group>)}
  {exerciseId==='standing_pallof_press'&&<group ref={bar} name="controlled-pallof-handle"><mesh><torusGeometry args={[.075,.014,12,32]}/><meshStandardMaterial color="#adc5cc" roughness={.5} metalness={.6}/></mesh></group>}
  {spec.gear==='single'&&<group ref={single} name="controlled-single-weight"><Dumbbell vertical/></group>}
  {exerciseId==='leg_press'&&<group ref={plate} name="controlled-footplate"><RoundedBox args={[1.24,.07,.56]} radius={.02} castShadow><meshStandardMaterial color="#4b6873" roughness={.8}/></RoundedBox>{[-.36,-.12,.12,.36].map(x=><mesh key={x} position={[x,.04,0]}><boxGeometry args={[.015,.006,.44]}/><meshStandardMaterial color="#a4b7ba"/></mesh>)}</group>}
 </group>;
});
