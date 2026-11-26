import { useEffect, useMemo } from "react";
import { Line as ThreeLine, BufferGeometry, Color, DoubleSide, LineBasicMaterial, MeshPhysicalMaterial } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { AnatomicalMuscle } from "../../lib/exercisesData";
import { createLimbGeometry, createLimbPatch, createTorsoGeometry, createTorsoPatch, TORSO_PATCHES, type LimbKind, type SurfacePatch } from "./geometry";

export type MuscleMaterials = Record<AnatomicalMuscle, MeshPhysicalMaterial>;
export interface BodySurfaceProps {
  materials: MuscleMaterials;
  skin: MeshPhysicalMaterial;
  selected: AnatomicalMuscle | null;
  primary: ReadonlySet<AnatomicalMuscle>;
  secondary: ReadonlySet<AnatomicalMuscle>;
  onSelect?: (muscle: AnatomicalMuscle) => void;
}

export function createMuscleMaterial() {
  const material = new MeshPhysicalMaterial({ color: "#bfc7cd", roughness: .56, metalness: .025, clearcoat: .08, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vMuscleUv;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMuscleUv = uv;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vMuscleUv;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        float fiberPhase = vMuscleUv.y * 100.0 + sin(vMuscleUv.x * 3.5) * 9.0;
        float fiberFilter = 1.0 - smoothstep(0.4, 1.8, fwidth(fiberPhase));
        float activeMuscle = step(0.02, max(emissive.r, max(emissive.g, emissive.b)));
        diffuseColor.rgb *= 1.0 - activeMuscle * 0.015 * (1.0 - sin(fiberPhase)) * fiberFilter;`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance *= 1.0 - 0.025 * (1.0 - sin(fiberPhase)) * fiberFilter;`);
  };
  material.customProgramCacheKey = () => "anatomical-fibers-antialiased-v3";
  return material;
}

function Patch({ patch, muscle, ...props }: { patch: SurfacePatch; muscle: AnatomicalMuscle } & BodySurfaceProps) {
  const active = props.primary.has(muscle) || props.secondary.has(muscle), selected = props.selected === muscle;
  const outline = useMemo(() => new ThreeLine(new BufferGeometry().setFromPoints(patch.outline), new LineBasicMaterial({ toneMapped: false, transparent: true })), [patch]);
  useEffect(() => {
    outline.material.color.copy(new Color(selected ? "#b5efff" : "#ffe4be").multiplyScalar(selected ? 2.4 : 1.65));
    outline.material.opacity = selected ? .95 : active ? .65 : 0;
  }, [outline, active, selected]);
  useEffect(() => () => { patch.geometry.dispose(); outline.geometry.dispose(); outline.material.dispose(); }, [patch, outline]);
  const choose = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (event.delta < 5) props.onSelect?.(muscle); };
  return <>
    <mesh name={`muscle-${muscle}`} geometry={patch.geometry} material={props.materials[muscle]} onClick={choose}
      onPointerOver={(event) => { event.stopPropagation(); event.nativeEvent.target instanceof HTMLCanvasElement && (event.nativeEvent.target.style.cursor = "pointer"); }}
      onPointerOut={(event) => { event.nativeEvent.target instanceof HTMLCanvasElement && (event.nativeEvent.target.style.cursor = "grab"); }} />
    <primitive object={outline} visible={active || selected} raycast={() => null} />
  </>;
}

export function TorsoSurface(props: BodySurfaceProps) {
  const geometry = useMemo(createTorsoGeometry, []);
  const patches = useMemo(() => TORSO_PATCHES.map((p) => ({ ...p, patch: createTorsoPatch(p.points, p.back) })), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <mesh name="sculpted-torso" geometry={geometry} material={props.skin} castShadow onPointerOver={(e) => e.stopPropagation()} />
    {patches.map((patch, i) => <Patch key={i} {...props} muscle={patch.muscle} patch={patch.patch} />)}
  </>;
}

export function LimbSurface({ kind, side = 1, ...props }: { kind: LimbKind; side?: -1 | 1 } & BodySurfaceProps) {
  const geometry = useMemo(() => createLimbGeometry(kind), [kind]);
  const patches = useMemo(() => {
    const p = (muscle: AnatomicalMuscle, angle: number, width: number, a: number, b: number) => ({ muscle, patch: createLimbPatch(kind, angle, width, a, b) });
    switch (kind) {
      case "upperArm": return [p("front_delts", Math.PI / 2, 1.8, -.10, .29), p("side_delts", side > 0 ? 0 : Math.PI, 1.3, -.10, .33), p("rear_delts", Math.PI * 1.5, 1.8, -.10, .29), p("biceps", Math.PI / 2, 2.2, .32, .89), p("triceps", Math.PI * 1.5, 2.35, .30, .92)];
      case "forearm": return [p("forearms", Math.PI / 2, Math.PI * 1.8, .07, .90)];
      case "thigh": return [p("quads", Math.PI / 2, 2.6, .15, .95), p("hamstrings", Math.PI * 1.5, 2.45, .15, .91)];
      case "shin": return [p("calves", Math.PI * 1.5, 2.65, .06, .70)];
    }
  }, [kind, side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <><mesh geometry={geometry} material={props.skin} castShadow onPointerOver={(e) => e.stopPropagation()} />
    {patches.map((patch) => <Patch key={patch.muscle} {...props} muscle={patch.muscle} patch={patch.patch} />)}</>;
}

export function Head({ skin }: { skin: MeshPhysicalMaterial }) {
  return <>
    <mesh position={[0, .245, .005]} scale={[.173, .226, .175]} material={skin} castShadow><sphereGeometry args={[1, 48, 40]} /></mesh>
    <mesh position={[0, .12, .025]} scale={[.125, .117, .127]} material={skin}><sphereGeometry args={[1, 32, 24]} /></mesh>
    <mesh position={[0, .035, 0]} material={skin}><cylinderGeometry args={[.087, .1, .15, 32]} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * .169, .23, .004]} scale={[.027, .047, .027]} material={skin}><sphereGeometry args={[1, 20, 16]} /></mesh>)}
  </>;
}

export function Hand({ skin,support=false }: { skin: MeshPhysicalMaterial;support?:boolean }) {
  return <group rotation={support?[-Math.PI/2,0,0]:[0,0,0]}>
    <mesh position={[0, -.03, .005]} scale={[.061, .079, .032]} material={skin} castShadow><sphereGeometry args={[1, 24, 20]} /></mesh>
    {support?[-.039,-.013,.013,.038].map((x,i)=><mesh key={x} position={[x,-.106,-.012]} material={skin}><capsuleGeometry args={[.013,i===0||i===3?.048:.063,6,10]}/></mesh>):[-.039, -.013, .013, .038].map((x, i) => <group key={x} position={[x, -.078, .009]} rotation={[-.42, 0, 0]}>
      <mesh position={[0, -.025, 0]} material={skin}><capsuleGeometry args={[.013, i === 0 || i === 3 ? .035 : .049, 6, 10]} /></mesh>
      <mesh position={[0, -.049, .017]} rotation={[-.75, 0, 0]} material={skin}><capsuleGeometry args={[.012, .023, 6, 10]} /></mesh>
    </group>)}
    <mesh position={[.057, -.025, .018]} rotation={[.2, 0, -.7]} material={skin}><capsuleGeometry args={[.019, .06, 8, 12]} /></mesh>
  </group>;
}
