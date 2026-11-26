'use client';
import { forwardRef,useCallback,useEffect,useImperativeHandle,useState } from "react";
import { Pause,Play,RotateCcw,Timer } from "lucide-react";

export interface RestTimerHandle { start:()=>void }
export const remainingSeconds = (deadline:number, now:number) => Math.max(0,Math.ceil((deadline-now)/1000));
export default forwardRef<RestTimerHandle>(function RestTimer(_,ref) {
  const [duration,setDuration]=useState(90),[remaining,setRemaining]=useState(90),[deadline,setDeadline]=useState<number|null>(null),[finished,setFinished]=useState(false);
  const begin = useCallback((seconds:number) => { setDuration(seconds);setRemaining(seconds);setDeadline(Date.now()+seconds*1000);setFinished(false); },[]);
  useImperativeHandle(ref,()=>({start:()=>begin(duration)}),[begin,duration]);
  useEffect(()=>{
    if(deadline===null)return;
    const tick=()=>{const next=remainingSeconds(deadline,Date.now());setRemaining(next);if(next===0){setDeadline(null);setFinished(true);}};
    tick();const timer=window.setInterval(tick,250);document.addEventListener("visibilitychange",tick);
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",tick);};
  },[deadline]);
  const pause=()=>{if(deadline!==null){setRemaining(remainingSeconds(deadline,Date.now()));setDeadline(null);}else begin(remaining||duration);};
  return <section className="rest-timer" aria-label="組間休息計時器"><div className="section-title"><Timer size={18}/><h3>組間休息</h3><span>新增組數後自動開始</span></div><div className="rest-timer__body"><div className={`timer-face ${finished?"is-finished":""}`}><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="31"/><circle cx="36" cy="36" r="31" style={{strokeDasharray:194.78,strokeDashoffset:194.78*(1-remaining/duration)}}/></svg><strong aria-label={`剩餘 ${remaining} 秒`}>{String(Math.floor(remaining/60)).padStart(2,"0")}:{String(remaining%60).padStart(2,"0")}</strong></div><div><div className="timer-options">{[60,90,120].map((seconds)=><button type="button" key={seconds} aria-pressed={duration===seconds} onClick={()=>begin(seconds)}>{seconds}s</button>)}</div><div className="timer-actions"><button type="button" className="text-button" onClick={pause}>{deadline===null?<Play size={14}/>:<Pause size={14}/>} {deadline===null?"開始／繼續":"暫停"}</button><button type="button" className="icon-button" aria-label="重設休息計時器" onClick={()=>{setDeadline(null);setRemaining(duration);setFinished(false);}}><RotateCcw size={15}/></button><span role="status">{finished?"休息結束":deadline!==null?"休息中":remaining<duration?"已暫停":"準備下一組"}</span></div></div></div></section>;
});
