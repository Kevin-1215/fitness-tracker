'use client';

import { Component, memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Layers3, Maximize2, Minimize2, RotateCcw, Rotate3d, Play, Pause, Waypoints, ScanLine } from "lucide-react";
import { Group, MeshPhysicalMaterial, Quaternion, Vector3 } from "three";
import { expandMuscles, MUSCLE_LABELS, type AnatomicalMuscle, type AnimationType, type Equipment, type MuscleId } from "../lib/exercisesData";
import { FOREARM, HIP_X, SHIN, SHOULDER_X, SHOULDER_Y, THIGH, UPPER_ARM, sampleExercisePose, solvePose, type LimbSolution, type V3 } from "../lib/motionRig";
import {BACK_MOVEMENTS,SINGLE_DUMBBELL,fitCamera,motionEnvelope} from "../lib/sceneFraming";
import { createMuscleMaterial, Hand, Head, LimbSurface, TorsoSurface, type MuscleMaterials } from "./anatomy/AnatomicalBody";
import { Dumbbell, TrainingEquipment, type EquipmentHandle } from "./anatomy/TrainingEquipment";
import { VIEWER_STYLES } from "./anatomy/viewerStyles";
import {ControlledHuman,type ControlledFrame} from './anatomy/ControlledHuman';
import {controlledEnvelope} from '../lib/controlledMotion';
import {controlledMotionFor} from '../lib/motionCatalog';

export { sampleExercisePose, solveTwoBone } from "../lib/motionRig";
const SIDES = [-1, 1] as const, DOWN = new Vector3(0, -1, 0), EMPTY: readonly MuscleId[] = [];
type View = "auto" | "front" | "side" | "back" | "reset";
function SceneReady({sceneKey,onReady}:{sceneKey:string;onReady:(key:string)=>void}){
  const frames=useRef(0),invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{frames.current=0;invalidate();},[sceneKey,invalidate]);
  useFrame(()=>{if(frames.current<2){frames.current++;if(frames.current===2)onReady(sceneKey);else invalidate();}});
  return null;
}
interface PlaybackFrame { progress: number; repetition: number; phase: string }
interface Seek { value: number; revision: number }

export interface MuscleViewer3DProps {
  exerciseId?:string;
  primaryMuscles?: readonly MuscleId[];
  secondaryMuscles?: readonly MuscleId[];
  animationType?: AnimationType;
  equipment?: Equipment;
  exerciseName?: string;
  isPlayingAnimation?: boolean;
  defaultPlayingAnimation?: boolean;
  onPlayingAnimationChange?: (playing: boolean) => void;
  cycleDuration?: number;
  height?: number;
  className?: string;
}

export const MUSCLE_DETAILS: Record<AnatomicalMuscle, { english: string; function: string }> = {
  chest: { english: "PECTORALIS MAJOR", function: "帶動上臂向前、向身體中線靠攏，參與水平推舉。" },
  lats: { english: "LATISSIMUS DORSI", function: "帶動上臂向下、向後靠近身體，是下拉與划船的重要發力肌群。" },
  upper_back: { english: "TRAPEZIUS · RHOMBOIDS", function: "協調肩胛骨的移動與穩定，划船時可觀察肩胛向後靠攏。" },
  lower_back: { english: "ERECTOR SPINAE", function: "協助維持脊椎與軀幹位置，折髖和承重時提供支撐。" },
  front_delts: { english: "ANTERIOR DELTOID", function: "協助上臂向前抬與向上推，常在胸推和肩推中參與。" },
  side_delts: { english: "LATERAL DELTOID", function: "帶動上臂向側方抬起，側平舉與過頭推舉時參與。" },
  rear_delts: { english: "POSTERIOR DELTOID", function: "帶動上臂向後或向外後方移動，划船與面拉時參與。" },
  biceps: { english: "BICEPS BRACHII", function: "協助手肘彎曲與前臂旋後，彎舉及拉的動作常會使用。" },
  triceps: { english: "TRICEPS BRACHII", function: "伸直手肘，參與推舉、伏地挺身和滑輪下壓。" },
  forearms: { english: "FOREARM MUSCLES", function: "穩定手腕、維持握力，部分肌群也協助屈肘與前臂旋轉。" },
  quads: { english: "QUADRICEPS", function: "伸直膝蓋，深蹲與腿推時協助把身體或重量推起。" },
  hamstrings: { english: "HAMSTRINGS", function: "參與屈膝與伸髖，硬舉和臀橋時協同工作。" },
  glutes: { english: "GLUTEUS MAXIMUS", function: "伸展髖部並協助穩定骨盆，深蹲、硬舉與臀橋時參與。" },
  calves: { english: "GASTROCNEMIUS · SOLEUS", function: "協助足踝推蹬與穩定，承重動作中維持腳掌支撐。" },
  abs: { english: "RECTUS ABDOMINIS", function: "參與軀幹屈曲與抗伸展，捲腹與棒式的工作方式不同。" },
  obliques: { english: "ABDOMINAL OBLIQUES", function: "參與軀幹側屈、旋轉及抗旋轉，協助穩定肋骨與骨盆。" },
};

interface RigProps {
  primaryMuscles: readonly MuscleId[]; secondaryMuscles: readonly MuscleId[];
  animationType: AnimationType; equipment: Equipment; playing: boolean; anatomy: boolean;
  cycleDuration: number; pulse: boolean; xray?: boolean; selected?: AnatomicalMuscle | null;
  onSelect?: (muscle: AnatomicalMuscle) => void; seek?: Seek; onPlayback?: (frame: PlaybackFrame) => void;
}

export const ProceduralHuman = memo(function ProceduralHuman({ primaryMuscles, secondaryMuscles, animationType, equipment, playing, anatomy, cycleDuration, pulse, xray = false, selected = null, onSelect, seek, onPlayback }: RigProps) {
  const invalidate = useThree((state) => state.invalidate);
  const root = useRef<Group>(null), torso = useRef<Group>(null), head = useRef<Group>(null), gear = useRef<EquipmentHandle>(null);
  const arms = useRef<(Group | null)[]>([]), elbows = useRef<(Group | null)[]>([]), hands = useRef<(Group | null)[]>([]);
  const hips = useRef<(Group | null)[]>([]), knees = useRef<(Group | null)[]>([]), ankles = useRef<(Group | null)[]>([]);
  const elapsed = useRef(cycleDuration * .15), reportTimer = useRef(1), lastDuration = useRef(cycleDuration);
  const primaryKey = primaryMuscles.join("|"), secondaryKey = secondaryMuscles.join("|");
  const primary = useMemo(() => expandMuscles(primaryKey ? primaryKey.split("|") as MuscleId[] : EMPTY), [primaryKey]);
  const secondary = useMemo(() => expandMuscles(secondaryKey ? secondaryKey.split("|") as MuscleId[] : EMPTY), [secondaryKey]);
  const materials = useMemo(() => Object.fromEntries(Object.keys(MUSCLE_LABELS).map((id) => [id, createMuscleMaterial()])) as MuscleMaterials, []);
  const skin = useMemo(() => new MeshPhysicalMaterial({ color: "#c5c8c7", roughness: .56, metalness: .025, clearcoat: .08 }), []);
  const shorts = useMemo(() => new MeshPhysicalMaterial({ color: "#1c242b", roughness: .86, metalness: .01 }), []);
  const scratch = useMemo(() => ({ a: new Vector3(), b: new Vector3(), q: new Quaternion(), feet: [new Vector3(), new Vector3()], wrists: [new Vector3(), new Vector3()] }), []);
  useEffect(() => { elapsed.current = anatomy ? 0 : cycleDuration * .15; reportTimer.current = 1; invalidate(); }, [animationType, anatomy, equipment, invalidate]);
  useEffect(() => { elapsed.current = elapsed.current / lastDuration.current * cycleDuration; lastDuration.current = cycleDuration; }, [cycleDuration]);
  useEffect(() => { if (seek) { elapsed.current = Math.min(.9999, Math.max(0, seek.value)) * lastDuration.current; reportTimer.current = 1; invalidate(); } }, [seek, invalidate]);
  useEffect(() => {
    skin.transparent = xray; skin.opacity = xray ? .17 : 1; skin.depthWrite = !xray; skin.needsUpdate = true;
    for (const id of Object.keys(materials) as AnatomicalMuscle[]) {
      const main = primary.has(id), assist = !main && secondary.has(id), focused = selected === id, material = materials[id];
      material.color.set(main ? "#f97316" : assist ? "#eab308" : focused ? "#9adcf3" : xray ? "#334155" : id === "glutes" ? "#1c242b" : "#bfc7cd");
      material.roughness = id === "glutes" && !main && !assist ? .86 : .56;
      material.emissive.set(main ? "#f97316" : assist ? "#eab308" : focused ? "#5bb4d3" : "#000000");
      material.emissiveIntensity = main ? .9 : assist ? .45 : focused ? .3 : 0;
      material.transparent = xray; material.opacity = main || assist || focused || !xray ? 1 : .3;
      material.depthWrite = !xray || main || assist || focused; material.needsUpdate = true;
    }
    invalidate();
  }, [materials, primary, secondary, skin, xray, selected, invalidate]);
  useEffect(() => () => { skin.dispose(); shorts.dispose(); Object.values(materials).forEach((material) => material.dispose()); }, [materials, skin, shorts]);

  useFrame(({ clock }, delta) => {
    if (!root.current || !torso.current) return;
    if (playing && !anatomy) elapsed.current += Math.min(delta, .1);
    const t = (elapsed.current % cycleDuration) / cycleDuration;
    const loweringFirst = ["squat", "hinge", "rollout", "side_bend","goblet_squat","reverse_lunge"].includes(animationType), split = loweringFirst ? .58 : .42;
    const linear = t < split ? t / split : 1 - (t - split) / (1 - split), amount = linear * linear * (3 - 2 * linear);
    const pose = sampleExercisePose(anatomy ? "anatomy" : animationType, amount);
    const skeleton=solvePose(pose);
    root.current.position.fromArray(pose.root); root.current.rotation.set(pose.tilt, 0, 0);
    torso.current.rotation.set(pose.bend, 0, pose.lean);
    if (head.current) { head.current.position.y = pose.headHeight??.99; head.current.rotation.x = pose.headTilt??0; }
    root.current.updateMatrixWorld(true);
    const apply = (upper: Group | null, lower: Group | null, start: V3, solved:LimbSolution) => {
      if (!upper || !lower) return;
      scratch.a.fromArray(solved.elbow).sub(scratch.b.fromArray(start)).normalize(); upper.quaternion.setFromUnitVectors(DOWN, scratch.a);
      scratch.a.fromArray(solved.end).sub(scratch.b.fromArray(solved.elbow)).normalize(); scratch.q.setFromUnitVectors(DOWN, scratch.a);
      lower.quaternion.copy(upper.quaternion).invert().multiply(scratch.q);
    };
    SIDES.forEach((side, i) => {
      apply(arms.current[i], elbows.current[i], [side * SHOULDER_X, SHOULDER_Y, 0], skeleton.arms[i]);
      apply(hips.current[i], knees.current[i], [side * HIP_X, 0, 0], skeleton.legs[i]);
    });
    root.current.updateMatrixWorld(true);
    SIDES.forEach((_, i) => {
      if (knees.current[i] && ankles.current[i]) {ankles.current[i]!.quaternion.copy(knees.current[i]!.getWorldQuaternion(scratch.q)).invert();if(pose.footPitch)ankles.current[i]!.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),pose.footPitch[i]));}
      if (elbows.current[i] && hands.current[i]) hands.current[i]!.quaternion.copy(elbows.current[i]!.getWorldQuaternion(scratch.q)).invert();
    });
    root.current.updateMatrixWorld(true);
    if (hands.current[0] && hands.current[1] && ankles.current[0] && ankles.current[1]) {
      SIDES.forEach((_, i) => { hands.current[i]!.getWorldPosition(scratch.wrists[i]); ankles.current[i]!.getWorldPosition(scratch.feet[i]); });
      gear.current?.update(scratch.wrists[0], scratch.wrists[1], scratch.feet[0], scratch.feet[1]);
    }
    for (const id of primary) materials[id].emissiveIntensity = pulse ? .9 + .13 * Math.sin(clock.elapsedTime * 2) : .9;
    reportTimer.current += delta;
    if (reportTimer.current >= .18) {
      reportTimer.current = 0;
      onPlayback?.({ progress: t, repetition: Math.floor(elapsed.current / cycleDuration) + 1, phase: anatomy ? "肌群總覽" : animationType === "plank" ? "等長支撐" : ["dead_bug","bird_dog"].includes(animationType)?t<split?"控制伸展":"穩定回收":animationType==="pallof_press"?t<split?"推離胸前":"控制回收":t < split ? loweringFirst ? "離心控制" : "向心發力" : loweringFirst ? "向心發力" : "離心控制" });
    }
  });

  const surface = { materials, skin, primary, secondary, selected, onSelect };
  return <>
    <group ref={root} name="human-rig">
      <RoundedBox args={[.58,.29,.37]} radius={.10} position={[0,-.025,0]} material={shorts} smoothness={5} castShadow />
      {SIDES.map((side) => <mesh key={side} name="muscle-glutes" position={[side*.135,-.025,-.182]} scale={[.135,.12,.024]} material={materials.glutes} onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect?.("glutes"); }} castShadow><sphereGeometry args={[1,32,28]} /></mesh>)}
      <group ref={torso} name="spine" position={[0,.1,0]}>
        <TorsoSurface {...surface} />
        {SIDES.map((side, i) => <group key={side} position={[side*SHOULDER_X,SHOULDER_Y,0]} ref={(node) => { arms.current[i] = node; }} name={i === 0 ? "left-shoulder" : "right-shoulder"}>
          <mesh material={skin} position={[-side*.035,-.012,0]} scale={[.112,.09,.112]} castShadow><sphereGeometry args={[1,32,28]} /></mesh>
          <LimbSurface kind="upperArm" side={side} {...surface} />
          <group position={[0,-UPPER_ARM,0]} ref={(node) => { elbows.current[i] = node; }} name={i === 0 ? "left-elbow" : "right-elbow"}>
            <mesh material={skin} scale={[.082,.082,.082]}><sphereGeometry args={[1,24,20]} /></mesh>
            <LimbSurface kind="forearm" side={side} {...surface} />
            <group position={[0,-FOREARM,0]} ref={(node) => { hands.current[i] = node; }} name={`hand-${side}`}>
              <mesh material={skin} scale={[.054,.054,.054]}><sphereGeometry args={[1,20,16]} /></mesh>
              <Hand skin={skin} support={["push_up","push_up_narrow","pike_push_up","bird_dog"].includes(animationType)&&!anatomy}/>
              {!anatomy && equipment === "啞鈴" && !SINGLE_DUMBBELL.includes(animationType) && !(side < 0 && ["row_single","side_bend"].includes(animationType)) && <Dumbbell hammer={animationType === "hammer_curl"} />}
            </group>
          </group>
        </group>)}
        <group ref={head} position={[0,.99,0]}><Head skin={skin} /></group>
      </group>
      {SIDES.map((side, i) => <group key={side} position={[side*HIP_X,0,0]} ref={(node) => { hips.current[i] = node; }} name={`hip-${side}`}>
        <LimbSurface kind="thigh" side={side} {...surface} />
        <mesh position={[0,-.06,0]} material={shorts} castShadow><cylinderGeometry args={[.163,.163,.16,40]} /></mesh>
        <group position={[0,-THIGH,0]} ref={(node) => { knees.current[i] = node; }} name={`knee-${side}`}>
          <mesh material={skin} scale={[.095,.092,.095]}><sphereGeometry args={[1,24,20]} /></mesh>
          <LimbSurface kind="shin" side={side} {...surface} />
          <group position={[0,-SHIN,0]} ref={(node) => { ankles.current[i] = node; }}>
            <RoundedBox args={[.16,.105,.32]} radius={.045} smoothness={4} position={[0,-.0435,.085]} castShadow><meshStandardMaterial color="#939fa7" roughness={.65} /></RoundedBox>
            <RoundedBox args={[.168,.028,.332]} radius={.012} position={[0,-.096,.085]}><meshStandardMaterial color="#424e57" roughness={.9} /></RoundedBox>
          </group>
        </group>
      </group>)}
    </group>
    <TrainingEquipment ref={gear} animationType={animationType} equipment={equipment} anatomy={anatomy} />
  </>;
});

function CameraRig({ view, revision, anatomy, animationType,equipment,exerciseId,upperBody=false }: { view: View; revision: number; anatomy: boolean; animationType: AnimationType;equipment:Equipment;exerciseId?:string;upperBody?:boolean }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate, size } = useThree();
  const bounds=useMemo(()=>!anatomy&&exerciseId&&controlledMotionFor(exerciseId)?controlledEnvelope(exerciseId,equipment,upperBody):motionEnvelope(animationType,equipment,true),[animationType,equipment,anatomy,exerciseId,upperBody]);
  useEffect(() => {
    const back = BACK_MOVEMENTS.includes(animationType);
    const effective = view === "auto" ? back ? "back" : "reset" : view;
    const fit=fitCamera(bounds,size.width/Math.max(1,size.height),effective);
    camera.position.copy(fit.position);controls.current?.target.copy(fit.target);camera.lookAt(fit.target);controls.current?.update();invalidate();
  }, [view, revision, anatomy, animationType, bounds,camera, invalidate, size.width, size.height]);
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={.1} minDistance={1.7} maxDistance={40} minPolarAngle={.18} maxPolarAngle={Math.PI*.79} />;
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="mv3d-fallback" role="status">無法啟動 3D 顯示，請使用支援 WebGL 的瀏覽器。下方動作教學仍可閱讀。</p> : this.props.children; }
}

function defaultEquipment(type: AnimationType): Equipment {
  if (["press_horizontal","row_pull","squat","press_vertical","curl","rollout","press_close","deadlift","hip_thrust","reverse_curl"].includes(type)) return "槓鈴";
  if (["press_incline","row_single","hinge","raise","hammer_curl","side_bend","fly_supine","goblet_squat","reverse_lunge","front_raise","reverse_fly","overhead_extension","alternate_curl"].includes(type)) return "啞鈴";
  if (["press_seated","pulldown","pulldown_supinated","row_seated","leg_press","face_pull","extension","plank_crunch","fly_standing","pulldown_neutral","pullover_cable","press_vertical_seated","pallof_press"].includes(type)) return "滑輪/機械";
  return "徒手";
}

/** Motion is explicitly enabled by exercise ID. The old unrestricted IK paths
 * remain withheld, including for variants sharing an animationType. */
export const PUBLIC_VIEWER_MODE = 'controlled-motion-or-anatomy' as const;
export default function MuscleViewer3D({ exerciseId,primaryMuscles = EMPTY, secondaryMuscles = EMPTY, animationType = "press_horizontal", equipment, exerciseName = "互動肌群總覽",isPlayingAnimation,defaultPlayingAnimation=false,onPlayingAnimationChange,cycleDuration=6, height = 660, className = "" }: MuscleViewer3DProps) {
  const motion=controlledMotionFor(exerciseId),speedId=useId();
  const [anatomy,setAnatomy]=useState(!motion),[internalPlaying,setInternalPlaying]=useState(defaultPlayingAnimation),[guides,setGuides]=useState(true),[speed,setSpeed]=useState(1),[seek,setSeek]=useState<Seek|undefined>(),[sidePhase,setSidePhase]=useState(0),[upperBody,setUpperBody]=useState(false);
  const [frame,setFrame]=useState<ControlledFrame>({progress:.3,depth:.5,metric:0,metricLabel:motion?.jointLabel??'',phase:'中段位置',side:0});
  const [xray,setXray]=useState(false),[selected,setSelected]=useState<AnatomicalMuscle|null>(null);
  const [view,setView]=useState<{name:View;revision:number}>({name:"auto",revision:0});
  const [mounted,setMounted]=useState(false),[visible,setVisible]=useState(true),[reducedMotion,setReducedMotion]=useState(false),[expanded,setExpanded]=useState(false),[renderedScene,setRenderedScene]=useState("");
  const container=useRef<HTMLElement>(null),primary=expandMuscles(primaryMuscles),secondary=[...expandMuscles(secondaryMuscles)].filter(id=>!primary.has(id));
  const focused=selected??[...primary][0]??null,detail=focused?MUSCLE_DETAILS[focused]:null;
  const activeEquipment=equipment??defaultEquipment(animationType),nameParts=exerciseName.split(" (");
  const moving=!!motion&&!anatomy,playing=moving&&(isPlayingAnimation??internalPlaying),controllable=isPlayingAnimation===undefined||!!onPlayingAnimationChange;
  const duration=Math.max(3,Math.min(12,Number.isFinite(cycleDuration)?cycleDuration:6))/speed;
  const sceneKey=exerciseName+"|"+(moving?'motion':'anatomy')+"|"+view.name+":"+view.revision+":"+(seek?.revision??0)+":"+sidePhase+":"+upperBody;
  const activeView=view.name==="auto"?BACK_MOVEMENTS.includes(animationType)?"back":"reset":view.name;
  const chooseMuscle=useCallback((muscle:AnatomicalMuscle)=>setSelected(last=>last===muscle?null:muscle),[]);
  const updateFrame=useCallback((next:ControlledFrame)=>setFrame(next),[]);
  function setPlaying(value:boolean){if(isPlayingAnimation===undefined)setInternalPlaying(value);onPlayingAnimationChange?.(value);}
  function scrub(value:number){setPlaying(false);setSeek(last=>({value,revision:(last?.revision??0)+1}));setFrame(last=>({...last,progress:value}));}
  useEffect(()=>{setMounted(true);const query=window.matchMedia("(prefers-reduced-motion: reduce)");const motion=()=>setReducedMotion(query.matches),visibility=()=>setVisible(!document.hidden);motion();visibility();query.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility);return()=>{query.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);};},[]);
  useEffect(()=>{setSelected(null);setView({name:"auto",revision:0});setAnatomy(!controlledMotionFor(exerciseId));setInternalPlaying(false);setSeek(undefined);setSidePhase(0);setUpperBody(false);},[exerciseName,exerciseId]);
  useEffect(()=>{
    if(!expanded)return;const previousOverflow=document.body.style.overflow,previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    document.body.style.overflow="hidden";container.current?.querySelector<HTMLButtonElement>("[data-expand-button]")?.focus();
    const keyboard=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();setExpanded(false);}if(event.key!=="Tab")return;const items=[...(container.current?.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex='0']")??[])];if(!items.length)return;if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}};
    document.addEventListener("keydown",keyboard,true);return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",keyboard,true);previousFocus?.focus();};
  },[expanded]);
  return <section ref={container} data-scene-ready={renderedScene===sceneKey} data-mode={moving?'controlled-motion':'anatomy'} data-motion-enabled={moving?'true':'false'} className={"mv3d "+(expanded?"is-expanded ":"")+className} role={expanded?"dialog":undefined} aria-modal={expanded?true:undefined} aria-label={exerciseName+"：互動 3D 肌群"}>
    <style>{VIEWER_STYLES}</style><header className="mv3d-header"><div className="mv3d-title"><span className="mv3d-kicker">{moving?"MOVEMENT LAB":"INTERACTIVE ANATOMY"}</span><h3>{nameParts[0]}</h3>{nameParts[1]&&<p>{nameParts[1].replace(/\)$/,"")}</p>}</div><div className="mv3d-stage-tools">{moving&&motion&&!["squat","hinge"].includes(motion.kind)&&<button type="button" aria-label={upperBody?"顯示全身":"放大上半身"} title={upperBody?"顯示全身":"放大上半身"} aria-pressed={upperBody} onClick={()=>setUpperBody(value=>!value)}><ScanLine size={17}/></button>}<button type="button" aria-label="切換肌群透視" aria-pressed={xray} onClick={()=>setXray(last=>!last)}><Layers3 size={17}/></button><button type="button" data-expand-button aria-label={expanded?"關閉放大檢視":"放大檢視"} aria-pressed={expanded} onClick={()=>setExpanded(last=>!last)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div></header>
    {moving&&motion&&<div className="mv3d-playback"><div className="mv3d-playback-top"><button type="button" className="mv3d-play" aria-label={playing?'暫停 3D 動作示範':'播放 3D 動作示範'} aria-pressed={playing} disabled={!controllable} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={19}/>:<Play size={19}/>}</button><div className="mv3d-playback-status"><strong>{playing?'':'暫停 · '}{frame.phase}</strong><span>{motion.label}{motion.kind==='alternate'?` · ${frame.side===0?'右':'左'}側`:''}</span></div><div className="mv3d-speed"><label htmlFor={speedId}>速度</label><select id={speedId} aria-label="3D 播放速度" value={speed} onChange={event=>setSpeed(Number(event.target.value))}>{[.5,.75,1].map(s=><option key={s} value={s}>{s}×</option>)}</select></div></div>
      <input aria-label="3D 動作進度" type="range" min={0} max={100} step={.5} value={frame.progress*100} disabled={!controllable} onChange={event=>scrub(Number(event.target.value)/100)}/><div className="mv3d-keyframes" role="group" aria-label="關鍵姿勢">{([['起始',0],['中段',.3],[motion.loweringFirst?'底點':'頂端',.54],['回程',.8]] as const).map(([label,value])=><button type="button" key={label} disabled={!controllable} onClick={()=>scrub(value)}>{label}</button>)}</div>
    </div>}
    <div className="mv3d-stage" style={{height:Number.isFinite(height)?Math.max(480,height):660}}><CanvasBoundary>{mounted?<Canvas shadows="percentage" dpr={[1,1.5]} camera={{position:[0,1.6,-5.2],fov:37,near:.1,far:80}} frameloop={visible&&(playing||!reducedMotion&&primary.size>0)?"always":"demand"} gl={{antialias:true,alpha:false}} onPointerMissed={()=>setSelected(null)} fallback={<p className="mv3d-fallback">此裝置無法顯示 WebGL 3D，仍可觀看影片與中文步驟。</p>}>
      <color attach="background" args={["#11191d"]}/><fog attach="fog" args={["#11191d",12,36]}/><ambientLight intensity={.35}/><hemisphereLight args={["#d7e2e9","#243037",.6]}/>
      <directionalLight position={[-3,5,-4]} intensity={2.4} color="#e5eff8" castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.0004} shadow-normalBias={.025}/><directionalLight position={[4,3,3]} intensity={1.7} color="#ffefd9"/><spotLight position={[0,4,-3]} intensity={16} angle={.7} penumbra={1} color="#c5e7fc"/>
      <Environment resolution={128} frames={1}><Lightformer form="rect" intensity={2} position={[-3,3,-4]} scale={[4,5,1]} rotation={[0,Math.PI/4,0]}/><Lightformer form="rect" intensity={1.5} position={[4,2,3]} scale={[3,4,1]} rotation={[0,-Math.PI/2,0]}/></Environment>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.002,0]} receiveShadow><planeGeometry args={[50,50]}/><meshStandardMaterial color="#172025" roughness={.85} metalness={.12}/></mesh>
      {moving&&exerciseId?<ControlledHuman exerciseId={exerciseId} equipment={activeEquipment} primaryMuscles={primaryMuscles} secondaryMuscles={secondaryMuscles} playing={playing&&visible} cycleDuration={duration} seek={seek} sidePhase={sidePhase} xray={xray} guides={guides} pulse={!reducedMotion&&visible} selected={selected} onSelect={chooseMuscle} onFrame={updateFrame}/>:<ProceduralHuman primaryMuscles={primaryMuscles} secondaryMuscles={secondaryMuscles} animationType={animationType} equipment={activeEquipment} playing={false} anatomy={true} cycleDuration={5} pulse={!reducedMotion&&visible} xray={xray} selected={selected} onSelect={chooseMuscle}/>}
      <CameraRig view={view.name} revision={view.revision} anatomy={!moving} exerciseId={exerciseId} upperBody={upperBody} animationType={animationType} equipment={activeEquipment}/><SceneReady sceneKey={sceneKey} onReady={setRenderedScene}/>
      <EffectComposer multisampling={2} enableNormalPass={false}><Bloom mipmapBlur intensity={.58} luminanceThreshold={1.15} luminanceSmoothing={.3}/><Vignette offset={.15} darkness={.45}/></EffectComposer>
    </Canvas>:<p className="mv3d-fallback" role="status">載入 3D 肌群…</p>}</CanvasBoundary></div>
    <div className="mv3d-camera-controls"><div className="mv3d-views" role="group" aria-label="人體視角">{([["front","正面"],["side","側面"],["back","背面"],["reset","重置"]] as const).map(([name,label])=><button type="button" key={name} aria-label={name==="reset"?"重置視角":label} aria-pressed={activeView===name} onClick={()=>{if(name==="reset")setUpperBody(false);setView(last=>({name,revision:last.revision+1}));}}>{name==="reset"?<RotateCcw size={14}/>:null}{label}</button>)}</div>{motion&&<div className="mv3d-mode-switch"><button type="button" aria-pressed={moving} onClick={()=>setAnatomy(false)}>動作拆解</button><button type="button" aria-pressed={!moving} onClick={()=>{setAnatomy(true);setPlaying(false);}}>肌群總覽</button></div>}</div>
    <div className="mv3d-floor-label"><Rotate3d size={15}/><span>{moving&&upperBody?"上半身放大 · ":""}拖曳旋轉 · 點選肌群 · 雙指縮放</span></div>
    {moving&&motion&&<div className="mv3d-motion-detail">
      <div className="mv3d-kinematics"><span><strong>{Math.round(frame.metric)}°</strong>{frame.metricLabel} · 圖中角度</span><button type="button" aria-pressed={guides} onClick={()=>setGuides(last=>!last)}><Waypoints size={15}/>關節與軌跡</button>{motion.kind==='alternate'&&<button type="button" onClick={()=>setSidePhase(last=>1-last)}>換側</button>}</div><div className="mv3d-coaching"><p>{motion.cue}</p><small>固定支撐：{motion.support}</small></div>
    </div>}
    <div className="mv3d-muscle-list"><div className="mv3d-muscle-group"><span><i className="primary"/>主要發力</span><div>{[...primary].map(id=><button type="button" key={id} aria-pressed={selected===id} onClick={()=>chooseMuscle(id)}>{MUSCLE_LABELS[id]}</button>)}</div></div><div className="mv3d-muscle-group"><span><i className="secondary"/>協同肌群</span><div>{secondary.length?secondary.map(id=><button type="button" key={id} aria-pressed={selected===id} onClick={()=>chooseMuscle(id)}>{MUSCLE_LABELS[id]}</button>):<small>未另列協同肌群</small>}</div></div></div>
    {detail&&focused&&<div className="mv3d-focus"><span>{selected?"已選肌群":"主要發力肌群"}</span><strong>{MUSCLE_LABELS[focused]}<small>{detail.english}</small></strong>{selected&&<p>{detail.function}</p>}</div>}
    <p className="mv3d-note">{motion?'模型用於觀察關節與器材的相對位置；圖中角度不是你的目標角度，請依活動度調整，並對照實人影片。':'此動作目前提供肌群位置示意；舊版動作動畫已停用，請觀看實人示範。'}顏色不代表出力百分比。</p>
  </section>;
}
