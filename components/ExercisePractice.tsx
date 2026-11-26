'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,RotateCcw} from 'lucide-react';
import type {ExerciseCoaching} from '../lib/exerciseCoaching';

/** Counts user-confirmed sets only. No fabricated automatic rep detection. */
export default function ExercisePractice({guide}:{guide:ExerciseCoaching}) {
 const [sets,setSets]=useState(guide.sets),[amount,setAmount]=useState(guide.holdSeconds??guide.reps),[completed,setCompleted]=useState(0),[remaining,setRemaining]=useState(0),[rest,setRest]=useState<number>(guide.restSeconds);
 const deadline=useRef<number|null>(null);
 useEffect(()=>{if(!remaining)return;const timer=window.setInterval(()=>{const value=Math.max(0,Math.ceil(((deadline.current??Date.now())-Date.now())/1000));setRemaining(value);},250);return()=>window.clearInterval(timer);},[remaining>0]);
 function finish(){const count=Math.min(sets,completed+1);setCompleted(count);deadline.current=count<sets?Date.now()+rest*1000:null;setRemaining(count<sets?rest:0);}
 function reset(){setCompleted(0);setRemaining(0);deadline.current=null;}
 return <section className="practice-panel"><div className="panel-heading compact"><h3>這個動作，練一輪</h3><button type="button" className="text-button" onClick={reset}><RotateCcw size={14}/>重來</button></div><p>可調整的練習起點。先用能保留 2–3 次餘力的重量；最後幾下仍維持完整姿勢。</p>
  <div className="practice-fields"><label>組數<input aria-label="練習組數" type="number" min={1} max={10} value={sets} onChange={event=>{const value=Number(event.target.value);if(Number.isInteger(value)&&value>=1&&value<=10){setSets(value);reset();}}}/></label><label>{guide.holdSeconds?'每組秒數':`次數${guide.perSide?'／每側':''}`}<input aria-label={guide.holdSeconds?'練習秒數':'練習次數'} type="number" min={1} max={guide.holdSeconds?180:30} value={amount} onChange={event=>{const value=Number(event.target.value);if(Number.isInteger(value)&&value>=1&&value<=(guide.holdSeconds?180:30))setAmount(value);}}/></label><label>組間休息<select aria-label="練習休息時間" value={rest} onChange={event=>setRest(Number(event.target.value))}>{[60,90,120].map(s=><option key={s} value={s}>{s} 秒</option>)}</select></label></div>
  <div className="practice-tempo"><strong>節奏參考</strong><span>{guide.holdSeconds?`保持 ${amount} 秒，持續呼吸；姿勢失守就提早結束。`:guide.tempo}</span></div>
  <div className="practice-progress" role="status">{completed>=sets?'本輪練習已完成':remaining?`休息 ${remaining} 秒 · 下一組 ${completed+1}／${sets}`:`準備第 ${completed+1}／${sets} 組 · ${amount} ${guide.holdSeconds?'秒':`次${guide.perSide?'／每側':''}`}`}</div>
  {remaining>0?<button type="button" className="text-button" onClick={()=>{deadline.current=null;setRemaining(0);}}>結束休息</button>:<button type="button" className="primary-button" onClick={finish} disabled={completed>=sets}><Check size={17}/>{guide.perSide?'兩側都完成，結束本組':'完成這一組'}</button>}
  <small>此處僅計算你確認完成的練習組；要保留重量與次數，請回重訓頁新增紀錄。首次練習先做暖身組，無法保持姿勢時減重或採用簡化版。</small>
 </section>;
}
