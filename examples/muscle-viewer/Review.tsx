import {useState} from "react";
import MuscleViewer3D from "../../components/MuscleViewer3D";
import {exercisesData} from "../../lib/exercisesData";

/** Development-only review surface. The deployed dashboard does not import this module. */
export default function Review(){
  const [id,setId]=useState("incline_dumbbell_press"),[playing,setPlaying]=useState(false);
  const exercise=exercisesData.find(item=>item.id===id)??exercisesData[1];
  return <main className="review-page"><style>{`.review-page{margin:0 auto;max-width:720px;padding:12px;background:#0b1216}.review-toolbar{position:sticky;top:0;z-index:10;display:flex;gap:12px;align-items:center;padding:10px 0;background:#0b1216}.review-toolbar label{font-size:14px;color:#b8cbd7;flex:1;min-width:0}.review-toolbar select{width:100%;font:inherit;font-size:14px;padding:10px;color:#ddebf1;background:#1b303c;border:1px solid #405965;border-radius:7px}.review-toolbar span{color:#8ea6b5;font-size:12px;white-space:nowrap}.review-page .mv3d-stage{height:470px!important}@media(max-width:600px){.review-page{padding:8px}.review-toolbar span{display:none}.review-page .mv3d-stage{height:410px!important}}`}</style>
    <div id="review-top"/><div className="review-toolbar"><label>檢視動作<select aria-label="檢視動作" value={exercise.id} onChange={event=>{setId(event.target.value);setPlaying(false);}}>{exercisesData.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><a href="#review-top" style={{fontSize:12,color:"#b3d3e2",whiteSpace:"nowrap"}}>回頂端</a><span>{exercisesData.length} 個動作 · 人工視覺檢查</span></div>
    <MuscleViewer3D exerciseName={exercise.name} primaryMuscles={exercise.primaryMuscles} secondaryMuscles={exercise.secondaryMuscles} animationType={exercise.animationType} equipment={exercise.equipment} isPlayingAnimation={playing} onPlayingAnimationChange={setPlaying} height={470}/>
  </main>;
}
