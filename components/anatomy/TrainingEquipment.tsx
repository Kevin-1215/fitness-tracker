import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Group, Line, LineBasicMaterial, Quaternion, TubeGeometry, Vector3 } from "three";
import type { AnimationType, Equipment } from "../../lib/exercisesData";

const UP = new Vector3(0, 1, 0);
const metal = { color: "#454d53", metalness: .72, roughness: .28 };
const chrome = { color: "#b9c1c6", metalness: .82, roughness: .22 };
const rubber = { color: "#141a20", metalness: .02, roughness: .8 };

function Box({ at, size, color = "#3b4247", radius = .025 }: { at: [number, number, number]; size: [number, number, number]; color?: string; radius?: number }) {
  return <RoundedBox position={at} args={size} radius={radius} smoothness={3} castShadow receiveShadow><meshStandardMaterial {...metal} color={color} /></RoundedBox>;
}

function Tower({ row }: { row: boolean }) {
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
    <mesh position={[0, row ? .81 : 3.12, -.25]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.105, .105, .065, 24]} /><meshStandardMaterial {...rubber} /></mesh>
    <Box at={[0, .31, -.91]} size={[.14, .6, .18]} />
    <Box at={[0, .58, -.98]} size={[.61, .13, .54]} color="#111820" radius={.06} />
    <Box at={[0, .21, -.91]} size={[.73, .08, .65]} />
    {!row && [-1, 1].map((side) => <mesh key={side} position={[side * .23, .84, -.62]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[.088, .088, .30, 24]} /><meshStandardMaterial {...rubber} />
    </mesh>)}
    {row && [-1, 1].map((side) => <group key={side} position={[side * .26, .17, -.26]} rotation={[-.55, 0, 0]}>
      <Box at={[0, 0, 0]} size={[.27, .08, .37]} color="#1d252c" />
    </group>)}
  </group>;
}

export function Dumbbell({ hammer = false }: { hammer?: boolean }) {
  return <group name="dumbbell" rotation={[0, hammer ? Math.PI / 2 : 0, Math.PI / 2]}>
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
  const pulldown = animationType === "pulldown" || animationType === "pulldown_supinated";
  const row = animationType === "row_seated";
  const barbell = equipment === "槓鈴", machine = equipment === "滑輪/機械";
  const cable = useMemo(() => {
    const geometry = new BufferGeometry(); geometry.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
    const line = new Line(geometry, new LineBasicMaterial({ color: "#727e87" })); line.frustumCulled = false; return line;
  }, []);
  const bentBar = useMemo(() => new TubeGeometry(new CatmullRomCurve3([
    new Vector3(0,-.86,.12), new Vector3(0,-.61,0), new Vector3(0,0,0), new Vector3(0,.61,0), new Vector3(0,.86,.12),
  ]), 48, .021, 12, false), []);
  const work = useMemo(() => ({ mid: new Vector3(), direction: new Vector3(), q: new Quaternion() }), []);
  useEffect(() => () => { cable.geometry.dispose(); cable.material.dispose(); bentBar.dispose(); }, [cable, bentBar]);
  useImperativeHandle(ref, () => ({ update(left, right, leftFoot, rightFoot) {
    const mid = work.mid.copy(left).add(right).multiplyScalar(.5);
    if (moving.current) {
      moving.current.position.copy(mid);
      moving.current.quaternion.setFromUnitVectors(UP, work.direction.copy(right).sub(left).normalize());
      const length = left.distanceTo(right) + .40;
      if (shaft.current) shaft.current.scale.y = length;
      plates.current.forEach((plate, i) => { if (plate) plate.position.y = (i === 0 ? -1 : 1) * (length / 2 - .045); });
    }
    const positions = cable.geometry.getAttribute("position") as BufferAttribute;
    positions.setXYZ(0, mid.x, mid.y, mid.z);
    positions.setXYZ(1, 0, row ? .81 : animationType === "face_pull" ? 2.2 : 3.12, row ? 1.25 : .77);
    positions.needsUpdate = true;
    if (footplate.current) footplate.current.position.copy(leftFoot).add(rightFoot).multiplyScalar(.5).add(new Vector3(0, .02, .1));
  } }), [row, animationType, work, cable]);
  return <group visible={!anatomy} name="training-equipment">
    {machine && animationType !== "leg_press" && <Tower row={row} />}
    <group ref={moving} name="virtual-barbell" visible={barbell || machine && animationType !== "leg_press"}>
      {pulldown ? <>
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
    <group ref={footplate} visible={animationType === "leg_press"} rotation={[-.65, 0, 0]}><Box at={[0,0,0]} size={[.95,.10,.46]} color="#323e46" /></group>
    {["press_horizontal", "press_incline", "row_single", "leg_press"].includes(animationType) && <group position={animationType === "row_single" ? [-.46,.55,-.1] : [0,.56,-.46]} rotation={[animationType === "press_incline" ? -Math.PI / 6 : 0,0,0]}>
      <Box at={[0,0,0]} size={[.47,.12,1.88]} color="#19212a" radius={.05} />
      {[-1,1].map((side) => <group key={side}><Box at={[0,-.27,side*.62]} size={[.09,.5,.12]} /><Box at={[0,-.5,side*.62]} size={[.65,.075,.25]} /></group>)}
    </group>}
    {animationType === "pull_up" && <>
      <Box at={[0,3.04,.04]} size={[1.75,.055,.055]} />
      {[-1,1].map((side) => <Box key={side} at={[side*.82,1.53,.04]} size={[.08,3.1,.08]} />)}
    </>}
  </group>;
});
