import { useEffect, useState } from "react";
import { Activity, BookOpen, ChevronDown, Info, Wind } from "lucide-react";
import MuscleViewer3D from "../../components/MuscleViewer3D";
import { exercisesData, CATEGORIES, type Exercise } from "../../lib/exercisesData";
import "./demo.css";

const labels = { chest: "胸部", back: "背部", legs: "腿臀", shoulders: "肩部", arms: "手臂", core: "核心" };
const steps = ["準備姿勢", "離心控制", "向心發力", "頂峰收縮"];
export default function Demo() {
  const [exercise, setExercise] = useState<Exercise>(exercisesData.find((item) => item.id === "reverse_grip_lat_pulldown")!);
  const [playing, setPlaying] = useState(false), [tab, setTab] = useState<"steps" | "mistakes">("steps");
  useEffect(() => { setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  const choose = (id: string) => { const next = exercisesData.find((item) => item.id === id); if (next) { setExercise(next); setPlaying(true); } };
  return <div className="atlas-app">
    <header className="atlas-nav"><a href="#main" className="atlas-brand"><span className="atlas-mark"><Activity size={22} /></span><b>FORM<span>TRAINING ATLAS</span></b></a><div><BookOpen size={15} /><span>動作百科</span><i />{exercisesData.length} 個動作</div></header>
    <main id="main" className="atlas-main">
      <div className="atlas-intro"><div><p className="atlas-overline">UNDERSTAND THE MOVEMENT</p><h1>看清每一次發力。</h1><p>轉動視角、停在任一瞬間，理解動作與肌群如何配合。</p></div><div className="atlas-intro-tag"><span>3D 互動示範</span><small>身體輪廓 · 動作路徑 · 肌群參與</small></div></div>
      <div className="atlas-picker"><div className="atlas-categories" role="group" aria-label="肌群分類">{CATEGORIES.map((category) => <button type="button" key={category} aria-pressed={exercise.category === category} onClick={() => choose(exercisesData.find((item) => item.category === category)!.id)}>{labels[category]}</button>)}</div>
        <label className="atlas-select"><span>選擇動作</span><select aria-label="選擇動作" value={exercise.id} onChange={(event) => choose(event.target.value)}>{CATEGORIES.map((category) => <optgroup key={category} label={labels[category]}>{exercisesData.filter((item) => item.category === category).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>)}</select><ChevronDown size={16} /></label>
      </div>
      <div className="atlas-layout"><div className="atlas-viewer"><MuscleViewer3D exerciseId={exercise.id} exerciseName={exercise.name} primaryMuscles={exercise.primaryMuscles} secondaryMuscles={exercise.secondaryMuscles} animationType={exercise.animationType} equipment={exercise.equipment} isPlayingAnimation={playing} onPlayingAnimationChange={setPlaying} height={690} /></div>
        <aside className="atlas-guide" aria-label="動作教學"><div className="atlas-guide-heading"><span className="atlas-overline">MOVEMENT GUIDE</span><div><span>{labels[exercise.category]}</span><span>{exercise.equipment}</span><span>{exercise.difficulty}</span></div><h2>{exercise.name.split(" (")[0]}</h2><p>{exercise.name.split(" (")[1]?.replace(/\)$/, "")}</p></div>
          <div className="atlas-guide-tabs" role="group" aria-label="教學內容"><button type="button" aria-pressed={tab === "steps"} onClick={() => setTab("steps")}>動作要領</button><button type="button" aria-pressed={tab === "mistakes"} onClick={() => setTab("mistakes")}>常見錯誤</button></div>
          {tab === "steps" ? <ol className="atlas-steps">{exercise.instructions.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><div><h3>{steps[index]}</h3><p>{instruction}</p></div></li>)}</ol> : <div className="atlas-mistakes"><p>先掌握穩定與控制，再逐步增加負重。</p>{exercise.commonMistakes.map((mistake) => <div key={mistake}><Info size={17} /><p>{mistake}</p></div>)}</div>}
          <div className="atlas-breath"><Wind size={21} /><div><h3>呼吸節奏</h3><p>{exercise.breathing}</p></div></div>
        </aside>
      </div>
      <section className="atlas-related"><span>參考動作</span><button type="button" aria-pressed={exercise.id === "reverse_grip_lat_pulldown"} onClick={() => choose("reverse_grip_lat_pulldown")}>反手高位下拉</button><button type="button" aria-pressed={exercise.id === "seated_machine_row"} onClick={() => choose("seated_machine_row")}>坐姿對握划船</button><p>點選亮起的肌群，查看它在這個動作中的角色。</p></section>
    </main><footer className="atlas-footer"><span>FORM / TRAIN WITH UNDERSTANDING</span><span>動作品質，從理解開始。</span></footer>
  </div>;
}
