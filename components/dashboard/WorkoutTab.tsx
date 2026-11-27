'use client';
import { useCallback,useEffect,useMemo,useRef,useState,type FormEvent } from "react";
import { BookOpen,Check,Copy,Dumbbell,History,Plus,Search,Trash2,Trophy } from "lucide-react";
import ExerciseDetailModal from "../ExerciseDetailModal";
import RestTimer,{type RestTimerHandle} from "./RestTimer";
import { api,useApi } from "../../lib/clientApi";
import { CATEGORIES,exercisesData,expandMuscles,MUSCLE_LABELS,type Equipment,type ExerciseCategory } from "../../lib/exercisesData";
import {controlledMotionFor,CONTROLLED_MOTION_COUNT} from "../../lib/motionCatalog";
import type { WorkoutLog,WorkoutResponse } from "../../lib/fitness";

const categories:Record<ExerciseCategory,string>={chest:"胸",back:"背",legs:"腿臀",shoulders:"肩",arms:"手臂",core:"核心"};
const kg=(value:number)=>value.toLocaleString("zh-TW",{maximumFractionDigits:2});
export default function WorkoutTab({date}:{date:string}) {
  const [onlyMotion,setOnlyMotion]=useState(false);
  const [selectedId,setSelectedId]=useState("bench_press"),[category,setCategory]=useState<ExerciseCategory|"">(""),[equipment,setEquipment]=useState<Equipment|"">(""),[search,setSearch]=useState("");
  const [weight,setWeight]=useState(""),[reps,setReps]=useState("10"),[notes,setNotes]=useState(""),[saving,setSaving]=useState(false),[deleting,setDeleting]=useState<string|null>(null),[detail,setDetail]=useState(false);
  const [notice,setNotice]=useState<{kind:"success"|"error";message:string}|null>(null), timer=useRef<RestTimerHandle>(null);
  const selected=exercisesData.find((item)=>item.id===selectedId)!;
  const url=`/api/workouts?${new URLSearchParams({date,exercise_code:selectedId})}`, resource=useApi<WorkoutResponse>(url);
  const logs=resource.data?.logs.filter((row)=>row.exercise_code===selectedId)??[],history=resource.data?.history;
  const closeDetail=useCallback(()=>setDetail(false),[]);
  useEffect(()=>{setWeight("");setReps("10");setNotes("");setNotice(null);},[selectedId,date]);
  const filtered=useMemo(()=>{
    const query=search.trim().toLowerCase();
    return exercisesData.filter((item)=>(!onlyMotion||!!controlledMotionFor(item.id))&&(!category||item.category===category)&&(!equipment||item.equipment===equipment)&&(!query||`${item.name} ${item.id} ${[...expandMuscles(item.primaryMuscles)].map((id)=>MUSCLE_LABELS[id]).join(" ")}`.toLowerCase().includes(query)));
  },[category,equipment,search,onlyMotion]);
  async function addSet(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setNotice(null);
    try{
      const result=await api<WorkoutResponse&{entry:WorkoutLog}>("/api/workouts",{method:"POST",body:{log_date:date,exercise_code:selectedId,weight_kg:Number(weight),reps:Number(reps),notes}});
      resource.refresh();timer.current?.start();setNotice({kind:"success",message:`已儲存 ${selected.name.split(" (")[0]} 第 ${result.entry.set_number} 組。`});
    }catch(error){setNotice({kind:"error",message:error instanceof Error?error.message:"儲存失敗。"});}finally{setSaving(false);}
  }
  async function remove(id:string){setDeleting(id);setNotice(null);try{await api(`/api/workouts?${new URLSearchParams({id})}`,{method:"DELETE"});resource.refresh();}catch(error){setNotice({kind:"error",message:error instanceof Error?error.message:"刪除失敗。"});}finally{setDeleting(null);}}
  const primary=[...expandMuscles(selected.primaryMuscles)], secondary=[...expandMuscles(selected.secondaryMuscles)].filter((id)=>!primary.includes(id));
  return <div className="workout-tab">
    <div className="dashboard-metrics"><article><Dumbbell size={19}/><div><span>當日完成組數</span><strong>{resource.loading?"—":resource.data?.total_sets??0}<small>組</small></strong></div></article><article><Check size={19}/><div><span>當日訓練動作</span><strong>{resource.loading?"—":new Set(resource.data?.logs.map((row)=>row.exercise_code)).size}<small>項</small></strong></div></article><article><Trophy size={19}/><div><span>當日總訓練量</span><strong>{resource.loading?"—":kg(resource.data?.volume_kg??0)}<small>kg</small></strong></div></article></div>
    <div className="workout-layout"><aside className="panel exercise-library"><div className="panel-heading"><div><span className="eyebrow">EXERCISE LIBRARY</span><h2>選擇訓練動作</h2></div><span className="count-badge">{exercisesData.length}</span></div>
      <div className="category-tabs" role="group" aria-label="肌群分類"><button type="button" aria-pressed={!category} onClick={()=>setCategory("")}>全部</button>{CATEGORIES.map((id)=><button type="button" key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{categories[id]}</button>)}</div>
      <div className="library-filters"><label><Search size={17}/><input aria-label="搜尋動作" placeholder="搜尋中文或英文動作" value={search} onChange={(event)=>setSearch(event.target.value)}/></label><select aria-label="器材篩選" value={equipment} onChange={(event)=>setEquipment(event.target.value as Equipment|"")}><option value="">全部器材</option>{(["槓鈴","啞鈴","滑輪/機械","徒手"] as const).map((item)=><option key={item} value={item}>{item==="滑輪/機械"?"機械／滑輪":item}</option>)}</select></div>
      <div className="library-count"><span>符合篩選：{filtered.length} 個動作</span><button type="button" className="motion-library-toggle" aria-pressed={onlyMotion} onClick={()=>setOnlyMotion(value=>!value)}>3D 拆解 {CONTROLLED_MOTION_COUNT}</button></div><ul className="exercise-list">{filtered.map((exercise)=><li key={exercise.id}><button type="button" aria-pressed={selectedId===exercise.id} onClick={()=>setSelectedId(exercise.id)}><div><strong>{exercise.name.split(" (")[0]}</strong>{controlledMotionFor(exercise.id)&&<span className="motion-ready-badge">3D</span>}<span className={`difficulty difficulty-${exercise.difficulty}`}>{exercise.difficulty}</span></div><small>{exercise.name.split(" (")[1]?.replace(/\)$/,"")}</small><div className="tag-row">{[...expandMuscles(exercise.primaryMuscles)].map((id)=><span className="muscle-pill" key={id}>{MUSCLE_LABELS[id]}</span>)}</div></button></li>)}</ul>
      {!filtered.length&&<div className="empty-state">沒有符合的動作。<button type="button" className="text-button" onClick={()=>{setSearch("");setCategory("");setEquipment("");setOnlyMotion(false);}}>清除篩選</button></div>}
    </aside>
    <div className="workout-main"><section className="panel selected-exercise"><div className="panel-heading"><div><span className="eyebrow">SELECTED MOVEMENT</span><h2>{selected.name.split(" (")[0]}</h2><p>{selected.name.split(" (")[1]?.replace(/\)$/,"")}</p></div><span className="pill">{selected.equipment}</span></div><div className="selected-muscles"><span>主要</span>{primary.map((id)=><span className="muscle-pill primary" key={id}>{MUSCLE_LABELS[id]}</span>)}</div><div className="selected-muscles"><span>協同</span>{secondary.length?secondary.map((id)=><span className="muscle-pill" key={id}>{MUSCLE_LABELS[id]}</span>):<small>未另列協同肌群</small>}</div>
      <button type="button" className="guide-button" onClick={()=>setDetail(true)}><BookOpen size={20}/><span>{controlledMotionFor(selected.id)?"實人教學與 3D 拆解":"實人教學與 3D 肌群"}<small>{controlledMotionFor(selected.id)?"影片對照 · 關鍵姿勢 · 關節軌跡":"實人影片 · 握法與支撐檢查 · 中文步驟"}</small></span><span className="guide-button__tag">開啟教學</span></button>
      <div className="exercise-history"><div><Trophy size={18}/><span>截至此日 PR</span><strong>{resource.loading?"—":history?.pr_weight_kg==null?"尚無紀錄":`${kg(history.pr_weight_kg)} kg`}</strong></div><div><History size={18}/><span>上次訓練</span><strong>{resource.loading?"—":history?.last_date??"首次挑戰"}</strong></div></div>
      {!!history?.last_sets.length&&<div className="previous-session"><span>上次組數</span><div>{history.last_sets.map((row)=><span key={row.id}>{kg(row.weight_kg)} kg × {row.reps}</span>)}</div><button type="button" className="text-button" disabled={saving} onClick={()=>setWeight(String(history.last_sets.at(-1)!.weight_kg))}>帶入上次重量</button></div>}
    </section>
    <section className="panel set-panel"><div className="panel-heading compact"><h2>記錄每一組</h2><span className="subtle">{date}</span></div>
      {resource.error&&<div className="message error" role="alert">{resource.error}<button type="button" onClick={resource.refresh}>重新載入</button></div>}
      {notice&&<div className={`message ${notice.kind}`} role={notice.kind==="error"?"alert":"status"}>{notice.message}</div>}
      <form onSubmit={addSet}><div className="set-form"><label>重量 <small>kg</small><input aria-label="重量 kg" type="number" min={0} max={1500} step="any" required value={weight} onChange={(event)=>setWeight(event.target.value)} disabled={saving} placeholder="0"/></label><label>次數 <small>reps</small><input aria-label="次數 reps" type="number" min={1} max={1000} step={1} required value={reps} onChange={(event)=>setReps(event.target.value)} disabled={saving}/></label><button type="submit" className="primary-button" disabled={saving||resource.loading}><Plus size={18}/>{saving?"儲存中…":"新增組數"}</button></div><div className="set-form-bottom"><input aria-label="訓練備註" placeholder="備註（選填）" maxLength={500} value={notes} onChange={(event)=>setNotes(event.target.value)} disabled={saving}/><button type="button" className="text-button" disabled={!logs.length||saving} onClick={()=>setWeight(String(logs.at(-1)!.weight_kg))}><Copy size={14}/>複製上一組重量</button></div></form>
      {resource.loading?<div className="loading-state" role="status">載入訓練紀錄…</div>:logs.length?<div className="table-scroll"><table className="sets-table"><thead><tr><th>組次</th><th>重量</th><th>次數</th><th>訓練量</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{logs.map((row)=><tr key={row.id}><td><span className="set-number">{row.set_number}</span></td><td>{kg(row.weight_kg)} <small>kg</small>{row.notes&&<span className="set-note">{row.notes}</span>}</td><td>{row.reps}</td><td>{kg(row.weight_kg*row.reps)} <small>kg</small></td><td><button type="button" className="icon-button danger" aria-label={`刪除第 ${row.set_number} 組`} disabled={deleting!==null||saving} onClick={()=>void remove(row.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>:!resource.error&&<div className="empty-state"><Dumbbell size={24}/><strong>第一組，從這裡開始。</strong><span>輸入重量與次數，留下今天的進步。</span></div>}
    </section><RestTimer ref={timer}/></div></div>
    <ExerciseDetailModal exercise={selected} open={detail} onClose={closeDetail}/>
  </div>;
}
