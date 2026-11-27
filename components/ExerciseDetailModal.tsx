'use client';
import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Wind, X } from "lucide-react";
import type { Exercise } from "../lib/exercisesData";
import {coachingFor} from '../lib/exerciseCoaching';
import {exerciseSources} from '../lib/exerciseSources';
import ExerciseVideo from './ExerciseVideo';
import ExercisePractice from './ExercisePractice';
import {controlledMotionFor} from '../lib/motionCatalog';
import './exercise-guide.css';
import './motion-guide.css';

const MuscleViewer3D = lazy(() => import("./MuscleViewer3D"));
export default function ExerciseDetailModal({ exercise,open,onClose }: { exercise:Exercise;open:boolean;onClose:()=>void }) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  const [ready,setReady] = useState(false),[visual,setVisual]=useState<'video'|'motion'|'compare'>('video');
  const guide=coachingFor(exercise),source=exerciseSources[exercise.id];
  const motion=controlledMotionFor(exercise.id);
  useEffect(() => { setReady(true); },[]);
  useEffect(() => {
    if (!ready || !open || !dialog.current) return;
    const element = dialog.current, previousOverflow = document.body.style.overflow;
    if (!element.open) element.showModal();
    document.body.style.overflow="hidden";setVisual('video');
    return () => { element.close();document.body.style.overflow=previousOverflow; };
  },[ready,open,exercise.id]);
  if (!ready || !open) return null;
  return createPortal(<dialog ref={dialog} className="exercise-modal" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault();onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();
  }}>
    <header className="exercise-modal__header"><div><span className="eyebrow">MOVEMENT GUIDE</span><h2 id={titleId}>{exercise.name.split(" (")[0]}</h2><p>{exercise.name.split(" (")[1]?.replace(/\)$/,"")}</p></div><button type="button" className="icon-button" aria-label="關閉動作教學" onClick={onClose}><X size={22} /></button></header>
    <div className={`exercise-modal__layout ${visual==='compare'?'is-comparing':''}`}><div className="exercise-modal__viewer"><div className="guide-visual-tabs" role="group" aria-label="教學顯示方式"><button type="button" aria-pressed={visual==='video'} onClick={()=>setVisual('video')}>實人示範</button><button type="button" aria-pressed={visual==='motion'} onClick={()=>setVisual('motion')}>3D 動作拆解</button>{motion&&<button type="button" aria-pressed={visual==='compare'} onClick={()=>setVisual('compare')}>對照觀看</button>}</div>
      {visual==='compare'&&<p className="comparison-note">影片與 3D 各自播放，可分別暫停，再從正面或側面對照同一個姿勢。</p>}
      <div className={`guide-media ${visual==='compare'?'guide-media--compare':''}`}>
      {visual!=='motion'&&<ExerciseVideo key={exercise.id+'-video'} source={source} name={exercise.name}/>}
      {visual!=='video'&&<Suspense fallback={<div className="viewer-loading" role="status">載入 3D 模型…</div>}><MuscleViewer3D key={exercise.id+'-3d'} exerciseId={exercise.id} exerciseName={exercise.name} primaryMuscles={exercise.primaryMuscles} secondaryMuscles={exercise.secondaryMuscles} animationType={exercise.animationType} equipment={exercise.equipment} height={visual==='compare'?460:530}/></Suspense>}
      </div>
      <ExercisePractice key={exercise.id} guide={guide}/></div>
      <aside className="exercise-modal__guide"><div className="tag-row"><span className="pill">{exercise.equipment}</span><span className="pill">{exercise.difficulty}</span></div><section className="movement-checks"><span className="eyebrow">FORM CHECK</span><h3>先確認這三件事</h3><dl><dt>支撐與握法</dt><dd>{guide.contact}</dd><dt>軌跡與終點</dt><dd>{guide.range}</dd><dt>先從簡單版開始</dt><dd>{guide.easier}</dd></dl></section><ol className="instruction-list">{exercise.instructions.map((instruction,index) => <li key={instruction}><span>{index+1}</span><div><h3>{guide.labels[index]}</h3><p>{instruction}</p></div></li>)}</ol>
        <div className="guide-callout"><Wind size={21} /><div><h3>呼吸節奏</h3><p>{exercise.breathing}</p></div></div>
        <div className="guide-callout warning"><AlertTriangle size={21} /><div><h3>常見錯誤與提醒</h3><ul>{exercise.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div></div>
      </aside></div>
  </dialog>,document.body);
}
