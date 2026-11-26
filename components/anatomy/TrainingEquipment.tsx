import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import {useFrame} from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Group, Line, LineBasicMaterial, Mesh,MeshStandardMaterial, Quaternion, TubeGeometry, Vector3 } from "three";
import type { AnimationType, Equipment } from "../../lib/exercisesData";
import {BENCH_MOVEMENTS,HANGING_MOVEMENTS,SINGLE_DUMBBELL} from "../../lib/sceneFraming";

const UP = new Vector3(0, 1, 0);
const metal = { color: "#454d53", metalness: .72, roughness: .28 };
const chrome = { color: "#b9c1c6", metalness: .82, roughness: .22 };
const rubber = { color: "#141a20", metalness: .02, roughness: .8 };

function Box({ at, size, color = "#3b4247", radius = .025 }: { at: [number, number, number]; size: [number, number, number]; color?: string; radius?: number }) {
  return <RoundedBox position={at} args={size} radius={radius} smoothness={3} castShadow receiveShadow><meshStandardMaterial {...metal} color={color} /></RoundedBox>;
}

function Tower({ row,seated=true,anchor=3.12 }: { row: boolean;seated?:boolean;anchor?:number }) {
  return <group name="cable-machine" position={[0, 0, 1.02]}>
    <Box at={[0, .045, -.22]} size={[1.68, .09, 1.25]} color="#292f33" />
    {[-1, 1].map((side) => <group key={side}>
      <Box at={[side * .76, 1.6, .02]} size={[.115, 3.12, .16]} />
      <Box at={[side * .61, .1, -.48]} size={[.14, .1, 1.45]} />
      <mesh position={[side * .19, 1.54, .02]} castShadow><cylinderGeometry args={[.015, .015, 2.52, 16]} /><meshStandardMaterial {...chrome} /></mesh>
    </group>)}
    <Box at={[0, 3.14, .02]} size={[1.62, .13, .19]} />
    <Box at={[0, 1.65, .14]} size={[.57, 2.56, .10]} color="#1d2328" />
    {Array.from({ length: 14 }, (_, i) => <Box key={i} at={[0, .26 + i * .047, -.02]} size={[.48, .039, .31]} color={i === 8 ? "#49545d" : "#30383e"} radius={.008} />)}
    <mesh position={[0, anchor, -.25]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.105, .105, .065, 24]} /><meshStandardMaterial {...rubber} /></mesh>
    {seated&&<><Box at={[0, .31, -.91]} size={[.14, .6, .18]} />
    <Box at={[0, .58, -.98]} size={[.61, .13, .54]} color="#111820" radius={.06} />
    <Box at={[0, .21, -.91]} size={[.73, .08, .65]} /></>}
    {seated&&!row && anchor>3 && [-1, 1].map((side) => <mesh key={side} position={[side * .23, .84, -.62]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[.088, .088, .30, 24]} /><meshStandardMaterial {...rubber} />
    </mesh>)}
    {row && [-1, 1].map((side) => <group key={side} position={[side * .26, .17, -.26]} rotation={[-.55, 0, 0]}>
      <Box at={[0, 0, 0]} size={[.27, .08, .37]} color="#1d252c" />
    </group>)}
  </group>;
}

function SlimTower({x,z,height=2.05}:{x:number;z:number;height?:number}){
  return <group position={[x,0,z]} name="cable-column"><Box at={[0,1.4,0]} size={[.23,2.8,.25]}/><Box at={[0,.045,0]} size={[.52,.09,.8]}/><mesh position={[0,height,-.18]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.09,.09,.07,24]}/><meshStandardMaterial {...rubber}/></mesh></group>;
}

export function Dumbbell({ hammer = false,vertical=false }: { hammer?: boolean;vertical?:boolean }) {
  return <group name="dumbbell" rotation={vertical?[0,0,0]:[0, hammer ? Math.PI / 2 : 0, Math.PI / 2]}>
    <mesh><cylinderGeometry args={[.023, .023, .29, 20]} /><meshStandardMaterial {...chrome} /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[0, side * .145, 0]}>
      <mesh castShadow><cylinderGeometry args={[.105, .105, .085, 6]} /><meshStandardMaterial {...rubber} /></mesh>
      <mesh position={[0, side * .045, 0]}><cylinderGeometry args={[.045, .045, .008, 20]} /><meshStandardMaterial {...chrome} /></mesh>
    </group>)}
  </group>;
}

export interface EquipmentHandle { update: (left: Vector3, right: Vector3, leftFoot: Vector3, rightFoot: Vector3) => void }
interface Props { animationType: AnimationType; equipment: Equipment; anatomy: boolean }

export const TrainingEquipment = forwardRef<EquipmentHandle, Props>(function TrainingEquipment({ animationType, equipment, anatomy }, ref) {
  const moving = useRef<Group>(null), shaft = useRef<Group>(null), plates = useRef<(Group | null)[]>([]), footplate = useRef<Group>(null);
  const handles=useRef<(Group|null)[]>([]);
  const structure=useRef<Group>(null),lastGhost=useRef<boolean|null>(null);
  const pulldown = ["pulldown","pulldown_supinated","pulldown_neutral"].includes(animationType);
  const row = animationType === "row_seated";
  const fly=animationType==="fly_standing",pallof=animationType==="pallof_press",single=SINGLE_DUMBBELL.includes(animationType);
  const seated=row||pulldown||["press_seated","press_vertical_seated"].includes(animationType);
  const anchor=row?.81:["face_pull","press_seated"].includes(animationType)?2.2:3.12;
  const barbell = equipment === "槓鈴", machine = equipment === "滑輪/機械";
  const cable = useMemo(() => {
    const geometry = new BufferGeometry(); geometry.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
    const line = new Line(geometry, new LineBasicMaterial({ color: "#727e87" })); line.frustumCulled = false; return line;
  }, []);
  const secondCable=useMemo(()=>{const geometry=new BufferGeometry();geometry.setAttribute("position",new BufferAttribute(new Float32Array(6),3));const line=new Line(geometry,new LineBasicMaterial({color:"#727e87"}));line.frustumCulled=false;return line;},[]);
  const bentBar = useMemo(() => new TubeGeometry(new CatmullRomCurve3([
    new Vector3(0,-.86,.12), new Vector3(0,-.61,0), new Vector3(0,0,0), new Vector3(0,.61,0), new Vector3(0,.86,.12),
  ]), 48, .021, 12, false), []);
  const work = useMemo(() => ({ mid: new Vector3(), direction: new Vector3(), q: new Quaternion() }), []);
  useFrame(({camera})=>{
    const ghost=machine&&!fly&&!pallof&&camera.position.z>.9;
    if(!structure.current||lastGhost.current===ghost)return;lastGhost.current=ghost;
    structure.current.traverse(object=>{if(object instanceof Mesh){for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof MeshStandardMaterial){material.transparent=ghost;material.opacity=ghost?.16:1;material.depthWrite=!ghost;material.needsUpdate=true;}}});
  });
  useEffect(()=>{lastGhost.current=null;},[animationType,equipment]);
  useEffect(() => () => { cable.geometry.dispose(); cable.material.dispose();secondCable.geometry.dispose();secondCable.material.dispose(); bentBar.dispose(); }, [cable,secondCable,bentBar]);
  useImperativeHandle(ref, () => ({ update(left, right, leftFoot, rightFoot) {
    const mid = work.mid.copy(left).add(right).multiplyScalar(.5);
    if (moving.current) {
      moving.current.position.copy(mid);
      if(single||pallof)moving.current.quaternion.identity();else moving.current.quaternion.setFromUnitVectors(UP, work.direction.copy(right).sub(left).normalize());
      const length = Math.max(barbell?2.2:.5,left.distanceTo(right) + (barbell?.40:.20));
      if (shaft.current) shaft.current.scale.y = length;
      plates.current.forEach((plate, i) => { if (plate) plate.position.y = (i === 0 ? -1 : 1) * (length / 2 - .045); });
    }
    const positions = cable.geometry.getAttribute("position") as BufferAttribute;
    positions.setXYZ(0, fly?left.x:mid.x,fly?left.y:mid.y,fly?left.z:mid.z);
    positions.setXYZ(1, fly?-1.38:pallof?1.45:0,fly?2.05:pallof?2.05:anchor,fly?.67:pallof?-.18:.77);
    positions.needsUpdate = true;
    const second=secondCable.geometry.getAttribute("position") as BufferAttribute;second.setXYZ(0,right.x,right.y,right.z);second.setXYZ(1,1.38,2.05,.67);second.needsUpdate=true;
    handles.current[0]?.position.copy(left);handles.current[1]?.position.copy(right);
    if (footplate.current) footplate.current.position.copy(leftFoot).add(rightFoot).multiplyScalar(.5).add(new Vector3(0, .02, .1));
  } }), [row,animationType,work,cable,secondCable,single,pallof,fly,barbell,anchor]);
  return <group visible={!anatomy} name="training-equipment">
    <group ref={structure} name="machine-structure">
    {machine && animationType !== "leg_press" && !fly&&!pallof&&<Tower row={row} seated={seated} anchor={anchor}/>}
    {fly&&[-1,1].map(side=><SlimTower key={side} x={side*1.38} z={.85}/>)}
    {pallof&&<SlimTower x={1.45} z={0}/>}
    </group>
    <group ref={moving} name="virtual-barbell" visible={single||barbell||machine&&animationType!=="leg_press"&&!fly}>
      {single?<Dumbbell vertical/>:pallof?<mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.095,.018,12,24]}/><meshStandardMaterial {...chrome}/></mesh>:pulldown&&animationType!=="pulldown_neutral" ? <>
        <mesh geometry={bentBar} castShadow><meshStandardMaterial {...chrome} /></mesh>
        {[-1,1].map((side) => <mesh key={side} position={[0, side * .61, 0]}><cylinderGeometry args={[.026,.026,.29,16]} /><meshStandardMaterial {...rubber} /></mesh>)}
      </> : <>
        <group ref={shaft}><mesh castShadow><cylinderGeometry args={[.022,.022,1,20]} /><meshStandardMaterial {...chrome} /></mesh></group>
        {barbell && [-1,1].map((side, i) => <group key={side} ref={(node) => { plates.current[i] = node; }}>
          <mesh castShadow><cylinderGeometry args={[.185,.185,.065,32]} /><meshStandardMaterial {...rubber} /></mesh>
          <mesh position={[0,side*.036,0]}><cylinderGeometry args={[.06,.06,.009,24]} /><meshStandardMaterial {...chrome} /></mesh>
          <mesh position={[0,-side*.055,0]}><cylinderGeometry args={[.04,.04,.03,20]} /><meshStandardMaterial color="#d56b38" metalness={.6} roughness={.3} /></mesh>
        </group>)}
        {machine && [-1,1].map((side) => <mesh key={side} position={[0,side*.28,0]}><cylinderGeometry args={[.035,.035,.20,16]} /><meshStandardMaterial {...rubber} /></mesh>)}
      </>}
    </group>
    <primitive object={cable} visible={machine && animationType !== "leg_press"} />
    <primitive object={secondCable} visible={fly}/>
    {fly&&[-1,1].map((side,i)=><group key={side} ref={node=>{handles.current[i]=node;}}><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.024,.024,.16,16]}/><meshStandardMaterial {...rubber}/></mesh></group>)}
    <group ref={footplate} visible={animationType === "leg_press"} rotation={[-.65, 0, 0]}><Box at={[0,0,0]} size={[.95,.10,.46]} color="#323e46" /></group>
    {BENCH_MOVEMENTS.includes(animationType)&&<group name="aligned-training-bench">
      <group name="bench-backrest" position={[0,.74,0]} rotation={[animationType==="press_incline"?-Math.PI/3:-Math.PI/2,0,0]}><Box at={[0,.71,-.22]} size={[.49,1.68,.12]} color="#19212a" radius={.05}/></group>
      <Box at={[0,.55,.28]} size={[.49,.12,.49]} color="#19212a" radius={.05}/>
      <Box at={[0,.28,-.51]} size={[.12,.12,1.85]}/>
      {[-1.10,.30].map(z=><group key={z}><Box at={[0,.19,z]} size={[.10,.36,.13]}/><Box at={[0,.045,z]} size={[.7,.09,.32]}/></group>)}
    </group>}
    {["row_single","hip_thrust"].includes(animationType)&&<group position={animationType==="row_single"?[-.46,.55,-.1]:[0,.55,-.95]} rotation={animationType==="hip_thrust"?[0,Math.PI/2,0]:[0,0,0]}><Box at={[0,0,0]} size={[.48,.12,animationType==="hip_thrust"?1.45:1.6]} color="#19212a" radius={.05}/><Box at={[0,-.27,0]} size={[.14,.5,.45]}/></group>}
    {animationType==="leg_press"&&<group name="leg-press-frame"><group position={[0,.73,-.4]} rotation={[-.65,0,0]}><Box at={[0,.62,-.22]} size={[.53,1.45,.12]} color="#19212a" radius={.05}/></group><Box at={[0,.54,-.3]} size={[.57,.12,.5]} color="#19212a" radius={.05}/><Box at={[0,.26,-.4]} size={[.16,.48,.35]}/><Box at={[0,.045,.1]} size={[1.45,.09,2.1]}/>{[-1,1].map(side=><group key={side} position={[side*.63,1.08,.55]} rotation={[-.65,0,0]}><Box at={[0,0,0]} size={[.07,.08,2.25]}/></group>)}</group>}
    {["press_seated","press_vertical_seated"].includes(animationType)&&<Box at={[0,1.13,-.32]} size={[.55,.93,.12]} color="#19212a" radius={.05}/>}
    {animationType==="inverted_row"&&<group><Box at={[0,1.28,-.75]} size={[1.7,.055,.055]}/>{[-1,1].map(side=><Box key={side} at={[side*.8,.65,-.75]} size={[.08,1.3,.12]}/>)}</group>}
    {HANGING_MOVEMENTS.includes(animationType) && <>
      <Box at={[0,3.04,.04]} size={[1.75,.055,.055]} />
      {[-1,1].map((side) => <Box key={side} at={[side*.82,1.53,.04]} size={[.08,3.1,.08]} />)}
    </>}
  </group>;
});
