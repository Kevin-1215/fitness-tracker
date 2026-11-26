'use client';
import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Wind, X } from "lucide-react";
import type { Exercise } from "../lib/exercisesData";

const MuscleViewer3D = lazy(() => import("./MuscleViewer3D"));
const labels = ["預備姿勢","離心控制","向心發力","頂峰收縮"];
export default function ExerciseDetailModal({ exercise,open,onClose }: { exercise:Exercise;open:boolean;onClose:()=>void }) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  const [ready,setReady] = useState(false),[playing,setPlaying] = useState(true);
  useEffect(() => { setReady(true); },[]);
  useEffect(() => {
    if (!ready || !open || !dialog.current) return;
    const element = dialog.current, previousOverflow = document.body.style.overflow;
    if (!element.open) element.showModal();
    document.body.style.overflow="hidden";setPlaying(true);
    return () => { element.close();document.body.style.overflow=previousOverflow; };
  },[ready,open,exercise.id]);
  if (!ready || !open) return null;
  return createPortal(<dialog ref={dialog} className="exercise-modal" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault();onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();
  }}>
    <header className="exercise-modal__header"><div><span className="eyebrow">MOVEMENT GUIDE</span><h2 id={titleId}>{exercise.name.split(" (")[0]}</h2><p>{exercise.name.split(" (")[1]?.replace(/\)$/,"")}</p></div><button type="button" className="icon-button" aria-label="關閉動作教學" onClick={onClose}><X size={22} /></button></header>
    <div className="exercise-modal__layout"><div className="exercise-modal__viewer"><Suspense fallback={<div className="viewer-loading" role="status">載入 3D 動作示範…</div>}><MuscleViewer3D exerciseName={exercise.name} primaryMuscles={exercise.primaryMuscles} secondaryMuscles={exercise.secondaryMuscles} animationType={exercise.animationType} equipment={exercise.equipment} isPlayingAnimation={playing} onPlayingAnimationChange={setPlaying} height={530} /></Suspense></div>
      <aside className="exercise-modal__guide"><div className="tag-row"><span className="pill">{exercise.equipment}</span><span className="pill">{exercise.difficulty}</span></div><ol className="instruction-list">{exercise.instructions.map((instruction,index) => <li key={instruction}><span>{index+1}</span><div><h3>{labels[index]}</h3><p>{instruction}</p></div></li>)}</ol>
        <div className="guide-callout"><Wind size={21} /><div><h3>呼吸節奏</h3><p>{exercise.breathing}</p></div></div>
        <div className="guide-callout warning"><AlertTriangle size={21} /><div><h3>常見錯誤與提醒</h3><ul>{exercise.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div></div>
      </aside></div>
  </dialog>,document.body);
}
